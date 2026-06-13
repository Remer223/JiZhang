package org.example.accountbookserver.service;

import org.example.accountbookserver.entity.Family;
import org.example.accountbookserver.entity.FamilyMember;

import java.util.List;
import java.util.Map;

public interface FamilyService {
    Map<String, Object> createFamily(Integer userId, String familyName, String role);
    Map<String, Object> joinFamily(Integer userId, Integer familyId, String role);
    Map<String, Object> approveMember(Integer creatorId, Integer familyId, Integer memberUserId);
    Map<String, Object> rejectMember(Integer creatorId, Integer familyId, Integer memberUserId);
    Map<String, Object> leaveFamily(Integer userId, Integer familyId);
    Map<String, Object> dissolveFamily(Integer creatorId, Integer familyId);
    Map<String, Object> getMyFamily(Integer userId);
    List<FamilyMember> getFamilyMembers(Integer familyId);
    List<Map<String, Object>> listActiveFamilies();
    List<Map<String, Object>> searchFamilies(String keyword);
}
