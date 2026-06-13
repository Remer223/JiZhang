const BASE_URL = require('../../utils/config.js').BASE_URL;

Page({
  data: {
    phone: '',
    captchaKey: '',
    captchaImage: '',
    captcha: '',
    newPassword: ''
  },

  onLoad() {
    this.getCaptcha();
  },

  inputPhone(e) {
    this.setData({ phone: e.detail.value });
  },

  inputCaptcha(e) {
    this.setData({ captcha: e.detail.value });
  },

  inputNewPassword(e) {
    this.setData({ newPassword: e.detail.value });
  },

  getCaptcha() {
    const that = this;
    wx.request({
      url: BASE_URL + '/user/captcha',
      method: 'GET',
      success(res) {
        if (res.data.code === 200) {
          that.setData({
            captchaKey: res.data.data.key,
            captchaImage: res.data.data.image
          });
        } else {
          wx.showToast({ title: '获取验证码失败', icon: 'none' });
        }
      },
      fail() {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  submitReset() {
    const { phone, captchaKey, captcha, newPassword } = this.data;

    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (!captcha) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }
    if (!newPassword) {
      wx.showToast({ title: '请输入新密码', icon: 'none' });
      return;
    }
    if (newPassword.length < 6) {
      wx.showToast({ title: '密码长度不能少于6位', icon: 'none' });
      return;
    }

    const that = this;
    wx.request({
      url: BASE_URL + '/user/reset-password',
      method: 'POST',
      data: {
        phone: phone,
        captchaKey: captchaKey,
        captcha: captcha,
        newPassword: newPassword
      },
      success(res) {
        if (res.data.code === 200) {
          wx.showToast({ title: '密码重置成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' });
          // refresh captcha on failure
          that.getCaptcha();
        }
      },
      fail() {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  }
});
