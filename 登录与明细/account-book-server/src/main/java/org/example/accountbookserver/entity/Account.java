package org.example.accountbookserver.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Account {
    private Integer id;
    private Integer userId;
    private Integer type; // 1=支出 2=收入
    private Double amount;
    private String category;
    private String remark;
    private String createTime;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    @JsonProperty("user_id")
    public Integer getUserId() { return userId; }
    @JsonProperty("user_id")
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getType() { return type; }
    public void setType(Integer type) { this.type = type; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public String getCreateTime() { return createTime; }
    public void setCreateTime(String createTime) { this.createTime = createTime; }
}
