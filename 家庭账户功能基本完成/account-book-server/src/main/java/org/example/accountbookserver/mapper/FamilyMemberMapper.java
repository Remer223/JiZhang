package org.example.accountbookserver.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.accountbookserver.entity.FamilyMember;

import java.util.List;

@Mapper
public interface FamilyMemberMapper {
    int insert(FamilyMember member);
    List<FamilyMember> selectByFamilyId(@Param("familyId") Integer familyId);
    FamilyMember selectByUserAndFamily(@Param("userId") Integer userId, @Param("familyId") Integer familyId);
    int approveMember(@Param("id") Integer id);
    int rejectMember(@Param("id") Integer id);
    int deleteById(Integer id);
    int deleteByFamilyId(@Param("familyId") Integer familyId);
    int deleteByUserAndFamily(@Param("userId") Integer userId, @Param("familyId") Integer familyId);
}
