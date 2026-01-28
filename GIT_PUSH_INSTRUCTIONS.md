# Git推送指令指南

## 🎯 推送到测试环境分支

### 基本命令
```bash
# 进入项目目录
cd D:\工作\Huanu\VibeCode\HuanuCanvas

# 检查当前状态
git status

# 添加所有修改的文件
git add .

# 提交到本地仓库
git commit -m "你的提交信息"

# 推送到GitHub测试环境分支
git push origin test-environment
```

### 完整操作流程

#### 1. 检查状态
```bash
git status
```

#### 2. 添加文件
```bash
git add .                    # 添加所有文件
# 或者
git add specific-file.js     # 添加特定文件
```

#### 3. 提交
```bash
git commit -m "feat: 添加新功能"
```

#### 4. 推送
```bash
git push origin test-environment
```

### 常用提交信息模板

```bash
# 新功能
git commit -m "feat: 添加新功能描述"

# 修复bug
git commit -m "fix: 修复某问题"

# 文档更新
git commit -m "docs: 更新文档"

# 样式变更
git commit -m "style: 调整样式"

# 重构
git commit -m "refactor: 代码重构"

# 性能优化
git commit -m "perf: 性能优化"
```

### 快捷命令

```bash
# 一行命令完成
git add . && git commit -m "feat: 更新内容" && git push origin test-environment

# 跳过添加步骤（如果文件已在Git中）
git commit -m "feat: 描述" && git push origin test-environment
```

### 分支操作

```bash
# 查看所有分支
git branch -a

# 切换到测试分支
git checkout test-environment

# 创建新功能分支
git checkout -b feature-name test-environment

# 推送新分支
git push -u origin feature-name
```

### 常见问题解决

#### 推送被拒绝
```bash
# 先拉取最新代码
git pull origin test-environment

# 解决冲突后再次推送
git push origin test-environment
```

#### 强制推送（谨慎使用）
```bash
git push --force-with-lease origin test-environment
```

### 当前状态

✅ 当前分支：test-environment  
✅ 最后提交：a73d532 docs: 添加GitHub提交报告和项目状态总结  
✅ 推送状态：Everything up-to-date  
✅ 远程分支：origin/test-environment  

---

*更新时间：2026-01-28 14:20*