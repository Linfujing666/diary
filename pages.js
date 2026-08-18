/* ============================================
   森系手账 · 页面渲染模块
   ============================================ */

const Pages = {
  current: 'home',
  calendarDate: new Date(),
  accountsFilter: { type: '', category: '' },
  shoppingTab: 'all',
  reportMonth: { y: new Date().getFullYear(), m: new Date().getMonth() + 1 },

  // ============================================
  // 首页 / 工作台
  // ============================================
  home() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const week = weekdays[now.getDay()];

    const summary = DB.getMonthSummary(y, m);
    const todaySum = DB.getTodaySummary();
    const pendingShopping = DB.getPendingShopping();
    const catStats = DB.getMonthExpenseByCategory(y, m);
    const platformStats = DB.getMonthExpenseByPlatform(y, m);
    const paymentStats = DB.getMonthExpenseByPayment(y, m);
    const totalExpense = summary.expense || 1;

    // 选择吉祥物状态
    let mascotType = 'default';
    if (pendingShopping.length > 3) mascotType = 'busy';
    else if (pendingShopping.length > 0) mascotType = 'confirm';
    else if (todaySum.accounts.length === 0) mascotType = 'resting';

    // 时段问候
    const hour = now.getHours();
    let timeGreeting = '早安';
    if (hour >= 11 && hour < 14) timeGreeting = '中午好';
    else if (hour >= 14 && hour < 18) timeGreeting = '下午好';
    else if (hour >= 18 && hour < 22) timeGreeting = '晚上好';
    else if (hour >= 22 || hour < 6) timeGreeting = '夜深了';

    // 根据情况生成首页主标语（不要把吉祥物对话放这里）
    let mainGreeting = `${timeGreeting}，愿你今天也从容 🌿`;
    if (pendingShopping.length > 0) {
      mainGreeting = `还有 ${pendingShopping.length} 件待处理的包裹哦 📦`;
    } else if (summary.expense === 0) {
      mainGreeting = '本月还没有消费，从容开始 🌱';
    } else {
      const tips = [
        '今天也要好好生活 🌿',
        '温柔地记录每一笔花费吧',
        '愿每一笔花费都值得被记下 ✨',
        '和森林小管家一起记账吧～',
      ];
      mainGreeting = tips[Math.floor(Math.random() * tips.length)];
    }

    const catColors = ['#5a8a4a', '#8ba888', '#a8c8a0', '#d4a25e', '#c47a6a', '#8b9dc3', '#c4a46d', '#b8a0c8', '#a0c4b8', '#d4c4a0', '#c8b8a0', '#a8b8c4'];

    return `
      <div class="greeting-bar">
        <div class="greeting-date">${m}月${d}日 · 星期${week}</div>
        <div class="greeting-text">${mainGreeting}</div>
      </div>

      <div class="finance-overview">
        <div class="finance-row">
          <div class="finance-item">
            <div class="finance-label">本月收入</div>
            <div class="finance-value">¥${DB.formatMoney(summary.income)}</div>
          </div>
          <div class="finance-item">
            <div class="finance-label">本月支出</div>
            <div class="finance-value">¥${DB.formatMoney(summary.expense)}</div>
          </div>
          <div class="finance-item">
            <div class="finance-label">本月结余</div>
            <div class="finance-value small">¥${DB.formatMoney(summary.balance)}</div>
            <div class="finance-count">${summary.count} 笔支出</div>
          </div>
        </div>
      </div>

      ${pendingShopping.length > 0 ? `
      <div class="card">
        <div class="section-header">
          <div class="card-title"><span class="title-icon">📦</span>待处理购物</div>
          <span class="more-link" onclick="App.navigate('shopping')">全部 →</span>
        </div>
        ${pendingShopping.slice(0, 3).map(item => this.renderPendingShoppingItem(item)).join('')}
        ${pendingShopping.length > 3 ? `<div style="text-align:center;margin-top:8px;"><span class="more-link" onclick="App.navigate('shopping')">还有 ${pendingShopping.length - 3} 件待处理 →</span></div>` : ''}
      </div>
      ` : ''}

      <div class="card">
        <div class="section-header">
          <div class="card-title"><span class="title-icon">🧾</span>今日账目</div>
          <span class="more-link" onclick="App.navigate('accounts')">全部 →</span>
        </div>
        ${todaySum.accounts.length > 0 ? `
          <div style="display:flex;gap:12px;margin-bottom:8px;font-size:12px;">
            <span style="color:var(--income-color);">收入 ¥${DB.formatMoney(todaySum.income)}</span>
            <span style="color:var(--expense-color);">支出 ¥${DB.formatMoney(todaySum.expense)}</span>
          </div>
          ${todaySum.accounts.map(a => this.renderAccountItem(a)).join('')}
        ` : Mascot.renderEmpty('resting', '今天还没有记账哦～')}
      </div>

      ${catStats.length > 0 ? `
      <div class="card">
        <div class="card-title"><span class="title-icon">📊</span>本月支出分类</div>
        ${catStats.slice(0, 6).map((cat, i) => {
          const pct = (cat.amount / totalExpense * 100).toFixed(1);
          return `
            <div class="category-bar-item">
              <div class="category-bar-header">
                <span class="category-bar-name">${cat.icon} ${cat.categoryName}</span>
                <span class="category-bar-amount">¥${DB.formatMoney(cat.amount)} <span style="color:var(--text-light);font-size:11px;font-weight:400;">${pct}%</span></span>
              </div>
              <div class="category-bar-track">
                <div class="category-bar-fill" style="width:${pct}%;background:${catColors[i % catColors.length]};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      ${platformStats.length > 0 ? `
      <div class="card">
        <div class="card-title"><span class="title-icon">🛒</span>购物平台统计</div>
        ${platformStats.map(p => {
          const maxAmt = platformStats[0].amount || 1;
          const pct = (p.amount / maxAmt * 100).toFixed(0);
          return `
            <div class="stat-list-item">
              <div class="stat-list-icon" style="background:${p.color}20;">${p.icon}</div>
              <div class="stat-list-info">
                <div class="stat-list-name">${p.platformName}</div>
                <div class="stat-list-bar"><div class="stat-list-bar-fill" style="width:${pct}%;background:${p.color};"></div></div>
              </div>
              <div class="stat-list-amount">¥${DB.formatMoney(p.amount)}</div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      ${paymentStats.length > 0 ? `
      <div class="card">
        <div class="card-title"><span class="title-icon">💳</span>支付方式统计</div>
        ${paymentStats.map(p => {
          const maxAmt = paymentStats[0].amount || 1;
          const pct = (p.amount / maxAmt * 100).toFixed(0);
          const pm = DB.getPaymentMethod(p.paymentId);
          const color = pm && pm.type === 'bnpl' ? '#d4a25e' : '#8ba888';
          return `
            <div class="stat-list-item">
              <div class="stat-list-icon" style="background:${color}20;">${p.icon}</div>
              <div class="stat-list-info">
                <div class="stat-list-name">${p.paymentName} ${pm && pm.type === 'bnpl' ? '<span style="font-size:10px;color:var(--warn-color);">先用后付</span>' : ''}</div>
                <div class="stat-list-bar"><div class="stat-list-bar-fill" style="width:${pct}%;background:${color};"></div></div>
              </div>
              <div class="stat-list-amount">¥${DB.formatMoney(p.amount)}</div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <div style="height:20px;"></div>
      ${Mascot.renderWithBubble(mascotType)}
    `;
  },

  // 渲染待处理购物项
  renderPendingShoppingItem(item) {
    const platform = DB.getPlatform(item.platform) || {};
    const daysLeft = DB.daysUntilDeadline(item.returnDeadline);
    let deadlineClass = '';
    let deadlineText = '';
    if (daysLeft !== null && daysLeft <= 3) {
      deadlineClass = 'deadline-urgent';
      deadlineText = `⚠️ 还有${daysLeft}天到期`;
    } else if (daysLeft !== null) {
      deadlineText = `退货截止还有${daysLeft}天`;
    }

    let actions = '';
    if (item.status === 'received') {
      actions = `
        <div class="shopping-item-actions">
          <button class="btn-keep" onclick="App.keepShopping('${item.id}')">留下</button>
          <button class="btn-return" onclick="App.returnShopping('${item.id}')">退货</button>
        </div>
      `;
    } else if (item.status === 'kept') {
      actions = `<div style="font-size:12px;color:var(--forest-green);font-weight:500;">✅ 已记账</div>`;
    }

    return `
      <div class="shopping-pending-item">
        <div class="shopping-item-icon">${platform.icon || '📦'}</div>
        <div class="shopping-item-info">
          <div class="shopping-item-name">${item.product}</div>
          <div class="shopping-item-meta">
            ${platform.name || ''} · ${item.status === 'received' ? '待确认' : '已留下'}
            ${deadlineText ? ` · <span class="${deadlineClass}">${deadlineText}</span>` : ''}
          </div>
        </div>
        <div style="text-align:right;">
          <div class="shopping-item-amount">¥${DB.formatMoney(item.amount)}</div>
          ${actions}
        </div>
      </div>
    `;
  },

  // 渲染账目项
  renderAccountItem(a) {
    const cat = DB.getCategoryById(a.categoryId);
    const icon = cat ? cat.icon : '📝';
    const isIncome = a.type === 'income';
    const pmName = DB.getPaymentMethodName(a.paymentMethod);
    const platformName = DB.getPlatformName(a.platform);

    let note = a.note || '';
    if (a.product) note = a.product + (note ? ' · ' + note : '');
    if (pmName && !isIncome) note = (note ? note + ' · ' : '') + pmName;
    if (platformName) note = (note ? note + ' · ' : '') + platformName;
    if (a.payStatus === 'unpaid') note += ' · 待付款';

    return `
      <div class="account-item" onclick="App.editAccount('${a.id}')">
        <div class="account-icon" style="background:${isIncome ? 'rgba(90,138,74,0.1)' : 'rgba(196,122,106,0.08)'}">${icon}</div>
        <div class="account-info">
          <div class="account-category">${cat ? cat.name : '未分类'}${a.subCategory ? ' · ' + a.subCategory : ''}</div>
          ${note ? `<div class="account-note">${note}</div>` : ''}
        </div>
        <div class="account-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}¥${DB.formatMoney(a.amount)}</div>
      </div>
    `;
  },

  // ============================================
  // 日历
  // ============================================
  calendar() {
    const date = this.calendarDate;
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDay = new Date(y, date.getMonth(), 1).getDay();
    const daySummary = DB.getCalendarDaySummary(y, m);
    const today = DB.formatDate(new Date());

    let days = '';
    // 空白填充
    for (let i = 0; i < firstDay; i++) days += '<div class="calendar-day"></div>';
    // 日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const sum = daySummary[d];
      const isToday = dateStr === today;
      const expenseStr = sum && sum.expense > 0 ? `<div class="day-expense">${DB.formatMoney(sum.expense)}</div>` : '';
      const incomeStr = sum && sum.income > 0 ? `<div class="day-income">${DB.formatMoney(sum.income)}</div>` : '';
      days += `
        <div class="calendar-day ${isToday ? 'today' : ''}" onclick="Pages.selectCalendarDay('${dateStr}')">
          <div class="day-num">${d}</div>
          ${expenseStr}
          ${incomeStr}
        </div>
      `;
    }

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    // 月度统计
    const summary = DB.getMonthSummary(y, m);

    return `
      <div class="card">
        <div class="calendar-header">
          <button class="calendar-nav-btn" onclick="Pages.changeMonth(-1)">‹</button>
          <div class="calendar-month">${y}年${m}月</div>
          <button class="calendar-nav-btn" onclick="Pages.changeMonth(1)">›</button>
        </div>
        <div class="calendar-grid">
          ${weekdays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
          ${days}
        </div>
        <div style="display:flex;justify-content:space-around;padding-top:12px;border-top:1px solid rgba(224,216,200,0.4);font-size:12px;">
          <div>收入 <span style="color:var(--income-color);font-weight:600;">¥${DB.formatMoney(summary.income)}</span></div>
          <div>支出 <span style="color:var(--expense-color);font-weight:600;">¥${DB.formatMoney(summary.expense)}</span></div>
          <div>结余 <span style="color:var(--forest-green);font-weight:600;">¥${DB.formatMoney(summary.balance)}</span></div>
        </div>
      </div>

      <div id="calendar-day-detail"></div>
      ${Mascot.renderWithBubble('default')}
    `;
  },

  calendarSelectedDay: null,

  selectCalendarDay(dateStr) {
    this.calendarSelectedDay = dateStr;
    const accounts = DB.getDayAccounts(dateStr);
    const d = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    let expense = 0, income = 0;
    accounts.forEach(a => {
      if (a.type === 'expense') expense += a.amount;
      else if (a.type === 'income') income += a.amount;
    });

    const html = `
      <div class="card">
        <div class="day-detail-header">
          <div class="day-detail-date">${d.getMonth()+1}月${d.getDate()}日 · 星期${weekdays[d.getDay()]}</div>
        </div>
        <div class="day-detail-summary mb-16">
          <span>支出 <span class="expense">¥${DB.formatMoney(expense)}</span></span>
          <span>收入 <span class="income">¥${DB.formatMoney(income)}</span></span>
        </div>
        ${accounts.length > 0 ? accounts.map(a => this.renderAccountItem(a)).join('') : Mascot.renderEmpty('resting', '这一天没有账目～')}
      </div>
    `;
    document.getElementById('calendar-day-detail').innerHTML = html;
    // 滚动到详情
    setTimeout(() => {
      document.getElementById('calendar-day-detail').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  },

  changeMonth(delta) {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + delta, 1);
    this.render();
  },

  // ============================================
  // 账本
  // ============================================
  accounts() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const summary = DB.getMonthSummary(y, m);

    let accounts = DB.getAccounts();
    if (this.accountsFilter.type) accounts = accounts.filter(a => a.type === this.accountsFilter.type);

    // 按日期分组
    const groups = {};
    accounts.forEach(a => {
      if (!groups[a.date]) groups[a.date] = [];
      groups[a.date].push(a);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    const filterChips = [
      { type: '', label: '全部' },
      { type: 'expense', label: '支出' },
      { type: 'income', label: '收入' },
      { type: 'transfer', label: '转账' },
    ];

    return `
      <div class="accounts-summary">
        <div class="accounts-summary-card">
          <div class="accounts-summary-label">收入</div>
          <div class="accounts-summary-value income">¥${DB.formatMoney(summary.income)}</div>
        </div>
        <div class="accounts-summary-card">
          <div class="accounts-summary-label">支出</div>
          <div class="accounts-summary-value expense">¥${DB.formatMoney(summary.expense)}</div>
        </div>
        <div class="accounts-summary-card">
          <div class="accounts-summary-label">结余</div>
          <div class="accounts-summary-value">¥${DB.formatMoney(summary.balance)}</div>
        </div>
      </div>

      <div class="filter-bar">
        ${filterChips.map(f => `<div class="filter-chip ${this.accountsFilter.type === f.type ? 'active' : ''}" onclick="Pages.setAccountsFilter('${f.type}')">${f.label}</div>`).join('')}
      </div>

      ${sortedDates.length > 0 ? sortedDates.map(dateStr => {
        const dayAccounts = groups[dateStr];
        let e = 0, i = 0;
        dayAccounts.forEach(a => { if (a.type==='expense') e+=a.amount; else if (a.type==='income') i+=a.amount; });
        const d = new Date(dateStr);
        const weekdays = ['日','一','二','三','四','五','六'];
        return `
          <div class="card">
            <div class="date-group-header">
              <span>${d.getMonth()+1}月${d.getDate()}日 · 星期${weekdays[d.getDay()]}</span>
              <span class="day-total">${i > 0 ? `<span style="color:var(--income-color);">+¥${DB.formatMoney(i)}</span> ` : ''}${e > 0 ? `<span style="color:var(--expense-color);">-¥${DB.formatMoney(e)}</span>` : ''}</span>
            </div>
            ${dayAccounts.map(a => this.renderAccountItem(a)).join('')}
          </div>
        `;
      }).join('') : Mascot.renderEmpty('empty', '还没有账目记录～点击右下角 + 开始记账')}
    `;
  },

  setAccountsFilter(type) {
    this.accountsFilter.type = type;
    this.render();
  },

  // ============================================
  // 购物管理
  // ============================================
  shopping() {
    const counts = DB.getShoppingCounts();
    let shopping = DB.getShopping();

    // 标签筛选
    const tabs = [
      { key: 'all', label: '全部', count: shopping.length },
      { key: 'pending', label: '待收货', count: counts.pending },
      { key: 'received', label: '待确认', count: counts.received },
      { key: 'kept', label: '已留下', count: counts.kept },
      { key: 'returned', label: '已退货', count: counts.returned },
    ];

    if (this.shoppingTab !== 'all') {
      shopping = shopping.filter(s => s.status === this.shoppingTab);
    }

    const unpaidTotal = DB.getUnpaidTotal();

    return `
      ${unpaidTotal > 0 ? `
      <div class="card" style="background:linear-gradient(135deg,#f0e2a8,#f0d894);border:none;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">⏳</span>
          <div style="flex:1;">
            <div style="font-size:13px;color:var(--text-secondary);">先用后付待付款</div>
            <div style="font-size:18px;font-weight:700;color:var(--text-primary);">¥${DB.formatMoney(unpaidTotal)}</div>
          </div>
          <button class="btn-sm" style="background:var(--card-bg);color:var(--warn-color);border:1px solid var(--warn-color);" onclick="App.showUnpaidList()">查看</button>
        </div>
      </div>
      ` : ''}

      <div class="shopping-status-tabs">
        ${tabs.map(t => `
          <div class="status-tab ${this.shoppingTab === t.key ? 'active' : ''}" onclick="Pages.setShoppingTab('${t.key}')">
            ${t.label}<span class="tab-count">${t.count}</span>
          </div>
        `).join('')}
      </div>

      ${shopping.length > 0 ? shopping.map(item => this.renderShoppingCard(item)).join('') : Mascot.renderEmpty('empty', '没有购物记录～')}
      <div style="height:20px;"></div>
    `;
  },

  renderShoppingCard(item) {
    const platform = DB.getPlatform(item.platform) || {};
    const payment = DB.getPaymentMethod(item.paymentMethod) || {};
    const cat = DB.getCategoryById(item.categoryId);
    const statusMap = {
      pending: { text: '待收货', cls: 'status-pending', icon: '🚚' },
      received: { text: '待确认', cls: 'status-received', icon: '❓' },
      kept: { text: '已留下', cls: 'status-kept', icon: '✅' },
      returned: { text: '已退货', cls: 'status-returned', icon: '↩️' },
      recorded: { text: '已记账', cls: 'status-recorded', icon: '📝' },
    };
    const st = statusMap[item.status] || statusMap.pending;

    const daysLeft = DB.daysUntilDeadline(item.returnDeadline);
    let deadlineHtml = '';
    if (item.status === 'received' || item.status === 'pending') {
      if (daysLeft !== null) {
        if (daysLeft <= 0) {
          deadlineHtml = `<div class="deadline-warning deadline-urgent">⚠️ 退货截止日已${daysLeft < 0 ? '过' : '到'}！</div>`;
        } else if (daysLeft <= 3) {
          deadlineHtml = `<div class="deadline-warning deadline-urgent">⚠️ 退货截止还有 ${daysLeft} 天</div>`;
        } else {
          deadlineHtml = `<div class="deadline-warning">退货截止还有 ${daysLeft} 天</div>`;
        }
      }
    }

    let actions = '';
    if (item.status === 'pending') {
      actions = `
        <button class="btn btn-primary" onclick="App.receiveShopping('${item.id}')">确认收货</button>
        <button class="btn btn-secondary" onclick="App.editShopping('${item.id}')">编辑</button>
      `;
    } else if (item.status === 'received') {
      actions = `
        <button class="btn btn-primary" onclick="App.keepShopping('${item.id}')">✅ 留下</button>
        <button class="btn" style="background:#fff;color:var(--danger-color);border:1.5px solid var(--danger-color);" onclick="App.returnShopping('${item.id}')">退货</button>
      `;
    } else if (item.status === 'kept' && item.payStatus === 'unpaid') {
      actions = `
        <button class="btn btn-primary" onclick="App.markShoppingPaid('${item.id}')">标记已付款</button>
        <button class="btn btn-secondary" onclick="App.editShopping('${item.id}')">查看</button>
      `;
    } else {
      actions = `<button class="btn btn-secondary" onclick="App.editShopping('${item.id}')">查看详情</button>`;
    }

    return `
      <div class="shopping-card">
        <div class="shopping-card-header">
          <div>
            <div class="shopping-card-title">${item.product}</div>
            <span class="status-tag ${st.cls}">${st.icon} ${st.text}</span>
          </div>
          <div class="shopping-card-amount">¥${DB.formatMoney(item.amount)}</div>
        </div>
        <div class="shopping-card-meta">
          <span class="shopping-meta-tag">${platform.icon || ''} ${platform.name || '未知'}</span>
          <span class="shopping-meta-tag">${payment.icon || ''} ${payment.name || '未知'}</span>
          ${cat ? `<span class="shopping-meta-tag">${cat.icon} ${cat.name}${item.subCategory ? '·' + item.subCategory : ''}</span>` : ''}
          ${item.payStatus === 'unpaid' ? '<span class="shopping-meta-tag" style="background:#fff3e0;color:#e8975a;">待付款</span>' : ''}
        </div>
        ${deadlineHtml}
        <div class="shopping-card-dates">
          📦 下单：${item.orderDate || '-'} 
          ${item.receiveDate ? '· 📬 收货：' + item.receiveDate : ''}
          ${item.decideDate ? '· ✅ 决定：' + item.decideDate : ''}
          ${item.payDate ? '· 💰 付款：' + item.payDate : ''}
        </div>
        ${item.note ? `<div style="font-size:12px;color:var(--text-light);margin-bottom:8px;">📝 ${item.note}</div>` : ''}
        <div class="shopping-card-actions">${actions}</div>
      </div>
    `;
  },

  setShoppingTab(tab) {
    this.shoppingTab = tab;
    this.render();
  },

  // ============================================
  // 报表
  // ============================================
  reports() {
    const { y, m } = this.reportMonth;
    const summary = DB.getMonthSummary(y, m);
    const catStats = DB.getMonthExpenseByCategory(y, m);
    const platformStats = DB.getMonthExpenseByPlatform(y, m);
    const paymentStats = DB.getMonthExpenseByPayment(y, m);
    const trends = DB.getMonthTrends(6);

    const catColors = ['#5a8a4a', '#8ba888', '#a8c8a0', '#d4a25e', '#c47a6a', '#8b9dc3', '#c4a46d', '#b8a0c8', '#a0c4b8', '#d4c4a0', '#c8b8a0', '#a8b8c4'];

    // 饼图SVG
    const totalCat = catStats.reduce((s, c) => s + c.amount, 0) || 1;
    let cumulativeAngle = 0;
    let pieSegments = '';
    catStats.forEach((cat, i) => {
      const angle = (cat.amount / totalCat) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      const x1 = 60 + 50 * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = 60 + 50 * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = 60 + 50 * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = 60 + 50 * Math.sin((endAngle - 90) * Math.PI / 180);
      const largeArc = angle > 180 ? 1 : 0;
      if (angle < 360) {
        pieSegments += `<path d="M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${catColors[i % catColors.length]}" stroke="#fff" stroke-width="1.5"/>`;
      } else {
        pieSegments += `<circle cx="60" cy="60" r="50" fill="${catColors[i % catColors.length]}"/>`;
      }
      cumulativeAngle = endAngle;
    });

    // 趋势柱状图
    const maxTrend = Math.max(...trends.map(t => Math.max(t.income, t.expense)), 1);
    const trendBars = trends.map((t, i) => {
      const barH = (t.expense / maxTrend) * 100;
      const incomeH = (t.income / maxTrend) * 100;
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
          <div style="display:flex;gap:2px;align-items:flex-end;height:100px;">
            <div style="width:8px;height:${incomeH}px;background:var(--sage-green);border-radius:2px 2px 0 0;min-height:2px;"></div>
            <div style="width:8px;height:${barH}px;background:var(--expense-color);border-radius:2px 2px 0 0;min-height:2px;opacity:0.7;"></div>
          </div>
          <div style="font-size:10px;color:var(--text-light);">${t.label}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;">
        <button class="calendar-nav-btn" onclick="Pages.changeReportMonth(-1)">‹</button>
        <div class="calendar-month">${y}年${m}月</div>
        <button class="calendar-nav-btn" onclick="Pages.changeReportMonth(1)">›</button>
      </div>

      <div class="report-summary-row">
        <div class="report-summary-card">
          <div class="accounts-summary-label">收入</div>
          <div class="accounts-summary-value income">¥${DB.formatMoney(summary.income)}</div>
        </div>
        <div class="report-summary-card">
          <div class="accounts-summary-label">支出</div>
          <div class="accounts-summary-value expense">¥${DB.formatMoney(summary.expense)}</div>
        </div>
        <div class="report-summary-card">
          <div class="accounts-summary-label">结余</div>
          <div class="accounts-summary-value" style="color:var(--forest-green);">¥${DB.formatMoney(summary.balance)}</div>
        </div>
      </div>

      <!-- 月度趋势 -->
      <div class="card report-section">
        <div class="card-title"><span class="title-icon">📈</span>近6月收支趋势</div>
        <div style="display:flex;gap:4px;align-items:flex-end;height:120px;margin-bottom:8px;">
          ${trendBars}
        </div>
        <div style="display:flex;gap:12px;font-size:11px;color:var(--text-light);">
          <span><span class="color-dot" style="background:var(--sage-green);"></span> 收入</span>
          <span><span class="color-dot" style="background:var(--expense-color);opacity:0.7;"></span> 支出</span>
        </div>
      </div>

      <!-- 支出分类饼图 -->
      ${catStats.length > 0 ? `
      <div class="card report-section">
        <div class="card-title"><span class="title-icon">🥧</span>支出分类</div>
        <div class="pie-chart-container">
          <svg class="pie-chart" viewBox="0 0 120 120">
            ${pieSegments}
            <circle cx="60" cy="60" r="22" fill="var(--warm-cream)"/>
            <text x="60" y="56" text-anchor="middle" font-size="10" fill="var(--text-light)">总支出</text>
            <text x="60" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--text-primary)">¥${DB.formatMoney(totalCat)}</text>
          </svg>
          <div class="pie-legend">
            ${catStats.slice(0, 8).map((cat, i) => `
              <div class="pie-legend-item">
                <span class="pie-legend-dot" style="background:${catColors[i % catColors.length]};"></span>
                <span class="pie-legend-name">${cat.icon} ${cat.categoryName}</span>
                <span class="pie-legend-value">¥${DB.formatMoney(cat.amount)}</span>
                <span class="pie-legend-pct">${(cat.amount / totalCat * 100).toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- 购物平台分析 -->
      ${platformStats.length > 0 ? `
      <div class="card report-section">
        <div class="card-title"><span class="title-icon">🛒</span>购物平台分析</div>
        ${platformStats.map(p => {
          const total = platformStats.reduce((s, x) => s + x.amount, 0) || 1;
          const pct = (p.amount / total * 100).toFixed(1);
          return `
            <div class="stat-list-item">
              <div class="stat-list-icon" style="background:${p.color}20;">${p.icon}</div>
              <div class="stat-list-info">
                <div class="stat-list-name">${p.platformName} <span style="color:var(--text-light);font-size:11px;">${pct}%</span></div>
                <div class="stat-list-bar"><div class="stat-list-bar-fill" style="width:${pct}%;background:${p.color};"></div></div>
              </div>
              <div class="stat-list-amount">¥${DB.formatMoney(p.amount)}</div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <!-- 支付方式分析 -->
      ${paymentStats.length > 0 ? `
      <div class="card report-section">
        <div class="card-title"><span class="title-icon">💳</span>支付方式分析</div>
        ${paymentStats.map(p => {
          const total = paymentStats.reduce((s, x) => s + x.amount, 0) || 1;
          const pct = (p.amount / total * 100).toFixed(1);
          const pm = DB.getPaymentMethod(p.paymentId);
          const color = pm && pm.type === 'bnpl' ? '#d4a25e' : '#8ba888';
          return `
            <div class="stat-list-item">
              <div class="stat-list-icon" style="background:${color}20;">${p.icon}</div>
              <div class="stat-list-info">
                <div class="stat-list-name">${p.paymentName} ${pm && pm.type === 'bnpl' ? '<span style="font-size:10px;color:var(--warn-color);">先用后付</span>' : ''} <span style="color:var(--text-light);font-size:11px;">${pct}%</span></div>
                <div class="stat-list-bar"><div class="stat-list-bar-fill" style="width:${pct}%;background:${color};"></div></div>
              </div>
              <div class="stat-list-amount">¥${DB.formatMoney(p.amount)}</div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <div style="height:20px;"></div>
      ${Mascot.renderWithBubble('default')}
    `;
  },

  changeReportMonth(delta) {
    const d = new Date(this.reportMonth.y, this.reportMonth.m - 1 + delta, 1);
    this.reportMonth = { y: d.getFullYear(), m: d.getMonth() + 1 };
    this.render();
  },

  // ============================================
  // 分类管理
  // ============================================
  categories() {
    const expenseCats = DB.getExpenseCategories();
    const incomeCats = DB.getIncomeCategories();

    return `
      <div class="card">
        <div class="section-header">
          <div class="card-title"><span class="title-icon">💸</span>支出分类</div>
          <button class="btn btn-sm btn-secondary" onclick="App.addCategory('expense')">+ 添加</button>
        </div>
        ${expenseCats.map(cat => this.renderCategoryItem(cat, 'expense')).join('')}
      </div>

      <div class="card">
        <div class="section-header">
          <div class="card-title"><span class="title-icon">💰</span>收入分类</div>
          <button class="btn btn-sm btn-secondary" onclick="App.addCategory('income')">+ 添加</button>
        </div>
        ${incomeCats.map(cat => this.renderCategoryItem(cat, 'income')).join('')}
      </div>
      <div style="height:20px;"></div>
    `;
  },

  renderCategoryItem(cat, type) {
    return `
      <div class="manage-list-item">
        <div class="manage-item-icon">${cat.icon}</div>
        <div class="manage-item-info">
          <div class="manage-item-name">${cat.name}</div>
          <div class="manage-item-sub">${cat.subCategories.length} 个子分类</div>
        </div>
        <div class="manage-item-actions">
          <button class="btn-sm" onclick="App.editCategory('${cat.id}', '${type}')">编辑</button>
          <button class="btn-sm delete" onclick="App.deleteCategory('${cat.id}')">删除</button>
        </div>
      </div>
      ${cat.subCategories.length > 0 ? `
        <div class="sub-category-list">
          ${cat.subCategories.map(sub => `
            <div class="sub-category-item">
              <span class="sub-dot"></span>
              <span style="flex:1;">${sub}</span>
              <button class="btn-sm delete" style="font-size:10px;padding:2px 8px;" onclick="App.deleteSubCategory('${cat.id}', '${sub}')">×</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  },

  // ============================================
  // 购物平台管理
  // ============================================
  platforms() {
    const platforms = DB.getPlatforms();
    return `
      <div class="card">
        <div class="section-header">
          <div class="card-title"><span class="title-icon">🛍</span>购物平台</div>
          <button class="btn btn-sm btn-secondary" onclick="App.addPlatform()">+ 添加</button>
        </div>
        ${platforms.map(p => `
          <div class="manage-list-item">
            <div class="manage-item-icon" style="background:${p.color}20;">${p.icon}</div>
            <div class="manage-item-info">
              <div class="manage-item-name">${p.name}</div>
              <div class="manage-item-sub"><span class="color-dot" style="background:${p.color};"></span> ${p.color}</div>
            </div>
            <div class="manage-item-actions">
              <button class="btn-sm" onclick="App.editPlatform('${p.id}')">编辑</button>
              <button class="btn-sm delete" onclick="App.deletePlatform('${p.id}')">删除</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="height:20px;"></div>
      ${Mascot.renderWithBubble('default')}
    `;
  },

  // ============================================
  // 支付方式管理
  // ============================================
  payments() {
    const all = DB.getPaymentMethods();
    const bnpl = all.filter(p => p.type === 'bnpl');
    const instant = all.filter(p => p.type === 'instant');

    return `
      <div class="card">
        <div class="section-header">
          <div class="card-title"><span class="title-icon">⏳</span>先用后付 / 延迟付款</div>
          <button class="btn btn-sm btn-secondary" onclick="App.addPayment('bnpl')">+ 添加</button>
        </div>
        ${bnpl.map(p => `
          <div class="manage-list-item">
            <div class="manage-item-icon" style="background:#f0e2a830;">${p.icon}</div>
            <div class="manage-item-info">
              <div class="manage-item-name">${p.name}</div>
              <div class="manage-item-sub" style="color:var(--warn-color);">先用后付</div>
            </div>
            <div class="manage-item-actions">
              <button class="btn-sm" onclick="App.editPayment('${p.id}')">编辑</button>
              <button class="btn-sm delete" onclick="App.deletePayment('${p.id}')">删除</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="section-header">
          <div class="card-title"><span class="title-icon">⚡</span>即时支付</div>
          <button class="btn btn-sm btn-secondary" onclick="App.addPayment('instant')">+ 添加</button>
        </div>
        ${instant.map(p => `
          <div class="manage-list-item">
            <div class="manage-item-icon">${p.icon}</div>
            <div class="manage-item-info">
              <div class="manage-item-name">${p.name}</div>
              <div class="manage-item-sub">即时支付</div>
            </div>
            <div class="manage-item-actions">
              <button class="btn-sm" onclick="App.editPayment('${p.id}')">编辑</button>
              <button class="btn-sm delete" onclick="App.deletePayment('${p.id}')">删除</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="height:20px;"></div>
    `;
  },

  // ============================================
  // 设置
  // ============================================
  settings() {
    const s = DB.data.settings;
    const mascotOn = s.mascotEnabled ? '开启' : '关闭';
    const cloudConfig = DB.cloud.getConfig();
    const cloudConfigured = DB.cloud.isConfigured();
    const lastSyncText = cloudConfig.lastSync
      ? this._formatSyncTime(cloudConfig.lastSync)
      : '未同步';

    // 备份提醒：超过 7 天没导出/同步过
    const lastSave = parseInt(localStorage.getItem('forest_ledger_last_save') || '0');
    const daysSinceSync = cloudConfig.lastSync
      ? Math.floor((Date.now() - cloudConfig.lastSync) / 86400000)
      : 999;
    const showBackupReminder = !cloudConfigured && lastSave
      && (Date.now() - lastSave > 7 * 86400000);

    return `
      ${showBackupReminder ? `
      <div class="card" style="background:linear-gradient(135deg,#fff8e1,#fff3c4);border:none;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;">💡</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;color:var(--warn-color);">建议开启云同步</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">已超过 7 天未备份，数据有丢失风险</div>
          </div>
          <button class="btn-sm" style="background:var(--forest-green);color:#fff;border:none;" onclick="App.showCloudSync()">去设置</button>
        </div>
      </div>
      ` : ''}

      <div class="settings-group">
        <div class="settings-group-title">数据管理</div>
        <div class="settings-item" onclick="App.showCloudSync()" style="${cloudConfigured ? 'border-left:3px solid var(--forest-green);' : ''}">
          <span class="settings-icon">☁️</span>
          <span class="settings-label">云同步</span>
          <span class="settings-value" style="${cloudConfigured ? 'color:var(--forest-green);' : 'color:var(--warn-color);'}">${cloudConfigured ? '已开启' : '未开启'}</span>
          <span class="settings-arrow">›</span>
        </div>
        <div class="settings-item" onclick="App.exportData()">
          <span class="settings-icon">📤</span>
          <span class="settings-label">导出数据</span>
          <span class="settings-arrow">›</span>
        </div>
        <div class="settings-item" onclick="App.importData()">
          <span class="settings-icon">📥</span>
          <span class="settings-label">导入数据</span>
          <span class="settings-arrow">›</span>
        </div>
        <div class="settings-item" onclick="App.resetData()">
          <span class="settings-icon">🔄</span>
          <span class="settings-label">重置所有数据</span>
          <span class="settings-arrow">›</span>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">数据迁移</div>
        <div class="settings-item" onclick="App.importXiaoqingzhang()" style="border-left:3px solid var(--forest-green);">
          <span class="settings-icon">📊</span>
          <span class="settings-label">从小青账导入</span>
          <span class="settings-value" style="color:var(--forest-green);font-size:11px;">.xlsx</span>
          <span class="settings-arrow">›</span>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">偏好设置</div>
        <div class="settings-item" onclick="App.toggleMascot()">
          <span class="settings-icon">🦌</span>
          <span class="settings-label">森林小管家</span>
          <span class="settings-value">${mascotOn}</span>
          <span class="settings-arrow">›</span>
        </div>
        <div class="settings-item" onclick="App.editReturnDays()">
          <span class="settings-icon">📅</span>
          <span class="settings-label">默认退货期限</span>
          <span class="settings-value">${s.returnDeadlineDays} 天</span>
          <span class="settings-arrow">›</span>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">关于</div>
        <div class="card" style="text-align:center;padding:24px;">
          ${Mascot.render('default', 80)}
          <div style="font-size:16px;font-weight:600;color:var(--deep-forest);margin-top:8px;">富婆的财富日记</div>
          <div style="font-size:12px;color:var(--text-light);margin-top:4px;">v1.0 · 个人记账工作台</div>
          <div style="font-size:12px;color:var(--text-light);margin-top:12px;line-height:1.8;">
            记账 · 购物确认 · 先用后付管理<br>
            愿你的每一笔花费都值得被温柔记录 🌿
          </div>
        </div>
      </div>
    `;
  },

  _formatSyncTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚同步';
    if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
    return `${d.getMonth()+1}月${d.getDate()}日`;
  },

  // ============================================
  // 渲染入口
  // ============================================
  render() {
    const content = document.getElementById('main-content');
    const titles = {
      home: '工作台', calendar: '日历', accounts: '账本',
      shopping: '我的购物', reports: '报表',
      categories: '分类管理', platforms: '购物平台',
      payments: '支付方式', settings: '设置'
    };
    document.getElementById('page-title').textContent = titles[this.current] || '富婆的财富日记';

    let html = '';
    switch(this.current) {
      case 'home': html = this.home(); break;
      case 'calendar': html = this.calendar(); break;
      case 'accounts': html = this.accounts(); break;
      case 'shopping': html = this.shopping(); break;
      case 'reports': html = this.reports(); break;
      case 'categories': html = this.categories(); break;
      case 'platforms': html = this.platforms(); break;
      case 'payments': html = this.payments(); break;
      case 'settings': html = this.settings(); break;
    }
    content.innerHTML = html;
    content.scrollTop = 0;

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === this.current);
    });

    // 显示/隐藏FAB
    const fab = document.getElementById('fab');
    const showFab = ['home', 'accounts', 'shopping'].includes(this.current);
    fab.style.display = showFab ? 'flex' : 'none';
  },
};
