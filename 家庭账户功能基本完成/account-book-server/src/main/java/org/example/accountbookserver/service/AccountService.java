package org.example.accountbookserver.service;


import org.example.accountbookserver.entity.Account;

import java.util.List;

public interface AccountService {
    List<Account> findAll();
    List<Account> findByUserId(Integer user_id);
    List<Account> findByUserIdWithRole(Integer user_id);
    List<Account> findByFamilyId(Integer family_id);
    List<Account> findByFamilyAndRole(Integer family_id, String role);
    List<Account> findByFamilyAndMember(Integer family_id, Integer member_user_id);
    int addAccount(Account account);
    int updateAccount(Account account);
    int deleteAccount(Integer id);
}
