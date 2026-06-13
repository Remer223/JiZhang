package org.example.accountbookserver.service;

import org.example.accountbookserver.entity.User;

import java.util.Map;

public interface UserService {
    Map<String, Object> login(String phone, String password);
    Map<String, Object> register(User user);
    boolean resetPassword(String phone, String newPassword);
    boolean updateProfile(User user);
}
