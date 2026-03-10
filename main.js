/**
 * 个人网站 - 交互逻辑
 * =====================================================
 * 模块：
 *  1. NavController     - 导航：滚动吸顶 + 汉堡菜单 + 锚点高亮
 *  2. ScrollReveal      - IntersectionObserver 滚动入场动画
 *  3. SmoothScroll      - 平滑滚动（补充原生 scroll-behavior）
 *  4. ActiveSection     - 滚动时高亮对应导航链接
 *  5. init              - 页面加载后统一初始化
 * =====================================================
 */

'use strict';

/* ======================================================
   数据配置：经历与作品（集中维护）
====================================================== */
const SITE_DATA = {
  timeline: [
    {
      date: '2026年 3月',
      statusText: '进行中',
      statusVariant: 'active',
      title: 'AI 训练师进阶之路',
      org: '杭州「且慢」· AI 训练师课程',
      desc: '入学杭州「且慢」第一课，正式开启 AI 训练师进阶之路。系统学习提示词工程、模型微调与 AI 应用落地等核心技能。',
      points: [
        '系统训练：提示词工程、数据标注规范、评测方法与迭代流程',
        '实践输出：围绕真实场景做 prompt/工具链设计与效果对比复盘',
        '目标方向：AI 应用落地（需求拆解 → 方案设计 → 可交付 Demo）',
      ],
      tags: ['Prompt Engineering', 'AI 应用', '模型训练'],
    },
    {
      date: '2025年',
      statusText: '已完成',
      statusVariant: 'default',
      title: '计算机专业毕业',
      org: '计算机科学与技术 · 本科',
      desc: '完成计算机专业学业，积累了扎实的软件开发与项目管理基础。系统掌握数据结构、算法、操作系统与软件工程等核心知识。',
      points: [
        '课程能力：数据结构与算法、操作系统、计算机网络、软件工程',
        '工程训练：需求分析、文档协作、代码规范与交付意识',
        '兴趣方向：前端工程化、AI 工具与自动化效率提升',
      ],
      tags: ['软件开发', '项目管理', '算法与数据结构'],
    },
  ],
  projects: [
    {
      id: 'project-mario',
      coverVariant: 1,
      emoji: '🎮',
      meta: ['游戏开发', 'JavaScript'],
      title: '超级玛丽 / 魂斗罗复刻',
      desc: '复刻经典横版游戏的核心玩法，把“碰撞/动画/关卡/状态机”等关键点做成可复用的模块化实现。',
      points: [
        '实现碰撞检测、角色状态切换、精灵动画与基础关卡逻辑',
        '可扩展：敌人/道具/关卡配置支持快速迭代',
        '沉淀：总结游戏循环与输入响应的工程化写法',
      ],
      detailTitle: '超级玛丽 / 魂斗罗复刻 · 项目说明',
      detailDesc:
        '这个项目用于训练“复杂交互与状态管理”的基本功：输入响应、动画渲染、碰撞检测与关卡推进。' +
        '如果你希望我把它整理成可公开的仓库结构（含 README 与演示链接），我也可以继续完善。',
    },
    {
      id: 'project-extension',
      coverVariant: 2,
      emoji: '🧩',
      meta: ['浏览器插件', '前端工具'],
      title: '浏览器效率插件',
      desc: '面向高频网页操作的效率工具：把重复点击变成“快捷键 + 自动化规则”，让流程更短、更稳。',
      points: [
        '支持快捷键、规则匹配与一键执行（规则可扩展）',
        '注重稳定性：异常兜底与提示，减少“静默失败”',
        '关注体验：低打扰 UI 与可撤销思路（避免误触成本）',
      ],
      detailTitle: '浏览器效率插件 · 项目说明',
      detailDesc:
        '面向高频网页场景，把“重复点击/复制粘贴/多步骤操作”收敛成快捷键与可配置规则。' +
        '后续可以补齐：规则 DSL、同步方案（本地/云端）、以及隐私声明与权限说明。',
    },
    {
      id: 'project-python',
      coverVariant: 3,
      emoji: '🐍',
      meta: ['Python', '自动化'],
      title: 'Python 自动化脚本项目',
      desc: '用 Python 把重复性工作流程自动化：批处理、采集清洗、定时执行与结果汇总，提升个人与团队效率。',
      points: [
        '封装可复用脚本模板：参数化、日志、错误重试与输出规范',
        '覆盖文件/数据处理常见需求：采集 → 清洗 → 导出',
        '可交付：提供使用说明与示例，降低上手门槛',
      ],
      detailTitle: 'Python 自动化脚本项目 · 项目说明',
      detailDesc:
        '汇总多个脚本并统一工程化模板：参数解析、日志、异常重试、输出结构与使用示例。' +
        '适合展示“可交付与可复用”的工程习惯，也方便在合作/实习中快速落地。',
    },
  ],
};

function renderTimeline() {
  const wrap = document.getElementById('timeline');
  if (!wrap) return;

  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/82c8df56-92aa-4ecf-8b01-308d6549bd69',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Debug-Session-Id':'9decd4'
    },
    body:JSON.stringify({
      sessionId:'9decd4',
      runId:'pre-fix',
      hypothesisId:'H1',
      location:'main.js:renderTimeline',
      message:'renderTimeline called',
      data:{timelineCount:SITE_DATA.timeline.length},
      timestamp:Date.now()
    })
  }).catch(()=>{});
  // #endregion agent log

  wrap.innerHTML = SITE_DATA.timeline.map((item, idx) => {
    const delayClass = idx === 0 ? '' : ` reveal--delay-${Math.min(idx, 5)}`;
    const badgeClass = item.statusVariant === 'active' ? 'timeline-badge timeline-badge--active' : 'timeline-badge';

    const pointsHtml = item.points?.length
      ? `<ul class="timeline-points" aria-label="经历要点">${item.points.map(p => `<li>${p}</li>`).join('')}</ul>`
      : '';

    const tagsHtml = item.tags?.length
      ? `<div class="timeline-tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
      : '';

    return `
      <div class="timeline-item reveal${delayClass}">
        <div class="timeline-dot"></div>
        <div class="timeline-date">${item.date}</div>
        <div class="timeline-card">
          <div class="timeline-card-header">
            <span class="${badgeClass}">${item.statusText}</span>
            <h3 class="timeline-title">${item.title}</h3>
          </div>
          <p class="timeline-org">${item.org}</p>
          <p class="timeline-desc">${item.desc}</p>
          ${pointsHtml}
          ${tagsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function renderPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  const details = document.getElementById('projectDetails');
  if (!grid || !details) return;

  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/82c8df56-92aa-4ecf-8b01-308d6549bd69',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Debug-Session-Id':'9decd4'
    },
    body:JSON.stringify({
      sessionId:'9decd4',
      runId:'pre-fix',
      hypothesisId:'H2',
      location:'main.js:renderPortfolio',
      message:'renderPortfolio called',
      data:{projectCount:SITE_DATA.projects.length},
      timestamp:Date.now()
    })
  }).catch(()=>{});
  // #endregion agent log
  const githubSvg = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  `;

  grid.innerHTML = SITE_DATA.projects.map((p, idx) => {
    const delayClass = idx === 0 ? '' : ` reveal--delay-${Math.min(idx, 5)}`;
    const metaHtml = p.meta.map(t => `<span class="project-tag">${t}</span>`).join('');
    const pointsHtml = p.points?.length ? `<ul class="project-points" aria-label="项目亮点">${p.points.map(x => `<li>${x}</li>`).join('')}</ul>` : '';

    return `
      <article class="project-card reveal${delayClass}" tabindex="0">
        <div class="project-card-top">
          <div class="project-cover project-cover--${p.coverVariant}">
            <div class="project-cover-icon">${p.emoji}</div>
          </div>
        </div>
        <div class="project-card-body">
          <div class="project-meta">${metaHtml}</div>
          <h3 class="project-title">${p.title}</h3>
          <p class="project-desc">${p.desc}</p>
          ${pointsHtml}
          <div class="project-footer">
            <a href="#${p.id}" class="project-link" aria-label="查看${p.title}项目详情">
              查看项目
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <a href="#${p.id}" class="project-github" aria-label="查看${p.title}代码与说明">
              ${githubSvg}
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  details.innerHTML = SITE_DATA.projects.map((p, idx) => {
    const delayClass = idx === 0 ? '' : ` reveal--delay-${Math.min(idx, 5)}`;
    return `
      <article class="project-detail reveal${delayClass}" id="${p.id}" aria-label="${p.title}详情">
        <h3 class="project-detail-title">${p.detailTitle}</h3>
        <p class="project-detail-desc">${p.detailDesc}</p>
        <div class="project-detail-actions">
          <a class="btn btn-ghost" href="#contact">联系我获取演示/代码</a>
          <a class="btn btn-primary" href="#portfolio">返回作品列表</a>
        </div>
      </article>
    `;
  }).join('');
}

/* ======================================================
   1. NavController - 导航控制器
====================================================== */
class NavController {
  constructor() {
    this.$header    = document.getElementById('header');
    this.$burger    = document.getElementById('navBurger');
    this.$navLinks  = document.getElementById('navLinks');
    this._isOpen    = false;
    this._lastFocusedEl = null;

    this._bindEvents();
    this._onScroll(); // 初始检测一次（避免刷新时已在中途）
  }

  _bindEvents() {
    // 滚动监听：导航栏吸顶阴影
    window.addEventListener('scroll', this._onScroll.bind(this), { passive: true });

    // 汉堡菜单开关
    this.$burger.addEventListener('click', (e) => {
      // #region agent log
      fetch('http://127.0.0.1:7625/ingest/82c8df56-92aa-4ecf-8b01-308d6549bd69',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'X-Debug-Session-Id':'9decd4'
        },
        body:JSON.stringify({
          sessionId:'9decd4',
          runId:'pre-fix',
          hypothesisId:'H3',
          location:'main.js:NavController._bindEvents',
          message:'nav burger clicked',
          data:{isOpen:this._isOpen, viewportWidth:window.innerWidth},
          timestamp:Date.now()
        })
      }).catch(()=>{});
      // #endregion agent log

      this._toggleMenu(e);
    });

    // 点击导航链接后关闭移动菜单
    this.$navLinks.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link') && this._isOpen) {
        this._closeMenu();
      }
    });

    // 点击菜单外区域关闭
    document.addEventListener('click', (e) => {
      if (
        this._isOpen &&
        !this.$navLinks.contains(e.target) &&
        !this.$burger.contains(e.target)
      ) {
        this._closeMenu();
      }
    });

    // ESC 键关闭菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) this._closeMenu();
    });

    // Tab 焦点限制（移动端菜单打开时）
    document.addEventListener('keydown', (e) => {
      if (!this._isOpen) return;
      if (e.key !== 'Tab') return;

      const focusables = this._getMenuFocusables();
      if (!focusables.length) return;

      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === document.body) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  _getMenuFocusables() {
    // 仅在移动端菜单模式下限制焦点
    const isMobile = window.innerWidth < 600;
    if (!isMobile) return [];
    if (!this.$navLinks.classList.contains('nav-links--mobile-open')) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(this.$navLinks.querySelectorAll(selector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }

  _onScroll() {
    const scrolled = window.scrollY > 20;
    this.$header.classList.toggle('header--scrolled', scrolled);
  }

  _toggleMenu() {
    this._isOpen ? this._closeMenu() : this._openMenu();
  }

  _openMenu() {
    this._isOpen = true;
    this._lastFocusedEl = document.activeElement;
    this.$burger.classList.add('nav-burger--open');
    this.$burger.setAttribute('aria-expanded', 'true');
    this.$navLinks.classList.add('nav-links--mobile-open');
    this.$navLinks.style.display = 'flex';
    // 防止背景滚动
    document.body.style.overflow = 'hidden';

    // 将焦点移动到第一个导航链接
    const firstLink = this.$navLinks.querySelector('a.nav-link');
    if (firstLink) firstLink.focus({ preventScroll: true });

    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/82c8df56-92aa-4ecf-8b01-308d6549bd69',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Debug-Session-Id':'9decd4'
      },
      body:JSON.stringify({
        sessionId:'9decd4',
        runId:'pre-fix',
        hypothesisId:'H3',
        location:'main.js:NavController._openMenu',
        message:'menu opened',
        data:{hasFirstLink:!!firstLink},
        timestamp:Date.now()
      })
    }).catch(()=>{});
    // #endregion agent log
  }

  _closeMenu() {
    this._isOpen = false;
    this.$burger.classList.remove('nav-burger--open');
    this.$burger.setAttribute('aria-expanded', 'false');
    this.$navLinks.classList.remove('nav-links--mobile-open');
    // 小屏隐藏，大屏通过 CSS 控制
    if (window.innerWidth < 600) {
      this.$navLinks.style.display = '';
    }
    document.body.style.overflow = '';

    // 关闭后返回焦点（优先回汉堡按钮）
    if (this._lastFocusedEl && typeof this._lastFocusedEl.focus === 'function') {
      // 若之前焦点是页面其它元素，回到 burger 更符合预期
      this.$burger.focus({ preventScroll: true });
    }
    this._lastFocusedEl = null;

    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/82c8df56-92aa-4ecf-8b01-308d6549bd69',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Debug-Session-Id':'9decd4'
      },
      body:JSON.stringify({
        sessionId:'9decd4',
        runId:'pre-fix',
        hypothesisId:'H3',
        location:'main.js:NavController._closeMenu',
        message:'menu closed',
        data:{},
        timestamp:Date.now()
      })
    }).catch(()=>{});
    // #endregion agent log
  }
}


/* ======================================================
   2. ScrollReveal - 滚动入场动画
====================================================== */
class ScrollReveal {
  constructor(selector = '.reveal') {
    this._elements = document.querySelectorAll(selector);
    this._init();
  }

  _init() {
    // 若浏览器不支持 IntersectionObserver，直接显示所有元素
    if (!('IntersectionObserver' in window)) {
      this._elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // 动画触发后取消观察，避免重复触发
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,       // 元素可见 12% 时触发
        rootMargin: '0px 0px -40px 0px', // 稍微提前触发，体验更顺滑
      }
    );

    this._elements.forEach(el => observer.observe(el));
  }
}


/* ======================================================
   3. SmoothScroll - 平滑滚动到锚点
====================================================== */
class SmoothScroll {
  constructor() {
    this._bindEvents();
  }

  _bindEvents() {
    // 拦截所有站内锚点点击，用 JS 实现补偿导航栏高度的滚动
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      this._scrollTo(target);
    });
  }

  _scrollTo(target) {
    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height')
    ) || 64;

    const offsetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth',
    });

    // 更新地址栏 URL（不触发跳转）
    history.pushState(null, '', `#${target.id}`);
  }
}


/* ======================================================
   4. ActiveSection - 滚动时高亮导航链接
====================================================== */
class ActiveSection {
  constructor() {
    this._navLinks = document.querySelectorAll('.nav-link[data-section]');
    this._sections = [];

    // 收集所有目标 section
    this._navLinks.forEach(link => {
      const id = link.dataset.section;
      const section = document.getElementById(id);
      if (section) this._sections.push({ id, section, link });
    });

    this._init();
  }

  _init() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            this._setActive(id);
          }
        });
      },
      {
        // 视口中间 40% 区域命中时高亮
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0,
      }
    );

    this._sections.forEach(({ section }) => observer.observe(section));
  }

  _setActive(activeId) {
    this._sections.forEach(({ id, link }) => {
      link.classList.toggle('nav-link--active', id === activeId);
    });
  }
}


/* ======================================================
   5. 打字机效果（可选：Hero Slogan 打字动画）
====================================================== */
class Typewriter {
  /**
   * @param {string} selector - 目标元素选择器
   * @param {string[]} texts   - 要循环打字的文本数组
   * @param {number} speed     - 打字速度（ms/字符）
   */
  constructor(selector, texts, speed = 80) {
    this.$el    = document.querySelector(selector);
    this.texts  = texts;
    this.speed  = speed;
    this._textIndex = 0;
    this._charIndex = 0;
    this._deleting  = false;

    if (this.$el) this._tick();
  }

  _tick() {
    const currentText = this.texts[this._textIndex];
    const displayed   = this._deleting
      ? currentText.substring(0, this._charIndex - 1)
      : currentText.substring(0, this._charIndex + 1);

    this.$el.textContent = displayed;

    if (!this._deleting && displayed === currentText) {
      // 打完，等待后开始删除
      setTimeout(() => {
        this._deleting = true;
        this._charIndex = currentText.length;
        this._tick();
      }, 2200);
      return;
    }

    if (this._deleting && displayed === '') {
      // 删完，切换到下一段文字
      this._deleting = false;
      this._textIndex = (this._textIndex + 1) % this.texts.length;
      this._charIndex = 0;
      setTimeout(() => this._tick(), 400);
      return;
    }

    this._charIndex += this._deleting ? -1 : 1;
    const delay = this._deleting ? this.speed * 0.5 : this.speed;
    setTimeout(() => this._tick(), delay);
  }
}


/* ======================================================
   6. 年份版权自动更新
====================================================== */
function updateCopyrightYear() {
  const el = document.querySelector('.footer-left');
  if (!el) return;
  const year = new Date().getFullYear();
  el.innerHTML = el.innerHTML.replace(/\d{4}/, year);
}


/* ======================================================
   7. 项目卡片：Enter 键支持（无障碍）
====================================================== */
function initCardKeyboard() {
  document.querySelectorAll('.project-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const link = card.querySelector('.project-link');
        if (link) link.click();
      }
    });
  });
}


/* ======================================================
   8. 复制到剪贴板（邮箱 / 微信号）
====================================================== */
function initCopyToClipboard() {
  document.addEventListener('click', async (e) => {
    const trigger = e.target.closest('[data-copy-value]');
    if (!trigger) return;

    // 只对 button 做复制，避免拦截正常跳转/打开邮箱
    if (trigger.tagName !== 'BUTTON') return;

    const value = trigger.getAttribute('data-copy-value');
    if (!value) return;

    e.preventDefault();

    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/82c8df56-92aa-4ecf-8b01-308d6549bd69',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Debug-Session-Id':'9decd4'
      },
      body:JSON.stringify({
        sessionId:'9decd4',
        runId:'pre-fix',
        hypothesisId:'H4',
        location:'main.js:initCopyToClipboard',
        message:'copy trigger',
        data:{tagName:trigger.tagName, valueLength:value.length},
        timestamp:Date.now()
      })
    }).catch(()=>{});
    // #endregion agent log

    try {
      await navigator.clipboard.writeText(value);
      flashCopied(trigger);
    } catch {
      // 兼容旧浏览器：降级使用选区复制
      const ok = fallbackCopy(value);
      if (ok) flashCopied(trigger);
    }
  });
}

function flashCopied(el) {
  const original = el.textContent;
  el.textContent = '已复制';
  el.setAttribute('aria-label', '已复制到剪贴板');
  setTimeout(() => {
    el.textContent = original;
    el.removeAttribute('aria-label');
  }, 1200);
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
  }
}


/* ======================================================
   9. 页面初始化入口
====================================================== */
function init() {
  // 先渲染数据，再初始化观察/交互（避免 ScrollReveal 漏掉节点）
  renderTimeline();
  renderPortfolio();

  // #region agent log
  fetch('http://127.0.0.1:7625/ingest/82c8df56-92aa-4ecf-8b01-308d6549bd69',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Debug-Session-Id':'9decd4'
    },
    body:JSON.stringify({
      sessionId:'9decd4',
      runId:'pre-fix',
      hypothesisId:'H0',
      location:'main.js:init',
      message:'init called',
      data:{},
      timestamp:Date.now()
    })
  }).catch(()=>{});
  // #endregion agent log

  // 基础交互模块
  new NavController();
  new ScrollReveal();
  new SmoothScroll();
  new ActiveSection();

  // 功能增强
  updateCopyrightYear();
  initCardKeyboard();
  initCopyToClipboard();

  // 可选：Hero Slogan 打字机效果
  // 注意：若要启用，需在 HTML 的 .hero-slogan 里把文字清空，由 JS 填充
  // new Typewriter('.hero-slogan', [
  //   '2025届计算机专业毕业生 | AI 训练师',
  //   '热爱编程 · 探索 AI 前沿',
  //   '致力于 AI 与开发的结合',
  // ], 75);
}

// DOM 加载完毕后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
