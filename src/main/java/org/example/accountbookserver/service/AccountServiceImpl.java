package org.example.accountbookserver.service;

import org.example.accountbookserver.entity.Account;
import org.example.accountbookserver.mapper.AccountMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public  class AccountServiceImpl implements AccountService {

    @Autowired
    private AccountMapper accountMapper;

    @Override
    public List<Account> findAll() {
        return accountMapper.selectAll();
    }

    @Override
    public int addAccount(Account account) {
        return accountMapper.insert(account);
    }

    @Override
    public int updateAccount(Account account) {
        return accountMapper.update(account);
    }

    @Override
    public int deleteAccount(Long id) {
        return accountMapper.deleteById(Math.toIntExact(id));
    }
}
