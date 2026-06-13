const BASE_URL = require('../../utils/config.js').BASE_URL;

Page({
  data: {
    // 家庭状态
    hasFamily: false,
    isApproved: false,
    isRejected: false,
    isCreator: false,
    family: null,
    members: [],
    myRole: '',

    // 创建家庭
    showCreateModal: false,
    familyName: '',
    createRole: '',

    // 加入家庭
    showJoinModal: false,
    searchKeyword: '',
    familyList: [],
    searchEmpty: false,       // 没结果
    selectedFamilyId: null,
    joinRole: '',

    // 解散确认
    showDissolveModal: false,

    // 退出确认
    showLeaveModal: false,

    // 未通过提示（只弹一次）
    showNotYetApprovedModal: false
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.user_id) {
      wx.redirectTo({ url: '/pages/userinfo/userinfo' });
      return;
    }
    this.loadMyFamily();
  },

  // 加载我的家庭信息
  loadMyFamily() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/my?userId=' + userInfo.user_id,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const data = res.data.data;
          // 过滤掉被拒绝的成员（兼容 null / true / 1）
          const members = (data.members || []).filter(m => !m.rejected && m.rejected !== 1);

          const approved = data.isApproved || false;

          this.setData({
            hasFamily: data.hasFamily,
            isApproved: approved,
            isRejected: data.isRejected || false,
            isCreator: data.isCreator || false,
            family: data.family,
            members: members,
            myRole: data.myRole || ''
          });

          if (approved) {
            this.downloadMemberAvatars(members);
          }

          // 被拒绝 → 弹一次说明（每人每家只弹一次）
          if (data.hasFamily && data.isRejected) {
            const key = 'rejected_notice_' + userInfo.user_id + '_' + (data.family ? data.family.id : '0');
            const alreadyShown = wx.getStorageSync(key);
            if (!alreadyShown) {
              this.setData({ showNotYetApprovedModal: true });
            }
          }
        }
      },
      fail: (err) => {
        console.error('加载家庭信息失败：', err);
      }
    });
  },

  // 下载成员头像（把相对路径转为本地临时路径）
  downloadMemberAvatars(members) {
    const defaultAvatar = '/pages/imag/default-avatar.png';
    let completed = 0;

    members.forEach((member, index) => {
      const avatarUrl = member.avatar || '';
      if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
        wx.downloadFile({
          url: BASE_URL + avatarUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              this.setData({ ['members[' + index + '].avatar']: res.tempFilePath });
            } else {
              this.setData({ ['members[' + index + '].avatar']: defaultAvatar });
            }
          },
          fail: () => {
            this.setData({ ['members[' + index + '].avatar']: defaultAvatar });
          },
          complete: () => {
            completed++;
          }
        });
      } else {
        // 没有头像或不是/uploads开头，用默认图
        this.setData({ ['members[' + index + '].avatar']: defaultAvatar });
        completed++;
      }
    });
  },

  // ========== 创建家庭 ==========
  openCreateModal() {
    this.setData({ showCreateModal: true, familyName: '', createRole: '' });
  },

  closeCreateModal() {
    this.setData({ showCreateModal: false });
  },

  inputFamilyName(e) {
    this.setData({ familyName: e.detail.value });
  },

  inputCreateRole(e) {
    this.setData({ createRole: e.detail.value });
  },

  submitCreate() {
    const { familyName, createRole } = this.data;
    if (!familyName.trim()) {
      wx.showToast({ title: '请输入家庭名称', icon: 'none' });
      return;
    }
    if (!createRole.trim()) {
      wx.showToast({ title: '请输入你在家庭中的角色（如：爸爸、妈妈）', icon: 'none' });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/create',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        userId: userInfo.user_id,
        familyName: familyName.trim(),
        role: createRole.trim()
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '家庭创建成功', icon: 'success' });
          this.closeCreateModal();
          this.loadMyFamily();
        } else {
          wx.showToast({ title: res.data.message || '创建失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // ========== 加入家庭（搜索模式） ==========
  openJoinModal() {
    this.setData({
      showJoinModal: true,
      joinRole: '',
      searchKeyword: '',
      selectedFamilyId: null,
      familyList: [],
      searchEmpty: false
    });
  },

  closeJoinModal() {
    this.setData({ showJoinModal: false });
  },

  // 输入搜索关键词（带防抖：300ms内没继续输入才请求）
  inputSearchKeyword(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword, selectedFamilyId: null });

    // 清空时直接清列表
    if (!keyword.trim()) {
      this.setData({ familyList: [], searchEmpty: false });
      return;
    }

    // 防抖
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.searchFamily(keyword.trim());
    }, 300);
  },

  searchFamily(keyword) {
    wx.request({
      url: BASE_URL + '/family/search?keyword=' + encodeURIComponent(keyword),
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const list = res.data.data || [];
          this.setData({
            familyList: list,
            searchEmpty: list.length === 0
          });
        }
      },
      fail: () => {
        // 静默失败，不弹toast
      }
    });
  },

  selectFamily(e) {
    this.setData({ selectedFamilyId: parseInt(e.currentTarget.dataset.id) });
  },

  inputJoinRole(e) {
    this.setData({ joinRole: e.detail.value });
  },

  submitJoin() {
    const { selectedFamilyId, joinRole } = this.data;
    if (!selectedFamilyId) {
      wx.showToast({ title: '请选择一个家庭', icon: 'none' });
      return;
    }
    if (!joinRole.trim()) {
      wx.showToast({ title: '请输入你在家庭中的角色', icon: 'none' });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/join',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        userId: userInfo.user_id,
        familyId: selectedFamilyId,
        role: joinRole.trim()
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '申请已提交', icon: 'success' });
          this.closeJoinModal();
          this.loadMyFamily();     // 刷新页面，显示"等待审批中"
        } else {
          wx.showToast({ title: res.data.message || '申请失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // ========== 审批 ==========
  approveMember(e) {
    const memberUserId = parseInt(e.currentTarget.dataset.userid);
    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/approve',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        creatorId: userInfo.user_id,
        familyId: this.data.family.id,
        memberUserId: memberUserId
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '已同意', icon: 'success' });
          this.loadMyFamily();
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      }
    });
  },

  rejectMember(e) {
    const memberUserId = parseInt(e.currentTarget.dataset.userid);
    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/reject',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        creatorId: userInfo.user_id,
        familyId: this.data.family.id,
        memberUserId: memberUserId
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '已拒绝', icon: 'success' });
          this.loadMyFamily();
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      }
    });
  },

  // ========== 解散家庭 ==========
  openDissolveModal() {
    this.setData({ showDissolveModal: true });
  },

  closeDissolveModal() {
    this.setData({ showDissolveModal: false });
  },

  confirmDissolve() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/dissolve',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        creatorId: userInfo.user_id,
        familyId: this.data.family.id
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '家庭已解散', icon: 'success' });
          this.closeDissolveModal();
          this.loadMyFamily();
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      }
    });
  },

  // ========== 退出家庭 ==========
  openLeaveModal() {
    this.setData({ showLeaveModal: true });
  },

  closeLeaveModal() {
    this.setData({ showLeaveModal: false });
  },

  confirmLeave() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    wx.request({
      url: BASE_URL + '/family/leave',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        userId: userInfo.user_id,
        familyId: this.data.family.id
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '已退出家庭', icon: 'success' });
          this.closeLeaveModal();
          this.loadMyFamily();
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      }
    });
  },

  // 被拒绝后点"知道了"：直接清理，不弹确认框
  dismissRejection() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const familyId = this.data.family ? this.data.family.id : 0;
    wx.request({
      url: BASE_URL + '/family/leave',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { userId: userInfo.user_id, familyId: familyId },
      complete: () => {
        this.loadMyFamily();
      }
    });
  },

  // 关闭"被拒绝"提示弹窗 → 清理记录
  closeNotYetApprovedModal() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const familyId = this.data.family ? this.data.family.id : 0;
    // 记录已看过，下次不再弹
    wx.setStorageSync('rejected_notice_' + userInfo.user_id + '_' + familyId, true);
    this.setData({ showNotYetApprovedModal: false });
    // 删除被拒记录，恢复自由
    wx.request({
      url: BASE_URL + '/family/leave',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { userId: userInfo.user_id, familyId: familyId },
      complete: () => {
        this.loadMyFamily();
      }
    });
  },

  preventClose() {}
});
