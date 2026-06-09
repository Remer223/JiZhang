const BASE_URL = require('../../utils/config.js').BASE_URL;

Page({
  data: {
    currentTab: '支出',
    amount: '',
    currentTypeId: null,
    typeList: [
      { id: 1, name: "餐饮", icon: "🍜", color: "#07c160", category: "支出" },
      { id: 2, name: "购物", icon: "🛍️", color: "#ff976a", category: "支出" },
      { id: 3, name: "教育", icon: "🎓", color: "#1890ff", category: "支出" },
      { id: 4, name: "交通", icon: "🚇", color: "#722ed1", category: "支出" },
      { id: 5, name: "工资", icon: "💰", color: "#52c41a", category: "收入" }
    ],
    remark: '',
    canSubmit: false,
    showCustomModal: false,
    customName: '',
    customIcon: '',
    customColor: '#07c160',
    showDeleteMode: false,
    deleteConfirmId: null,

    // 点击检测（scroll-view 处理滚动，我们只判断 tap vs swipe）
    _touchStartX: 0,
    _touchStartY: 0
  },

  onLoad() {
    this.loadCustomTypes();
  },

  onShow() {
    this.loadCustomTypes();
  },

  // 加载自定义类型
  loadCustomTypes() {
    const customTypes = wx.getStorageSync('customTypes') || [];
    const baseTypes = [
      { id: 1, name: "餐饮", icon: "🍜", color: "#07c160", category: "支出" },
      { id: 2, name: "购物", icon: "🛍️", color: "#ff976a", category: "支出" },
      { id: 3, name: "教育", icon: "🎓", color: "#1890ff", category: "支出" },
      { id: 4, name: "交通", icon: "🚇", color: "#722ed1", category: "支出" },
      { id: 5, name: "工资", icon: "💰", color: "#52c41a", category: "收入" }
    ];
    const markedCustomTypes = customTypes.map(t => ({ ...t, isCustom: true }));
    this.setData({
      typeList: [...baseTypes, ...markedCustomTypes]
    });
  },

  // 切换支出/收入
  switchType(e) {
    this.setData({
      currentTab: e.currentTarget.dataset.type,
      currentTypeId: null,
      canSubmit: false
    });
  },

  // ==================== 金额输入 ====================

  inputAmount(e) {
    let value = e.detail.value;
    value = value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    if (value.startsWith('0') && value.length > 1 && value[1] !== '.') {
      value = value.replace(/^0+/, '0');
    }
    this.setData({ amount: value });
    this.checkSubmit();
    return value;
  },

  checkSubmit() {
    const { amount, currentTypeId } = this.data;
    const numAmount = parseFloat(amount);
    this.setData({
      canSubmit: amount && numAmount > 0 && !!currentTypeId
    });
  },

  // ==================== 点击检测 ====================
  // scroll-view 自己处理滚动。这里只记下 touchstart 的位置，
  // touchend 时判断位移 < 阈值 → 点击 → 坐标反算 item

  onTouchStart(e) {
    this.data._touchStartX = e.touches[0].clientX;
    this.data._touchStartY = e.touches[0].clientY;
  },

  onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - this.data._touchStartX;
    const dy = e.changedTouches[0].clientY - this.data._touchStartY;
    const moved = Math.sqrt(dx * dx + dy * dy);
    if (moved < 10) {
      this._dispatchTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  },

  _dispatchTap(clientX, clientY) {
    const query = wx.createSelectorQuery().in(this);
    query.select('.type-scroll').boundingClientRect();
    query.exec((rects) => {
      if (!rects || !rects[0]) return;
      const rect = rects[0];
      const ratio = 750 / wx.getSystemInfoSync().windowWidth;
      // 相对 scroll-view 左边缘的 rpx 偏移
      const relRpx = (clientX - rect.left) * ratio;
      // 每个 item: 140rpx 宽 + 20rpx 间距 + 左边距 30rpx
      if (relRpx < 30) return; // 左边距区域
      const idx = Math.floor((relRpx - 30) / 160);
      if (idx >= 0 && idx < this.data.typeList.length) {
        const item = this.data.typeList[idx];
        this.onTypeTap(item.id);
      }
    });
  },

  // ==================== 类型交互 ====================

  onTypeTap(id) {
    const item = this.data.typeList.find(t => t.id === id);
    if (!item) return;
    if (this.data.showDeleteMode && item.isCustom) {
      this.setData({ deleteConfirmId: id });
    } else {
      this.setData({ currentTypeId: id });
      this.checkSubmit();
    }
  },

  // ==================== 删除自定义类型 ====================

  toggleDeleteMode() {
    this.setData({
      showDeleteMode: !this.data.showDeleteMode,
      deleteConfirmId: null
    });
  },

  onDeleteType(e) {
    const id = e.currentTarget.dataset.id;
    const type = this.data.typeList.find(t => t.id === id);
    if (!type || !type.isCustom) {
      wx.showToast({ title: '基础类型不能删除', icon: 'none' });
      return;
    }
    this.setData({ deleteConfirmId: id });
  },

  confirmDelete(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    let customTypes = wx.getStorageSync('customTypes') || [];
    customTypes = customTypes.filter(t => t.id !== id);
    wx.setStorageSync('customTypes', customTypes);

    const baseTypes = [
      { id: 1, name: "餐饮", icon: "🍜", color: "#07c160", category: "支出" },
      { id: 2, name: "购物", icon: "🛍️", color: "#ff976a", category: "支出" },
      { id: 3, name: "教育", icon: "🎓", color: "#1890ff", category: "支出" },
      { id: 4, name: "交通", icon: "🚇", color: "#722ed1", category: "支出" },
      { id: 5, name: "工资", icon: "💰", color: "#52c41a", category: "收入" }
    ];
    const newList = [...baseTypes, ...customTypes.map(t => ({ ...t, isCustom: true }))];

    let update = {
      deleteConfirmId: null,
      typeList: newList
    };
    if (this.data.currentTypeId === id) {
      update.currentTypeId = null;
      update.canSubmit = false;
    }
    this.setData(update);
    wx.showToast({ title: '删除成功', icon: 'success' });
  },

  cancelDelete() {
    this.setData({ deleteConfirmId: null });
  },

  // ==================== 保存记录 ====================

  submitRecord() {
    if (!this.data.canSubmit) return;

    const { currentTab, amount, currentTypeId, typeList, remark } = this.data;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    const type = typeList.find(item => item.id === currentTypeId);
    const userInfo = wx.getStorageSync('userInfo') || {};

    wx.request({
      url: BASE_URL + "/account/add",
      method: "POST",
      data: {
        user_id: userInfo.user_id,
        type: currentTab === '支出' ? 1 : 2,
        amount: numAmount,
        category: type.name,
        remark: remark || ''
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '记账成功', icon: 'success' });
          setTimeout(() => wx.navigateBack({ delta: 1 }), 1000);
        } else {
          wx.showToast({ title: res.data.message || '记账失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '提交失败', icon: 'none' });
      }
    });
  },

  // ==================== 备注 ====================

  inputRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  // ==================== 自定义弹窗 ====================

  openCustomModal() {
    this.setData({ showCustomModal: true, customName: '', customIcon: '', customColor: '#07c160' });
  },

  closeCustomModal() {
    this.setData({ showCustomModal: false });
  },

  preventClose() {},

  inputCustomName(e) { this.setData({ customName: e.detail.value }); },
  inputCustomIcon(e) { this.setData({ customIcon: e.detail.value }); },
  inputCustomColor(e) { this.setData({ customColor: e.detail.value }); },

  saveCustomType() {
    const { customName, customIcon, customColor, currentTab } = this.data;
    if (!customName || !customIcon) {
      wx.showToast({ title: '请完善信息', icon: 'none' });
      return;
    }

    const newType = {
      id: Date.now(),
      name: customName,
      icon: customIcon,
      color: customColor,
      category: currentTab
    };

    let customTypes = wx.getStorageSync('customTypes') || [];
    customTypes.push(newType);
    wx.setStorageSync('customTypes', customTypes);

    this.loadCustomTypes();
    this.setData({ currentTypeId: newType.id, showCustomModal: false });
    this.checkSubmit();
  }
});
