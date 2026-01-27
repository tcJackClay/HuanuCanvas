# 变更日志模板

## 版本格式

我们遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

```
<主版本号>.<次版本号>.<修订号>[-预发布版本号]
```

**示例**: `v1.4.1`, `v2.0.0-beta.1`

## 变更日志格式

每次发布时请使用以下格式：

```markdown
# 变更日志

所有值得注意的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

## [未发布]

### 新增
- 特性A的新功能描述
- 特性B的新功能描述

### 变更
- 特性A的功能变更描述
- 特性B的功能变更描述

### 修复
- 问题A的修复描述
- 问题B的修复描述

### 移除
- 已移除功能A的描述
- 已移除功能B的描述

### 安全
- 安全漏洞修复描述
- 安全改进描述

## [1.4.1] - 2024-01-27

### 修复
- 修复Canvas编辑器中的内存泄漏问题
- 修复AI图像生成API的超时问题
- 修复用户权限验证的bug

### 性能优化
- 优化前端打包大小，减少20%
- 提升Canvas渲染性能30%
- 优化数据库查询效率

## [1.4.0] - 2024-01-20

### 新增
- 新增AI图像生成功能
- 新增多人协作编辑
- 新增项目模板系统
- 新增暗色主题支持

### 变更
- 升级到React 19
- 更新UI组件库
- 重构Canvas编辑器架构
- 优化用户体验流程

### 修复
- 修复移动端适配问题
- 修复键盘快捷键冲突
- 修复文件上传失败问题
- 修复数据同步延迟

### 移除
- 移除已弃用的API端点
- 移除旧版本兼容性代码
- 移除调试模式下的冗余日志

### 安全
- 修复XSS漏洞
- 加强API认证机制
- 更新依赖包安全版本
- 添加CSRF保护

## [1.3.0] - 2024-01-10

### 新增
- 新增云端存储功能
- 新增版本历史管理
- 新增批量操作功能

### 变更
- 更新用户界面设计
- 优化加载速度
- 改进错误处理机制

### 修复
- 修复浏览器兼容性问题
- 修复数据导出错误
- 修复权限控制漏洞

## 变更类型说明

### 新增 (Added)
- 新功能、新特性

### 变更 (Changed)
- 对现有功能的修改、更新

### 修复 (Fixed)
- 对bug的修复

### 移除 (Removed)
- 已删除的功能、特性

### 弃用 (Deprecated)
- 即将在未来版本中移除的功能

### 安全 (Security)
- 安全相关的修复和改进

## 分类标签

### 功能分类
- 🎨 **UI/UX**: 用户界面和体验相关
- ⚡ **性能**: 性能优化相关
- 🛡️ **安全**: 安全相关
- 🔧 **工具**: 工具和脚本
- 📱 **移动端**: 移动设备适配
- 🌐 **国际化**: 多语言支持
- 🎭 **主题**: 主题和样式

### 范围分类
- **frontend**: 前端相关
- **backend**: 后端相关
- **api**: API相关
- **database**: 数据库相关
- **ci/cd**: 持续集成/部署
- **docs**: 文档相关
- **testing**: 测试相关

## 提交消息规范

遵循 [约定式提交](https://www.conventionalcommits.org/) 规范：

```bash
<类型>[可选范围]: <描述>

[可选正文]

[可选脚注]
```

### 类型示例
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档
- `style`: 格式化（不影响代码运行）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建过程或辅助工具
- `perf`: 性能优化
- `ci`: CI配置
- `build`: 构建系统
- `revert`: 回滚

### 示例
```bash
feat(canvas): add drag and drop functionality

Implement drag and drop support for canvas elements
including visual feedback and collision detection.

Closes #123

feat(auth): add JWT authentication system
fix(api): resolve timeout issue in image generation
docs: update API documentation
style: format code with prettier
refactor(canvas): optimize rendering performance
test(canvas): add unit tests for drag functionality
chore: update dependencies
```

## 自动生成

可以使用工具自动生成变更日志：

### 手动生成
```bash
# 使用Git日志生成
git log --pretty=format:"- %s (%h)" --since="2024-01-01" > CHANGELOG.md

# 使用Conventional Commits
conventional-changelog -p angular -i CHANGELOG.md -w
```

### GitHub Actions自动生成
```yaml
# .github/workflows/changelog.yml
name: Generate Changelog
on:
  push:
    tags:
      - 'v*'

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate Changelog
        uses: conventional-changelog/action@v1
        with:
          output-file: 'CHANGELOG.md'
          release-count: 0
          token: ${{ secrets.GITHUB_TOKEN }}
```

## 版本发布流程

### 1. 准备发布
```bash
# 更新版本号
npm version 1.4.1 --message "chore: bump version to 1.4.1"

# 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.4.1
```

### 2. 更新变更日志
```bash
# 编辑CHANGELOG.md
# 添加新版本的变更记录
```

### 3. 提交变更
```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.4.1"
git push origin release/v1.4.1
```

### 4. 创建PR
```bash
# 在GitHub上创建PR到main分支
```

### 5. 合并和标记
```bash
# 合并到main分支后
git tag v1.4.1
git push origin v1.4.1
```

### 6. 发布GitHub Release
在GitHub上创建新的Release，包含：
- 版本号和变更日志
- 重要变更的详细说明
- 下载链接（如果适用）
- 升级指南

## 升级指南

每次重大版本更新时请包含：

### 破坏性变更
```markdown
### 破坏性变更 🚨

#### 移除的API端点
- `DELETE /api/v1/old-endpoint` -> 使用 `DELETE /api/v2/new-endpoint`
- `POST /api/v1/deprecated` -> 已在v1.3.0中弃用，将在v2.0.0中移除

#### 配置变更
- 配置文件格式变更，请参考升级指南
- 环境变量命名变更：
  - `OLD_VAR` -> `NEW_VAR`

#### 数据迁移
- 数据库schema更新，需要运行迁移脚本
- 备份数据后执行：`npm run migrate:up`
```

### 升级步骤
```markdown
### 升级指南 📋

#### 从v1.3.x升级到v1.4.0

1. **更新依赖**
   ```bash
   npm update @huanu-canvas/core@^1.4.0
   ```

2. **运行迁移脚本**
   ```bash
   npm run migrate:1.3-to-1.4
   ```

3. **更新配置**
   ```bash
   cp .env.example .env
   # 更新新的配置项
   ```

4. **重启服务**
   ```bash
   npm run restart
   ```

#### 验证升级
- 确认所有功能正常工作
- 运行测试套件：`npm test`
- 检查日志中无错误信息
```

## 示例变更日志

参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 的完整示例。

---

**注意事项**:
- 保持变更日志准确和简洁
- 每个版本都应包含发布日期
- 变更按类型分组，按重要程度排序
- 为每个变更提供足够的上下文
- 包括相关的Issue和PR链接
- 保持一致的风格和格式