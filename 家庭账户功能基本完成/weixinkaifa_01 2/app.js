// app.js
App({
  onLaunch() {
    // 不在这里重定向 —— 由各个 tab 页面在 onShow 时检查登录状态
    // 因为 wx.redirectTo 从 tab 页面跳非 tab 页面后，用户按返回会退回到
    // 未登录的 tab 页面，导致数据泄露。
  },
  globalData: {
    userInfo: null
  }
})
