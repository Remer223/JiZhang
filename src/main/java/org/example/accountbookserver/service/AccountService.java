package org.example.accountbookserver.service;


import org.example.accountbookserver.entity.Account;
import org.example.accountbookserver.mapper.AccountMapper;

import java.util.List;

public interface AccountService {
    // 查询所有账单
    List<Account> findAll();
    // 新增账单
    int addAccount(Account account);

    // 更新账单
    int updateAccount(Account account);


    int deleteAccount(Long id);
}