// index.js
const BASE_URL = require('../../utils/config.js').BASE_URL;

Page({
  data: {
    // 筛选相关
    currentYear: 2026,
    currentYearIndex: 26,
    currentMonth: 5,
    currentMonthIndex: 4,
    currentDay: null,
    currentDayIndex: 0,

    // 筛选选项
    yearList: Array.from({ length: 36 }, (_, i) => (2000 + i) + '年'),
    monthList: Array.from({ length: 12 }, (_, i) => (i + 1) + '月'),
    dayList: ['全部', ...Array.from({ length: 31 }, (_, i) => (i + 1) + '日')],

    // 显示文本
    currentMonthText: '2026年5月',

    // 统计数据
    totalExpense: 0,
    totalIncome: 0,
    recordGroups: [],

    // 基础类型配置
    baseTypeConfig: {
      '餐饮': { icon: '🍜', color: '#07c160' },
      '购物': { icon: '🛍️', color: '#ff976a' },
      '教育': { icon: '🎓', color: '#1890ff' },
      '交通': { icon: '🚇', color: '#722ed1' },
      '工资': { icon: '💰', color: '#52c41a' }
    },

    // 弹窗筛选
    showFilterModal: false,
    filterType: 'all',
    filterCategory: '全部',
    filterMemberId: 0,        // 0=全部成员
    typeFilterList: [
      { label: '全部', value: 'all' },
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' }
    ],
    categoryFilterList: [
      { name: '全部', icon: '' }
    ],

    // 家庭相关
    myFamilyId: null,
    familyMemberList: [],    // [{userId, nickname, role}]
    isInFamily: false,

    // 删除确认弹窗
    showDeleteModal: false,
    deleteRecordId: null,
    deleteRecordInfo: null
  },

  onLoad() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    this.setData({
      currentYear: year,
      currentYearIndex: year - 2000,
      currentMonth: month,
      currentMonthIndex: month - 1,
      currentMonthText: `${year}年${month}月`
    });
    this.initCategoryFilter();
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.user_id) {
      wx.redirectTo({ url: '/pages/userinfo/userinfo' });
      return;
    }
    // 先加载家庭信息，再加载记录（确保familyId已就绪）
    this.loadFamilyInfo(() => {
      this.loadRecords();
    });
  },

  // ========== 家庭信息 ==========

  loadFamilyInfo(callback) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/my?userId=' + userInfo.user_id,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.code === 200 && res.data.data.hasFamily) {
          const data = res.data.data;
          // ★ 只有审批通过才显示共享数据，pending只能看自己的
          if (data.isApproved) {
            const approvedMembers = (data.members || []).filter(m => m.approved);
            const memberList = approvedMembers.map(m => ({
              userId: m.user_id,
              nickname: m.nickname || ('用户' + m.user_id),
              role: m.role
            }));
            this.setData({
              myFamilyId: data.family.id,
              isInFamily: true,
              familyMemberList: memberList,
              filterMemberId: 0
            });
          } else {
            // pending状态：不算在家庭中，只看个人数据
            this.setData({
              myFamilyId: null,
              isInFamily: false,
              familyMemberList: [],
              filterMemberId: 0
            });
          }
        } else {
          this.setData({
            myFamilyId: null,
            isInFamily: false,
            familyMemberList: [],
            filterMemberId: 0
          });
        }
        if (callback) callback();
      },
      fail: () => {
        if (callback) callback();
      }
    });
  },

  // ========== 类型配置 ==========

  initCategoryFilter() {
    const customTypes = wx.getStorageSync('customTypes') || [];
    const baseTypes = [
      { name: '餐饮', icon: '🍜' },
      { name: '购物', icon: '🛍️' },
      { name: '教育', icon: '🎓' },
      { name: '交通', icon: '🚇' },
      { name: '工资', icon: '💰' }
    ];
    const allTypes = [
      { name: '全部', icon: '' },
      ...baseTypes,
      ...customTypes.map(t => ({ name: t.name, icon: t.icon }))
    ];
    this.setData({ categoryFilterList: allTypes });
  },

  getTypeConfig() {
    const customTypes = wx.getStorageSync('customTypes') || [];
    const customConfig = {};
    customTypes.forEach(type => {
      customConfig[type.name] = { icon: type.icon, color: type.color };
    });
    return { ...this.data.baseTypeConfig, ...customConfig };
  },

  // ========== 加载账单（核心：家庭数据共享） ==========

  loadRecords() {
    const { currentYear, currentMonth, currentDay, filterType, filterCategory, filterMemberId, myFamilyId, isInFamily } = this.data;
    const userInfo = wx.getStorageSync('userInfo') || {};
    const typeConfig = this.getTypeConfig();

    let url = BASE_URL + '/account/list';
    let params = [];

    if (isInFamily && myFamilyId) {
      // ★ 在家庭中 → 查家庭所有成员的共享数据
      params.push('family_id=' + myFamilyId);
      if (filterMemberId && filterMemberId !== 0) {
        // 筛选具体某个成员
        params.push('member_user_id=' + filterMemberId);
      }
    } else if (userInfo.user_id) {
      // 没家庭 → 查自己的个人数据
      params.push('user_id=' + userInfo.user_id);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log("✅ 后端返回数据：", res.data);
        let records = res.data || [];

        if (!Array.isArray(records)) {
          console.error("❌ 后端返回异常数据：", records);
          records = [];
        }

        // 年月日筛选
        records = records.filter(item => {
          if (!item.createTime) return false;
          const date = new Date(item.createTime.replace(/-/g, '/'));
          return date.getFullYear() === currentYear
              && (date.getMonth() + 1) === currentMonth
              && (!currentDay || date.getDate() === currentDay);
        });

        // 收支类型筛选
        if (filterType !== 'all') {
          records = records.filter(item => {
            if (filterType === 'expense') return item.type === 1;
            if (filterType === 'income') return item.type === 2;
            return true;
          });
        }

        // 交易类型筛选
        if (filterCategory !== '全部') {
          records = records.filter(item => item.category === filterCategory);
        }

        // 计算总收支 + 分组
        let totalExpense = 0, totalIncome = 0;
        const groups = {};

        records.forEach(item => {
          if (item.type === 1) totalExpense += item.amount;
          else if (item.type === 2) totalIncome += item.amount;

          const dateStr = item.createTime.split(' ')[0];
          if (!groups[dateStr]) {
            groups[dateStr] = { records: [], dayExpense: 0, dayIncome: 0 };
          }

          const config = typeConfig[item.category] || { icon: '📄', color: '#999' };

          // ★ 拼接数据来源标签：昵称(角色)
          let sourceTag = '';
          if (item.role) {
            sourceTag = (item.nickname || '') + '(' + item.role + ')';
          }

          groups[dateStr].records.push({
            ...item,
            typeName: item.category,
            typeIcon: config.icon,
            typeColor: config.color,
            sourceTag: sourceTag,
            time: (item.createTime || '').split(' ')[1]?.substring(0, 5) || ''
          });

          if (item.type === 1) groups[dateStr].dayExpense += item.amount;
          else groups[dateStr].dayIncome += item.amount;
        });

        const sortedGroups = Object.keys(groups)
          .sort((a, b) => new Date(b.replace(/-/g, '/')) - new Date(a.replace(/-/g, '/')))
          .map(date => ({ dateText: this.formatDateText(date), ...groups[date] }));

        this.setData({
          totalExpense: totalExpense.toFixed(2),
          totalIncome: totalIncome.toFixed(2),
          recordGroups: sortedGroups
        });
      },
      fail: (err) => {
        console.error("❌ 连接后端失败：", err);
      }
    });
  },

  // ========== 日期格式化 ==========

  formatDateText(dateStr) {
    const date = new Date(dateStr.replace(/-/g, '/'));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    let prefix = '';
    if (date.toDateString() === today.toDateString()) prefix = '今天 ';
    else if (date.toDateString() === yesterday.toDateString()) prefix = '昨天 ';
    return `${prefix}${month}/${day} 周${weekDay}`;
  },

  // ========== 删除 ==========

  onLongPressRecord(e) {
    const { id, category, amount, type } = e.currentTarget.dataset;
    this.setData({
      showDeleteModal: true,
      deleteRecordId: id,
      deleteRecordInfo: { category, amount, type: type === 1 ? '支出' : '收入' }
    });
  },

  closeDeleteModal() {
    this.setData({ showDeleteModal: false, deleteRecordId: null, deleteRecordInfo: null });
  },

  confirmDelete() {
    const { deleteRecordId } = this.data;
    if (!deleteRecordId) return;
    wx.request({
      url: BASE_URL + '/account/delete/' + deleteRecordId,
      method: 'DELETE',
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.closeDeleteModal();
          this.loadRecords();
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
  },

  // ========== 筛选弹窗 ==========

  openFilterModal() {
    this.initCategoryFilter();
    this.setData({ showFilterModal: true });
  },

  closeFilterModal() {
    this.setData({ showFilterModal: false });
  },

  preventClose() {},

  selectTypeFilter(e) {
    this.setData({ filterType: e.currentTarget.dataset.value });
  },

  selectCategoryFilter(e) {
    this.setData({ filterCategory: e.currentTarget.dataset.name });
  },

  selectMemberFilter(e) {
    this.setData({ filterMemberId: parseInt(e.currentTarget.dataset.userid) || 0 });
  },

  resetFilter() {
    this.setData({
      filterType: 'all',
      filterCategory: '全部',
      filterMemberId: 0
    });
  },

  confirmFilter() {
    this.setData({ showFilterModal: false });
    this.loadRecords();
  },

  // ========== 年月日切换 ==========

  onYearChange(e) {
    const index = parseInt(e.detail.value);
    const year = 2000 + index;
    this.setData({ currentYear: year, currentYearIndex: index });
    this.updateMonthText();
    this.loadRecords();
  },

  onMonthChange(e) {
    const index = parseInt(e.detail.value);
    const month = index + 1;
    this.setData({ currentMonth: month, currentMonthIndex: index });
    this.updateMonthText();
    this.loadRecords();
  },

  onDayChange(e) {
    const index = parseInt(e.detail.value);
    const day = index === 0 ? null : index;
    this.setData({ currentDay: day, currentDayIndex: index });
    this.updateMonthText();
    this.loadRecords();
  },

  updateMonthText() {
    const { currentYear, currentMonth, currentDay } = this.data;
    let text = `${currentYear}年${currentMonth}月`;
    if (currentDay) text += currentDay + '日';
    this.setData({ currentMonthText: text });
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  }
});
