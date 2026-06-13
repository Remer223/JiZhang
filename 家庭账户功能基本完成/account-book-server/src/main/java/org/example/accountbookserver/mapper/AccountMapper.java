package org.example.accountbookserver.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.accountbookserver.entity.Account;
import java.util.List;

@Mapper
public interface AccountMapper {
    List<Account> selectAll();
    List<Account> selectByUserId(@Param("user_id") Integer user_id);
    List<Account> selectByUserIdWithRole(@Param("user_id") Integer user_id);
    List<Account> selectByFamilyId(@Param("family_id") Integer family_id);
    List<Account> selectByFamilyAndRole(@Param("family_id") Integer family_id, @Param("role") String role);
    List<Account> selectByFamilyAndMember(@Param("family_id") Integer family_id, @Param("member_user_id") Integer member_user_id);
    int insert(Account account);
    int update(Account account);
    int deleteById(Integer id);
}
