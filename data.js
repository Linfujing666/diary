/* ============================================
   森系手账 · 数据层
   localStorage 持久化 + 所有业务逻辑
   ============================================ */

const DB = {
  STORE_KEY: 'forest_ledger_data_v1',

  // 默认数据
  defaults: {
    accounts: [],         // 正式账目
    shopping: [],         // 购物记录
    expenseCategories: [  // 支出分类
      { id: 'ec_food', name: '餐饮', icon: '🍜', subCategories: ['早餐', '午餐', '晚餐', '零食', '饮品'] },
      { id: 'ec_shopping', name: '购物', icon: '🛍', subCategories: ['日用品', '数码配件', '文具'] },
      { id: 'ec_clothing', name: '服饰', icon: '👕', subCategories: ['上衣', '外套', '裤子', '鞋类', '配饰'] },
      { id: 'ec_beauty', name: '美妆', icon: '💄', subCategories: ['护肤品', '彩妆', '香水', '洗护'] },
      { id: 'ec_digital', name: '数码', icon: '📱', subCategories: ['手机', '电脑', '配件', '游戏'] },
      { id: 'ec_transport', name: '交通', icon: '🚌', subCategories: ['公交地铁', '打车', '加油', '停车'] },
      { id: 'ec_housing', name: '住房', icon: '🏠', subCategories: ['房租', '水电费', '物业费', '维修'] },
      { id: 'ec_home', name: '家居', icon: '🪑', subCategories: ['家具', '厨具', '装饰', '清洁'] },
      { id: 'ec_fun', name: '娱乐', icon: '🎮', subCategories: ['电影', '游戏', '音乐', '旅行'] },
      { id: 'ec_life', name: '生活', icon: '🌿', subCategories: ['医疗', '通信', '健身', '宠物'] },
      { id: 'ec_social', name: '人情', icon: '💝', subCategories: ['礼物', '红包', '请客'] },
      { id: 'ec_other', name: '其他', icon: '📝', subCategories: ['杂项'] },
    ],
    incomeCategories: [   // 收入分类
      { id: 'ic_salary', name: '工资', icon: '💼', subCategories: ['基本工资', '绩效', '加班'] },
      { id: 'ic_bonus', name: '奖金', icon: '🎉', subCategories: ['年终奖', '项目奖', '其他'] },
      { id: 'ic_parttime', name: '兼职', icon: '📝', subCategories: ['稿费', '咨询', '其他'] },
      { id: 'ic_invest', name: '投资收入', icon: '📈', subCategories: ['股票', '基金', '利息', '分红'] },
      { id: 'ic_redpacket', name: '红包', icon: '🧧', subCategories: ['微信红包', '支付宝', '其他'] },
      { id: 'ic_refund', name: '退款', icon: '↩️', subCategories: ['购物退款', '其他'] },
      { id: 'ic_other', name: '其他收入', icon: '💰', subCategories: ['杂项'] },
    ],
    platforms: [          // 购物平台
      { id: 'p_taobao', name: '淘宝', icon: '🛒', color: '#ff6a3d' },
      { id: 'p_jd', name: '京东', icon: '📦', color: '#e1251b' },
      { id: 'p_pdd', name: '拼多多', icon: '🍊', color: '#e02e24' },
      { id: 'p_douyin', name: '抖音', icon: '🎵', color: '#000000' },
      { id: 'p_xhs', name: '小红书', icon: '📕', color: '#ff2741' },
      { id: 'p_meituan', name: '美团', icon: '🏍', color: '#ffc300' },
      { id: 'p_other', name: '其他', icon: '🏪', color: '#8ba888' },
    ],
    paymentMethods: [     // 支付方式
      { id: 'pm_huabei', name: '花呗', icon: '💳', type: 'bnpl' },
      { id: 'pm_jdbaitiao', name: '京东白条', icon: '💳', type: 'bnpl' },
      { id: 'pm_douyinyuefu', name: '抖音月付', icon: '💳', type: 'bnpl' },
      { id: 'pm_meituanyuefu', name: '美团月付', icon: '💳', type: 'bnpl' },
      { id: 'pm_wechat', name: '微信支付', icon: '💚', type: 'instant' },
      { id: 'pm_alipay', name: '支付宝', icon: '💙', type: 'instant' },
      { id: 'pm_bankcard', name: '银行卡', icon: '🏦', type: 'instant' },
      { id: 'pm_creditcard', name: '信用卡', icon: '💳', type: 'instant' },
      { id: 'pm_cash', name: '现金', icon: '💵', type: 'instant' },
      { id: 'pm_other', name: '其他', icon: '💰', type: 'instant' },
    ],
    settings: {
      mascotEnabled: true,
      returnDeadlineDays: 7,
    }
  },

  data: null,

  // 初始化 / 加载
  init() {
    const saved = localStorage.getItem(this.STORE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        // 补全可能缺失的字段
        this.data = this.mergeDefaults(this.data);
      } catch(e) {
        console.error('数据解析失败', e);
        this.data = JSON.parse(JSON.stringify(this.defaults));
        this.seedDemoData();
      }
    } else {
      this.data = JSON.parse(JSON.stringify(this.defaults));
      this.seedDemoData();
    }
    this.save();
  },

  // 合并默认值（防止旧数据缺字段）
  mergeDefaults(data) {
    const d = this.defaults;
    return {
      accounts: data.accounts || [],
      shopping: data.shopping || [],
      expenseCategories: data.expenseCategories || d.expenseCategories,
      incomeCategories: data.incomeCategories || d.incomeCategories,
      platforms: data.platforms || d.platforms,
      paymentMethods: data.paymentMethods || d.paymentMethods,
      settings: { ...d.settings, ...(data.settings || {}) }
    };
  },

  save() {
    localStorage.setItem(this.STORE_KEY, JSON.stringify(this.data));
    // 同时写入 IndexedDB 作为二级备份（比 localStorage 更持久）
    this._saveToIndexedDB();
    // 记录最后备份时间
    localStorage.setItem('forest_ledger_last_save', Date.now().toString());
    // 触发自动云同步（如果已配置且开启）
    if (this.cloud && this.cloud.autoSync) {
      setTimeout(() => { try { this.cloud.autoSync(); } catch(e) {} }, 3000);
    }
  },

  // ============= IndexedDB 二级备份 =============
  _idb: null,
  _idbReady: false,

  _initIndexedDB() {
    return new Promise((resolve) => {
      if (this._idbReady) return resolve(this._idb);
      if (!('indexedDB' in window)) return resolve(null);
      const req = indexedDB.open('forest_ledger_db', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'key' });
        }
      };
      req.onsuccess = (e) => {
        this._idb = e.target.result;
        this._idbReady = true;
        resolve(this._idb);
      };
      req.onerror = () => resolve(null);
    });
  },

  _saveToIndexedDB() {
    this._initIndexedDB().then(db => {
      if (!db) return;
      const tx = db.transaction(['backups'], 'readwrite');
      const store = tx.objectStore('backups');
      // 保存最新快照 + 历史快照（最多 5 份）
      const snapshot = {
        key: 'latest',
        data: JSON.parse(JSON.stringify(this.data)),
        time: Date.now()
      };
      store.put(snapshot);
      // 每 50 次保存一个历史快照
      const saveCount = parseInt(localStorage.getItem('forest_ledger_save_count') || '0') + 1;
      localStorage.setItem('forest_ledger_save_count', saveCount.toString());
      if (saveCount % 50 === 0) {
        store.put({
          key: 'history_' + Date.now(),
          data: JSON.parse(JSON.stringify(this.data)),
          time: Date.now()
        });
      }
      // 清理超过 5 份的旧历史
      store.getAllKeys().onsuccess = (e) => {
        const keys = e.target.result.filter(k => k.startsWith('history_'));
        if (keys.length > 5) {
          keys.sort();
          keys.slice(0, keys.length - 5).forEach(k => store.delete(k));
        }
      };
    });
  },

  // 从 IndexedDB 恢复
  restoreFromIndexedDB() {
    return this._initIndexedDB().then(db => {
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(['backups'], 'readonly');
        const store = tx.objectStore('backups');
        const req = store.get('latest');
        req.onsuccess = (e) => {
          resolve(e.target.result || null);
        };
        req.onerror = () => resolve(null);
      });
    });
  },

  // 获取所有历史快照
  getHistorySnapshots() {
    return this._initIndexedDB().then(db => {
      if (!db) return [];
      return new Promise((resolve) => {
        const tx = db.transaction(['backups'], 'readonly');
        const store = tx.objectStore('backups');
        store.getAll().onsuccess = (e) => {
          const all = e.target.result || [];
          resolve(all.filter(s => s.key.startsWith('history_'))
            .sort((a, b) => b.time - a.time));
        };
      });
    });
  },

  // 启动时检查：localStorage 丢失但 IndexedDB 有 → 自动恢复
  checkAndRestore() {
    const lsData = localStorage.getItem(this.STORE_KEY);
    if (lsData) return Promise.resolve(false); // localStorage 正常，不需要恢复
    return this.restoreFromIndexedDB().then(snapshot => {
      if (snapshot && snapshot.data) {
        this.data = this.mergeDefaults(snapshot.data);
        this.save();
        console.log('[DB] 从 IndexedDB 自动恢复成功');
        return true;
      }
      return false;
    });
  },

  export() {
    return JSON.stringify(this.data, null, 2);
  },

  import(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    this.data = this.mergeDefaults(parsed);
    this.save();
  },

  // ============================================
  // 导入小青账数据 (xlsx)
  // 小青账导出文件含 3 个 Sheet：支出 / 收入 / 转账
  // 字段映射：
  //   支出/收入: 时间|账本|账户|大类|小类|金额|币种|备注|来源
  //   转账:      时间|账本|转出账户|大类|小类|转出金额|转出币种|转入账户|转入币种|转入金额|备注|来源
  // ============================================
  importXiaoqingzhang(arrayBuffer) {
    // 动态加载 SheetJS (xlsx) 解析库
    return this._loadXLSX().then(XLSX => {
      const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const result = { imported: 0, skipped: 0, categoriesAdded: [], details: [] };

      // 分类名 → ID 映射缓存
      const expenseCatMap = this._buildCategoryMap('expense');
      const incomeCatMap = this._buildCategoryMap('income');

      // 支出 Sheet
      if (wb.SheetNames.includes('支出')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['支出'], { defval: '' });
        rows.forEach(r => {
          const acc = this._parseXQZRow(r, 'expense', expenseCatMap, result);
          if (acc) { this.data.accounts.push(acc); result.imported++; }
          else result.skipped++;
        });
      }
      // 收入 Sheet
      if (wb.SheetNames.includes('收入')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['收入'], { defval: '' });
        rows.forEach(r => {
          const acc = this._parseXQZRow(r, 'income', incomeCatMap, result);
          if (acc) { this.data.accounts.push(acc); result.imported++; }
          else result.skipped++;
        });
      }
      // 转账 Sheet
      if (wb.SheetNames.includes('转账')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['转账'], { defval: '' });
        rows.forEach(r => {
          const acc = this._parseXQZTransferRow(r, result);
          if (acc) { this.data.accounts.push(acc); result.imported++; }
          else result.skipped++;
        });
      }

      this.save();
      return result;
    });
  },

  // 构建分类名 → ID 映射（支持自动创建）
  _buildCategoryMap(type) {
    const cats = type === 'expense' ? this.data.expenseCategories : this.data.incomeCategories;
    const map = {};
    cats.forEach(c => { map[c.name] = c.id; });
    return map;
  },

  // 解析小青账支出/收入行
  _parseXQZRow(row, type, catMap, result) {
    const date = this._parseXQZDate(row['时间']);
    const amount = parseFloat(row['金额']);
    if (!date || !amount || amount <= 0) return null;

    const typeName = type === 'expense' ? '支出' : '收入';
    const bigCat = String(row['大类'] || '').trim();
    const smallCat = String(row['小类'] || '').trim();
    const account = String(row['账户'] || '').trim();
    const note = String(row['备注'] || '').trim();
    const source = String(row['来源'] || '').trim();

    // 分类映射
    let categoryId = '';
    let subCategory = smallCat;
    if (bigCat) {
      if (catMap[bigCat]) {
        categoryId = catMap[bigCat];
      } else {
        // 自动创建新分类
        const newCat = this.addCategory(type, bigCat, type === 'expense' ? '📝' : '💰', smallCat ? [smallCat] : []);
        catMap[bigCat] = newCat.id;
        categoryId = newCat.id;
        result.categoriesAdded.push(bigCat);
      }
    }

    // 支付方式映射（小青账的"账户"字段 → 我们的支付方式）
    let paymentMethod = this._mapPaymentMethod(account);

    return {
      id: this.genId('acc'),
      date,
      type,
      amount: Math.round(amount * 100) / 100,
      categoryId,
      subCategory,
      paymentMethod,
      platform: '',
      product: '',
      note: note || (account ? `[小青账] ${account}` : '[小青账导入]'),
      source: '小青账导入',
      payStatus: 'paid',
      payDate: date,
    };
  },

  // 解析小青账转账行
  _parseXQZTransferRow(row, result) {
    const date = this._parseXQZDate(row['时间']);
    const amount = parseFloat(row['转出金额']);
    if (!date || !amount || amount <= 0) return null;

    const outAccount = String(row['转出账户'] || '').trim();
    const inAccount = String(row['转入账户'] || '').trim();
    const note = String(row['备注'] || '').trim();

    return {
      id: this.genId('acc'),
      date,
      type: 'transfer',
      amount: Math.round(amount * 100) / 100,
      categoryId: '',
      subCategory: '',
      paymentMethod: this._mapPaymentMethod(outAccount),
      platform: '',
      product: '',
      note: note || `${outAccount} → ${inAccount}`,
      source: '小青账导入',
      payStatus: 'paid',
      payDate: date,
    };
  },

  // 解析小青账日期（支持多种格式）
  _parseXQZDate(val) {
    if (!val) return '';
    // Date 对象
    if (val instanceof Date) {
      return this.formatDate(val);
    }
    // 字符串
    const s = String(val).trim();
    // 2021-01-01 / 2021/01/01
    let m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    }
    // 2021-01-01 12:30:25
    m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[\sT]/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    }
    // Excel 数字日期序列号
    if (/^\d+$/.test(s)) {
      const num = parseInt(s);
      if (num > 30000 && num < 60000) {
        // Excel 日期序列号：1900-01-01 = 1，但 Excel 有 1900 闰年 bug
        const date = new Date(Date.UTC(1899, 11, 30) + num * 86400000);
        return this.formatDate(date);
      }
    }
    return '';
  },

  // 小青账账户名 → 我们的支付方式
  _mapPaymentMethod(accountName) {
    if (!accountName) return '';
    const name = accountName.toLowerCase();
    const map = {
      '微信': 'pm_wechat', 'wechat': 'pm_wechat',
      '支付宝': 'pm_alipay', 'alipay': 'pm_alipay',
      '花呗': 'pm_huabei',
      '京东白条': 'pm_jdbaitiao',
      '信用卡': 'pm_creditcard',
      '现金': 'pm_cash',
      '银行卡': 'pm_bankcard', '储蓄卡': 'pm_bankcard', '借记卡': 'pm_bankcard',
    };
    for (const key in map) {
      if (accountName.includes(key) || name.includes(key)) {
        return map[key];
      }
    }
    return '';
  },

  // 动态加载 SheetJS
  _loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error('无法加载 Excel 解析库'));
      document.head.appendChild(script);
    });
  },

  reset() {
    this.data = JSON.parse(JSON.stringify(this.defaults));
    this.save();
  },

  // 生成ID
  genId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  // ============================================
  // 演示数据
  // ============================================
  seedDemoData() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const fmt = (date) => {
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    // 本月账目
    this.data.accounts = [
      { id: this.genId('acc'), date: fmt(today), type: 'income', amount: 12000, categoryId: 'ic_salary', subCategory: '基本工资', paymentMethod: 'pm_bankcard', platform: '', product: '', note: '8月工资', source: '手动', payStatus: 'paid', payDate: fmt(today) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d)), type: 'expense', amount: 35, categoryId: 'ec_food', subCategory: '午餐', paymentMethod: 'pm_wechat', platform: '', product: '', note: '食堂午餐', source: '手动', payStatus: 'paid', payDate: fmt(today) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d)), type: 'expense', amount: 28, categoryId: 'ec_transport', subCategory: '打车', paymentMethod: 'pm_alipay', platform: '', product: '', note: '上班打车', source: '手动', payStatus: 'paid', payDate: fmt(today) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-1)), type: 'expense', amount: 56, categoryId: 'ec_food', subCategory: '晚餐', paymentMethod: 'pm_wechat', platform: '', product: '', note: '和朋友吃饭', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m, d-1)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-2)), type: 'expense', amount: 89, categoryId: 'ec_life', subCategory: '通信', paymentMethod: 'pm_alipay', platform: '', product: '', note: '话费充值', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m, d-2)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-3)), type: 'expense', amount: 299, categoryId: 'ec_clothing', subCategory: '外套', paymentMethod: 'pm_huabei', platform: 'p_taobao', product: '秋季薄外套', note: '换季买的', source: '购物确认', payStatus: 'unpaid', payDate: '' },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-5)), type: 'expense', amount: 1560, categoryId: 'ec_digital', subCategory: '配件', paymentMethod: 'pm_jdbaitiao', platform: 'p_jd', product: '蓝牙耳机', note: '', source: '购物确认', payStatus: 'unpaid', payDate: '' },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-7)), type: 'expense', amount: 680, categoryId: 'ec_beauty', subCategory: '护肤品', paymentMethod: 'pm_douyinyuefu', platform: 'p_douyin', product: '精华液', note: '', source: '购物确认', payStatus: 'paid', payDate: fmt(new Date(y, m, d-7)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-8)), type: 'expense', amount: 420, categoryId: 'ec_home', subCategory: '厨具', paymentMethod: 'pm_alipay', platform: 'p_xhs', product: '不粘锅', note: '', source: '购物确认', payStatus: 'paid', payDate: fmt(new Date(y, m, d-8)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-10)), type: 'expense', amount: 300, categoryId: 'ec_shopping', subCategory: '日用品', paymentMethod: 'pm_wechat', platform: 'p_pdd', product: '纸巾囤货', note: '', source: '购物确认', payStatus: 'paid', payDate: fmt(new Date(y, m, d-10)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, d-12)), type: 'expense', amount: 1200, categoryId: 'ec_housing', subCategory: '房租', paymentMethod: 'pm_bankcard', platform: '', product: '', note: '8月房租', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m, d-12)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, 5)), type: 'expense', amount: 45, categoryId: 'ec_food', subCategory: '饮品', paymentMethod: 'pm_wechat', platform: '', product: '', note: '奶茶', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m, 5)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, 3)), type: 'expense', amount: 128, categoryId: 'ec_fun', subCategory: '电影', paymentMethod: 'pm_alipay', platform: '', product: '', note: '看电影', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m, 3)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m, 1)), type: 'expense', amount: 200, categoryId: 'ec_social', subCategory: '红包', paymentMethod: 'pm_wechat', platform: '', product: '', note: '朋友生日', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m, 1)) },
      // 上月数据（用于趋势）
      { id: this.genId('acc'), date: fmt(new Date(y, m-1, 5)), type: 'income', amount: 12000, categoryId: 'ic_salary', subCategory: '基本工资', paymentMethod: 'pm_bankcard', platform: '', product: '', note: '7月工资', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m-1, 5)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m-1, 10)), type: 'expense', amount: 4800, categoryId: 'ec_shopping', subCategory: '日用品', paymentMethod: 'pm_huabei', platform: 'p_taobao', product: '各种日用品', note: '7月购物', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m-1, 10)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m-1, 15)), type: 'expense', amount: 1200, categoryId: 'ec_housing', subCategory: '房租', paymentMethod: 'pm_bankcard', platform: '', product: '', note: '7月房租', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m-1, 15)) },
      { id: this.genId('acc'), date: fmt(new Date(y, m-1, 20)), type: 'expense', amount: 2000, categoryId: 'ec_food', subCategory: '午餐', paymentMethod: 'pm_wechat', platform: '', product: '', note: '7月餐饮', source: '手动', payStatus: 'paid', payDate: fmt(new Date(y, m-1, 20)) },
    ];

    // 购物记录
    this.data.shopping = [
      // 待收货
      {
        id: this.genId('shop'), product: '帆布托特包', amount: 89, categoryId: 'ec_clothing', subCategory: '配饰',
        platform: 'p_taobao', paymentMethod: 'pm_huabei',
        orderDate: fmt(new Date(y, m, d-1)), receiveDate: '', decideDate: '',
        status: 'pending', returnDeadline: fmt(new Date(y, m, d + 6)),
        note: '日常通勤用', payStatus: 'unpaid', payDate: '', linkedAccountId: ''
      },
      // 已收货待确认
      {
        id: this.genId('shop'), product: '陶瓷马克杯', amount: 45, categoryId: 'ec_home', subCategory: '厨具',
        platform: 'p_xhs', paymentMethod: 'pm_alipay',
        orderDate: fmt(new Date(y, m, d-5)), receiveDate: fmt(new Date(y, m, d-2)), decideDate: '',
        status: 'received', returnDeadline: fmt(new Date(y, m, d + 2)),
        note: '样子很可爱', payStatus: 'paid', payDate: fmt(new Date(y, m, d-5)), linkedAccountId: ''
      },
      {
        id: this.genId('shop'), product: '森系发夹套装', amount: 35, categoryId: 'ec_clothing', subCategory: '配饰',
        platform: 'p_douyin', paymentMethod: 'pm_douyinyuefu',
        orderDate: fmt(new Date(y, m, d-6)), receiveDate: fmt(new Date(y, m, d-3)), decideDate: '',
        status: 'received', returnDeadline: fmt(new Date(y, m, d + 1)),
        note: '快到期了！', payStatus: 'unpaid', payDate: '', linkedAccountId: ''
      },
    ];
  },

  // ============================================
  // 账目 CRUD
  // ============================================
  getAccounts(filter = {}) {
    let list = [...this.data.accounts];
    if (filter.type) list = list.filter(a => a.type === filter.type);
    if (filter.startDate) list = list.filter(a => a.date >= filter.startDate);
    if (filter.endDate) list = list.filter(a => a.date <= filter.endDate);
    if (filter.categoryId) list = list.filter(a => a.categoryId === filter.categoryId);
    if (filter.platform) list = list.filter(a => a.platform === filter.platform);
    if (filter.paymentMethod) list = list.filter(a => a.paymentMethod === filter.paymentMethod);
    list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    return list;
  },

  getAccount(id) {
    return this.data.accounts.find(a => a.id === id);
  },

  addAccount(account) {
    account.id = account.id || this.genId('acc');
    account.source = account.source || '手动';
    account.payStatus = account.payStatus || 'paid';
    account.payDate = account.payDate || account.date;
    this.data.accounts.push(account);
    this.save();
    return account;
  },

  updateAccount(id, updates) {
    const acc = this.data.accounts.find(a => a.id === id);
    if (acc) {
      Object.assign(acc, updates);
      this.save();
    }
    return acc;
  },

  deleteAccount(id) {
    const idx = this.data.accounts.findIndex(a => a.id === id);
    if (idx > -1) {
      this.data.accounts.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  },

  // ============================================
  // 购物 CRUD
  // ============================================
  getShopping(filter = {}) {
    let list = [...this.data.shopping];
    if (filter.status) list = list.filter(s => s.status === filter.status);
    list.sort((a, b) => {
      // 待确认优先，然后按退货截止日期升序
      const order = { received: 0, pending: 1, kept: 2, returned: 3, recorded: 4 };
      const oa = order[a.status] || 5;
      const ob = order[b.status] || 5;
      if (oa !== ob) return oa - ob;
      return (a.returnDeadline || '').localeCompare(b.returnDeadline || '');
    });
    return list;
  },

  getShoppingItem(id) {
    return this.data.shopping.find(s => s.id === id);
  },

  addShopping(item) {
    item.id = item.id || this.genId('shop');
    item.status = item.status || 'pending';
    item.payStatus = item.payStatus || 'unpaid';
    // 自动计算退货截止日期
    if (item.orderDate && !item.returnDeadline) {
      const od = new Date(item.orderDate);
      od.setDate(od.getDate() + (this.data.settings.returnDeadlineDays || 7));
      item.returnDeadline = this.formatDate(od);
    }
    this.data.shopping.push(item);
    this.save();
    return item;
  },

  updateShopping(id, updates) {
    const item = this.data.shopping.find(s => s.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
    }
    return item;
  },

  deleteShopping(id) {
    const idx = this.data.shopping.findIndex(s => s.id === id);
    if (idx > -1) {
      this.data.shopping.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  },

  // 确认留下 → 自动生成账目
  keepShopping(id) {
    const item = this.data.shopping.find(s => s.id === id);
    if (!item) return null;

    const today = this.formatDate(new Date());
    item.status = 'kept';
    item.decideDate = today;

    // 自动生成正式账目
    const account = {
      id: this.genId('acc'),
      date: today,
      type: 'expense',
      amount: item.amount,
      categoryId: item.categoryId,
      subCategory: item.subCategory || '',
      paymentMethod: item.paymentMethod,
      platform: item.platform,
      product: item.product,
      note: item.note || '',
      source: '购物确认',
      payStatus: item.payStatus || 'unpaid',
      payDate: item.payDate || '',
    };

    this.data.accounts.push(account);
    item.linkedAccountId = account.id;
    this.save();
    return { item, account };
  },

  // 退货
  returnShopping(id) {
    const item = this.data.shopping.find(s => s.id === id);
    if (!item) return null;
    item.status = 'returned';
    item.decideDate = this.formatDate(new Date());
    // 如果之前已生成账目，删除关联账目
    if (item.linkedAccountId) {
      this.deleteAccount(item.linkedAccountId);
      item.linkedAccountId = '';
    }
    this.save();
    return item;
  },

  // 确认收货
  receiveShopping(id) {
    const item = this.data.shopping.find(s => s.id === id);
    if (!item) return null;
    item.status = 'received';
    item.receiveDate = this.formatDate(new Date());
    this.save();
    return item;
  },

  // 标记已付款
  markPaid(id) {
    const item = this.data.shopping.find(s => s.id === id);
    if (!item) return null;
    item.payStatus = 'paid';
    item.payDate = this.formatDate(new Date());
    // 同步更新关联账目
    if (item.linkedAccountId) {
      this.updateAccount(item.linkedAccountId, { payStatus: 'paid', payDate: item.payDate });
    }
    this.save();
    return item;
  },

  // ============================================
  // 分类管理
  // ============================================
  getExpenseCategories() { return this.data.expenseCategories; },
  getIncomeCategories() { return this.data.incomeCategories; },

  getCategoryById(id) {
    let cat = this.data.expenseCategories.find(c => c.id === id);
    if (!cat) cat = this.data.incomeCategories.find(c => c.id === id);
    return cat;
  },

  getCategoryName(id) {
    const c = this.getCategoryById(id);
    return c ? c.name : '未分类';
  },

  getCategoryIcon(id) {
    const c = this.getCategoryById(id);
    return c ? c.icon : '📝';
  },

  addCategory(type, name, icon, subCategories = []) {
    const cat = { id: this.genId(type === 'expense' ? 'ec' : 'ic'), name, icon, subCategories };
    if (type === 'expense') this.data.expenseCategories.push(cat);
    else this.data.incomeCategories.push(cat);
    this.save();
    return cat;
  },

  updateCategory(id, updates) {
    let cat = this.data.expenseCategories.find(c => c.id === id);
    if (!cat) cat = this.data.incomeCategories.find(c => c.id === id);
    if (cat) {
      Object.assign(cat, updates);
      this.save();
    }
    return cat;
  },

  deleteCategory(id) {
    let idx = this.data.expenseCategories.findIndex(c => c.id === id);
    if (idx > -1) { this.data.expenseCategories.splice(idx, 1); this.save(); return true; }
    idx = this.data.incomeCategories.findIndex(c => c.id === id);
    if (idx > -1) { this.data.incomeCategories.splice(idx, 1); this.save(); return true; }
    return false;
  },

  addSubCategory(catId, subName) {
    const cat = this.getCategoryById(catId);
    if (cat && !cat.subCategories.includes(subName)) {
      cat.subCategories.push(subName);
      this.save();
    }
    return cat;
  },

  deleteSubCategory(catId, subName) {
    const cat = this.getCategoryById(catId);
    if (cat) {
      cat.subCategories = cat.subCategories.filter(s => s !== subName);
      this.save();
    }
    return cat;
  },

  // ============================================
  // 平台管理
  // ============================================
  getPlatforms() { return this.data.platforms; },

  getPlatform(id) { return this.data.platforms.find(p => p.id === id); },

  getPlatformName(id) {
    const p = this.data.platforms.find(p => p.id === id);
    return p ? p.name : '';
  },

  getPlatformIcon(id) {
    const p = this.data.platforms.find(p => p.id === id);
    return p ? p.icon : '🏪';
  },

  getPlatformColor(id) {
    const p = this.data.platforms.find(p => p.id === id);
    return p ? p.color : '#8ba888';
  },

  addPlatform(name, icon, color) {
    const p = { id: this.genId('p'), name, icon: icon || '🏪', color: color || '#8ba888' };
    this.data.platforms.push(p);
    this.save();
    return p;
  },

  updatePlatform(id, updates) {
    const p = this.data.platforms.find(p => p.id === id);
    if (p) { Object.assign(p, updates); this.save(); }
    return p;
  },

  deletePlatform(id) {
    const idx = this.data.platforms.findIndex(p => p.id === id);
    if (idx > -1) { this.data.platforms.splice(idx, 1); this.save(); return true; }
    return false;
  },

  // ============================================
  // 支付方式管理
  // ============================================
  getPaymentMethods() { return this.data.paymentMethods; },
  getPaymentMethodsByType(type) { return this.data.paymentMethods.filter(p => p.type === type); },

  getPaymentMethod(id) { return this.data.paymentMethods.find(p => p.id === id); },

  getPaymentMethodName(id) {
    const p = this.data.paymentMethods.find(p => p.id === id);
    return p ? p.name : '';
  },

  getPaymentMethodIcon(id) {
    const p = this.data.paymentMethods.find(p => p.id === id);
    return p ? p.icon : '💰';
  },

  addPaymentMethod(name, icon, type) {
    const p = { id: this.genId('pm'), name, icon: icon || '💳', type: type || 'instant' };
    this.data.paymentMethods.push(p);
    this.save();
    return p;
  },

  updatePaymentMethod(id, updates) {
    const p = this.data.paymentMethods.find(p => p.id === id);
    if (p) { Object.assign(p, updates); this.save(); }
    return p;
  },

  deletePaymentMethod(id) {
    const idx = this.data.paymentMethods.findIndex(p => p.id === id);
    if (idx > -1) { this.data.paymentMethods.splice(idx, 1); this.save(); return true; }
    return false;
  },

  // ============================================
  // 统计计算
  // ============================================

  // 获取某月账目
  getMonthAccounts(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.data.accounts.filter(a => a.date.startsWith(prefix));
  },

  // 月度财务概况
  getMonthSummary(year, month) {
    const accounts = this.getMonthAccounts(year, month);
    let income = 0, expense = 0, count = 0;
    accounts.forEach(a => {
      if (a.type === 'income') income += a.amount;
      else if (a.type === 'expense') { expense += a.amount; count++; }
    });
    return { income, expense, balance: income - expense, count };
  },

  // 今日账目
  getTodayAccounts() {
    const today = this.formatDate(new Date());
    return this.data.accounts.filter(a => a.date === today);
  },

  getTodaySummary() {
    const accounts = this.getTodayAccounts();
    let income = 0, expense = 0;
    accounts.forEach(a => {
      if (a.type === 'income') income += a.amount;
      else if (a.type === 'expense') expense += a.amount;
    });
    return { income, expense, accounts };
  },

  // 某日账目
  getDayAccounts(dateStr) {
    return this.data.accounts.filter(a => a.date === dateStr)
      .sort((a, b) => b.id.localeCompare(a.id));
  },

  // 月度支出分类统计
  getMonthExpenseByCategory(year, month) {
    const accounts = this.getMonthAccounts(year, month).filter(a => a.type === 'expense');
    const map = {};
    accounts.forEach(a => {
      if (!map[a.categoryId]) map[a.categoryId] = 0;
      map[a.categoryId] += a.amount;
    });
    const result = Object.entries(map).map(([catId, amount]) => ({
      categoryId: catId,
      categoryName: this.getCategoryName(catId),
      icon: this.getCategoryIcon(catId),
      amount: Math.round(amount * 100) / 100
    }));
    result.sort((a, b) => b.amount - a.amount);
    return result;
  },

  // 月度平台统计
  getMonthExpenseByPlatform(year, month) {
    const accounts = this.getMonthAccounts(year, month).filter(a => a.type === 'expense' && a.platform);
    const map = {};
    accounts.forEach(a => {
      if (!map[a.platform]) map[a.platform] = 0;
      map[a.platform] += a.amount;
    });
    const result = Object.entries(map).map(([pid, amount]) => ({
      platformId: pid,
      platformName: this.getPlatformName(pid),
      icon: this.getPlatformIcon(pid),
      color: this.getPlatformColor(pid),
      amount: Math.round(amount * 100) / 100
    }));
    result.sort((a, b) => b.amount - a.amount);
    return result;
  },

  // 月度支付方式统计
  getMonthExpenseByPayment(year, month) {
    const accounts = this.getMonthAccounts(year, month).filter(a => a.type === 'expense' && a.paymentMethod);
    const map = {};
    accounts.forEach(a => {
      if (!map[a.paymentMethod]) map[a.paymentMethod] = 0;
      map[a.paymentMethod] += a.amount;
    });
    const result = Object.entries(map).map(([pid, amount]) => ({
      paymentId: pid,
      paymentName: this.getPaymentMethodName(pid),
      icon: this.getPaymentMethodIcon(pid),
      amount: Math.round(amount * 100) / 100
    }));
    result.sort((a, b) => b.amount - a.amount);
    return result;
  },

  // 日历每日统计
  getCalendarDaySummary(year, month) {
    const accounts = this.getMonthAccounts(year, month);
    const map = {};
    accounts.forEach(a => {
      const day = parseInt(a.date.slice(8, 10));
      if (!map[day]) map[day] = { expense: 0, income: 0 };
      if (a.type === 'expense') map[day].expense += a.amount;
      else if (a.type === 'income') map[day].income += a.amount;
    });
    return map;
  },

  // 待处理购物
  getPendingShopping() {
    return this.data.shopping.filter(s => s.status === 'received' || s.status === 'kept');
  },

  // 各状态购物数量
  getShoppingCounts() {
    const counts = { pending: 0, received: 0, kept: 0, returned: 0, recorded: 0 };
    this.data.shopping.forEach(s => {
      if (counts[s.status] !== undefined) counts[s.status]++;
    });
    return counts;
  },

  // 多月趋势（最近N月）
  getMonthTrends(months = 6) {
    const now = new Date();
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const summary = this.getMonthSummary(y, m);
      result.push({
        year: y,
        month: m,
        label: `${m}月`,
        income: summary.income,
        expense: summary.expense,
        balance: summary.balance
      });
    }
    return result;
  },

  // 待付款总额（先用后付）
  getUnpaidTotal() {
    let total = 0;
    this.data.accounts.forEach(a => {
      if (a.payStatus === 'unpaid' && a.type === 'expense') total += a.amount;
    });
    return total;
  },

  // 待付款列表
  getUnpaidAccounts() {
    return this.data.accounts.filter(a => a.payStatus === 'unpaid' && a.type === 'expense')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  },

  // 标记账目已付款
  markAccountPaid(id) {
    const acc = this.data.accounts.find(a => a.id === id);
    if (acc) {
      acc.payStatus = 'paid';
      acc.payDate = this.formatDate(new Date());
      this.save();
    }
    return acc;
  },

  // ============================================
  // 工具函数
  // ============================================
  formatDate(date) {
    if (typeof date === 'string') return date.slice(0, 10);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  formatMoney(num) {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },

  // 计算距离退货截止还有几天
  daysUntilDeadline(deadline) {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dl = new Date(deadline);
    dl.setHours(0, 0, 0, 0);
    const diff = dl - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  // ============================================
  // GitHub Gist 云同步（免费永久云备份）
  // ============================================
  cloud: {
    GIST_API: 'https://api.github.com/gists',
    GIST_FILENAME: 'rich_diary_backup.json',
    GIST_DESC: '富婆的财富日记 - 自动云备份',

    // 从 localStorage 读取 token 和 gistId
    getConfig() {
      return {
        token: localStorage.getItem('forest_ledger_gist_token') || '',
        gistId: localStorage.getItem('forest_ledger_gist_id') || '',
        autoSync: localStorage.getItem('forest_ledger_auto_sync') === '1',
        lastSync: parseInt(localStorage.getItem('forest_ledger_last_sync') || '0'),
      };
    },

    setConfig(updates) {
      if ('token' in updates) localStorage.setItem('forest_ledger_gist_token', updates.token);
      if ('gistId' in updates) localStorage.setItem('forest_ledger_gist_id', updates.gistId);
      if ('autoSync' in updates) localStorage.setItem('forest_ledger_auto_sync', updates.autoSync ? '1' : '0');
    },

    isConfigured() {
      const c = this.getConfig();
      return !!(c.token && c.gistId);
    },

    // 上传到 Gist
    async push() {
      const c = this.getConfig();
      if (!c.token) throw new Error('未配置 GitHub Token');
      const dataStr = DB.export();
      const body = {
        description: this.GIST_DESC,
        files: {
          [this.GIST_FILENAME]: { content: dataStr }
        }
      };
      let url = this.GIST_API;
      let method = 'POST';
      if (c.gistId) {
        url = this.GIST_API + '/' + c.gistId;
        method = 'PATCH';
      }
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': 'token ' + c.token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '同步失败 (' + res.status + ')');
      }
      const gist = await res.json();
      // 记住 gistId 供下次更新
      if (gist.id && !c.gistId) {
        this.setConfig({ gistId: gist.id });
      }
      localStorage.setItem('forest_ledger_last_sync', Date.now().toString());
      return { success: true, gistId: gist.id, time: Date.now() };
    },

    // 从 Gist 拉取
    async pull() {
      const c = this.getConfig();
      if (!c.token || !c.gistId) throw new Error('未配置云同步');
      const res = await fetch(this.GIST_API + '/' + c.gistId, {
        headers: { 'Authorization': 'token ' + c.token }
      });
      if (!res.ok) throw new Error('拉取失败 (' + res.status + ')');
      const gist = await res.json();
      const file = gist.files[this.GIST_FILENAME];
      if (!file) throw new Error('云端无备份数据');
      const data = JSON.parse(file.content);
      DB.data = DB.mergeDefaults(data);
      DB.save();
      localStorage.setItem('forest_ledger_last_sync', Date.now().toString());
      return { success: true, time: Date.now() };
    },

    // 自动查找云端的备份 Gist（换手机后只需填 Token，无需手动填 Gist ID）
    // 原理：列出账号下所有 Gist，找描述和文件名都匹配的那个
    async findGist() {
      const c = this.getConfig();
      if (!c.token) throw new Error('未配置 GitHub Token');
      const res = await fetch(this.GIST_API + '?per_page=100', {
        headers: { 'Authorization': 'token ' + c.token }
      });
      if (!res.ok) throw new Error('查询 Gist 失败 (' + res.status + ')，请检查 Token 是否正确');
      const gists = await res.json();
      const found = gists.find(g =>
        g.description === this.GIST_DESC && g.files && g.files[this.GIST_FILENAME]
      );
      if (!found) return null;
      // 自动记住 gistId，下次直接用
      this.setConfig({ gistId: found.id });
      return found.id;
    },

    // 自动同步（每次记账后调用）
    async autoSync() {
      const c = this.getConfig();
      if (!c.autoSync || !c.token) return;
      // 距离上次同步超过 10 分钟才同步
      if (Date.now() - c.lastSync < 10 * 60 * 1000) return;
      try {
        await this.push();
      } catch(e) {
        console.log('[Cloud] 自动同步失败:', e.message);
      }
    },
  },
};
