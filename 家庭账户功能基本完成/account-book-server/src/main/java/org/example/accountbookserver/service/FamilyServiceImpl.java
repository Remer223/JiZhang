package org.example.accountbookserver.service;

import org.example.accountbookserver.entity.Family;
import org.example.accountbookserver.entity.FamilyMember;
import org.example.accountbookserver.mapper.FamilyMapper;
import org.example.accountbookserver.mapper.FamilyMemberMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class FamilyServiceImpl implements FamilyService {

    @Autowired
    private FamilyMapper familyMapper;

    @Autowired
    private FamilyMemberMapper familyMemberMapper;

    @Override
    @Transactional
    public Map<String, Object> createFamily(Integer userId, String familyName, String role) {
        Map<String, Object> result = new HashMap<>();

        int membership = familyMapper.countMembership(userId);
        if (membership > 0) {
            result.put("ok", false);
            result.put("message", "你已在家庭中，请先退出或取消申请");
            return result;
        }

        Family family = new Family();
        family.setName(familyName);
        family.setCreatorId(userId);
        familyMapper.insert(family);

        FamilyMember member = new FamilyMember();
        member.setFamilyId(family.getId());
        member.setUserId(userId);
        member.setRole(role);
        member.setApproved(1);    // 创建者直接批准
        familyMemberMapper.insert(member);

        result.put("ok", true);
        result.put("message", "家庭创建成功");
        result.put("family", family);
        return result;
    }

    @Override
    public Map<String, Object> joinFamily(Integer userId, Integer familyId, String role) {
        Map<String, Object> result = new HashMap<>();

        int membership = familyMapper.countMembership(userId);
        if (membership > 0) {
            result.put("ok", false);
            result.put("message", "你已在家庭中，请先退出或取消申请");
            return result;
        }

        Family family = familyMapper.selectById(familyId);
        if (family == null) {
            result.put("ok", false);
            result.put("message", "该家庭不存在");
            return result;
        }

        FamilyMember member = new FamilyMember();
        member.setFamilyId(familyId);
        member.setUserId(userId);
        member.setRole(role);
        member.setApproved(0);   // 需要创建者审批
        familyMemberMapper.insert(member);

        result.put("ok", true);
        result.put("message", "申请已提交，请等待家庭创建者审批");
        return result;
    }

    @Override
    public Map<String, Object> approveMember(Integer creatorId, Integer familyId, Integer memberUserId) {
        Map<String, Object> result = new HashMap<>();

        Family family = familyMapper.selectById(familyId);
        if (family == null) {
            result.put("ok", false);
            result.put("message", "家庭不存在");
            return result;
        }

        if (!family.getCreatorId().equals(creatorId)) {
            result.put("ok", false);
            result.put("message", "只有家庭创建者才能审批");
            return result;
        }

        FamilyMember member = familyMemberMapper.selectByUserAndFamily(memberUserId, familyId);
        if (member == null) {
            result.put("ok", false);
            result.put("message", "未找到该成员的申请记录");
            return result;
        }

        if (Integer.valueOf(1).equals(member.getApproved())) {
            result.put("ok", false);
            result.put("message", "该成员已通过审批");
            return result;
        }

        familyMemberMapper.approveMember(member.getId());
        result.put("ok", true);
        result.put("message", "已同意申请");
        return result;
    }

    @Override
    public Map<String, Object> rejectMember(Integer creatorId, Integer familyId, Integer memberUserId) {
        Map<String, Object> result = new HashMap<>();

        Family family = familyMapper.selectById(familyId);
        if (family == null) {
            result.put("ok", false);
            result.put("message", "家庭不存在");
            return result;
        }

        if (!family.getCreatorId().equals(creatorId)) {
            result.put("ok", false);
            result.put("message", "只有家庭创建者才能审批");
            return result;
        }

        FamilyMember member = familyMemberMapper.selectByUserAndFamily(memberUserId, familyId);
        if (member == null) {
            result.put("ok", false);
            result.put("message", "未找到该成员的申请记录");
            return result;
        }

        // 拒绝 = 标记rejected，不删除（让申请人看到通知）
        familyMemberMapper.rejectMember(member.getId());
        result.put("ok", true);
        result.put("message", "已拒绝申请");
        return result;
    }

    @Override
    public Map<String, Object> leaveFamily(Integer userId, Integer familyId) {
        Map<String, Object> result = new HashMap<>();

        Family family = familyMapper.selectById(familyId);
        if (family == null) {
            result.put("ok", false);
            result.put("message", "家庭不存在");
            return result;
        }

        FamilyMember member = familyMemberMapper.selectByUserAndFamily(userId, familyId);
        if (member == null) {
            result.put("ok", false);
            result.put("message", "你不是该家庭的成员");
            return result;
        }

        // 创建者且已批准 → 不能退出
        if (family.getCreatorId().equals(userId) && Integer.valueOf(1).equals(member.getApproved())) {
            result.put("ok", false);
            result.put("message", "家庭创建者不能退出，只能解散家庭");
            return result;
        }

        // 物理删除（pending=取消申请，approved=退出家庭，创建者pending=取消自己建的家）
        familyMemberMapper.deleteByUserAndFamily(userId, familyId);

        // 如果是创建者取消了自己建的家(pending状态)，连家庭也一起删
        if (family.getCreatorId().equals(userId)) {
            // 创建者走了，家庭也没意义了，删掉
            familyMemberMapper.deleteByFamilyId(familyId);
            familyMapper.deleteById(familyId);
            result.put("ok", true);
            result.put("message", "已取消");
            return result;
        }

        result.put("ok", true);
        result.put("message", Integer.valueOf(1).equals(member.getApproved()) ? "已退出家庭" : "已取消申请");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> dissolveFamily(Integer creatorId, Integer familyId) {
        Map<String, Object> result = new HashMap<>();

        Family family = familyMapper.selectById(familyId);
        if (family == null) {
            result.put("ok", false);
            result.put("message", "家庭不存在");
            return result;
        }

        if (!family.getCreatorId().equals(creatorId)) {
            result.put("ok", false);
            result.put("message", "只有家庭创建者才能解散家庭");
            return result;
        }

        // 解散 = 先删成员，再删家庭
        familyMemberMapper.deleteByFamilyId(familyId);
        familyMapper.deleteById(familyId);
        result.put("ok", true);
        result.put("message", "家庭已解散");
        return result;
    }

    @Override
    public Map<String, Object> getMyFamily(Integer userId) {
        Map<String, Object> result = new HashMap<>();

        List<Family> families = familyMapper.selectByUserId(userId);
        if (families.isEmpty()) {
            result.put("ok", true);
            result.put("hasFamily", false);
            result.put("family", null);
            result.put("members", Collections.emptyList());
            return result;
        }

        Family family = families.get(0);
        List<FamilyMember> members = familyMemberMapper.selectByFamilyId(family.getId());

        FamilyMember myMember = null;
        for (FamilyMember m : members) {
            if (m.getUserId().equals(userId)) {
                myMember = m;
                break;
            }
        }

        result.put("ok", true);
        result.put("hasFamily", true);
        result.put("family", family);
        result.put("members", members);
        result.put("myRole", myMember != null ? myMember.getRole() : null);
        result.put("isCreator", family.getCreatorId().equals(userId));
        result.put("isApproved", myMember != null && Integer.valueOf(1).equals(myMember.getApproved()));
        result.put("isRejected", myMember != null && Integer.valueOf(1).equals(myMember.getRejected()));
        return result;
    }

    @Override
    public List<FamilyMember> getFamilyMembers(Integer familyId) {
        return familyMemberMapper.selectByFamilyId(familyId);
    }

    @Override
    public List<Map<String, Object>> searchFamilies(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return familyMapper.searchByKeyword(keyword.trim());
    }

    @Override
    public List<Map<String, Object>> listActiveFamilies() {
        List<Family> families = familyMapper.selectAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Family family : families) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", family.getId());
            item.put("name", family.getName());
            item.put("creator_id", family.getCreatorId());
            item.put("created_at", family.getCreatedAt());

            List<FamilyMember> members = familyMemberMapper.selectByFamilyId(family.getId());
            item.put("member_count", members.size());
            item.put("members", members);

            result.add(item);
        }

        return result;
    }
}
