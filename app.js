/* ============================================
   森系手账 · 应用主逻辑
   ============================================ */

// PWA standalone 模式检测：在 body 上加 class，便于 CSS 针对性适配状态栏
(function detectStandalone() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith('android-app://');
  if (isStandalone) {
    document.documentElement.classList.add('standalone');
    document.body && document.body.classList.add('standalone');
  }
})();

const App = {
  init() {
    DB.init();
    // 启动时检查：localStorage 丢失时自动从 IndexedDB 恢复
    DB.checkAndRestore().then(restored => {
      if (restored) {
        this.toast('检测到数据异常，已自动从本地备份恢复 🌿');
      }
      this.bindEvents();
      this.restoreSidebarState();
      this.renderMascotSidebar();
      Pages.render();
      // 启动时云同步策略：
      // - 以前是直接 pull 覆盖本地，会导致"删除后又复活"的 bug
      // - 现在改为：只有当本地数据真的丢了（restored 为 true）才从云端恢复
      // - 本地正常时不主动 pull，避免用云端旧快照覆盖用户最新操作
      // - 如果云端有更新，让用户通过「设置 → 云同步 → 从云端恢复」主动拉取
      if (restored && DB.cloud.isConfigured()) {
        DB.cloud.pull().then(() => {
          Pages.render();
        }).catch(() => {});
      }
    });
  },

  bindEvents() {
    // 菜单按钮
    document.getElementById('menu-btn').addEventListener('click', () => this.toggleSidebar());
    // 遮罩点击关闭（仅窄屏抽屉模式）
    document.getElementById('overlay').addEventListener('click', () => this.closeSidebar());
    // 导航项
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) this.navigate(page);
      });
    });
    // FAB
    document.getElementById('fab').addEventListener('click', () => this.onFabClick());

    // 键盘ESC关闭弹窗
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
        this.closeModal();
      }
    });

    // 窗口大小变化时重置 sidebar 状态
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateMenuIcon();
        // 跨断点切换时重置 sidebar/app 状态
        if (window.innerWidth >= 768) {
          // 切到宽屏：根据 collapsed 状态决定
          const sidebar = document.getElementById('sidebar');
          const app = document.getElementById('app');
          app.classList.remove('expanded');
          if (localStorage.getItem('sidebar-collapsed') === '1') {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('expanded');
          } else {
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('expanded');
          }
        } else {
          // 切到窄屏：根据 collapsed 状态映射到 expanded
          this.restoreSidebarState();
        }
      }, 200);
    });
  },

  renderMascotSidebar() {
    document.getElementById('sidebar-mascot').innerHTML = Mascot.getSVG('mini');
  },

  // 恢复 sidebar 宽窄状态（所有屏幕通用）
  restoreSidebarState() {
    const isNarrow = window.innerWidth < 768;
    // 默认值：未存储时
    //   - 窄屏：默认收起（仅显示图标列）
    //   - 宽屏：默认展开（完整 200px）
    const stored = localStorage.getItem('sidebar-collapsed');
    const collapsed = stored === null ? isNarrow : stored === '1';
    const sidebar = document.getElementById('sidebar');
    const app = document.getElementById('app');
    if (collapsed) {
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('expanded');
      app.classList.remove('expanded');
    } else {
      sidebar.classList.remove('collapsed');
      if (isNarrow) {
        // 窄屏下"未收起"= expanded 状态
        sidebar.classList.add('expanded');
        app.classList.add('expanded');
      } else {
        sidebar.classList.remove('expanded');
        app.classList.remove('expanded');
      }
    }
    this.updateMenuIcon();
  },

  // 数据变更后触发自动云同步（异步，不阻塞 UI）
  _syncTimer: null,
  triggerAutoSync() {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      DB.cloud.autoSync();
    }, 3000); // 数据变更 3 秒后同步
  },

  // 导航
  navigate(page) {
    Pages.current = page;
    Pages.render();
    // 窄屏：选择导航项后收起侧栏
    if (window.innerWidth < 768) {
      this.closeSidebar();
    }
  },

  // 侧边栏切换
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const app = document.getElementById('app');
    if (window.innerWidth < 768) {
      // 窄屏：在收起(60px)与展开(200px)之间切换，主内容跟随
      const isExpanded = sidebar.classList.contains('expanded');
      if (isExpanded) {
        sidebar.classList.remove('expanded');
        app.classList.remove('expanded');
        localStorage.setItem('sidebar-collapsed', '1');
      } else {
        sidebar.classList.add('expanded');
        app.classList.add('expanded');
        localStorage.setItem('sidebar-collapsed', '0');
      }
    } else {
      // 宽屏：切换宽窄（展开/收起图标列）
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      // 记住偏好
      localStorage.setItem('sidebar-collapsed', isCollapsed ? '1' : '0');
    }
    this.updateMenuIcon();
  },

  // 更新菜单按钮图标
  updateMenuIcon() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('menu-icon');
    if (!icon) return;
    if (window.innerWidth < 768) {
      // 窄屏：展开状态显示「◂」(收起箭头)，收起状态显示「☰」(展开箭头)
      const isExpanded = sidebar.classList.contains('expanded');
      icon.textContent = isExpanded ? '◂' : '☰';
    } else {
      const isCollapsed = sidebar.classList.contains('collapsed');
      icon.textContent = isCollapsed ? '☰' : '◂';
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const app = document.getElementById('app');
    if (window.innerWidth < 768) {
      // 窄屏：选择导航项后收起成图标列（保留 collapsed 状态）
      sidebar.classList.remove('expanded');
      app.classList.remove('expanded');
      sidebar.classList.add('collapsed');
      localStorage.setItem('sidebar-collapsed', '1');
    } else {
      // 宽屏：清掉 collapsed 状态，恢复完整导航
      sidebar.classList.remove('collapsed');
      localStorage.setItem('sidebar-collapsed', '0');
    }
    this.updateMenuIcon();
  },

  // FAB点击 - 根据当前页面
  onFabClick() {
    if (Pages.current === 'shopping') {
      this.showShoppingForm();
    } else {
      this.showAccountForm();
    }
  },

  // ============================================
  // Toast
  // ============================================
  toast(msg, duration = 2000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  },

  // ============================================
  // 确认弹窗
  // ============================================
  confirm(message, onConfirm, onCancel) {
    const html = `
      <div class="modal-overlay" id="confirm-overlay">
        <div class="modal-sheet" style="max-width:340px;border-radius:18px;align-self:center;margin:auto 20px;">
          <div style="text-align:center;padding:20px 10px;">
            ${Mascot.render('confirm', 70)}
            <div style="font-size:15px;color:var(--text-primary);margin:12px 0 20px;line-height:1.6;">${message}</div>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-secondary" style="flex:1;" onclick="App.closeConfirm()">取消</button>
              <button class="btn btn-danger" style="flex:1;" id="confirm-ok-btn">确定</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('confirm-container').innerHTML = html;
    document.getElementById('confirm-ok-btn').addEventListener('click', () => {
      this.closeConfirm();
      if (onConfirm) onConfirm();
    });
    document.getElementById('confirm-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'confirm-overlay') {
        this.closeConfirm();
        if (onCancel) onCancel();
      }
    });
  },

  closeConfirm() {
    document.getElementById('confirm-container').innerHTML = '';
  },

  // ============================================
  // Modal 通用
  // ============================================
  showModal(html) {
    document.getElementById('modal-container').innerHTML = html;
  },

  closeModal() {
    document.getElementById('modal-container').innerHTML = '';
  },

  // ============================================
  // 账目表单（新增/编辑）
  // ============================================
  showAccountForm(editId = null) {
    const isEdit = !!editId;
    const acc = isEdit ? DB.getAccount(editId) : {
      type: 'expense', amount: '', date: DB.formatDate(new Date()),
      categoryId: '', subCategory: '', paymentMethod: '', platform: '',
      product: '', note: '', payStatus: 'paid', payDate: DB.formatDate(new Date())
    };

    const expenseCats = DB.getExpenseCategories();
    const incomeCats = DB.getIncomeCategories();
    const platforms = DB.getPlatforms();
    const payments = DB.getPaymentMethods();

    const renderCategoryOptions = (type) => {
      const cats = type === 'expense' ? expenseCats : incomeCats;
      return cats.map(c => `<option value="${c.id}" ${acc.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
    };

    const renderSubOptions = (type, catId) => {
      if (!catId) return '';
      const cat = DB.getCategoryById(catId);
      if (!cat) return '';
      return cat.subCategories.map(s => `<option value="${s}" ${acc.subCategory === s ? 'selected' : ''}>${s}</option>`).join('');
    };

    const isShopping = acc.type === 'expense' && (acc.platform || acc.product);
    const pm = DB.getPaymentMethod(acc.paymentMethod);
    const showPayStatus = acc.type === 'expense' && pm && pm.type === 'bnpl';

    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">${isEdit ? '编辑账目' : '新增账目'}</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>

          <div class="type-switcher">
            <div class="type-option ${acc.type==='expense'?'active':''}" data-type="expense" onclick="App.switchAccountType('expense')">支出</div>
            <div class="type-option ${acc.type==='income'?'active':''}" data-type="income" onclick="App.switchAccountType('income')">收入</div>
            <div class="type-option ${acc.type==='transfer'?'active':''}" data-type="transfer" onclick="App.switchAccountType('transfer')">转账</div>
          </div>

          <div class="form-group">
            <label class="form-label">金额</label>
            <div class="amount-input-wrap">
              <input type="number" class="form-input amount-input" id="acc-amount" value="${acc.amount}" placeholder="0" step="0.01" inputmode="decimal">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">日期</label>
              <input type="date" class="form-input" id="acc-date" value="${acc.date}">
            </div>
            <div class="form-group">
              <label class="form-label">支付方式</label>
              <select class="form-select" id="acc-payment" onchange="App.onPaymentChange()">
                <option value="">请选择</option>
                ${payments.map(p => `<option value="${p.id}" ${acc.paymentMethod===p.id?'selected':''}>${p.icon} ${p.name}${p.type==='bnpl'?' (先用后付)':''}</option>`).join('')}
              </select>
            </div>
          </div>

          ${acc.type !== 'transfer' ? `
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">一级分类</label>
              <select class="form-select" id="acc-category" onchange="App.onCategoryChange()">
                <option value="">请选择</option>
                ${renderCategoryOptions(acc.type)}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">二级分类</label>
              <select class="form-select" id="acc-subcategory">
                <option value="">无</option>
                ${renderSubOptions(acc.type, acc.categoryId)}
              </select>
            </div>
          </div>
          ` : ''}

          ${acc.type === 'expense' ? `
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">购物平台</label>
              <select class="form-select" id="acc-platform">
                <option value="">无</option>
                ${platforms.map(p => `<option value="${p.id}" ${acc.platform===p.id?'selected':''}>${p.icon} ${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">商品名称</label>
              <input type="text" class="form-input" id="acc-product" value="${acc.product || ''}" placeholder="可选">
            </div>
          </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea class="form-textarea" id="acc-note" placeholder="写点什么...">${acc.note || ''}</textarea>
          </div>

          ${showPayStatus ? `
          <div class="form-row" id="pay-status-row">
            <div class="form-group">
              <label class="form-label">付款状态</label>
              <select class="form-select" id="acc-paystatus">
                <option value="unpaid" ${acc.payStatus==='unpaid'?'selected':''}>待付款</option>
                <option value="paid" ${acc.payStatus==='paid'?'selected':''}>已付款</option>
              </select>
            </div>
            <div class="form-group" id="paydate-group" style="${acc.payStatus==='unpaid'?'display:none':''}">
              <label class="form-label">实际付款日期</label>
              <input type="date" class="form-input" id="acc-paydate" value="${acc.payDate || DB.formatDate(new Date())}">
            </div>
          </div>
          ` : ''}

          <div class="modal-actions">
            ${isEdit ? `<button class="btn btn-danger" style="flex:0 0 auto;padding:14px 18px;" onclick="App.deleteAccount('${editId}')">删除</button>` : ''}
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App.saveAccount('${editId || ''}')">保存</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  _currentAccountType: 'expense',

  switchAccountType(type) {
    this._currentAccountType = type;
    document.querySelectorAll('.type-option').forEach(el => {
      el.classList.toggle('active', el.dataset.type === type);
    });
    // 重新渲染分类
    const expenseCats = DB.getExpenseCategories();
    const incomeCats = DB.getIncomeCategories();
    const cats = type === 'expense' ? expenseCats : incomeCats;
    const catSelect = document.getElementById('acc-category');
    if (catSelect) {
      catSelect.innerHTML = '<option value="">请选择</option>' + cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    }
    // 转账时隐藏分类和购物相关字段
    const subSelect = document.getElementById('acc-subcategory');
    if (subSelect) subSelect.parentElement.parentElement.style.display = type === 'transfer' ? 'none' : '';
    const platformRow = document.getElementById('acc-platform');
    if (platformRow) platformRow.parentElement.parentElement.style.display = type === 'expense' ? '' : 'none';
  },

  onCategoryChange() {
    const catId = document.getElementById('acc-category').value;
    const cat = DB.getCategoryById(catId);
    const subSelect = document.getElementById('acc-subcategory');
    if (subSelect && cat) {
      subSelect.innerHTML = '<option value="">无</option>' + cat.subCategories.map(s => `<option value="${s}">${s}</option>`).join('');
    }
  },

  onPaymentChange() {
    const pmId = document.getElementById('acc-payment').value;
    const pm = DB.getPaymentMethod(pmId);
    const existing = document.getElementById('pay-status-row');
    if (pm && pm.type === 'bnpl' && this._currentAccountType === 'expense') {
      if (!existing) {
        const payStatusRow = document.createElement('div');
        payStatusRow.className = 'form-row';
        payStatusRow.id = 'pay-status-row';
        payStatusRow.innerHTML = `
          <div class="form-group">
            <label class="form-label">付款状态</label>
            <select class="form-select" id="acc-paystatus" onchange="document.getElementById('paydate-group').style.display=this.value==='unpaid'?'none':''">
              <option value="unpaid">待付款</option>
              <option value="paid">已付款</option>
            </select>
          </div>
          <div class="form-group" id="paydate-group" style="display:none;">
            <label class="form-label">实际付款日期</label>
            <input type="date" class="form-input" id="acc-paydate" value="${DB.formatDate(new Date())}">
          </div>
        `;
        document.querySelector('.modal-actions').insertAdjacentElement('beforebegin', payStatusRow);
      }
    } else {
      if (existing) existing.remove();
    }
  },

  saveAccount(editId) {
    const type = document.querySelector('.type-option.active')?.dataset.type || 'expense';
    const amount = parseFloat(document.getElementById('acc-amount').value);
    if (!amount || amount <= 0) {
      this.toast('请输入有效金额');
      return;
    }

    const data = {
      type,
      amount,
      date: document.getElementById('acc-date').value,
      paymentMethod: document.getElementById('acc-payment').value,
      note: document.getElementById('acc-note').value.trim(),
    };

    if (type !== 'transfer') {
      data.categoryId = document.getElementById('acc-category').value;
      data.subCategory = document.getElementById('acc-subcategory').value;
    }
    if (type === 'expense') {
      data.platform = document.getElementById('acc-platform').value;
      data.product = document.getElementById('acc-product').value.trim();
    }

    // 先用后付
    const payStatusEl = document.getElementById('acc-paystatus');
    if (payStatusEl) {
      data.payStatus = payStatusEl.value;
      const payDateEl = document.getElementById('acc-paydate');
      data.payDate = payDateEl ? payDateEl.value : '';
    } else {
      data.payStatus = 'paid';
      data.payDate = data.date;
    }

    if (editId) {
      DB.updateAccount(editId, data);
      this.toast('账目已更新');
    } else {
      DB.addAccount(data);
      this.toast('记账成功 ✅');
    }

    this.closeModal();
    Pages.render();
  },

  editAccount(id) {
    this.showAccountForm(id);
  },

  deleteAccount(id) {
    this.confirm('确定删除这条账目吗？', () => {
      DB.deleteAccount(id);
      this.toast('已删除');
      this.closeModal();
      Pages.render();
    });
  },

  // ============================================
  // 购物表单
  // ============================================
  showShoppingForm(editId = null) {
    const isEdit = !!editId;
    const item = isEdit ? DB.getShoppingItem(editId) : {
      product: '', amount: '', categoryId: '', subCategory: '',
      platform: '', paymentMethod: '', orderDate: DB.formatDate(new Date()),
      receiveDate: '', decideDate: '', status: 'pending', returnDeadline: '',
      note: '', payStatus: 'unpaid', payDate: ''
    };

    const expenseCats = DB.getExpenseCategories();
    const platforms = DB.getPlatforms();
    const payments = DB.getPaymentMethods();
    const bnplPayments = payments.filter(p => p.type === 'bnpl');
    const instantPayments = payments.filter(p => p.type === 'instant');

    const statusOptions = [
      { val: 'pending', label: '待收货' },
      { val: 'received', label: '已收货/待确认' },
      { val: 'kept', label: '已留下' },
      { val: 'returned', label: '已退货' },
    ];

    const cat = DB.getCategoryById(item.categoryId);

    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">${isEdit ? '编辑购物' : '新增购物'}</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:2;">
              <label class="form-label">商品名称</label>
              <input type="text" class="form-input" id="shop-product" value="${item.product}" placeholder="商品名称">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">金额</label>
              <div class="amount-input-wrap">
                <input type="number" class="form-input amount-input" id="shop-amount" value="${item.amount}" placeholder="0" step="0.01" inputmode="decimal">
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">商品分类</label>
              <select class="form-select" id="shop-category" onchange="App.onShopCategoryChange()">
                <option value="">请选择</option>
                ${expenseCats.map(c => `<option value="${c.id}" ${item.categoryId===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">二级分类</label>
              <select class="form-select" id="shop-subcategory">
                <option value="">无</option>
                ${cat ? cat.subCategories.map(s => `<option value="${s}" ${item.subCategory===s?'selected':''}>${s}</option>`).join('') : ''}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">购物平台</label>
              <select class="form-select" id="shop-platform">
                <option value="">请选择</option>
                ${platforms.map(p => `<option value="${p.id}" ${item.platform===p.id?'selected':''}>${p.icon} ${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">支付方式</label>
              <select class="form-select" id="shop-payment" onchange="App.onShopPaymentChange()">
                <option value="">请选择</option>
                ${bnplPayments.length > 0 ? '<optgroup label="先用后付">' + bnplPayments.map(p => `<option value="${p.id}" ${item.paymentMethod===p.id?'selected':''}>${p.icon} ${p.name}</option>`).join('') + '</optgroup>' : ''}
                <optgroup label="即时支付">${instantPayments.map(p => `<option value="${p.id}" ${item.paymentMethod===p.id?'selected':''}>${p.icon} ${p.name}</option>`).join('')}</optgroup>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">下单日期</label>
              <input type="date" class="form-input" id="shop-orderdate" value="${item.orderDate}">
            </div>
            <div class="form-group">
              <label class="form-label">退货截止日期</label>
              <input type="date" class="form-input" id="shop-deadline" value="${item.returnDeadline}">
            </div>
          </div>

          ${item.status !== 'pending' || isEdit ? `
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">收货日期</label>
              <input type="date" class="form-input" id="shop-receivedate" value="${item.receiveDate}">
            </div>
            <div class="form-group">
              <label class="form-label">当前状态</label>
              <select class="form-select" id="shop-status">
                ${statusOptions.map(s => `<option value="${s.val}" ${item.status===s.val?'selected':''}>${s.label}</option>`).join('')}
              </select>
            </div>
          </div>
          ` : ''}

          <div class="form-row" id="shop-paystatus-row" style="${item.paymentMethod && DB.getPaymentMethod(item.paymentMethod)?.type === 'bnpl' ? '' : 'display:none;'}">
            <div class="form-group">
              <label class="form-label">付款状态</label>
              <select class="form-select" id="shop-paystatus" onchange="document.getElementById('shop-paydate-group').style.display=this.value==='unpaid'?'none':''">
                <option value="unpaid" ${item.payStatus==='unpaid'?'selected':''}>待付款</option>
                <option value="paid" ${item.payStatus==='paid'?'selected':''}>已付款</option>
              </select>
            </div>
            <div class="form-group" id="shop-paydate-group" style="${item.payStatus==='unpaid'?'display:none':''}">
              <label class="form-label">实际付款日期</label>
              <input type="date" class="form-input" id="shop-paydate" value="${item.payDate || DB.formatDate(new Date())}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea class="form-textarea" id="shop-note" placeholder="写点什么...">${item.note || ''}</textarea>
          </div>

          <div class="modal-actions">
            ${isEdit ? `<button class="btn btn-danger" style="flex:0 0 auto;padding:14px 18px;" onclick="App.deleteShopping('${editId}')">删除</button>` : ''}
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App.saveShopping('${editId || ''}')">保存</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  onShopCategoryChange() {
    const catId = document.getElementById('shop-category').value;
    const cat = DB.getCategoryById(catId);
    const subSelect = document.getElementById('shop-subcategory');
    if (subSelect && cat) {
      subSelect.innerHTML = '<option value="">无</option>' + cat.subCategories.map(s => `<option value="${s}">${s}</option>`).join('');
    }
  },

  onShopPaymentChange() {
    const pmId = document.getElementById('shop-payment').value;
    const pm = DB.getPaymentMethod(pmId);
    const row = document.getElementById('shop-paystatus-row');
    if (row) {
      row.style.display = (pm && pm.type === 'bnpl') ? '' : 'none';
    }
  },

  saveShopping(editId) {
    const product = document.getElementById('shop-product').value.trim();
    const amount = parseFloat(document.getElementById('shop-amount').value);
    if (!product) { this.toast('请输入商品名称'); return; }
    if (!amount || amount <= 0) { this.toast('请输入有效金额'); return; }

    const data = {
      product,
      amount,
      categoryId: document.getElementById('shop-category').value,
      subCategory: document.getElementById('shop-subcategory').value,
      platform: document.getElementById('shop-platform').value,
      paymentMethod: document.getElementById('shop-payment').value,
      orderDate: document.getElementById('shop-orderdate').value,
      returnDeadline: document.getElementById('shop-deadline').value,
      note: document.getElementById('shop-note').value.trim(),
    };

    const receiveDateEl = document.getElementById('shop-receivedate');
    if (receiveDateEl) {
      data.receiveDate = receiveDateEl.value;
      data.status = document.getElementById('shop-status').value;
    }

    const payStatusEl = document.getElementById('shop-paystatus');
    if (payStatusEl) {
      data.payStatus = payStatusEl.value;
      const payDateEl = document.getElementById('shop-paydate');
      data.payDate = payDateEl ? payDateEl.value : '';
    }

    // 自动计算退货截止日期
    if (data.orderDate && !data.returnDeadline) {
      const od = new Date(data.orderDate);
      od.setDate(od.getDate() + (DB.data.settings.returnDeadlineDays || 7));
      data.returnDeadline = DB.formatDate(od);
    }

    if (editId) {
      DB.updateShopping(editId, data);
      this.toast('购物记录已更新');
    } else {
      DB.addShopping(data);
      this.toast('已添加购物记录 📦');
    }

    this.closeModal();
    Pages.render();
  },

  editShopping(id) {
    this.showShoppingForm(id);
  },

  deleteShopping(id) {
    this.confirm('确定删除这条购物记录吗？', () => {
      DB.deleteShopping(id);
      this.toast('已删除');
      this.closeModal();
      Pages.render();
    });
  },

  // 购物操作
  keepShopping(id) {
    const result = DB.keepShopping(id);
    if (result) {
      this.toast('好耶！已帮你记账啦 ✨');
      Pages.render();
    }
  },

  returnShopping(id) {
    this.confirm('确定退货吗？退货不会生成正式支出。', () => {
      DB.returnShopping(id);
      this.toast('已标记退货');
      Pages.render();
    });
  },

  receiveShopping(id) {
    DB.receiveShopping(id);
    this.toast('已确认收货 📬');
    Pages.render();
  },

  markShoppingPaid(id) {
    DB.markPaid(id);
    this.toast('已标记付款 💰');
    Pages.render();
  },

  // 待付款列表
  showUnpaidList() {
    const unpaid = DB.getUnpaidAccounts();
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">⏳ 待付款账目</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div style="margin-bottom:12px;font-size:13px;color:var(--text-secondary);">
            共 ${unpaid.length} 笔，合计 ¥${DB.formatMoney(unpaid.reduce((s,a)=>s+a.amount,0))}
          </div>
          ${unpaid.length > 0 ? unpaid.map(a => {
            const cat = DB.getCategoryById(a.categoryId);
            const pm = DB.getPaymentMethod(a.paymentMethod);
            return `
              <div class="account-list-item" style="border:1px solid rgba(224,216,200,0.4);border-radius:12px;padding:12px;margin-bottom:8px;">
                <div class="account-icon">${cat?.icon || '📝'}</div>
                <div class="account-info">
                  <div class="account-category">${a.product || cat?.name || '未分类'}</div>
                  <div class="account-note">${pm?.name || ''} · ${a.date}${a.payDate ? ' · 应付:' + a.payDate : ''}</div>
                </div>
                <div style="text-align:right;">
                  <div class="account-amount expense">¥${DB.formatMoney(a.amount)}</div>
                  <button class="btn-sm btn-primary" style="margin-top:4px;" onclick="App.markAccountPaid('${a.id}')">已付款</button>
                </div>
              </div>
            `;
          }).join('') : '<div style="text-align:center;padding:30px;color:var(--text-light);">没有待付款账目</div>'}
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  markAccountPaid(id) {
    DB.markAccountPaid(id);
    this.toast('已标记付款 💰');
    this.closeModal();
    Pages.render();
  },

  // ============================================
  // 分类管理
  // ============================================
  addCategory(type) {
    this.showCategoryForm(null, type);
  },

  editCategory(id, type) {
    this.showCategoryForm(id, type);
  },

  showCategoryForm(editId, type) {
    const isEdit = !!editId;
    const cat = isEdit ? DB.getCategoryById(editId) : { name: '', icon: '🌿', subCategories: [] };
    const icons = ['🍜','🛍','👕','💄','📱','🚌','🏠','🪑','🎮','🌿','💝','📝','💼','🎉','📈','🧧','💰','↩️','📚','🎨','☕','🧸','💡','🌸'];
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">${isEdit ? '编辑分类' : '新增分类'}</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="form-group">
            <label class="form-label">分类名称</label>
            <input type="text" class="form-input" id="cat-name" value="${cat.name}" placeholder="分类名称">
          </div>
          <div class="form-group">
            <label class="form-label">图标</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${icons.map(ic => `<div class="icon-pick" data-icon="${ic}" style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;border:2px solid ${cat.icon===ic?'var(--forest-green)':'transparent'};background:var(--soft-green-bg);" onclick="App.pickIcon(this)">${ic}</div>`).join('')}
            </div>
          </div>
          ${isEdit ? `
          <div class="form-group">
            <label class="form-label">子分类（每行一个）</label>
            <textarea class="form-textarea" id="cat-subs" placeholder="每行一个子分类">${cat.subCategories.join('\n')}</textarea>
          </div>
          ` : `
          <div class="form-group">
            <label class="form-label">子分类（每行一个，可选）</label>
            <textarea class="form-textarea" id="cat-subs" placeholder="每行一个子分类"></textarea>
          </div>
          `}
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App.saveCategory('${editId || ''}', '${type}')">保存</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  pickIcon(el) {
    document.querySelectorAll('.icon-pick').forEach(e => e.style.border = '2px solid transparent');
    el.style.border = '2px solid var(--forest-green)';
  },

  saveCategory(editId, type) {
    const name = document.getElementById('cat-name').value.trim();
    if (!name) { this.toast('请输入分类名称'); return; }
    const iconEl = document.querySelector('.icon-pick[style*="forest-green"]') || document.querySelector('.icon-pick[style*="--forest-green"]') || document.querySelector('.icon-pick');
    const icon = iconEl ? iconEl.dataset.icon : '🌿';
    const subs = document.getElementById('cat-subs').value.split('\n').map(s => s.trim()).filter(s => s);

    if (editId) {
      DB.updateCategory(editId, { name, icon, subCategories: subs });
      this.toast('分类已更新');
    } else {
      DB.addCategory(type, name, icon, subs);
      this.toast('分类已添加');
    }
    this.closeModal();
    Pages.render();
  },

  deleteCategory(id) {
    this.confirm('确定删除这个分类吗？', () => {
      DB.deleteCategory(id);
      this.toast('已删除');
      Pages.render();
    });
  },

  deleteSubCategory(catId, subName) {
    this.confirm(`确定删除子分类「${subName}」吗？`, () => {
      DB.deleteSubCategory(catId, subName);
      this.toast('已删除');
      Pages.render();
    });
  },

  // ============================================
  // 平台管理
  // ============================================
  addPlatform() {
    this.showPlatformForm();
  },

  editPlatform(id) {
    this.showPlatformForm(id);
  },

  showPlatformForm(editId) {
    const isEdit = !!editId;
    const p = isEdit ? DB.getPlatform(editId) : { name: '', icon: '🏪', color: '#8ba888' };
    const icons = ['🛒','📦','🍊','🎵','📕','🏍','🏪','🛍','🏬','🌐','💊','👗','👟','📖','🍔','🛏','💻','🎮','📷','🎯'];
    const colors = ['#ff6a3d','#e1251b','#e02e24','#000000','#ff2741','#ffc300','#8ba888','#5a8a4a','#6b9a5a','#d4a25e','#c47a6a','#8b9dc3','#c4a46d','#b8a0c8'];
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">${isEdit ? '编辑平台' : '新增平台'}</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="form-group">
            <label class="form-label">平台名称</label>
            <input type="text" class="form-input" id="pf-name" value="${p.name}" placeholder="平台名称">
          </div>
          <div class="form-group">
            <label class="form-label">图标</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${icons.map(ic => `<div class="icon-pick" data-icon="${ic}" style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;border:2px solid ${p.icon===ic?'var(--forest-green)':'transparent'};background:var(--soft-green-bg);" onclick="App.pickIcon(this)">${ic}</div>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">颜色</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${colors.map(c => `<div class="color-pick" data-color="${c}" style="width:32px;height:32px;border-radius:50%;cursor:pointer;border:3px solid ${p.color===c?'var(--text-primary)':'transparent'};background:${c};" onclick="App.pickColor(this)"></div>`).join('')}
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App.savePlatform('${editId || ''}')">保存</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  pickColor(el) {
    document.querySelectorAll('.color-pick').forEach(e => e.style.border = '3px solid transparent');
    el.style.border = '3px solid var(--text-primary)';
  },

  savePlatform(editId) {
    const name = document.getElementById('pf-name').value.trim();
    if (!name) { this.toast('请输入平台名称'); return; }
    const iconEl = document.querySelector('.icon-pick[style*="forest-green"]') || document.querySelector('.icon-pick');
    const icon = iconEl ? iconEl.dataset.icon : '🏪';
    const colorEl = document.querySelector('.color-pick[style*="--text-primary"]') || document.querySelector('.color-pick[style*="solid"]') || document.querySelector('.color-pick');
    const color = colorEl ? colorEl.dataset.color : '#8ba888';

    if (editId) {
      DB.updatePlatform(editId, { name, icon, color });
      this.toast('平台已更新');
    } else {
      DB.addPlatform(name, icon, color);
      this.toast('平台已添加');
    }
    this.closeModal();
    Pages.render();
  },

  deletePlatform(id) {
    this.confirm('确定删除这个平台吗？', () => {
      DB.deletePlatform(id);
      this.toast('已删除');
      Pages.render();
    });
  },

  // ============================================
  // 支付方式管理
  // ============================================
  addPayment(type) {
    this.showPaymentForm(null, type);
  },

  editPayment(id) {
    this.showPaymentForm(id);
  },

  showPaymentForm(editId, defaultType) {
    const isEdit = !!editId;
    const p = isEdit ? DB.getPaymentMethod(editId) : { name: '', icon: '💳', type: defaultType || 'instant' };
    const icons = ['💳','💚','💙','🏦','💵','💰','📱','🏆','⏰','🌟','🔗','🅿️','🎟','📊'];
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">${isEdit ? '编辑支付方式' : '新增支付方式'}</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="form-group">
            <label class="form-label">名称</label>
            <input type="text" class="form-input" id="pm-name" value="${p.name}" placeholder="支付方式名称">
          </div>
          <div class="form-group">
            <label class="form-label">类型</label>
            <select class="form-select" id="pm-type">
              <option value="bnpl" ${p.type==='bnpl'?'selected':''}>先用后付 / 延迟付款</option>
              <option value="instant" ${p.type==='instant'?'selected':''}>即时支付</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">图标</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${icons.map(ic => `<div class="icon-pick" data-icon="${ic}" style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;border:2px solid ${p.icon===ic?'var(--forest-green)':'transparent'};background:var(--soft-green-bg);" onclick="App.pickIcon(this)">${ic}</div>`).join('')}
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App.savePayment('${editId || ''}')">保存</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  savePayment(editId) {
    const name = document.getElementById('pm-name').value.trim();
    if (!name) { this.toast('请输入名称'); return; }
    const type = document.getElementById('pm-type').value;
    const iconEl = document.querySelector('.icon-pick[style*="forest-green"]') || document.querySelector('.icon-pick');
    const icon = iconEl ? iconEl.dataset.icon : '💳';

    if (editId) {
      DB.updatePaymentMethod(editId, { name, icon, type });
      this.toast('支付方式已更新');
    } else {
      DB.addPaymentMethod(name, icon, type);
      this.toast('支付方式已添加');
    }
    this.closeModal();
    Pages.render();
  },

  deletePayment(id) {
    this.confirm('确定删除这个支付方式吗？', () => {
      DB.deletePayment(id);
      this.toast('已删除');
      Pages.render();
    });
  },

  // ============================================
  // 设置
  // ============================================
  toggleMascot() {
    DB.data.settings.mascotEnabled = !DB.data.settings.mascotEnabled;
    DB.save();
    this.toast(DB.data.settings.mascotEnabled ? '小管家已唤醒 🦌' : '小管家已休息');
    Pages.render();
  },

  editReturnDays() {
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet" style="max-width:340px;">
          <div class="modal-header">
            <div class="modal-title">默认退货期限</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="form-group">
            <label class="form-label">下单后默认退货截止天数</label>
            <input type="number" class="form-input" id="return-days" value="${DB.data.settings.returnDeadlineDays}" min="1" max="60">
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App.saveReturnDays()">保存</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  saveReturnDays() {
    const days = parseInt(document.getElementById('return-days').value);
    if (days > 0 && days <= 60) {
      DB.data.settings.returnDeadlineDays = days;
      DB.save();
      this.toast('已保存');
      this.closeModal();
      Pages.render();
    } else {
      this.toast('请输入1-60之间的数字');
    }
  },

  exportData() {
    const data = DB.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `富婆的财富日记_备份_${DB.formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('数据已导出 📤');
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          DB.import(ev.target.result);
          this.toast('数据已导入 📥');
          Pages.render();
        } catch(err) {
          this.toast('导入失败，文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // 导入小青账数据
  importXiaoqingzhang() {
    this.showXQZImportGuide();
  },

  showXQZImportGuide() {
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">📥 导入小青账数据</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div style="font-size:14px;color:var(--text-secondary);line-height:1.8;margin-bottom:16px;">
            <div style="background:var(--soft-green-bg);border-radius:12px;padding:14px;margin-bottom:14px;">
              <div style="font-weight:600;color:var(--forest-green);margin-bottom:8px;">📋 导出步骤（在小青账 App 中）</div>
              <div style="font-size:13px;line-height:2;">
                1. 打开小青账 → 右下角「我的」<br>
                2. 找到「账单管理」或「账单导出」<br>
                3. 选择导出时间范围（建议全选）<br>
                4. 选择导出方式 → 保存到手机<br>
                5. 把导出的 <strong>.xlsx</strong> 文件传到当前设备
              </div>
            </div>
            <div style="background:#fff8e1;border-radius:12px;padding:14px;margin-bottom:14px;font-size:13px;line-height:1.8;">
              <strong style="color:var(--warn-color);">⚠️ 注意事项</strong><br>
              · 导入会<strong>追加</strong>到现有账目，不会覆盖<br>
              · 小青账的分类会自动映射，未匹配的会自动新建<br>
              · 小青账的"账户"会尝试匹配支付方式<br>
              · 建议先「导出」备份当前数据再导入
            </div>
            <div style="text-align:center;padding:12px;">
              ${Mascot.render('happy', 70)}
              <div style="font-size:12px;color:var(--text-light);margin-top:4px;">准备好了就开始吧～</div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="App._pickXQZFile()">选择小青账文件</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
  },

  _pickXQZFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this._processXQZFile(file);
    };
    input.click();
  },

  _processXQZFile(file) {
    // 显示加载中
    this.closeModal();
    this.toast('正在解析小青账数据...⏳', 3000);

    const reader = new FileReader();
    reader.onload = (ev) => {
      DB.importXiaoqingzhang(ev.target.result)
        .then(result => {
          this._showXQZResult(result, file.name);
        })
        .catch(err => {
          console.error(err);
          this.toast('导入失败：' + (err.message || '文件格式错误'), 3000);
        });
    };
    reader.onerror = () => this.toast('文件读取失败', 3000);
    reader.readAsArrayBuffer(file);
  },

  _showXQZResult(result, filename) {
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">✅ 导入完成</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div style="text-align:center;padding:20px 10px;">
            ${Mascot.render('happy', 80)}
            <div style="font-size:16px;font-weight:600;color:var(--forest-green);margin-top:12px;">好耶！数据迁移成功</div>
          </div>
          <div style="background:var(--soft-green-bg);border-radius:12px;padding:16px;margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:var(--text-secondary);font-size:14px;">成功导入</span>
              <span style="font-weight:700;color:var(--forest-green);font-size:16px;">${result.imported} 笔</span>
            </div>
            ${result.skipped > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:var(--text-secondary);font-size:14px;">跳过（数据不完整）</span>
              <span style="font-weight:600;color:var(--text-light);font-size:14px;">${result.skipped} 笔</span>
            </div>` : ''}
            ${result.categoriesAdded.length > 0 ? `
            <div style="border-top:1px solid rgba(224,216,200,0.4);padding-top:10px;margin-top:8px;">
              <div style="color:var(--text-secondary);font-size:13px;margin-bottom:6px;">自动新建分类：</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${result.categoriesAdded.map(c => `<span class="shopping-meta-tag">${c}</span>`).join('')}
              </div>
            </div>` : ''}
          </div>
          <div style="font-size:12px;color:var(--text-light);text-align:center;margin-bottom:14px;">
            来源文件：${filename}
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="App.closeModal();App.navigate('accounts');">查看账本</button>
          </div>
        </div>
      </div>
    `;
    this.showModal(html);
    Pages.render();
  },

  resetData() {
    this.confirm('确定重置所有数据吗？这将清除所有账目和设置，不可恢复！', () => {
      DB.reset();
      DB.seedDemoData();
      DB.save();
      this.toast('数据已重置');
      Pages.render();
    });
  },

  // ============================================
  // 云同步（GitHub Gist）
  // ============================================
  showCloudSync() {
    const c = DB.cloud.getConfig();
    const hasToken = !!c.token;
    const configured = DB.cloud.isConfigured();
    const lastSyncText = c.lastSync ? this._formatTime(c.lastSync) : '从未同步';

    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)App.closeModal()">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">☁️ 云同步设置</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>

          <div style="background:var(--soft-green-bg);border-radius:12px;padding:14px;margin-bottom:14px;font-size:13px;line-height:1.8;">
            <strong style="color:var(--forest-green);">☁️ 什么是云同步？</strong><br>
            通过 GitHub Gist 免费云端备份你的记账数据。<br>
            换手机、清浏览器都不怕，登录同一 GitHub 账号即可恢复。<br>
            <span style="color:var(--text-light);">完全免费、私有、永久保存。</span>
          </div>

          ${configured ? `
            <div style="background:#e8f5e9;border-radius:12px;padding:14px;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="font-size:18px;">✅</span>
                <span style="font-weight:600;color:var(--forest-green);">云同步已配置</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);">
                上次同步：${lastSyncText}<br>
                自动同步：${c.autoSync ? '已开启' : '已关闭'}
              </div>
            </div>
          ` : hasToken ? `
            <div style="background:#fff3e0;border-radius:12px;padding:14px;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="font-size:18px;">🔑</span>
                <span style="font-weight:600;color:var(--warn-color);">已填 Token，还没绑定备份</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);line-height:1.7;">
                旧手机迁移：点下方「从云端恢复」即可自动找回备份<br>
                第一次使用：点「立即上传」会自动创建云端备份
              </div>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">GitHub Token <span style="font-size:11px;color:var(--text-light);">(必填)</span></label>
            <input type="password" class="form-input" id="cloud-token" value="${c.token}" placeholder="ghp_xxxxxxxxxxxx">
            <div style="font-size:11px;color:var(--text-light);margin-top:4px;line-height:1.6;">
              获取方式：github.com → Settings → Developer settings → Personal access tokens → Generate new token（classic）→ 勾选 <strong>gist</strong> 权限 → 生成
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Gist ID <span style="font-size:11px;color:var(--text-light);">(一般留空即可，会自动识别)</span></label>
            <input type="text" class="form-input" id="cloud-gistid" value="${c.gistId}" placeholder="自动识别，无需手填">
          </div>

          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="cloud-autosync" ${c.autoSync ? 'checked' : ''} style="width:18px;height:18px;">
              <span style="font-size:14px;">开启自动同步（每次记账后自动上传）</span>
            </label>
          </div>

          <div class="modal-actions" style="flex-wrap:wrap;gap:8px;">
            ${configured ? `
              <button class="btn btn-primary" style="flex:1;" onclick="App.cloudPush()">☁️ 立即上传</button>
              <button class="btn btn-secondary" style="flex:1;" onclick="App.cloudPull()">📥 从云端恢复</button>
            ` : hasToken ? `
              <button class="btn btn-secondary" style="flex:1;" onclick="App.saveCloudConfig()">保存 Token</button>
              <button class="btn btn-primary" style="flex:1;" onclick="App.cloudPullFirst()">📥 从云端恢复（旧手机迁移）</button>
              <button class="btn btn-secondary" style="flex:1;" onclick="App.cloudPushFirst()">☁️ 立即上传（第一次备份）</button>
            ` : `
              <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
              <button class="btn btn-primary" style="flex:1;" onclick="App.saveCloudConfig()">保存配置</button>
            `}
          </div>
          ${configured ? `
            <div style="margin-top:10px;text-align:center;">
              <button class="btn-sm" style="background:rgba(196,122,106,0.1);color:var(--danger-color);border:none;" onclick="App.clearCloudConfig()">解除云同步</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    this.showModal(html);
  },

  // 先保存表单里的 Token，再执行恢复（用于"只填 Token"的迁移场景）
  async cloudPullFirst() {
    const token = document.getElementById('cloud-token').value.trim();
    const gistId = document.getElementById('cloud-gistid').value.trim();
    const autoSync = document.getElementById('cloud-autosync').checked;
    if (!token) { this.toast('请先输入 GitHub Token'); return; }
    DB.cloud.setConfig({ token, gistId, autoSync });
    this.cloudPull();
  },

  // 先保存表单里的 Token，再执行上传（用于第一次备份场景）
  async cloudPushFirst() {
    const token = document.getElementById('cloud-token').value.trim();
    const gistId = document.getElementById('cloud-gistid').value.trim();
    const autoSync = document.getElementById('cloud-autosync').checked;
    if (!token) { this.toast('请先输入 GitHub Token'); return; }
    DB.cloud.setConfig({ token, gistId, autoSync });
    this.cloudPush();
  },

  saveCloudConfig() {
    const token = document.getElementById('cloud-token').value.trim();
    const gistId = document.getElementById('cloud-gistid').value.trim();
    const autoSync = document.getElementById('cloud-autosync').checked;
    if (!token) { this.toast('请输入 GitHub Token'); return; }
    DB.cloud.setConfig({ token, gistId, autoSync });
    this.toast('云同步配置已保存 ✅');
    this.closeModal();
    Pages.render();
  },

  async cloudPush() {
    this.toast('正在上传到云端... ⏳', 3000);
    try {
      const r = await DB.cloud.push();
      this.toast('已上传到云端 ☁️');
      this.closeModal();
      Pages.render();
    } catch(e) {
      this.toast('上传失败：' + e.message, 3000);
    }
  },

  async cloudPull() {
    this.confirm('从云端恢复会覆盖当前数据，确定吗？', async () => {
      this.toast('正在从云端拉取... ⏳', 3000);
      try {
        const c = DB.cloud.getConfig();
        // 没有 gistId 时（换手机场景），先用 Token 自动查找云端备份
        if (!c.gistId) {
          const gistId = await DB.cloud.findGist();
          if (!gistId) {
            this.toast('云端没有找到历史备份，请先在本机「立即上传」一次', 4000);
            return;
          }
          this.toast('已自动找到云端备份 ✅');
        }
        await DB.cloud.pull();
        this.toast('已从云端恢复 📥');
        this.closeModal();
        Pages.render();
      } catch(e) {
        this.toast('拉取失败：' + e.message, 3000);
      }
    });
  },

  clearCloudConfig() {
    this.confirm('解除云同步？本地数据不受影响，但不再自动备份到云端。', () => {
      DB.cloud.setConfig({ token: '', gistId: '', autoSync: false });
      this.toast('已解除云同步');
      this.closeModal();
      Pages.render();
    });
  },

  _formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
    return `${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
