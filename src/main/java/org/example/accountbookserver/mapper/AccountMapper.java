package org.example.accountbookserver.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Insert;
import org.example.accountbookserver.entity.Account;
import java.util.List;

@Mapper
public interface AccountMapper {
    List<Account> selectAll();
    int insert(Account account);
    int update(Account account);
    int deleteById(Integer id);
}
