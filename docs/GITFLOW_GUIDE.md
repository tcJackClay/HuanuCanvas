# GitFlow分支管理指南

## 📋 分支结构

### 主分支 (Master Branches)
- **main**: 生产环境分支，始终保持稳定状态
- **develop**: 开发分支，集成所有功能分支的最新变更

### 支持分支 (Supporting Branches)
- **feature/***: 功能开发分支
- **hotfix/***: 紧急修复分支
- **release/***: 发布准备分支

## 🚀 工作流程

### 开始新功能开发
```bash
# 从develop分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name

# 开发工作...
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature-name

# 创建Pull Request到develop分支
```

### 合并功能分支
```bash
# 在GitHub上创建Pull Request
# 审查通过后，使用GitHub界面合并或：
git checkout develop
git pull origin develop
git branch -d feature/new-feature-name
```

### 创建热修复
```bash
# 从main分支创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 修复工作...
git add .
git commit -m "fix: critical security patch"
git push origin hotfix/critical-bug-fix
```

### 发布准备
```bash
# 从develop分支创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.5.0

# 版本更新和最终测试...
git add .
git commit -m "chore: prepare release v1.5.0"
```

## 🛡️ 分支保护规则

### main分支保护
- ✅ 禁止直接推送
- ✅ 要求Pull Request审查
- ✅ 要求状态检查通过
- ✅ 要求分支保持最新状态
- ✅ 自动删除已合并分支

### develop分支保护
- ✅ 禁止直接推送（feature分支除外）
- ✅ 要求Pull Request审查
- ✅ 要求状态检查通过
- ✅ 自动删除已合并分支

## 🏷️ 提交消息规范

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (Type)
- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码格式化
- **refactor**: 重构
- **test**: 测试相关
- **chore**: 构建/工具相关

### 示例
```
feat(auth): add user authentication

Implement JWT-based authentication system with refresh token support.

Closes #123
```

## 🔄 分支命名规范

### 命名模式
```
<类型>/<简短描述>
```

### 示例
```
feature/user-profile-management
feature/ai-canvas-integration
hotfix/security-vulnerability
release/v1.5.0
release/v1.6.0-beta
```

## 📊 分支生命周期

### 功能分支 (Feature)
1. 从develop创建
2. 开发完成后创建PR
3. 审查通过后合并到develop
4. 删除功能分支

### 热修复分支 (Hotfix)
1. 从main创建
2. 修复后创建PR到main和develop
3. 审查通过后合并
4. 创建新的发布标签
5. 删除热修复分支

### 发布分支 (Release)
1. 从develop创建
2. 版本更新和最终测试
3. 合并到main和develop
4. 创建发布标签
5. 删除发布分支

## 🛠️ 常用Git命令

### 查看分支
```bash
git branch -a                    # 查看所有分支
git branch --merged develop      # 查看已合并到develop的分支
```

### 清理分支
```bash
# 删除本地已合并分支
git branch --merged develop | grep -v "\\*\\|develop\\|main" | xargs -n 1 git branch -d

# 删除远程已合并分支
git remote prune origin
```

### 分支重命名
```bash
git branch -m old-name new-name  # 重命名当前分支
```

## 📈 分支策略最佳实践

1. **保持分支最新**: 定期从develop合并最新变更
2. **小而频繁的PR**: 避免大型、复杂的PR
3. **及时清理**: 合并后及时删除分支
4. **清晰描述**: PR和分支名称要有明确的描述
5. **遵循命名规范**: 严格按照GitFlow规范命名

## 🔧 故障排除

### 解决合并冲突
```bash
git status                        # 查看冲突文件
# 手动解决冲突
git add <resolved-files>
git commit -m "resolve merge conflicts"
```

### 恢复意外删除的分支
```bash
git reflog                        # 查看操作历史
git checkout -b <branch-name> <commit-hash>
```

---

更多详细信息请参考项目CI/CD配置和GitHub Actions工作流。