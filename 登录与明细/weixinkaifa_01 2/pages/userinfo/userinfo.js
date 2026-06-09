const BASE_URL = require('../../utils/config.js').BASE_URL;

// 标题映射
const TITLE_MAP = { login: '登录', register: '注册', edit: '个人信息' };

Page({
  data: {
    mode: 'login',
    userId: null,
    avatar: '',
    avatarChanged: false,
    phone: '',
    nickname: '',
    password: ''
  },

  onLoad(options) {
    const user = wx.getStorageSync('userInfo') || {};
    // options.mode 可从 navigateTo 传入：register | edit
    const fromMode = options.mode;
    const isEdit = fromMode === 'edit' || (!!user.user_id && fromMode !== 'register');

    if (isEdit) {
      let avatar = user.avatar || '';
      if (avatar && avatar.startsWith('/uploads/')) {
        const fullUrl = BASE_URL + avatar;
        wx.downloadFile({
          url: fullUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              this.setData({ avatar: res.tempFilePath });
            }
          }
        });
      }
      this.setData({
        mode: 'edit',
        userId: user.user_id || null,
        avatar: avatar,
        phone: user.phone || '',
        nickname: user.nickname || '',
        password: ''
      });
      this.setNavTitle('edit');
    } else if (fromMode === 'register') {
      // navigateTo 进来的注册页
      this.setData({
        mode: 'register',
        phone: '',
        nickname: '',
        password: ''
      });
      this.setNavTitle('register');
    } else {
      // 默认登录页
      this.setData({
        mode: 'login',
        phone: '',
        nickname: '',
        password: ''
      });
      this.setNavTitle('login');
    }
  },

  // 根据 mode 动态设置导航栏标题
  setNavTitle(mode) {
    wx.setNavigationBarTitle({ title: TITLE_MAP[mode] || '记账本' });
  },

  // 切换到注册 → push 新页面，返回时自然回到登录页
  switchToRegister() {
    wx.navigateTo({ url: '/pages/userinfo/userinfo?mode=register' });
  },

  // 切换到登录 → 就是系统返回，和左上角返回一个效果
  switchToLogin() {
    wx.navigateBack();
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ avatar: res.tempFiles[0].tempFilePath, avatarChanged: true });
      },
      fail: (err) => {
        console.log('选择图片失败', err);
      }
    });
  },

  inputPhone(e) {
    this.setData({ phone: e.detail.value });
  },

  inputNickname(e) {
    this.setData({ nickname: e.detail.value });
  },

  inputPassword(e) {
    this.setData({ password: e.detail.value });
  },

  // 登录
  login() {
    const { phone, password } = this.data;

    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    wx.request({
      url: BASE_URL + '/user/login',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { phone: phone, password: password },
      success: (res) => {
        if (res.data.code === 200) {
          const userData = res.data.data || {};
          let avatarPath = userData.avatar || '';
          wx.setStorageSync('userInfo', {
            user_id: userData.user_id,
            phone: userData.phone || phone,
            nickname: userData.nickname || '',
            avatar: avatarPath
          });
          wx.showToast({ title: '登录成功', icon: 'success' });
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' });
          }, 800);
        } else {
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请检查后端是否启动', icon: 'none' });
      }
    });
  },

  // 注册
  doRegister() {
    const { phone, nickname, password } = this.data;

    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }

    wx.request({
      url: BASE_URL + '/user/register',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { phone: phone, nickname: nickname, password: password },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '注册成功，请登录', icon: 'success' });
          // 注册成功 → 返回登录页
          setTimeout(() => wx.navigateBack(), 1000);
        } else {
          wx.showToast({ title: res.data.message || '注册失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请检查后端是否启动', icon: 'none' });
      }
    });
  },

  // 编辑资料 —— 有头像变更先上传
  submit() {
    const { avatar } = this.data;
    if (this.data.avatarChanged && avatar) {
      this.uploadAvatar((avatarUrl) => {
        this.setData({ avatar: avatarUrl });
        this.saveProfile(avatarUrl);
      });
    } else {
      this.saveProfile(this.data.avatar);
    }
  },

  uploadAvatar(callback) {
    wx.uploadFile({
      url: BASE_URL + '/upload/avatar',
      filePath: this.data.avatar,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.code === 200) {
          callback(data.data);
        } else {
          wx.showToast({ title: '头像上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '头像上传失败', icon: 'none' });
      }
    });
  },

  saveProfile(avatarUrl) {
    const { userId, nickname } = this.data;
    let avatarPath = avatarUrl || '';
    if (avatarPath && avatarPath.startsWith(BASE_URL)) {
      avatarPath = avatarPath.substring(BASE_URL.length);
    }

    wx.request({
      url: BASE_URL + '/user/profile',
      method: 'PUT',
      header: { 'content-type': 'application/json' },
      data: { user_id: userId, nickname: nickname, avatar: avatarPath },
      success: (res) => {
        if (res.data.code === 200) {
          const user = wx.getStorageSync('userInfo') || {};
          user.nickname = nickname;
          user.avatar = avatarPath;
          wx.setStorageSync('userInfo', user);
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        } else {
          wx.showToast({ title: res.data.message || '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  goToResetPassword() {
    wx.navigateTo({ url: '/pages/reset-password/reset-password' });
  }
});
