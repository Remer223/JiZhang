package org.example.accountbookserver.entity;

import lombok.Data;

@Data
public class Account {
    private Long id;
    private String user_id;
    private Integer type;
    private Double amount;
    private String category;
    private String remark;
    private String create_time;
    //1122
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUser_id() { return user_id; }
    public void setUser_id(String user_id) { this.user_id = user_id; }
    public Integer getType() { return type; }
    public void setType(Integer type) { this.type = type; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public String getCreate_time() { return create_time; }
    public void setCreate_time(String create_time) { this.create_time = create_time; }
}