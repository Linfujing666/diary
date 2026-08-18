/* ============================================
   森系手账 · 森林小管家角色（SVG）
   原创日漫风森林小鹿角色
   ============================================ */

const Mascot = {
  // 角色SVG库 - 不同场景不同动作
  svgs: {
    // 默认 - 站立微笑
    default: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 鹿角 -->
      <path d="M38 28 Q34 18 30 14 M36 24 Q32 20 28 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M62 28 Q66 18 70 14 M64 24 Q68 20 72 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="28" cy="13" r="2.5" fill="#c4a46d"/>
      <circle cx="72" cy="13" r="2.5" fill="#c4a46d"/>
      <!-- 脸 -->
      <ellipse cx="50" cy="50" rx="22" ry="20" fill="#f5e6c8"/>
      <!-- 耳朵 -->
      <ellipse cx="30" cy="36" rx="6" ry="9" fill="#e8d4a8" transform="rotate(-25 30 36)"/>
      <ellipse cx="70" cy="36" rx="6" ry="9" fill="#e8d4a8" transform="rotate(25 70 36)"/>
      <ellipse cx="31" cy="37" rx="3" ry="5" fill="#f0d8a8" transform="rotate(-25 31 37)"/>
      <ellipse cx="69" cy="37" rx="3" ry="5" fill="#f0d8a8" transform="rotate(25 69 37)"/>
      <!-- 腮红 -->
      <ellipse cx="36" cy="55" rx="4" ry="3" fill="#f4b8a0" opacity="0.5"/>
      <ellipse cx="64" cy="55" rx="4" ry="3" fill="#f4b8a0" opacity="0.5"/>
      <!-- 眼睛 -->
      <ellipse cx="42" cy="48" rx="2.5" ry="3" fill="#5a4a3a"/>
      <ellipse cx="58" cy="48" rx="2.5" ry="3" fill="#5a4a3a"/>
      <circle cx="42.5" cy="47" r="0.8" fill="#fff"/>
      <circle cx="58.5" cy="47" r="0.8" fill="#fff"/>
      <!-- 嘴 -->
      <path d="M46 58 Q50 61 54 58" stroke="#5a4a3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- 身体 -->
      <ellipse cx="50" cy="82" rx="14" ry="10" fill="#8ba888"/>
      <!-- 叶子装饰 -->
      <path d="M44 72 Q42 70 44 68 Q46 70 44 72" fill="#6b9a5a"/>
      <path d="M56 72 Q58 70 56 68 Q54 70 56 72" fill="#6b9a5a"/>
    </svg>`,

    // 待收货 - 抱着包裹
    waiting: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 28 Q34 18 30 14 M36 24 Q32 20 28 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M62 28 Q66 18 70 14 M64 24 Q68 20 72 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="28" cy="13" r="2.5" fill="#c4a46d"/>
      <circle cx="72" cy="13" r="2.5" fill="#c4a46d"/>
      <ellipse cx="50" cy="45" rx="22" ry="20" fill="#f5e6c8"/>
      <ellipse cx="30" cy="32" rx="6" ry="9" fill="#e8d4a8" transform="rotate(-25 30 32)"/>
      <ellipse cx="70" cy="32" rx="6" ry="9" fill="#e8d4a8" transform="rotate(25 70 32)"/>
      <ellipse cx="31" cy="33" rx="3" ry="5" fill="#f0d8a8" transform="rotate(-25 31 33)"/>
      <ellipse cx="69" cy="33" rx="3" ry="5" fill="#f0d8a8" transform="rotate(25 69 33)"/>
      <ellipse cx="36" cy="50" rx="4" ry="3" fill="#f4b8a0" opacity="0.5"/>
      <ellipse cx="64" cy="50" rx="4" ry="3" fill="#f4b8a0" opacity="0.5"/>
      <!-- 期待的眼神 -->
      <ellipse cx="42" cy="43" rx="2.5" ry="3.5" fill="#5a4a3a"/>
      <ellipse cx="58" cy="43" rx="2.5" ry="3.5" fill="#5a4a3a"/>
      <circle cx="42.5" cy="42" r="1" fill="#fff"/>
      <circle cx="58.5" cy="42" r="1" fill="#fff"/>
      <!-- 小O嘴 -->
      <ellipse cx="50" cy="55" rx="2" ry="2.5" fill="#5a4a3a"/>
      <!-- 包裹 -->
      <rect x="38" y="62" width="24" height="20" rx="2" fill="#d4a25e"/>
      <rect x="38" y="62" width="24" height="20" rx="2" fill="none" stroke="#c4954e" stroke-width="1"/>
      <line x1="50" y1="62" x2="50" y2="82" stroke="#c4954e" stroke-width="1"/>
      <line x1="38" y1="72" x2="62" y2="72" stroke="#c4954e" stroke-width="1"/>
      <path d="M46 66 Q50 64 54 66" stroke="#8ba888" stroke-width="1.5" fill="none"/>
      <!-- 小手抱包裹 -->
      <ellipse cx="36" cy="70" rx="4" ry="5" fill="#f5e6c8"/>
      <ellipse cx="64" cy="70" rx="4" ry="5" fill="#f5e6c8"/>
    </svg>`,

    // 待确认 - 拿着小包裹问号
    confirm: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 28 Q34 18 30 14 M36 24 Q32 20 28 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M62 28 Q66 18 70 14 M64 24 Q68 20 72 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="28" cy="13" r="2.5" fill="#c4a46d"/>
      <circle cx="72" cy="13" r="2.5" fill="#c4a46d"/>
      <ellipse cx="50" cy="48" rx="22" ry="20" fill="#f5e6c8"/>
      <ellipse cx="30" cy="34" rx="6" ry="9" fill="#e8d4a8" transform="rotate(-25 30 34)"/>
      <ellipse cx="70" cy="34" rx="6" ry="9" fill="#e8d4a8" transform="rotate(25 70 34)"/>
      <ellipse cx="31" cy="35" rx="3" ry="5" fill="#f0d8a8" transform="rotate(-25 31 35)"/>
      <ellipse cx="69" cy="35" rx="3" ry="5" fill="#f0d8a8" transform="rotate(25 69 35)"/>
      <ellipse cx="36" cy="53" rx="4" ry="3" fill="#f4b8a0" opacity="0.6"/>
      <ellipse cx="64" cy="53" rx="4" ry="3" fill="#f4b8a0" opacity="0.6"/>
      <!-- 眨眼 -->
      <ellipse cx="42" cy="46" rx="2.5" ry="3" fill="#5a4a3a"/>
      <path d="M56 46 Q58 44 60 46" stroke="#5a4a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- 思考嘴 -->
      <path d="M47 57 Q50 59 53 57" stroke="#5a4a3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- 问号气泡 -->
      <circle cx="78" cy="22" r="10" fill="#fff" opacity="0.9" stroke="#8ba888" stroke-width="1"/>
      <text x="78" y="27" text-anchor="middle" font-size="12" fill="#5a8a4a" font-weight="bold">?</text>
      <!-- 小包裹在手边 -->
      <rect x="42" y="68" width="16" height="14" rx="2" fill="#d4a25e"/>
      <line x1="50" y1="68" x2="50" y2="82" stroke="#c4954e" stroke-width="1"/>
    </svg>`,

    // 成功 - 开心
    happy: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 28 Q34 18 30 14 M36 24 Q32 20 28 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M62 28 Q66 18 70 14 M64 24 Q68 20 72 22" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="28" cy="13" r="2.5" fill="#c4a46d"/>
      <circle cx="72" cy="13" r="2.5" fill="#c4a46d"/>
      <ellipse cx="50" cy="48" rx="22" ry="20" fill="#f5e6c8"/>
      <ellipse cx="30" cy="34" rx="6" ry="9" fill="#e8d4a8" transform="rotate(-25 30 34)"/>
      <ellipse cx="70" cy="34" rx="6" ry="9" fill="#e8d4a8" transform="rotate(25 70 34)"/>
      <ellipse cx="31" cy="35" rx="3" ry="5" fill="#f0d8a8" transform="rotate(-25 31 35)"/>
      <ellipse cx="69" cy="35" rx="3" ry="5" fill="#f0d8a8" transform="rotate(25 69 35)"/>
      <ellipse cx="36" cy="53" rx="4" ry="3.5" fill="#f4b8a0" opacity="0.6"/>
      <ellipse cx="64" cy="53" rx="4" ry="3.5" fill="#f4b8a0" opacity="0.6"/>
      <!-- 开心眯眼 -->
      <path d="M39 46 Q42 43 45 46" stroke="#5a4a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M55 46 Q58 43 61 46" stroke="#5a4a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- 大笑嘴 -->
      <path d="M44 56 Q50 62 56 56" stroke="#5a4a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M45 57 Q50 60 55 57" fill="#f4b8a0"/>
      <!-- 开心的小手举起 -->
      <ellipse cx="28" cy="60" rx="4" ry="5" fill="#f5e6c8" transform="rotate(-30 28 60)"/>
      <ellipse cx="72" cy="60" rx="4" ry="5" fill="#f5e6c8" transform="rotate(30 72 60)"/>
      <!-- 星星 -->
      <text x="18" y="28" font-size="10" fill="#f0e2a8">✨</text>
      <text x="76" y="65" font-size="8" fill="#f0e2a8">✨</text>
    </svg>`,

    // 休息 - 树下休息
    resting: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 树 -->
      <ellipse cx="80" cy="30" rx="14" ry="12" fill="#8ba888" opacity="0.7"/>
      <ellipse cx="76" cy="25" rx="8" ry="7" fill="#a8c8a0" opacity="0.7"/>
      <rect x="78" y="38" width="4" height="15" rx="1" fill="#c4a46d"/>
      <!-- 躺着的鹿 -->
      <ellipse cx="45" cy="68" rx="20" ry="12" fill="#f5e6c8"/>
      <ellipse cx="28" cy="62" rx="10" ry="9" fill="#f5e6c8"/>
      <path d="M22 56 Q18 50 16 48" stroke="#c4a46d" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M28 54 Q26 48 24 46" stroke="#c4a46d" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="22" cy="60" rx="4" ry="5" fill="#e8d4a8" transform="rotate(-30 22 60)"/>
      <!-- 闭眼 -->
      <path d="M24 60 Q26 59 28 60" stroke="#5a4a3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- 微笑 -->
      <path d="M25 64 Q27 65 29 64" stroke="#5a4a3a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <!-- Zzz -->
      <text x="35" y="52" font-size="8" fill="#8ba888" opacity="0.6">z</text>
      <text x="40" y="46" font-size="10" fill="#8ba888" opacity="0.5">z</text>
      <text x="46" y="40" font-size="12" fill="#8ba888" opacity="0.4">Z</text>
      <!-- 草地 -->
      <path d="M5 78 Q50 75 95 78" stroke="#a8c8a0" stroke-width="2" fill="none"/>
      <path d="M10 76 L12 72 M20 77 L22 73 M30 76 L32 72 M60 77 L62 73 M70 76 L72 72" stroke="#a8c8a0" stroke-width="1" fill="none"/>
    </svg>`,

    // 忙碌 - 抱着多个包裹
    busy: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 25 Q34 15 30 11 M36 21 Q32 17 28 19" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M62 25 Q66 15 70 11 M64 21 Q68 17 72 19" stroke="#c4a46d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="42" rx="22" ry="20" fill="#f5e6c8"/>
      <ellipse cx="30" cy="28" rx="6" ry="9" fill="#e8d4a8" transform="rotate(-25 30 28)"/>
      <ellipse cx="70" cy="28" rx="6" ry="9" fill="#e8d4a8" transform="rotate(25 70 28)"/>
      <ellipse cx="36" cy="47" rx="4" ry="3" fill="#f4b8a0" opacity="0.5"/>
      <ellipse cx="64" cy="47" rx="4" ry="3" fill="#f4b8a0" opacity="0.5"/>
      <!-- 认真眼 -->
      <ellipse cx="42" cy="40" rx="2.5" ry="3" fill="#5a4a3a"/>
      <ellipse cx="58" cy="40" rx="2.5" ry="3" fill="#5a4a3a"/>
      <!-- 小嘴 -->
      <path d="M47 52 L53 52" stroke="#5a4a3a" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 多个包裹 -->
      <rect x="28" y="58" width="14" height="12" rx="1" fill="#d4a25e"/>
      <rect x="44" y="55" width="16" height="14" rx="1" fill="#c47a6a"/>
      <rect x="62" y="58" width="14" height="12" rx="1" fill="#8ba888"/>
      <line x1="35" y1="58" x2="35" y2="70" stroke="#a8845a" stroke-width="0.8"/>
      <line x1="52" y1="55" x2="52" y2="69" stroke="#a86a5a" stroke-width="0.8"/>
      <line x1="69" y1="58" x2="69" y2="70" stroke="#6b8a5e" stroke-width="0.8"/>
      <!-- 汗滴 -->
      <ellipse cx="74" cy="32" rx="2" ry="3" fill="#8bc4e0" opacity="0.7"/>
    </svg>`,

    // 小尺寸图标版
    mini: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 14 Q15 8 13 6" stroke="#c4a46d" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M30 14 Q33 8 35 6" stroke="#c4a46d" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="24" rx="12" ry="11" fill="#f5e6c8"/>
      <ellipse cx="14" cy="18" rx="3.5" ry="5" fill="#e8d4a8" transform="rotate(-25 14 18)"/>
      <ellipse cx="34" cy="18" rx="3.5" ry="5" fill="#e8d4a8" transform="rotate(25 34 18)"/>
      <ellipse cx="18" cy="27" rx="2.5" ry="2" fill="#f4b8a0" opacity="0.5"/>
      <ellipse cx="30" cy="27" rx="2.5" ry="2" fill="#f4b8a0" opacity="0.5"/>
      <circle cx="20" cy="23" r="1.5" fill="#5a4a3a"/>
      <circle cx="28" cy="23" r="1.5" fill="#5a4a3a"/>
      <path d="M22 29 Q24 31 26 29" stroke="#5a4a3a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
  },

  // 台词库
  messages: {
    default: ['今天也要好好生活 🌱', '记录每一笔温柔的消费～', '你的财务小屋很安静呢'],
    waiting: ['包裹正在路上～', '期待你的新宝贝！'],
    confirm: ['收到啦，要留下吗？', '这个喜欢吗？决定一下～'],
    happy: ['好耶！已经帮你记账啦。', '记账成功！干得漂亮 ✨'],
    resting: ['今天也是轻松的一天 🌿', '没有消费的一天也很棒呢～', '休息一下也不错呀'],
    busy: ['这里还有一些小事情需要处理哦～', '待处理有点多了，来看看吧！'],
    empty: ['还没有记录哦，开始记账吧～', '空空的，加一笔试试？'],
  },

  // 获取SVG
  getSVG(type = 'default') {
    return this.svgs[type] || this.svgs.default;
  },

  // 获取随机台词
  getMessage(type = 'default') {
    const msgs = this.messages[type] || this.messages.default;
    return msgs[Math.floor(Math.random() * msgs.length)];
  },

  // 渲染带气泡的完整角色
  renderWithBubble(type = 'default', customMsg = null) {
    const svg = this.getSVG(type);
    const msg = customMsg || this.getMessage(type);
    return `<div class="mascot-container">
      <div class="mascot-bubble">${msg}</div>
      <div class="mascot" style="width:80px;height:80px;flex-shrink:0;">${svg}</div>
    </div>`;
  },

  // 渲染纯角色
  render(type = 'default', size = 80) {
    return `<div class="mascot" style="width:${size}px;height:${size}px;">${this.getSVG(type)}</div>`;
  },

  // 渲染空状态
  renderEmpty(type = 'empty', msg = null) {
    const svg = this.getSVG(type === 'empty' ? 'resting' : type);
    const message = msg || this.getMessage(type === 'empty' ? 'resting' : type);
    return `<div class="empty-state">
      <div class="mascot" style="width:100px;height:100px;">${svg}</div>
      <div class="empty-state-text">${message}</div>
    </div>`;
  },
};
