const BASE_URL = require('../../utils/config.js').BASE_URL;

Page({
  data: {
    totalExpense: 0,
    totalIncome: 0,
    expenseTypeStats: [],
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    
    // 年月选择器
    yearList: Array.from({ length: 36 }, (_, i) => (2000 + i) + '年'),
    monthList: Array.from({ length: 12 }, (_, i) => (i + 1) + '月'),
    currentYearIndex: new Date().getFullYear() - 2000,
    currentMonthIndex: new Date().getMonth(),
    
    // 饼图数据（用于CSS绘制）
    pieData: [],
    
    // 柱状图数据
    barDays: [],
    barExpenseData: [],
    barIncomeData: [],
    
    baseTypeConfig: {
      '餐饮': { icon: '🍜', color: '#07c160' },
      '购物': { icon: '🛍️', color: '#ff976a' },
      '教育': { icon: '🎓', color: '#1890ff' },
      '交通': { icon: '🚇', color: '#722ed1' },
      '工资': { icon: '💰', color: '#52c41a' }
    }
  },

  onLoad() {
    // 数据在 onShow 里加载
  },

  onShow() {
    // 守卫：未登录则跳转登录页
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.user_id) {
      wx.redirectTo({ url: '/pages/userinfo/userinfo' });
      return;
    }
    this.loadStats();
  },

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

  // 切换年份
  onYearChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      currentYear: 2000 + index,
      currentYearIndex: index
    });
    this.loadStats();
  },

  // 切换月份
  onMonthChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      currentMonth: index + 1,
      currentMonthIndex: index
    });
    this.loadStats();
  },

  loadStats() {
    const { currentYear, currentMonth } = this.data;
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
        
        // 筛选当前年月
        records = records.filter(item => {
          if (!item.createTime) return false;
          const date = new Date(item.createTime.replace(/-/g, '/'));
          return date.getFullYear() === currentYear && 
                 (date.getMonth() + 1) === currentMonth;
        });

        let totalExpense = 0;
        let totalIncome = 0;
        const typeMap = {};
        const dailyExpense = {};
        const dailyIncome = {};

        records.forEach(item => {
          const date = new Date(item.createTime.replace(/-/g, '/'));
          const day = date.getDate();

          if (item.type === 1) {
            totalExpense += item.amount;
            if (typeMap[item.category]) {
              typeMap[item.category] += item.amount;
            } else {
              typeMap[item.category] = item.amount;
            }
            if (dailyExpense[day]) {
              dailyExpense[day] += item.amount;
            } else {
              dailyExpense[day] = item.amount;
            }
          } else if (item.type === 2) {
            totalIncome += item.amount;
            if (dailyIncome[day]) {
              dailyIncome[day] += item.amount;
            } else {
              dailyIncome[day] = item.amount;
            }
          }
        });

        // 生成饼图数据（用于CSS环形图）
        const pieData = [];
        let currentPercent = 0;
        const total = totalExpense || 1; // 避免除以0
        
        Object.keys(typeMap).forEach((category, index) => {
          const amount = typeMap[category];
          const percent = ((amount / total) * 100).toFixed(1);
          const config = typeConfig[category] || { color: '#999' };
          
          pieData.push({
            name: category,
            amount: amount.toFixed(2),
            percent: percent,
            color: config.color,
            startPercent: currentPercent,
            endPercent: currentPercent + parseFloat(percent)
          });
          
          currentPercent += parseFloat(percent);
        });

        // 生成柱状图数据
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const barDays = [];
        const barExpenseData = [];
        const barIncomeData = [];
        let maxAmount = 0;

        for (let i = 1; i <= daysInMonth; i++) {
          barDays.push(i);
          const exp = dailyExpense[i] || 0;
          const inc = dailyIncome[i] || 0;
          barExpenseData.push(exp.toFixed(2));
          barIncomeData.push(inc.toFixed(2));
          if (exp > maxAmount) maxAmount = exp;
          if (inc > maxAmount) maxAmount = inc;
        }

        // 生成列表数据
        const expenseTypeStats = Object.keys(typeMap).map(category => {
          const amount = typeMap[category];
          const config = typeConfig[category] || { icon: '📄', color: '#999' };
          
          return {
            type: category,
            icon: config.icon,
            color: config.color,
            amount: amount.toFixed(2),
            percent: totalExpense ? ((amount / totalExpense) * 100).toFixed(1) : 0
          };
        });

        expenseTypeStats.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

        this.setData({
          totalExpense: totalExpense.toFixed(2),
          totalIncome: totalIncome.toFixed(2),
          pieData,
          barDays,
          barExpenseData,
          barIncomeData,
          maxBarAmount: maxAmount || 1,
          expenseTypeStats
        });
      },
      fail: (err) => {
        console.error("❌ 连接后端失败：", err);
        wx.showToast({ title: '数据加载失败', icon: 'none' });
      }
    });
  }
});