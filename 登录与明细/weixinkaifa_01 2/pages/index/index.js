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
    typeFilterList: [
      { label: '全部', value: 'all' },
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' }
    ],
    categoryFilterList: [
      { name: '全部', icon: '' }
    ],

    // ==================== 新增：删除确认弹窗 ====================
    showDeleteModal: false,
    deleteRecordId: null,
    deleteRecordInfo: null
  },

  onLoad() {
    // 初始化为当前年月，避免默认值过滤掉当月的记录
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
    // 守卫：未登录则跳转登录页
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.user_id) {
      wx.redirectTo({ url: '/pages/userinfo/userinfo' });
      return;
    }
    this.loadRecords();
  },

  // 初始化交易类型筛选列表
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

  // 获取完整的类型配置
  getTypeConfig() {
    const customTypes = wx.getStorageSync('customTypes') || [];
    const customConfig = {};
    
    customTypes.forEach(type => {
      customConfig[type.name] = {
        icon: type.icon,
        color: type.color
      };
    });
    
    return {
      ...this.data.baseTypeConfig,
      ...customConfig
    };
  },

  // 加载记录（带所有筛选）
  loadRecords() {
    const { currentYear, currentMonth, currentDay, filterType, filterCategory } = this.data;
    const userInfo = wx.getStorageSync('userInfo') || {};
    const typeConfig = this.getTypeConfig();
    let url = BASE_URL + '/account/list';
    if (userInfo.user_id) {
      url += '?user_id=' + userInfo.user_id;
    }

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log("✅ 后端返回数据：", res.data);
        let records = res.data || [];
        
        // 年月日筛选
        records = records.filter(item => {
          if (!item.createTime) return false;
          const date = new Date(item.createTime.replace(/-/g, '/'));
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();
          
          if (year !== currentYear) return false;
          if (month !== currentMonth) return false;
          if (currentDay && day !== currentDay) return false;
          
          return true;
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

        // 计算总收支
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
          
          groups[dateStr].records.push({
            ...item,
            typeName: item.category,
            typeIcon: config.icon,
            typeColor: config.color,
            time: item.createTime?.split(' ')[1]?.substring(0, 5) || ''
          });
          
          if (item.type === 1) groups[dateStr].dayExpense += item.amount;
          else groups[dateStr].dayIncome += item.amount;
        });

        const sortedGroups = Object.keys(groups)
          .sort((a, b) => new Date(b.replace(/-/g, '/')) - new Date(a.replace(/-/g, '/')))
          .map(date => ({ 
            dateText: this.formatDateText(date), 
            ...groups[date] 
          }));

        this.setData({
          totalExpense,
          totalIncome,
          recordGroups: sortedGroups
        });
        
        console.log("页面数据：", this.data.recordGroups);
      },
      fail: (err) => {
        console.error("❌ 连接后端失败：", err);
      }
    });
  },

  // 格式化日期显示
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

  // ==================== 新增：删除功能 ====================

  // 长按显示删除确认
  onLongPressRecord(e) {
    const { id, category, amount, type } = e.currentTarget.dataset;
    
    this.setData({
      showDeleteModal: true,
      deleteRecordId: id,
      deleteRecordInfo: {
        category,
        amount,
        type: type === 1 ? '支出' : '收入'
      }
    });
  },

  // 关闭删除弹窗
  closeDeleteModal() {
    this.setData({
      showDeleteModal: false,
      deleteRecordId: null,
      deleteRecordInfo: null
    });
  },

  // 确认删除
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
          this.loadRecords(); // 刷新列表
        } else {
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error("删除失败：", err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // ==================== 筛选功能 ====================

  openFilterModal() {
    this.initCategoryFilter();
    this.setData({ showFilterModal: true });
  },

  closeFilterModal() {
    this.setData({ showFilterModal: false });
  },

  preventClose() {
    // 阻止冒泡
  },

  selectTypeFilter(e) {
    this.setData({ filterType: e.currentTarget.dataset.value });
  },

  selectCategoryFilter(e) {
    this.setData({ filterCategory: e.currentTarget.dataset.name });
  },

  resetFilter() {
    this.setData({
      filterType: 'all',
      filterCategory: '全部'
    });
  },

  confirmFilter() {
    console.log("筛选条件：", {
      filterType: this.data.filterType,
      filterCategory: this.data.filterCategory
    });
    this.setData({ showFilterModal: false });
    this.loadRecords();
  },

  // 切换年份
  onYearChange(e) {
    const index = parseInt(e.detail.value);
    const year = 2000 + index;
    const monthText = this.data.currentDay ? this.data.currentMonth + '月' + this.data.currentDay + '日' : this.data.currentMonth + '月';
    this.setData({ 
      currentYear: year,
      currentYearIndex: index,
      currentMonthText: `${year}年${monthText}`
    });
    this.loadRecords();
  },

  // 切换月份
  onMonthChange(e) {
    const index = parseInt(e.detail.value);
    const month = index + 1;
    const dayText = this.data.currentDay ? this.data.currentDay + '日' : '';
    this.setData({ 
      currentMonth: month,
      currentMonthIndex: index,
      currentMonthText: `${this.data.currentYear}年${month}月${dayText}`
    });
    this.loadRecords();
  },

  // 切换日期
  onDayChange(e) {
    const index = parseInt(e.detail.value);
    const day = index === 0 ? null : index;
    const dayText = day ? day + '日' : '';
    this.setData({ 
      currentDay: day,
      currentDayIndex: index,
      currentMonthText: `${this.data.currentYear}年${this.data.currentMonth}月${dayText}`
    });
    this.loadRecords();
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  }
});