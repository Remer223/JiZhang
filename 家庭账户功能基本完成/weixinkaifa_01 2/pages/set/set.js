const BASE_URL = require('../../utils/config.js').BASE_URL;

Page({
  data: {
    // 用户信息
    avatar: "/pages/imag/default-avatar.png",
    nickname: "",
    phone: "",

    // 提醒功能
    remindOn: false,
    remindTime: "20:00",
  },

  onLoad() {
    this.loadRemindSetting();
  },

  onShow() {
    // 守卫：未登录则跳转登录页
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.user_id) {
      wx.redirectTo({ url: '/pages/userinfo/userinfo' });
      return;
    }
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    let user = wx.getStorageSync('userInfo') || {};
    // 先重置为默认，避免切换账号时残留上一个账号的数据
    this.setData({
      avatar: '/pages/imag/default-avatar.png',
      nickname: user.nickname || user.phone || '',
      phone: user.phone || ''
    });
    let avatarUrl = user.avatar || '';
    if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
      wx.downloadFile({
        url: BASE_URL + avatarUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            this.setData({ avatar: res.tempFilePath });
          }
        }
      });
    }
  },

  // 进入个人信息展示页
  goUserInfo() {
    wx.navigateTo({
      url: "/pages/info/info",
      fail: (err) => {
        console.error("跳转info失败：", err);
        wx.showToast({ title: '跳转失败: ' + (err.errMsg || ''), icon: 'none' });
      }
    });
  },

  // 加载提醒设置
  loadRemindSetting() {
    let setting = wx.getStorageSync('remindSetting');
    if (setting) {
      this.setData({
        remindOn: setting.on,
        remindTime: setting.time
      });
    }
  },

  // 开关提醒
  switchRemind(e) {
    let isOn = e.detail.value;
    this.setData({ remindOn: isOn });

    if (isOn) {
      this.openRemind();
    } else {
      this.closeRemind();
    }
  },

  // 设置提醒时间
  setTime(e) {
    this.setData({ remindTime: e.detail });
    this.saveRemind();
  },

  // 保存提醒设置
  saveRemind() {
    wx.setStorageSync('remindSetting', {
      on: this.data.remindOn,
      time: this.data.remindTime
    });
  },

  // 开启每日提醒
  openRemind() {
    this.saveRemind();
    wx.showToast({ title: '已开启每日记账提醒', icon: 'success' });
  },

  // 关闭提醒
  closeRemind() {
    this.saveRemind();
    wx.showToast({ title: '已关闭提醒', icon: 'none' });
  }
});