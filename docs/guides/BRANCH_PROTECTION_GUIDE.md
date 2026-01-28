# 分支保护规则设置指导

## 🛡️ GitHub网页界面设置

### 1. 设置main分支保护规则

请按照以下步骤在GitHub网页界面设置main分支保护：

1. **访问仓库设置**
   - 打开: https://github.com/tcJackClay/HuanuCanvas
   - 点击顶部的 `Settings` 选项卡
   - 在左侧菜单中找到 `Branches`

2. **添加main分支保护规则**
   - 点击 `Add rule` 按钮
   - 在 `Branch name pattern` 中输入: `main`
   
3. **配置保护规则**
   
   **✅ 必需规则:**
   - ☑️ Require a pull request before merging
     - 设置 `Required number of reviewers`: 1
     - ☑️ Dismiss stale PR approvals when new commits are pushed
     - ☑️ Require review from Code Owners
   
   - ☑️ Require status checks to pass before merging
     - ☑️ Require branches to be up to date before merging
     - 在搜索框中添加以下状态检查:
       - `build`
       - `test`
       - `lint`
       - `enhanced-quality-checks`
       - `intelligent-testing`
       - `e2e-and-performance`
   
   - ☑️ Include administrators
   
   **🔧 可选规则:**
   - ☑️ Restrict pushes that create files larger than 100 MB
   - ☑️ Allow force pushes (选择性开启)
     - 设置为: `Nobody`
   - ☑️ Allow deletions

4. **保存规则**
   - 点击 `Create` 按钮

### 2. 设置develop分支保护规则

重复上述步骤，但修改以下内容:

1. **Branch name pattern**: `develop`
2. **简化保护规则**:
   - ☑️ Require a pull request before merging
     - 设置 `Required number of reviewers`: 1
   - ☑️ Require status checks to pass before merging
     - ☑️ Require branches to be up to date before merging
   - ☑️ Include administrators
   - **注意**: 允许feature分支直接推送

## 🔐 API方式设置 (高级)

如果需要通过GitHub API设置，可以使用以下命令:

### 设置main分支保护
```bash
# 设置分支保护
curl -X PUT \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/tcJackClay/HuanuCanvas/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "build",
        "enhanced-quality-checks",
        "intelligent-testing",
        "e2e-and-performance"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "block_creations": false,
    "required_conversation_resolution": true
  }'
```

### 设置develop分支保护
```bash
# 设置develop分支保护 (简化版)
curl -X PUT \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/tcJackClay/HuanuCanvas/branches/develop/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "enhanced-quality-checks",
        "intelligent-testing"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": true
  }'
```

## 📋 验证保护规则

设置完成后，可以通过以下方式验证:

1. **网页界面检查**
   - 访问: https://github.com/tcJackClay/HuanuCanvas/settings/branches
   - 确认规则已正确应用

2. **测试保护功能**
   ```bash
   # 尝试直接推送main分支 (应该失败)
   git checkout main
   echo "test" > test.txt
   git add test.txt
   git commit -m "test commit"
   git push origin main
   ```

3. **API验证**
   ```bash
   # 获取分支保护信息
   curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     https://api.github.com/repos/tcJackClay/HuanuCanvas/branches/main/protection
   ```

## 🚨 注意事项

### 风险提示
- 设置分支保护后，**不能直接推送**到保护的分支
- 所有更改必须通过Pull Request进行
- 首次设置时，确保您有有效的PR审查流程

### 故障排除
1. **无法推送**: 检查是否创建了PR并通过审查
2. **状态检查失败**: 查看Actions页面了解失败原因
3. **权限问题**: 确认您在仓库中有Admin权限

### 回滚方案
如果遇到问题，可以临时禁用保护规则:
1. 进入仓库设置 > Branches
2. 点击规则旁边的 `Edit` 
3. 暂时移除所有要求或删除规则

## 📞 支持

如遇到设置问题，请:
1. 检查GitHub文档: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository
2. 查看仓库的Actions日志
3. 联系项目管理员

---

**⚠️ 重要提醒**: 分支保护规则一旦生效，会立即影响所有团队成员的工作流程。建议在团队会议中讨论并确认后再进行设置。