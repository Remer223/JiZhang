package org.example.accountbookserver.controller;

import org.example.accountbookserver.entity.Result;
import org.example.accountbookserver.entity.User;
import org.example.accountbookserver.service.UserService;
import org.example.accountbookserver.util.CaptchaUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result login(@RequestBody Map<String, String> params) {
        String phone = params.get("phone");
        String password = params.get("password");

        if (phone == null || phone.isEmpty()) {
            return Result.error("手机号不能为空");
        }
        if (!phone.matches("^1[3-9]\\d{9}$")) {
            return Result.error("手机号格式不正确");
        }
        if (password == null || password.isEmpty()) {
            return Result.error("密码不能为空");
        }

        Map<String, Object> result = userService.login(phone, password);
        boolean ok = (boolean) result.get("ok");
        if (ok) {
            return Result.success("登录成功", result.get("user"));
        }
        return Result.error((String) result.get("message"));
    }

    @PostMapping("/register")
    public Result register(@RequestBody User user) {
        if (user.getPhone() == null || user.getPhone().isEmpty()) {
            return Result.error("手机号不能为空");
        }
        if (!user.getPhone().matches("^1[3-9]\\d{9}$")) {
            return Result.error("手机号格式不正确");
        }
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            return Result.error("密码不能为空");
        }
        if (user.getPassword().length() < 6) {
            return Result.error("密码长度不能少于6位");
        }

        Map<String, Object> result = userService.register(user);
        boolean ok = (boolean) result.get("ok");
        if (ok) {
            return Result.success("注册成功", result.get("user"));
        }
        return Result.error((String) result.get("message"));
    }

    @PutMapping("/profile")
    public Result updateProfile(@RequestBody User user) {
        if (user.getId() == null) {
            return Result.error("用户ID不能为空");
        }
        boolean ok = userService.updateProfile(user);
        return ok ? Result.success("修改成功") : Result.error("修改失败");
    }

    @GetMapping("/captcha")
    public Result captcha() {
        CaptchaUtil.CaptchaResult captcha = CaptchaUtil.generate();
        return Result.success("ok", Map.of("key", captcha.getKey(), "image", captcha.getImage()));
    }

    @PostMapping("/reset-password")
    public Result resetPassword(@RequestBody Map<String, String> params) {
        String phone = params.get("phone");
        String captchaKey = params.get("captchaKey");
        String captcha = params.get("captcha");
        String newPassword = params.get("newPassword");

        if (phone == null || phone.isEmpty()) {
            return Result.error("手机号不能为空");
        }
        if (!phone.matches("^1[3-9]\\d{9}$")) {
            return Result.error("手机号格式不正确");
        }
        if (captchaKey == null || captchaKey.isEmpty()) {
            return Result.error("验证码key不能为空");
        }
        if (captcha == null || captcha.isEmpty()) {
            return Result.error("验证码不能为空");
        }
        if (newPassword == null || newPassword.isEmpty()) {
            return Result.error("新密码不能为空");
        }
        if (newPassword.length() < 6) {
            return Result.error("密码长度不能少于6位");
        }

        if (!CaptchaUtil.verify(captchaKey, captcha)) {
            return Result.error("验证码错误或已过期");
        }

        boolean ok = userService.resetPassword(phone, newPassword);
        return ok ? Result.success("密码重置成功") : Result.error("密码重置失败");
    }
}
