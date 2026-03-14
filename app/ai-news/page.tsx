'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

type NewsLevel = 'must' | 'recommend' | 'info';

type AiNewsItem = {
  level: NewsLevel;
  title: string;
  source: string;
  points: [string, string, string];
  url: string;
  date: string;
  snippet?: string;
};

type ApiPayload = {
  generatedAt: string;
  executive: AiNewsItem[];
  feed: AiNewsItem[];
  message?: string;
};

type BriefResponse = {
  points: [string, string, string];
};

const levelMeta: Record<NewsLevel, { label: string; badge: string }> = {
  must: {
    label: '🔴 必读',
    badge: 'bg-red-500/12 text-red-400 border-red-500/40',
  },
  recommend: {
    label: '🟡 推荐',
    badge: 'bg-amber-500/12 text-amber-400 border-amber-500/40',
  },
  info: {
    label: '🔵 了解',
    badge: 'bg-sky-500/12 text-sky-400 border-sky-500/40',
  },
};

function formatDate(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildCopyText(item: AiNewsItem) {
  return [
    item.title,
    `1) ${item.points[0]}`,
    `2) ${item.points[1]}`,
    `3) ${item.points[2]}`,
    `[查看原文] ${item.url}`,
  ].join('\n');
}

function GhostActionButton({ href, onCopy }: { href: string; onCopy: () => Promise<void> }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-300 bg-white/80 px-3 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
      >
        <ExternalLink size={14} />
        跳转
      </a>
      <button
        onClick={handleCopy}
        className="inline-flex h-9 min-w-20 items-center justify-center gap-1 rounded-full border border-slate-300 bg-white/80 px-3 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  );
}

function NewsCard({ item, executive = false }: { item: AiNewsItem; executive?: boolean }) {
  const meta = levelMeta[item.level];
  const [aiPoints, setAiPoints] = useState<[string, string, string] | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const onCopy = async () => {
    const base = aiPoints ? { ...item, points: aiPoints } : item;
    await navigator.clipboard.writeText(buildCopyText(base));
  };

  const onBrief = async () => {
    try {
      setBriefLoading(true);
      setBriefError(null);
      const res = await fetch('/api/ai-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          source: item.source,
          snippet: item.snippet ?? item.points.join(' '),
          url: item.url,
          date: item.date,
        }),
      });
      const json = (await res.json()) as { message?: string } & Partial<BriefResponse>;
      if (!res.ok || !json.points) {
        throw new Error(json.message || 'AI 精简失败');
      }
      setAiPoints(json.points);
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : 'AI 精简失败');
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <article
      className={[
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        executive ? 'border-red-200 ring-1 ring-red-200/80' : '',
      ].join(' ')}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${meta.badge}`}>{meta.label}</span>
          <h3 className="text-base font-semibold leading-snug text-slate-900 md:text-lg">{item.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.source}</span>
            <span>{formatDate(item.date)}</span>
          </div>
        </div>
      </header>

      {item.snippet ? (
        <p className="mb-3 text-xs text-slate-500">
          原文摘要：<span className="break-words">{item.snippet}</span>
        </p>
      ) : null}

      <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
        <li>{aiPoints ? aiPoints[0] : item.points[0]}</li>
        <li>{aiPoints ? aiPoints[1] : item.points[1]}</li>
        <li>{aiPoints ? aiPoints[2] : item.points[2]}</li>
      </ol>

      {briefError ? (
        <p className="mb-2 text-xs text-red-500">AI 精简失败：{briefError}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBrief}
          disabled={briefLoading}
          className="inline-flex h-8 items-center rounded-full border border-slate-300 bg-white/80 px-3 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-60"
        >
          {briefLoading ? 'AI 精简中…' : aiPoints ? '重新精简' : 'AI 精简要点'}
        </button>
        <GhostActionButton href={item.url} onCopy={onCopy} />
      </div>
    </article>
  );
}

function SkeletonCard() {
  return <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />;
}

export default function AiNewsPage() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/fetch-ai-news', { cache: 'no-store' });
        const json = (await res.json()) as ApiPayload;
        if (!res.ok) {
          throw new Error(json.message || '请求失败');
        }
        if (mounted) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : '加载失败');
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const feed = data?.feed ?? [];
    return {
      recommend: feed.filter((x) => x.level === 'recommend'),
      info: feed.filter((x) => x.level === 'info'),
      must: feed.filter((x) => x.level === 'must'),
    };
  }, [data]);

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.26em] text-slate-500">AI Navigation</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">AI 航向标</h1>
            <p className="mt-2 text-sm text-slate-600">
              聚焦最近 24 小时的 AI 重要动向，优先提炼巨头 CEO 公开发声，帮你快速掌握「必须知道的那几件事」。
            </p>
          </div>
          {data?.generatedAt ? (
            <p className="text-[11px] text-slate-500">
              最近更新：{new Date(data.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </header>

        {/* Loading */}
        {loading ? (
          <section className="space-y-4">
            <SkeletonCard />
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </section>
        ) : null}

        {/* Error */}
        {!loading && error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            加载失败：{error}
          </section>
        ) : null}

        {/* Empty */}
        {!loading && !error && data && data.executive.length === 0 && data.feed.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            今日暂无可展示的 AI 资讯，请稍后再试。
          </section>
        ) : null}

        {/* Content */}
        {!loading && !error && data ? (
          <div className="space-y-10">
            {/* 顶部：CEO 追踪动态（必读） */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">巨头风向标</h2>
                <span className="rounded-full border border-red-500/40 bg-red-500/12 px-3 py-1 text-xs text-red-400">
                  CEO 24h 动态
                </span>
              </div>
              <div className="space-y-4">
                {data.executive.map((item, idx) => (
                  <NewsCard key={`${item.url}-${idx}`} item={{ ...item, level: 'must' }} executive />
                ))}
              </div>
            </section>

            {/* 中部：其他必读（如果有） */}
            {grouped.must.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xl font-semibold">重大发布（必读）</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {grouped.must.map((item, idx) => (
                    <NewsCard key={`${item.url}-${idx}`} item={item} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* 底部：推荐 + 了解 */}
            <section className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">推荐</h2>
                {grouped.recommend.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    暂无推荐内容
                  </p>
                ) : (
                  grouped.recommend.map((item, idx) => <NewsCard key={`${item.url}-${idx}`} item={item} />)
                )}
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">了解</h2>
                {grouped.info.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    暂无了解类内容
                  </p>
                ) : (
                  grouped.info.map((item, idx) => <NewsCard key={`${item.url}-${idx}`} item={item} />)
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

