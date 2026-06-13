package org.example.accountbookserver.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FamilyMember {
    private Integer id;
    private Integer familyId;
    private Integer userId;
    private String role;
    private Integer approved;   // 0=待审批 1=已批准
    private Integer rejected;   // 0=未拒绝 1=已拒绝
    private String joinedAt;

    // join查询时附带的用户信息
    private String nickname;
    private String avatar;
    private String phone;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    @JsonProperty("family_id")
    public Integer getFamilyId() { return familyId; }
    @JsonProperty("family_id")
    public void setFamilyId(Integer familyId) { this.familyId = familyId; }

    @JsonProperty("user_id")
    public Integer getUserId() { return userId; }
    @JsonProperty("user_id")
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getApproved() { return approved; }
    public void setApproved(Integer approved) { this.approved = approved; }

    public Integer getRejected() { return rejected; }
    public void setRejected(Integer rejected) { this.rejected = rejected; }

    @JsonProperty("joined_at")
    public String getJoinedAt() { return joinedAt; }
    @JsonProperty("joined_at")
    public void setJoinedAt(String joinedAt) { this.joinedAt = joinedAt; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
