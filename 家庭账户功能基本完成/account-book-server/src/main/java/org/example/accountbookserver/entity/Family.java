package org.example.accountbookserver.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Family {
    private Integer id;
    private String name;
    private Integer creatorId;
    private String createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    @JsonProperty("creator_id")
    public Integer getCreatorId() { return creatorId; }
    @JsonProperty("creator_id")
    public void setCreatorId(Integer creatorId) { this.creatorId = creatorId; }

    @JsonProperty("created_at")
    public String getCreatedAt() { return createdAt; }
    @JsonProperty("created_at")
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
