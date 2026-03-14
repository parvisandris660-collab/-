module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/fetch-ai-news/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
// 识别 CEO 类新闻，用于前端分区展示
const CEO_HANDLES = [
    '@sama',
    '@sundarpichai',
    '@demishassabis',
    '@darioamodei',
    '@satyanadella',
    '@elonmusk',
    'sam altman',
    'sundar pichai',
    'demis hassabis',
    'dario amodei',
    'satya nadella',
    'elon musk'
];
// 搜索 1：主要 AI 公司 CEO 的最新动态（X/Twitter + 主流科技媒体）
const QUERY_CEO = '(sam altman OR sundar pichai OR dario amodei OR satya nadella OR elon musk) AI statement OR announcement';
// 搜索 2：AI 行业最近 3 天的重要事件（不限公司）
const QUERY_AI_GENERAL = 'artificial intelligence AI major announcement model release breakthrough 2026';
/**
 * 双路并行 Tavily 搜索：
 * - CEO 追踪：针对关键人物动态
 * - 行业广搜：覆盖任意 AI 公司 / 研究机构，不限于固定几家
 */ async function fetchFromTavily(tavilyApiKey) {
    const base = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-store'
    };
    const [resCeo, resGeneral] = await Promise.all([
        fetch('https://api.tavily.com/search', {
            ...base,
            body: JSON.stringify({
                api_key: tavilyApiKey,
                query: QUERY_CEO,
                topic: 'news',
                search_depth: 'basic',
                max_results: 8,
                include_domains: [
                    'x.com',
                    'twitter.com',
                    'techcrunch.com',
                    'theverge.com',
                    'wired.com'
                ]
            })
        }),
        fetch('https://api.tavily.com/search', {
            ...base,
            body: JSON.stringify({
                api_key: tavilyApiKey,
                query: QUERY_AI_GENERAL,
                topic: 'news',
                search_depth: 'basic',
                max_results: 20,
                include_domains: [
                    'techcrunch.com',
                    'theverge.com',
                    'wired.com',
                    'arstechnica.com',
                    'venturebeat.com',
                    'bloomberg.com',
                    'reuters.com',
                    'zdnet.com',
                    'openai.com',
                    'anthropic.com',
                    'deepmind.google',
                    'mistral.ai',
                    'huggingface.co',
                    'arxiv.org'
                ]
            })
        })
    ]);
    if (!resCeo.ok) {
        const t = await resCeo.text();
        throw new Error(`Tavily CEO 搜索失败(${resCeo.status}): ${t}`);
    }
    if (!resGeneral.ok) {
        const t = await resGeneral.text();
        throw new Error(`Tavily 行业搜索失败(${resGeneral.status}): ${t}`);
    }
    const [ceoData, generalData] = await Promise.all([
        resCeo.json(),
        resGeneral.json()
    ]);
    return {
        ceo_results: ceoData?.results ?? [],
        general_results: generalData?.results ?? []
    };
}
/**
 * 根据 Tavily 结果本地打分：
 * - 时间越近、score 越高、越像 CEO 动态 → level 越高
 */ function normalizeFromTavily(payload) {
    const today = new Date();
    const all = [
        ...payload.ceo_results ?? [],
        ...payload.general_results ?? []
    ];
    const seen = new Set();
    const items = [];
    for (const r of all){
        const url = (r.url ?? '').trim();
        const title = (r.title ?? '').trim();
        if (!url || !title) continue;
        if (seen.has(url)) continue;
        seen.add(url);
        const snippet = (r.snippet ?? r.content ?? '').trim();
        const published = r.published_date ? new Date(r.published_date) : null;
        const days = published && !Number.isNaN(published.getTime()) ? (today.getTime() - published.getTime()) / (1000 * 60 * 60 * 24) : 0;
        if (days > 3) continue;
        const host = safeHost(url);
        const rawSource = r.source ?? host;
        const source = rawSource.replace(/^www\./, '');
        const isCeo = isExecutiveByText(title, source);
        const baseScore = typeof r.score === 'number' ? r.score : 0;
        const recencyScore = Math.max(0, 1 - days / 3); // 0~1
        const ceoBonus = isCeo ? 0.7 : 0;
        const totalScore = baseScore + recencyScore + ceoBonus;
        let level = 'info';
        if (isCeo || totalScore >= 1.4) {
            level = 'must';
        } else if (totalScore >= 0.8) {
            level = 'recommend';
        }
        const points = buildPointsFromSnippet(snippet || title);
        items.push({
            item: {
                level,
                title,
                source,
                points,
                url,
                date: published && !Number.isNaN(published.getTime()) ? published.toISOString().slice(0, 10) : today.toISOString().slice(0, 10),
                snippet: snippet || undefined
            },
            score: totalScore
        });
    }
    // 按综合得分排序，让更重要的排在前面
    items.sort((a, b)=>b.score - a.score);
    return items.map((x)=>x.item);
}
function safeHost(url) {
    try {
        return new URL(url).hostname;
    } catch  {
        return 'unknown';
    }
}
function buildPointsFromSnippet(text) {
    if (!text) {
        return [
            '暂无摘要',
            '暂无摘要',
            '暂无摘要'
        ];
    }
    const clean = text.replace(/\s+/g, ' ').trim();
    const parts = clean.split(/。|\.|\?|！|!/g).map((s)=>s.trim()).filter(Boolean);
    const p1 = parts[0] ?? clean.slice(0, 60);
    const p2 = parts[1] ?? p1;
    const p3 = parts[2] ?? p2;
    return [
        p1,
        p2,
        p3
    ];
}
function isExecutiveByText(title, source) {
    const haystack = `${title} ${source}`.toLowerCase();
    return CEO_HANDLES.some((h)=>haystack.includes(h.toLowerCase().replace('@', '')));
}
async function GET() {
    try {
        const tavilyApiKey = process.env.TAVILY_API_KEY;
        if (!tavilyApiKey) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: '缺少环境变量：TAVILY_API_KEY',
                generatedAt: new Date().toISOString(),
                executive: [],
                feed: []
            }, {
                status: 500
            });
        }
        const tavilyData = await fetchFromTavily(tavilyApiKey);
        const allNews = normalizeFromTavily(tavilyData);
        const executive = allNews.filter((item)=>isExecutiveByText(item.title, item.source)).map((item)=>({
                ...item,
                level: 'must'
            }));
        const feed = allNews.filter((item)=>!isExecutiveByText(item.title, item.source)).sort((a, b)=>{
            const weight = {
                must: 0,
                recommend: 1,
                info: 2
            };
            return weight[a.level] - weight[b.level];
        });
        const payload = {
            generatedAt: new Date().toISOString(),
            executive,
            feed
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(payload, {
            status: 200
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: error instanceof Error ? error.message : '未知错误',
            generatedAt: new Date().toISOString(),
            executive: [],
            feed: []
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__517483cd._.js.map