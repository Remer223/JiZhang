package org.example.accountbookserver.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.accountbookserver.entity.User;

@Mapper
public interface UserMapper {
    User findByPhone(String phone);
    int insert(User user);
    int updatePassword(User user);
    int updateProfile(User user);
}
