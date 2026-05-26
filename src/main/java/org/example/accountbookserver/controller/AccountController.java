package org.example.accountbookserver.controller;

import org.example.accountbookserver.entity.Account;
import org.example.accountbookserver.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/account")
@CrossOrigin(origins = "*")  //解决跨域
public class AccountController {
    @Autowired
    private AccountService accountService;
    @GetMapping("/list")
    public List<Account> list() {
        return accountService.findAll();
    }
    @PostMapping("/add")
    public String add(@RequestBody Account account) {
        accountService.addAccount(account); // 调用 service
        return "success";
    }
}
