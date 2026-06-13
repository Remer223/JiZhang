package org.example.accountbookserver.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.accountbookserver.entity.Family;

import java.util.List;

@Mapper
public interface FamilyMapper {
    int insert(Family family);
    Family selectById(Integer id);
    List<Family> selectByUserId(@Param("userId") Integer userId);
    List<Family> selectAll();
    int deleteById(Integer id);
    int countMembership(@Param("userId") Integer userId);
    List<java.util.Map<String, Object>> searchByKeyword(@Param("keyword") String keyword);
}
