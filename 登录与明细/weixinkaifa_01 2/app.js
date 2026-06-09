// app.js
App({
  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.phone) {
      wx.redirectTo({ url: '/pages/userinfo/userinfo' });
    }
  },
  globalData: {
    userInfo: null
  }
})
