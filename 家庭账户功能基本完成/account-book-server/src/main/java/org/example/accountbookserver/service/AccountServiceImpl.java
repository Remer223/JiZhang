package org.example.accountbookserver.service;

import org.example.accountbookserver.entity.Account;
import org.example.accountbookserver.mapper.AccountMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AccountServiceImpl implements AccountService {

    @Autowired
    private AccountMapper accountMapper;

    @Override
    public List<Account> findAll() {
        return accountMapper.selectAll();
    }

    @Override
    public List<Account> findByUserId(Integer user_id) {
        return accountMapper.selectByUserId(user_id);
    }

    @Override
    public List<Account> findByUserIdWithRole(Integer user_id) {
        return accountMapper.selectByUserIdWithRole(user_id);
    }

    @Override
    public List<Account> findByFamilyId(Integer family_id) {
        return accountMapper.selectByFamilyId(family_id);
    }

    @Override
    public List<Account> findByFamilyAndRole(Integer family_id, String role) {
        return accountMapper.selectByFamilyAndRole(family_id, role);
    }

    @Override
    public List<Account> findByFamilyAndMember(Integer family_id, Integer member_user_id) {
        return accountMapper.selectByFamilyAndMember(family_id, member_user_id);
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
    public int deleteAccount(Integer id) {
        return accountMapper.deleteById(id);
    }
}
