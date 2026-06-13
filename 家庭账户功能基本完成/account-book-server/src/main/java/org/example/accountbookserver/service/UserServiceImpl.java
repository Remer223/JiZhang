package org.example.accountbookserver.service;

import org.example.accountbookserver.entity.User;
import org.example.accountbookserver.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 65536;
    private static final int KEY_LENGTH = 256;

    @Override
    public Map<String, Object> login(String phone, String password) {
        Map<String, Object> result = new java.util.HashMap<>();
        User user = userMapper.findByPhone(phone);
        if (user == null) {
            result.put("ok", false);
            result.put("message", "该手机号未注册");
            return result;
        }
        boolean verified = verifyPassword(password, user.getPassword());
        result.put("ok", verified);
        if (verified) {
            user.setPassword(null);
            result.put("user", user);
        } else {
            result.put("message", "密码错误");
        }
        return result;
    }

    @Override
    public Map<String, Object> register(User user) {
        Map<String, Object> result = new java.util.HashMap<>();
        User exist = userMapper.findByPhone(user.getPhone());
        if (exist != null) {
            result.put("ok", false);
            result.put("message", "该手机号已注册");
            return result;
        }
        String hashed = hashPassword(user.getPassword());
        user.setPassword(hashed);
        userMapper.insert(user);
        user.setPassword(null);
        result.put("ok", true);
        result.put("user", user);
        return result;
    }

    @Override
    public boolean updateProfile(User user) {
        return userMapper.updateProfile(user) > 0;
    }

    @Override
    public boolean resetPassword(String phone, String newPassword) {
        String hashed = hashPassword(newPassword);
        User user = userMapper.findByPhone(phone);
        if (user == null) {
            User newUser = new User();
            newUser.setPhone(phone);
            newUser.setPassword(hashed);
            userMapper.insert(newUser);
        } else {
            user.setPassword(hashed);
            userMapper.updatePassword(user);
        }
        return true;
    }

    private String hashPassword(String password) {
        try {
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[16];
            random.nextBytes(salt);

            KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
            byte[] hash = factory.generateSecret(spec).getEncoded();

            return Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Password hashing failed", e);
        }
    }

    private boolean verifyPassword(String password, String stored) {
        try {
            String[] parts = stored.split(":");
            if (parts.length != 2) return false;

            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[1]);

            KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
            byte[] actualHash = factory.generateSecret(spec).getEncoded();

            return Base64.getEncoder().encodeToString(actualHash).equals(Base64.getEncoder().encodeToString(expectedHash));
        } catch (Exception e) {
            return false;
        }
    }
}
