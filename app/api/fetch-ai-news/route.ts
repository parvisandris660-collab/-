import { NextResponse } from 'next/server';

/**
 * 说明：
 * 1) 该路由用于抓取 AI 资讯并调用大模型做结构化总结。
 * 2) 不在代码中写死任何密钥，统一读取环境变量。
 * 3) 当前结果直接返回给前端；生产环境建议写入 Vercel KV/数据库后再读取。
 */

type NewsLevel = 'must' | 'recommend' | 'info';

export type AiNewsItem = {
  level: NewsLevel;
  title: string;
  source: string;
  points: [string, string, string];
  url: string;
  date: string; // YYYY-MM-DD
};

type ApiResponse = {
  generatedAt: string;
  executive: AiNewsItem[];
  feed: AiNewsItem[];
};

// 当外部模型请求失败或返回空结果时的本地兜底数据，保证前端至少有示例内容可看。
const FALLBACK_NEWS: AiNewsItem[] = [
  {
    level: 'must',
    title: '示例：GPT-Next 发布，推理速度提升 10 倍',
    source: '示例来源',
    points: ['这是本地示例数据，不会消耗额度。', '真实环境下会被 Tavily + DeepSeek 返回的数据替换。', '你可以在 .env.local 中配置自己的 Key。'],
    url: 'https://example.com/ai-news-demo',
    date: new Date().toISOString().slice(0, 10),
  },
  {
    level: 'recommend',
    title: '示例：某云厂商推出千亿参数模型开放测试',
    source: '示例来源',
    points: ['用于占位展示推荐级别的卡片效果。', '包含三条要点，结构与真实数据一致。', '方便你在没有额度时也能预览整页样式。'],
    url: 'https://example.com/ai-news-demo-2',
    date: new Date().toISOString().slice(0, 10),
  },
  {
    level: 'info',
    title: '示例：开源社区发布多模态小模型',
    source: '示例来源',
    points: ['信息级别内容，用于充实页面底部列表。', '你可以稍后将其替换为真实资讯。', '如不需要示例，可删除 FALLBACK_NEWS 常量。'],
    url: 'https://example.com/ai-news-demo-3',
    date: new Date().toISOString().slice(0, 10),
  },
];

const CEO_HANDLES = [
  '@sama',
  '@sundarpichai',
  '@demishassabis',
  '@darioamodei',
  '@satyanadella',
  '@elonmusk',
];

const SEARCH_QUERY =
  'AI major news AND (from:sama OR from:elonmusk OR from:sundarpichai OR from:darioamodei) since:24h';

/**
 * Tavily 搜索：抓原始候选资讯
 */
async function fetchFromTavily(tavilyApiKey: string) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: tavilyApiKey,
      query: SEARCH_QUERY,
      topic: 'news',
      search_depth: 'advanced',
      max_results: 20,
      include_domains: ['x.com', 'openai.com', 'googleblog.com', 'anthropic.com', 'microsoft.com'],
    }),
    // 让 Vercel/Next.js 不缓存该请求，确保获取最新资讯
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily 请求失败(${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * 调用 OpenRouter（OpenAI 兼容接口），将 Tavily 结果整理为固定 JSON 结构。
 *
 * 你提供的中转地址示例：
 * - https://openrouter.fans/v1/chat/completions
 *
 * DeepSeek 模型名：
 * - deepseek-chat
 * - deepseek-reasoner
 */
async function summarizeWithOpenRouter(
  baseUrl: string,
  apiKey: string,
  model: string,
  tavilyData: unknown
): Promise<AiNewsItem[]> {
  const prompt = `
你是 AI 资讯编辑。请根据输入的搜索结果，输出“仅 JSON 数组”，不要解释文字，不要 markdown。

输出格式必须严格如下：
[
  {
    "level": "must" | "recommend" | "info",
    "title": "标题",
    "source": "来源",
    "points": ["要点1", "要点2", "要点3"],
    "url": "链接",
    "date": "YYYY-MM-DD"
  }
]

要求：
1) 优先保留近24小时内信息，最多输出 12 条；
2) CEO 相关言论（${CEO_HANDLES.join(', ')}）尽量标记为 "must"；
3) points 必须是 3 句中文摘要，内容去重且可读；
4) url 必须是可访问原文链接；
5) 只返回 JSON 数组。

输入搜索结果：
${JSON.stringify(tavilyData)}
`;

  // OpenAI 兼容接口：/v1/chat/completions
  const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter 推荐带上来源信息（可选）。为避免中转服务对非 ASCII 头报错，这里保持纯英文。
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'ai-navigation',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            '你是一个资深 AI 资讯编辑，负责从搜索结果中提炼结构化要闻，严格按照用户给出的 JSON 模板输出。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter 请求失败(${res.status}): ${text}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '[]';
  const parsed = safeJsonArrayParse(String(text));
  return normalizeNews(parsed);
}

/**
 * 大模型常会返回 ```json ...``` 之类包裹，这里做容错处理。
 */
function safeJsonArrayParse(raw: string): unknown[] {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const result = JSON.parse(cleaned);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * 统一校验字段并裁剪格式，避免前端崩溃。
 */
function normalizeNews(items: unknown[]): AiNewsItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const validLevel: NewsLevel[] = ['must', 'recommend', 'info'];

  return items
    .map((item) => {
      const it = item as Partial<AiNewsItem>;
      const level = validLevel.includes(it.level as NewsLevel) ? (it.level as NewsLevel) : 'info';
      const title = (it.title ?? '').trim();
      const source = (it.source ?? '未知来源').trim();
      const url = (it.url ?? '').trim();
      const date = (it.date ?? today).trim();
      const pointsRaw = Array.isArray(it.points) ? it.points : [];
      const points = [
        String(pointsRaw[0] ?? '暂无摘要'),
        String(pointsRaw[1] ?? '暂无摘要'),
        String(pointsRaw[2] ?? '暂无摘要'),
      ] as [string, string, string];

      return { level, title, source, points, url, date };
    })
    .filter((n) => n.title && n.url);
}

/**
 * 按来源/标题粗略识别 CEO 追踪内容。
 * 规则可按你的实际数据迭代优化。
 */
function isExecutiveItem(item: AiNewsItem) {
  const haystack = `${item.title} ${item.source}`.toLowerCase();
  return CEO_HANDLES.some((h) => haystack.includes(h.replace('@', '')));
}

export async function GET() {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.fans';
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const openRouterModel = process.env.OPENROUTER_MODEL || 'deepseek-chat';

    if (!tavilyApiKey || !openRouterApiKey) {
      return NextResponse.json(
        {
          message: '缺少环境变量：TAVILY_API_KEY 或 OPENROUTER_API_KEY',
          generatedAt: new Date().toISOString(),
          executive: [],
          feed: [],
        },
        { status: 500 }
      );
    }

    const tavilyData = await fetchFromTavily(tavilyApiKey);
    const summarized = await summarizeWithOpenRouter(
      openRouterBaseUrl,
      openRouterApiKey,
      openRouterModel,
      tavilyData
    );

    // CEO 内容优先 + 默认提升为 must（如果模型没有给到）
    const executive = summarized
      .filter(isExecutiveItem)
      .map((item) => ({ ...item, level: 'must' as const }));

    const feed = summarized
      .filter((item) => !isExecutiveItem(item))
      .sort((a, b) => {
        const weight = { must: 0, recommend: 1, info: 2 };
        return weight[a.level] - weight[b.level];
      });

    const payload: ApiResponse = {
      generatedAt: new Date().toISOString(),
      executive,
      feed,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '未知错误',
        generatedAt: new Date().toISOString(),
        executive: [],
        feed: [],
      },
      { status: 500 }
    );
  }
}

