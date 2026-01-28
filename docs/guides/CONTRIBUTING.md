# 🤝 贡献指南

欢迎为HuanuCanvas项目贡献代码！本指南将帮助您了解如何参与项目开发。

## 📋 目录

- [行为准则](#行为准则)
- [开始贡献](#开始贡献)
- [开发环境设置](#开发环境设置)
- [GitFlow工作流](#gitflow工作流)
- [代码规范](#代码规范)
- [测试要求](#测试要求)
- [Pull Request流程](#pull-request流程)
- [Issue报告](#issue报告)
- [安全报告](#安全报告)
- [社区参与](#社区参与)

## 📜 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺，无论年龄、体型、残疾、种族、性别认同、经验水平、教育、社会经济地位、国籍、个人外表、种族、宗教或性认同和取向，都让每个人在我们的项目和社区中享受无骚扰的体验。

### 我们的标准

有助于创造积极环境的行为包括:
- ✅ 使用友好和包容的语言
- ✅ 尊重不同的观点和经验
- ✅ 优雅地接受建设性批评
- ✅ 专注于对社区最有利的事情
- ✅ 对其他社区成员表示同理心

不可接受的行为包括:
- ❌ 使用性化的语言或图像
- ❌ 恶意评论、人身攻击或政治攻击
- ❌ 公开或私下的骚扰
- ❌ 未经明确许可发布他人的私人信息
- ❌ 在专业环境中可能被合理认为不当的行为

## 🚀 开始贡献

### 贡献方式

您可以通过以下方式为项目做出贡献:

- 🐛 **报告Bug**: 报告发现的问题
- ✨ **建议功能**: 提出新功能想法
- 📚 **改进文档**: 完善项目文档
- 💻 **代码贡献**: 提交代码修复或新功能
- 🧪 **测试**: 帮助测试新功能
- 🌐 **本地化**: 参与翻译工作
- 📢 **推广**: 帮助推广项目

### 贡献前须知

在开始贡献之前，请:

1. **阅读文档**: 了解项目的架构和设计理念
2. **查看现有Issue**: 检查是否已经有人报告或正在处理
3. **遵循规范**: 了解项目的代码规范和工作流
4. **小步开始**: 首次贡献建议从简单的任务开始

## 🛠️ 开发环境设置

### 系统要求

- **Node.js**: >= 21.0.0
- **npm**: >= 10.0.0
- **Git**: 了解GitFlow工作流
- **操作系统**: Windows, macOS, Linux

### 快速设置

```bash
# 1. Fork并克隆仓库
git clone https://github.com/tcJackClay/HuanuCanvas.git
cd HuanuCanvas

# 2. 安装依赖
npm install

# 3. 设置环境变量
cp .env.example .env
# 编辑.env文件，填入必要的配置

# 4. 初始化GitFlow
chmod +x scripts/gitflow.sh
./scripts/gitflow.sh init-flow

# 5. 启动开发服务器
npm run dev
```

### 开发工具推荐

- **IDE**: VS Code (推荐配置)
- **扩展**: ESLint, Prettier, TypeScript
- **Git客户端**: SourceTree, GitKraken (可选)

## 🔄 GitFlow工作流

我们采用标准的GitFlow分支策略:

### 分支结构

- **main**: 生产环境分支
- **develop**: 开发集成分支  
- **feature/***: 功能开发分支
- **hotfix/***: 紧急修复分支
- **release/***: 发布准备分支

### 开发流程

```bash
# 1. 开始新功能
./scripts/gitflow.sh start-feature new-feature

# 2. 开发工作
# ... 修改代码 ...
git add .
git commit -m "feat: add new feature"

# 3. 推送到远程
git push origin feature/new-feature

# 4. 创建Pull Request到develop分支
```

详细流程请参考: [GitFlow管理指南](./GITFLOW_GUIDE.md)

## 📝 代码规范

### 代码风格

- **格式化**: 使用Prettier自动格式化
- **Linting**: 遵循ESLint规则
- **TypeScript**: 严格类型检查
- **命名规范**: 清晰的变量和函数命名

### 提交消息规范

遵循[约定式提交](https://www.conventionalcommits.org/)规范:

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```bash
git commit -m "feat(auth): add JWT authentication

Implement JWT-based authentication system with refresh token support, including login, logout, and token refresh endpoints.

Closes #123"
```

### 代码注释

- **复杂逻辑**: 添加必要注释
- **API函数**: 完整的JSDoc注释
- **组件**: React组件的Props说明
- **TODO/FIXME**: 使用标准格式

## 🧪 测试要求

### 测试标准

- **单元测试覆盖率**: >= 80%
- **集成测试**: 关键功能必须测试
- **E2E测试**: 核心用户流程测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm run test:unit
npm run test:integration
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

### 测试最佳实践

1. **先写测试**: 采用TDD方法
2. **测试独立性**: 每个测试应该独立
3. **清晰的测试名**: 测试名称应该描述清楚
4. **边界测试**: 测试边界条件和异常情况

## 📤 Pull Request流程

### 创建PR前检查

在创建PR之前，请确保:

- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 提交消息符合规范
- [ ] 文档已更新
- [ ] 自测完成

### PR要求

1. **清晰的标题**: 描述PR的目的
2. **详细描述**: 使用PR模板填写详细信息
3. **相关标签**: 添加合适的标签
4. **关联Issue**: 链接相关的Issue

### 代码审查

- **审查时间**: 通常在24小时内
- **审查重点**: 代码质量、功能实现、测试覆盖
- **反馈处理**: 及时回复审查意见

## 🐛 Issue报告

### Bug报告

使用[Bug报告模板](./ISSUE_TEMPLATE/bug_report.md)报告Bug，包括:

- 详细的问题描述
- 重现步骤
- 预期vs实际行为
- 环境信息
- 相关截图

### 功能请求

使用[功能请求模板](./ISSUE_TEMPLATE/feature_request.md)请求新功能:

- 功能描述
- 用户故事
- 技术考虑
- 优先级评估

### 问题咨询

使用[问题咨询模板](./ISSUE_TEMPLATE/question.md)寻求帮助:

- 清晰的问题描述
- 已尝试的解决方案
- 相关背景信息

## 🔒 安全报告

### 安全漏洞报告

如果您发现了安全漏洞，请:

1. **不要**公开报告安全问题
2. 通过私信或邮件私下报告
3. 提供详细的漏洞信息
4. 协助我们进行修复

### 安全最佳实践

- 不在代码中硬编码密钥
- 使用环境变量管理敏感信息
- 遵循OWASP安全指南
- 定期更新依赖包

## 🌟 社区参与

### 参与讨论

- **GitHub Discussions**: 参与项目讨论
- **Issue讨论**: 在相关Issue下讨论
- **Slack频道**: 实时交流 (如有)

### 社区指导

- **新手友好**: 帮助初次贡献者
- **知识分享**: 分享经验和最佳实践
- **建设性反馈**: 提供有益的批评和建议

### 认可贡献

- **Contributors**: 所有贡献者都会在README中列出
- **致谢**: 重大贡献会在Release Notes中特别致谢
- **维护者**: 长期贡献者有机会成为项目维护者

## 📞 获取帮助

如果您需要帮助:

1. **查看文档**: 仔细阅读项目文档
2. **搜索Issue**: 查看是否有类似问题
3. **创建Issue**: 使用问题咨询模板
4. **社区支持**: 寻求社区帮助

## 📋 检查清单

### 贡献前
- [ ] 阅读了贡献指南
- [ ] 设置了开发环境
- [ ] 了解了GitFlow工作流
- [ ] 确认了代码规范

### 开发中
- [ ] 遵循分支命名规范
- [ ] 编写了测试
- [ ] 运行了代码检查
- [ ] 编写了清晰的提交消息

### 提交前
- [ ] 自测完成
- [ ] 所有测试通过
- [ ] 代码格式化完成
- [ ] 更新了相关文档

### 创建PR时
- [ ] 使用了PR模板
- [ ] 添加了相关标签
- [ ] 关联了相关Issue
- [ ] 提供了清晰的描述

## 📚 相关资源

- [项目README](./README.md)
- [GitFlow管理指南](./GITFLOW_GUIDE.md)
- [分支保护指南](./BRANCH_PROTECTION_GUIDE.md)
- [标签系统](./LABELS.md)
- [API文档](./docs/api/)
- [架构文档](./docs/architecture/)

## 🙏 感谢

感谢所有为HuanuCanvas项目做出贡献的开发者！您的贡献让这个项目变得更好。

如果您对贡献有任何疑问，请随时创建Issue或联系项目维护者。

---

**再次欢迎您的贡献！** 🎉