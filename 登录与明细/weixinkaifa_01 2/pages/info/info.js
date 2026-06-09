const BASE_URL = require('../../utils/config.js').BASE_URL;

Page({
  data: {
    avatar: '',
    nickname: '',
    phone: ''
  },

  onLoad() {
    this.loadUser();
  },

  onShow() {
    this.loadUser();
  },

  loadUser() {
    const user = wx.getStorageSync('userInfo') || {};
    
    this.setData({
      avatar: '',
      nickname: user.nickname || '未设置',
      phone: user.phone || ''
    });
    let avatarUrl = user.avatar || '';
    if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
      avatarUrl = BASE_URL + avatarUrl;
      wx.downloadFile({
        url: avatarUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            this.setData({ avatar: res.tempFilePath });
          }
        }
      });
    }
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/userinfo/userinfo?mode=edit' });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.redirectTo({ url: '/pages/userinfo/userinfo' });
        }
      }
    });
  }
});