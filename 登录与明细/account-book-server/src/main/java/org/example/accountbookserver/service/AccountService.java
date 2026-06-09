package org.example.accountbookserver.service;


import org.example.accountbookserver.entity.Account;
import org.example.accountbookserver.mapper.AccountMapper;

import java.util.List;

public interface AccountService {
    // 查询所有账单
    List<Account> findAll();
    // 根据用户ID查询账单
    List<Account> findByUserId(Integer user_id);
    // 新增账单
    int addAccount(Account account);
    // 更新账单
    int updateAccount(Account account);
    // 根据ID删除账单
    int deleteAccount(Integer id);

}
