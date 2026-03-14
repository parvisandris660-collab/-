'use strict';

/* ================================================================
   AI 日报数据与渲染逻辑
   ================================================================
   【如何更新数据】
   手动维护时：直接修改下面的 MOCK_NEWS 数组即可。
   接入自动化时：参见 ai-news.html 里"如何接入真实数据"区块。

   【数据字段说明】
   - level:     'must' | 'rec' | 'info'  （必读 / 推荐 / 了解）
   - title:     文章标题
   - source:    来源名称（如 "X (Twitter)"、"TechCrunch"）
   - sourceUrl: 来源主页（可选）
   - points:    3条中文核心摘要（数组，建议恰好 3 条）
   - url:       原文链接
   - date:      发布日期字符串 yyyy-mm-dd（可选）
================================================================ */
const MOCK_NEWS = [
  {
    level: 'must',
    title: 'OpenAI 宣布 GPT-5 即将上线，推理能力大幅提升',
    source: 'The Verge',
    sourceUrl: 'https://www.theverge.com/',
    points: [
      'OpenAI 确认 GPT-5 将于近期开始灰度测试，主打增强推理与多步骤规划能力',
      '在数学、代码和逻辑推理基准测试中，GPT-5 相比 GPT-4o 提升约 40%',
      '订阅用户将优先获得访问权，企业 API 同步开放',
    ],
    url: 'https://www.theverge.com/',
    date: '2026-03-10',
  },
  {
    level: 'must',
    title: 'Google DeepMind 发布 Gemini 2.0 Ultra，原生多模态能力登顶',
    source: 'Google Blog',
    sourceUrl: 'https://blog.google/',
    points: [
      'Gemini 2.0 Ultra 在视频理解、代码生成和长文档摘要上全面超越上代',
      '新增原生图像/音频输出能力，可直接生成可执行代码并运行调试',
      '已集成进 Google Workspace，企业用户即日起可申请早期访问',
    ],
    url: 'https://blog.google/',
    date: '2026-03-10',
  },
  {
    level: 'rec',
    title: 'Cursor AI 更新：支持全代码库多文件联动修改',
    source: 'Cursor Blog',
    sourceUrl: 'https://cursor.com/',
    points: [
      'Cursor 0.45 新增"全仓库模式"，可跨多个文件联动分析并批量修改',
      '新版 Agent 模式支持自动运行测试、读取报错并迭代修复，减少人工确认步骤',
      'Windows 和 macOS 已同步推送，Linux 版本本周内跟进',
    ],
    url: 'https://cursor.com/',
    date: '2026-03-09',
  },
  {
    level: 'rec',
    title: 'Anthropic 公布 Claude 3.7 的训练方法论，强调宪法 AI 新进展',
    source: 'Anthropic',
    sourceUrl: 'https://www.anthropic.com/',
    points: [
      'Anthropic 发布技术报告，详解 Claude 3.7 如何通过宪法 AI 降低有害输出',
      '新版训练流程在安全性评估中通过率提升至 98.6%，是目前公开最高水平',
      '开源了部分对齐数据集和评测框架，可供研究者复现验证',
    ],
    url: 'https://www.anthropic.com/',
    date: '2026-03-09',
  },
  {
    level: 'rec',
    title: 'Mistral 发布 Mistral Small 3.1，参数量仅 24B 但超越多款旗舰模型',
    source: 'Mistral AI',
    sourceUrl: 'https://mistral.ai/',
    points: [
      'Mistral Small 3.1（24B）在 MMLU、HumanEval 等主流评测中超越 GPT-4o mini',
      '推理速度极快，在消费级显卡（RTX 4090）上可实现 80+ tokens/s',
      '采用 Apache 2.0 协议完全开源，可商用，适合本地部署场景',
    ],
    url: 'https://mistral.ai/',
    date: '2026-03-08',
  },
  {
    level: 'info',
    title: 'Stability AI 宣布完成新一轮融资，专注视频生成方向',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com/',
    points: [
      'Stability AI 完成 8000 万美元 B 轮融资，估值回升至 10 亿美元',
      '新战略聚焦视频生成模型，预计 Q2 发布 Stable Video 3.0',
      '此前创始人内部纠纷已和解，现任 CEO 将继续主导产品方向',
    ],
    url: 'https://techcrunch.com/',
    date: '2026-03-08',
  },
  {
    level: 'info',
    title: 'Meta 开源 LLaMA 4 Multimodal，支持图文混合输入',
    source: 'Meta AI Blog',
    sourceUrl: 'https://ai.meta.com/',
    points: [
      'LLaMA 4 Multimodal 版本开源，可同时理解图像和文本，支持多轮对话',
      '模型分为 8B 和 70B 两档，均在 Hugging Face 免费下载',
      '性能在开源多模态模型中排名第一，但在闭源旗舰面前仍有差距',
    ],
    url: 'https://ai.meta.com/',
    date: '2026-03-07',
  },
];


/* ================================================================
   工具函数
================================================================ */

/** 将 level 映射为中文标签文字 */
function levelText(level) {
  return { must: '必读', rec: '推荐', info: '了解' }[level] ?? level;
}

/** 将 level 映射为 badge CSS 类名 */
function levelClass(level) {
  return `news-badge news-badge--${level}`;
}

/** 格式化日期（从 yyyy-mm-dd 到 M月D日）*/
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}


/* ================================================================
   渲染单张新闻卡片
================================================================ */
function renderCard(item, index) {
  const points = (item.points || []).map(p =>
    `<li class="news-card-point">${p}</li>`
  ).join('');

  const dateHtml = item.date
    ? `<div class="news-card-date">${formatDate(item.date)}</div>`
    : '';

  const sourceHtml = item.sourceUrl
    ? `<a href="${item.sourceUrl}" target="_blank" rel="noopener" class="news-card-source">${item.source}</a>`
    : `<span class="news-card-source">${item.source}</span>`;

  return `
    <article class="news-card reveal" data-level="${item.level}" tabindex="0"
             aria-label="${levelText(item.level)}：${item.title}">
      <div class="news-card-num">${String(index + 1).padStart(2, '0')}</div>
      <div class="news-card-body">
        <div class="news-card-header">
          <span class="${levelClass(item.level)}">${levelText(item.level)}</span>
          <h2 class="news-card-title">${item.title}</h2>
          ${sourceHtml}
        </div>
        <ul class="news-card-points">${points}</ul>
        <a href="${item.url}" target="_blank" rel="noopener" class="news-card-link"
           aria-label="查看原文：${item.title}">
          查看原文
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 11L11 2M11 2H5M11 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
      ${dateHtml}
    </article>
  `;
}


/* ================================================================
   渲染新闻列表（支持按 level 筛选）
================================================================ */
function renderNews(filter = 'all') {
  const grid    = document.getElementById('newsGrid');
  const empty   = document.getElementById('newsEmpty');
  const loading = document.getElementById('newsLoading');
  const counter = document.getElementById('filterCount');
  if (!grid) return;

  // 隐藏加载态
  if (loading) loading.hidden = true;

  const filtered = filter === 'all'
    ? MOCK_NEWS
    : MOCK_NEWS.filter(n => n.level === filter);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    if (counter) counter.textContent = '';
    return;
  }

  if (empty) empty.hidden = true;
  if (counter) counter.textContent = `${filtered.length} 条`;

  grid.innerHTML = filtered.map(renderCard).join('');

  // 重新触发滚动入场动画（因为内容是动态插入的）
  grid.querySelectorAll('.reveal').forEach(el => {
    el.classList.remove('is-visible');
  });

  // 如果 ScrollReveal 已在 main.js 里初始化，重新创建一个实例来观察新元素
  if (typeof ScrollReveal !== 'undefined') {
    new ScrollReveal('.news-card.reveal');
  } else {
    // 降级：直接显示
    grid.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // 键盘支持：Enter 触发原文链接
  grid.querySelectorAll('.news-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const link = card.querySelector('.news-card-link');
        if (link) link.click();
      }
    });
  });
}


/* ================================================================
   筛选栏交互
================================================================ */
function initFilter() {
  const btns = document.querySelectorAll('.news-filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => {
        b.classList.remove('news-filter-btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('news-filter-btn--active');
      btn.setAttribute('aria-selected', 'true');
      renderNews(btn.dataset.filter);
    });
  });
}


/* ================================================================
   设置今日日期
================================================================ */
function setNewsDate() {
  const el = document.getElementById('newsDate');
  if (!el) return;
  const d = new Date();
  el.textContent = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}


/* ================================================================
   ========  接入真实 API 的预留接口  ========

   未来替换 MOCK_NEWS 时，只需实现下面这个异步函数：

   async function fetchLiveNews() {
     // 1. 调用 Tavily / Gemini 搜索接口抓取今日 AI 资讯
     // 2. 用大模型对每条新闻打 level 标签 + 生成 3 句摘要
     // 3. 返回与 MOCK_NEWS 相同结构的数组
     const res = await fetch('/api/fetch-ai-news');   // 本地或 Vercel API
     return res.json();
   }

   然后把 renderNews() 改成异步调用：
   const news = await fetchLiveNews();
   renderNews('all', news);

================================================================ */


/* ================================================================
   页面初始化
================================================================ */
function initNewsPage() {
  setNewsDate();
  renderNews('all');
  initFilter();
}

// 等 DOM 就绪后再初始化（main.js 可能在前面）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewsPage);
} else {
  initNewsPage();
}
