package org.example.accountbookserver.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

public class User {
    private Integer id;
    private String phone;
    private String password;
    private String nickname;
    private String avatar;

    @JsonProperty("user_id")
    public Integer getId() { return id; }
    @JsonProperty("user_id")
    public void setId(Integer id) { this.id = id; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
}
