package org.example.accountbookserver.controller;

import org.example.accountbookserver.entity.FamilyMember;
import org.example.accountbookserver.entity.Result;
import org.example.accountbookserver.service.FamilyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/family")
@CrossOrigin(origins = "*")
public class FamilyController {

    private static final Logger log = LoggerFactory.getLogger(FamilyController.class);

    @Autowired
    private FamilyService familyService;

    @PostMapping("/create")
    public Result create(@RequestBody Map<String, Object> params) {
        Integer userId = (Integer) params.get("userId");
        String familyName = (String) params.get("familyName");
        String role = (String) params.get("role");

        if (userId == null) return Result.error("用户ID不能为空");
        if (familyName == null || familyName.trim().isEmpty()) return Result.error("家庭名称不能为空");
        if (role == null || role.trim().isEmpty()) return Result.error("家庭角色不能为空");

        try {
            Map<String, Object> result = familyService.createFamily(userId, familyName.trim(), role.trim());
            boolean ok = (boolean) result.get("ok");
            return ok ? Result.success((String) result.get("message"), result.get("family"))
                      : Result.error((String) result.get("message"));
        } catch (Exception e) {
            log.warn("创建家庭失败: {}", e.getMessage());
            return Result.error("操作失败，请检查数据库表是否已创建");
        }
    }

    @PostMapping("/join")
    public Result join(@RequestBody Map<String, Object> params) {
        Integer userId = (Integer) params.get("userId");
        Integer familyId = (Integer) params.get("familyId");
        String role = (String) params.get("role");

        if (userId == null) return Result.error("用户ID不能为空");
        if (familyId == null) return Result.error("家庭ID不能为空");
        if (role == null || role.trim().isEmpty()) return Result.error("家庭角色不能为空");

        try {
            Map<String, Object> result = familyService.joinFamily(userId, familyId, role.trim());
            boolean ok = (boolean) result.get("ok");
            return ok ? Result.success((String) result.get("message"))
                      : Result.error((String) result.get("message"));
        } catch (Exception e) {
            log.warn("加入家庭失败: {}", e.getMessage());
            return Result.error("操作失败，请检查数据库表是否已创建");
        }
    }

    @PostMapping("/approve")
    public Result approve(@RequestBody Map<String, Object> params) {
        Integer creatorId = (Integer) params.get("creatorId");
        Integer familyId = (Integer) params.get("familyId");
        Integer memberUserId = (Integer) params.get("memberUserId");

        if (creatorId == null || familyId == null || memberUserId == null) return Result.error("参数不完整");

        try {
            Map<String, Object> result = familyService.approveMember(creatorId, familyId, memberUserId);
            boolean ok = (boolean) result.get("ok");
            return ok ? Result.success((String) result.get("message"))
                      : Result.error((String) result.get("message"));
        } catch (Exception e) {
            log.warn("审批失败: {}", e.getMessage());
            return Result.error("操作失败");
        }
    }

    @PostMapping("/reject")
    public Result reject(@RequestBody Map<String, Object> params) {
        Integer creatorId = (Integer) params.get("creatorId");
        Integer familyId = (Integer) params.get("familyId");
        Integer memberUserId = (Integer) params.get("memberUserId");

        if (creatorId == null || familyId == null || memberUserId == null) return Result.error("参数不完整");

        try {
            Map<String, Object> result = familyService.rejectMember(creatorId, familyId, memberUserId);
            boolean ok = (boolean) result.get("ok");
            return ok ? Result.success((String) result.get("message"))
                      : Result.error((String) result.get("message"));
        } catch (Exception e) {
            log.warn("拒绝失败: {}", e.getMessage());
            return Result.error("操作失败");
        }
    }

    @PostMapping("/leave")
    public Result leave(@RequestBody Map<String, Object> params) {
        Integer userId = (Integer) params.get("userId");
        Integer familyId = (Integer) params.get("familyId");

        if (userId == null || familyId == null) return Result.error("参数不完整");

        try {
            Map<String, Object> result = familyService.leaveFamily(userId, familyId);
            boolean ok = (boolean) result.get("ok");
            return ok ? Result.success((String) result.get("message"))
                      : Result.error((String) result.get("message"));
        } catch (Exception e) {
            log.warn("退出失败: {}", e.getMessage());
            return Result.error("操作失败");
        }
    }

    @PostMapping("/dissolve")
    public Result dissolve(@RequestBody Map<String, Object> params) {
        Integer creatorId = (Integer) params.get("creatorId");
        Integer familyId = (Integer) params.get("familyId");

        if (creatorId == null || familyId == null) return Result.error("参数不完整");

        try {
            Map<String, Object> result = familyService.dissolveFamily(creatorId, familyId);
            boolean ok = (boolean) result.get("ok");
            return ok ? Result.success((String) result.get("message"))
                      : Result.error((String) result.get("message"));
        } catch (Exception e) {
            log.warn("解散失败: {}", e.getMessage());
            return Result.error("操作失败");
        }
    }

    @GetMapping("/my")
    public Result myFamily(@RequestParam Integer userId) {
        if (userId == null) return Result.error("用户ID不能为空");
        try {
            return Result.success("ok", familyService.getMyFamily(userId));
        } catch (Exception e) {
            log.warn("查询家庭失败(可能未建表): {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("ok", true);
            fallback.put("hasFamily", false);
            fallback.put("family", null);
            fallback.put("members", Collections.emptyList());
            return Result.success("ok", fallback);
        }
    }

    @GetMapping("/{familyId}/members")
    public Result members(@PathVariable Integer familyId) {
        try {
            return Result.success("ok", familyService.getFamilyMembers(familyId));
        } catch (Exception e) {
            log.warn("查成员失败: {}", e.getMessage());
            return Result.success("ok", Collections.emptyList());
        }
    }

    @GetMapping("/list")
    public Result listFamilies() {
        try {
            return Result.success("ok", familyService.listActiveFamilies());
        } catch (Exception e) {
            log.warn("查家庭列表失败: {}", e.getMessage());
            return Result.success("ok", Collections.emptyList());
        }
    }

    @GetMapping("/search")
    public Result search(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Result.success("ok", Collections.emptyList());
        }
        try {
            return Result.success("ok", familyService.searchFamilies(keyword.trim()));
        } catch (Exception e) {
            log.warn("搜索家庭失败: {}", e.getMessage());
            return Result.success("ok", Collections.emptyList());
        }
    }
}
