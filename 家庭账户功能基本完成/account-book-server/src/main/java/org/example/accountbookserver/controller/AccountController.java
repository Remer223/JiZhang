package org.example.accountbookserver.controller;

import org.example.accountbookserver.entity.Account;
import org.example.accountbookserver.entity.Result;
import org.example.accountbookserver.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/account")
@CrossOrigin(origins = "*")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @GetMapping("/list")
    public List<Account> list(
            @RequestParam(required = false) Integer user_id,
            @RequestParam(required = false) Integer family_id,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer member_user_id) {

        // 家庭账单 + 筛选具体成员（user_id精确匹配）
        if (family_id != null && member_user_id != null) {
            return accountService.findByFamilyAndMember(family_id, member_user_id);
        }

        // 家庭账单 + 角色筛选
        if (family_id != null && role != null && !role.isEmpty()) {
            return accountService.findByFamilyAndRole(family_id, role);
        }

        // 家庭账单（全部成员共享）
        if (family_id != null) {
            return accountService.findByFamilyId(family_id);
        }

        // 个人账单
        if (user_id != null) {
            return accountService.findByUserId(user_id);
        }

        return new ArrayList<>();
    }

    @PostMapping("/add")
    public Result add(@RequestBody Account account) {
        if (account.getUserId() == null) {
            return Result.error("用户未登录，无法记账");
        }
        accountService.addAccount(account);
        return Result.success("添加成功");
    }

    @PutMapping("/update")
    public Result update(@RequestBody Account account) {
        return accountService.updateAccount(account) > 0 ? Result.success("修改成功") : Result.error("修改失败");
    }

    @DeleteMapping("/delete/{id}")
    public Result delete(@PathVariable Integer id) {
        return accountService.deleteAccount(id) > 0 ? Result.success("删除成功") : Result.error("删除失败");
    }
}
