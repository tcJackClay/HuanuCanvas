# 标签系统配置

## 📋 GitHub标签定义

为HuanuCanvas项目创建标签时，请遵循以下命名规范和颜色方案。

## 🏷️ 标签分类

### 优先级标签 (Priority)
| 标签名称 | 颜色 | 用途 | GitHub CLI命令 |
|---------|------|------|---------------|
| `priority: P0` | 🔴 #ff4444 | 紧急问题，需要立即处理 | `gh label create "priority: P0" --color "#ff4444" --description "紧急问题"` |
| `priority: P1` | 🟠 #ff9500 | 高优先级问题 | `gh label create "priority: P1" --color "#ff9500" --description "高优先级"` |
| `priority: P2` | 🟡 #ffeb3b | 中等优先级 | `gh label create "priority: P2" --color "#ffeb3b" --description "中等优先级"` |
| `priority: P3` | 🟢 #4caf50 | 低优先级 | `gh label create "priority: P3" --color "#4caf50" --description "低优先级"` |

### 变更类型标签 (Type)
| 标签名称 | 颜色 | 用途 | GitHub CLI命令 |
|---------|------|------|---------------|
| `type: feature` | 🟦 #0075ca | 新功能请求 | `gh label create "type: feature" --color "#0075ca" --description "新功能"` |
| `type: bug` | 🔴 #d73a4a | Bug报告 | `gh label create "type: bug" --color "#d73a4a" --description "Bug报告"` |
| `type: enhancement` | 🟢 #91d5ff | 功能改进 | `gh label create "type: enhancement" --color "#91d5ff" --description "功能改进"` |
| `type: documentation` | 🟡 #fef2c0 | 文档相关 | `gh label create "type: documentation" --color "#fef2c0" --description "文档相关"` |
| `type: refactor` | 🟠 #fbca04 | 代码重构 | `gh label create "type: refactor" --color "#fbca04" --description "代码重构"` |
| `type: test` | 🟣 #c8d5b9 | 测试相关 | `gh label create "type: test" --color "#c8d5b9" --description "测试相关"` |
| `type: chore` | ⚪ #cfd3d7 | 工具/构建/辅助 | `gh label create "type: chore" --color "#cfd3d7" --description "工具/构建/辅助"` |

### 状态标签 (Status)
| 标签名称 | 颜色 | 用途 | GitHub CLI命令 |
|---------|------|------|---------------|
| `status: help wanted` | 🟢 #008672 | 需要帮助 | `gh label create "status: help wanted" --color "#008672" --description "需要社区帮助"` |
| `status: good first issue` | 🟢 #7057ff | 适合新手 | `gh label create "status: good first issue" --color "#7057ff" --description "适合初次贡献者"` |
| `status: wontfix` | ⚫ #ffffff | 不会修复 | `gh label create "status: wontfix" --color "#ffffff" --description "不会修复"` |
| `status: duplicate` | ⚪ #cfd3d7 | 重复问题 | `gh label create "status: duplicate" --color "#cfd3d7" --description "重复问题"` |
| `status: invalid` | 🔴 #e6e6e6 | 无效问题 | `gh label create "status: invalid" --color "#e6e6e6" --description "无效问题"` |

### 模块标签 (Component)
| 标签名称 | 颜色 | 用途 | GitHub CLI命令 |
|---------|------|------|---------------|
| `component: frontend` | 🟦 #0366d6 | 前端相关 | `gh label create "component: frontend" --color "#0366d6" --description "前端代码"` |
| `component: backend` | 🟢 #28a745 | 后端相关 | `gh label create "component: backend" --color "#28a745" --description "后端API"` |
| `component: electron` | 🟣 #6f42c1 | Electron应用 | `gh label create "component: electron" --color "#6f42c1" --description "Electron应用"` |
| `component: canvas` | 🟠 #ff8c00 | Canvas编辑器 | `gh label create "component: canvas" --color "#ff8c00" --description "画布编辑器"` |
| `component: ai` | 🟡 #ffd700 | AI功能 | `gh label create "component: ai" --color "#ffd700" --description "AI相关功能"` |
| `component: auth` | 🔵 #1b7c83 | 身份认证 | `gh label create "component: auth" --color "#1b7c83" --description "身份认证"` |
| `component: deployment` | 🟤 #795548 | 部署相关 | `gh label create "component: deployment" --color "#795548" --description "部署相关"` |
| `component: ci-cd` | 🔄 #0099cc | CI/CD相关 | `gh label create "component: ci-cd" --color "#0099cc" --description "CI/CD相关"` |

### 难度标签 (Difficulty)
| 标签名称 | 颜色 | 用途 | GitHub CLI命令 |
|---------|------|------|---------------|
| `difficulty: easy` | 🟢 #28a745 | 简单任务 | `gh label create "difficulty: easy" --color "#28a745" --description "简单任务"` |
| `difficulty: medium` | 🟡 #fbca04 | 中等难度 | `gh label create "difficulty: medium" --color "#fbca04" --description "中等难度"` |
| `difficulty: hard` | 🟠 #ff8c00 | 高难度 | `gh label create "difficulty: hard" --color "#ff8c00" --description "高难度"` |
| `difficulty: expert` | 🔴 #d73a4a | 专家级 | `gh label create "difficulty: expert" --color "#d73a4a" --description "专家级任务"` |

### 影响的版本标签 (Version)
| 标签名称 | 颜色 | 用途 | GitHub CLI命令 |
|---------|------|------|---------------|
| `version: 1.0.x` | 🔵 #0366d6 | 1.0.x版本相关 | `gh label create "version: 1.0.x" --color "#0366d6" --description "1.0.x版本"` |
| `version: 1.1.x` | 🟢 #28a745 | 1.1.x版本相关 | `gh label create "version: 1.1.x" --color "#28a745" --description "1.1.x版本"` |
| `version: 2.0.x` | 🟣 #6f42c1 | 2.0.x版本相关 | `gh label create "version: 2.0.x" --color "#6f42c1" --description "2.0.x版本"` |

## 🚀 批量创建标签脚本

您可以使用以下GitHub CLI命令批量创建标签:

```bash
# 设置仓库所有者变量
export REPO_OWNER="tcJackClay"
export REPO_NAME="HuanuCanvas"

# 优先级标签
gh label create "priority: P0" --color "#ff4444" --description "紧急问题" --repo $REPO_OWNER/$REPO_NAME
gh label create "priority: P1" --color "#ff9500" --description "高优先级" --repo $REPO_OWNER/$REPO_NAME
gh label create "priority: P2" --color "#ffeb3b" --description "中等优先级" --repo $REPO_OWNER/$REPO_NAME
gh label create "priority: P3" --color "#4caf50" --description "低优先级" --repo $REPO_OWNER/$REPO_NAME

# 变更类型标签
gh label create "type: feature" --color "#0075ca" --description "新功能" --repo $REPO_OWNER/$REPO_NAME
gh label create "type: bug" --color "#d73a4a" --description "Bug报告" --repo $REPO_OWNER/$REPO_NAME
gh label create "type: enhancement" --color "#91d5ff" --description "功能改进" --repo $REPO_OWNER/$REPO_NAME
gh label create "type: documentation" --color "#fef2c0" --description "文档相关" --repo $REPO_OWNER/$REPO_NAME
gh label create "type: refactor" --color "#fbca04" --description "代码重构" --repo $REPO_OWNER/$REPO_NAME
gh label create "type: test" --color "#c8d5b9" --description "测试相关" --repo $REPO_OWNER/$REPO_NAME
gh label create "type: chore" --color "#cfd3d7" --description "工具/构建/辅助" --repo $REPO_OWNER/$REPO_NAME

# 状态标签
gh label create "status: help wanted" --color "#008672" --description "需要社区帮助" --repo $REPO_OWNER/$REPO_NAME
gh label create "status: good first issue" --color "#7057ff" --description "适合初次贡献者" --repo $REPO_OWNER/$REPO_NAME
gh label create "status: wontfix" --color "#ffffff" --description "不会修复" --repo $REPO_OWNER/$REPO_NAME
gh label create "status: duplicate" --color "#cfd3d7" --description "重复问题" --repo $REPO_OWNER/$REPO_NAME
gh label create "status: invalid" --color "#e6e6e6" --description "无效问题" --repo $REPO_OWNER/$REPO_NAME

# 模块标签
gh label create "component: frontend" --color "#0366d6" --description "前端代码" --repo $REPO_OWNER/$REPO_NAME
gh label create "component: backend" --color "#28a745" --description "后端API" --repo $REPO_OWNER/$REPO_NAME
gh label create "component: electron" --color "#6f42c1" --description "Electron应用" --repo $REPO_OWNER/$REPO_NAME
gh label create "component: canvas" --color "#ff8c00" --description "画布编辑器" --repo $REPO_OWNER/$REPO_NAME
gh label create "component: ai" --color "#ffd700" --description "AI相关功能" --repo $REPO_OWNER/$REPO_NAME
gh label create "component: auth" --color "#1b7c83" --description "身份认证" --repo $REPO_OWNER/$REPO_NAME
gh label create "component: deployment" --color "#795548" --description "部署相关" --repo $REPO_OWNER/$REPO_NAME
gh label create "component: ci-cd" --color "#0099cc" --description "CI/CD相关" --repo $REPO_OWNER/$REPO_NAME

# 难度标签
gh label create "difficulty: easy" --color "#28a745" --description "简单任务" --repo $REPO_OWNER/$REPO_NAME
gh label create "difficulty: medium" --color "#fbca04" --description "中等难度" --repo $REPO_OWNER/$REPO_NAME
gh label create "difficulty: hard" --color "#ff8c00" --description "高难度" --repo $REPO_OWNER/$REPO_NAME
gh label create "difficulty: expert" --color "#d73a4a" --description "专家级任务" --repo $REPO_OWNER/$REPO_NAME

# 版本标签
gh label create "version: 1.0.x" --color "#0366d6" --description "1.0.x版本" --repo $REPO_OWNER/$REPO_NAME
gh label create "version: 1.1.x" --color "#28a745" --description "1.1.x版本" --repo $REPO_OWNER/$REPO_NAME
gh label create "version: 2.0.x" --color "#6f42c1" --description "2.0.x版本" --repo $REPO_OWNER/$REPO_NAME
```

## 📊 标签使用指南

### 创建Issue时
1. **必须添加类型标签**: `type: feature`, `type: bug`, `type: enhancement`, `type: documentation`
2. **添加优先级标签**: `priority: P0-P3`
3. **添加相关模块标签**: `component: frontend`, `component: backend`等
4. **添加难度标签** (如适用): `difficulty: easy`, `difficulty: medium`等

### 创建PR时
1. **添加类型标签**: 根据PR内容选择合适的类型标签
2. **添加模块标签**: 根据修改的代码选择相关模块
3. **添加版本标签**: 如涉及特定版本问题

### Issue/PR管理
1. **分类管理**: 使用标签快速筛选和分类Issue/PR
2. **工作流**: 结合Projects使用标签管理开发进度
3. **报告**: 使用标签生成项目进度报告

## 🎯 标签最佳实践

### 命名规范
- 使用小写字母
- 使用冒号分隔标签类别和值
- 保持标签名称简洁明了
- 避免拼写错误

### 颜色规范
- **红色系**: 紧急/高优先级
- **橙色系**: 中等优先级/中等难度
- **黄色系**: 中等优先级/一般问题
- **绿色系**: 低优先级/简单任务
- **蓝色系**: 功能相关
- **紫色系**: 特殊功能
- **灰色系**: 状态相关

### 标签维护
- **定期清理**: 定期检查并清理不使用的标签
- **统一规范**: 新增标签时遵循现有的颜色和命名规范
- **团队共识**: 新增重要标签前与团队讨论
- **文档更新**: 标签变更时及时更新此文档

## 🔗 相关资源

- [GitHub Labels文档](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
- [GitHub CLI label命令](https://cli.github.com/manual/gh_label)
- [HuanuCanvas Issue模板](./ISSUE_TEMPLATE/)
- [HuanuCanvas PR模板](../pull_request_template.md)

---

**注意**: 创建标签后，请通知团队成员新标签的使用方法，并更新此文档。