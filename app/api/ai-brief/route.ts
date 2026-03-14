import { NextResponse } from 'next/server';

type BriefRequest = {
  title: string;
  source?: string;
  snippet?: string;
  url?: string;
  date?: string;
};

type BriefResponse = {
  points: [string, string, string];
};

function safeJsonArrayParse(raw: string): string[] {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const result = JSON.parse(cleaned);
    return Array.isArray(result) ? result.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BriefRequest;
    const { title, source, snippet, url, date } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.fans';
    const model = process.env.OPENROUTER_MODEL || 'deepseek-chat';

    if (!apiKey) {
      return NextResponse.json(
        { message: '缺少环境变量：OPENROUTER_API_KEY' },
        { status: 500 }
      );
    }

    const context = [
      `标题: ${title}`,
      source ? `来源: ${source}` : '',
      date ? `时间: ${date}` : '',
      url ? `链接: ${url}` : '',
      snippet ? `原文摘要: ${snippet}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `
你是中文科技媒体编辑，帮我把下面这条英文（或中英混合）新闻压缩成 3 条「中文要点」。

要求：
1. 严格输出 JSON 数组格式，例如：["要点1","要点2","要点3"]
2. 每条不超过 40 个中文字符，直接陈述事实，不要加评价
3. 不要生成 URL，只复述事实

原始信息：
${context}
`;

    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'ai-navigation-brief',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: '你只负责把新闻压缩成 3 条中文要点，严格输出 JSON 数组。' },
          { role: 'user', content: prompt },
        ],
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { message: `OpenRouter 请求失败(${res.status}): ${text}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '[]';
    const arr = safeJsonArrayParse(String(raw));
    const p1 = arr[0] ?? '暂无摘要';
    const p2 = arr[1] ?? p1;
    const p3 = arr[2] ?? p2;

    const payload: BriefResponse = {
      points: [p1, p2, p3],
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

