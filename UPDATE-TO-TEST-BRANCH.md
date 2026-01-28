# HuanuCanvas 现有项目更新到测试环境分支指南

## 🚀 更新指令 (在已有项目目录下执行)

### 方法一：切换到测试环境分支 (推荐)

```bash
# 1. 进入现有项目目录
cd HuanuCanvas

# 2. 拉取最新代码
git fetch origin

# 3. 切换到测试环境分支
git checkout test-environment

# 4. 强制同步到最新版本 (确保获取所有更新)
git reset --hard origin/test-environment

# 5. 清理并重新安装依赖
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 6. 验证更新
bash test-linux-env.sh
```

### 方法二：删除重建 (彻底更新)

```bash
# 1. 备份重要配置 (如果有自定义配置)
cp .env .env.backup
cp .env.local .env.local.backup 2>/dev/null || true

# 2. 删除现有项目
cd ..
rm -rf HuanuCanvas

# 3. 重新克隆测试环境分支
git clone -b test-environment https://github.com/tcJackClay/HuanuCanvas.git
cd HuanuCanvas

# 4. 恢复配置 (如果需要)
cp ../.env.backup .env 2>/dev/null || cp .env.linux .env

# 5. 安装依赖
npm install

# 6. 验证更新
bash test-linux-env.sh
```

### 方法三：合并更新 (保留本地更改)

```bash
# 1. 进入项目目录
cd HuanuCanvas

# 2. 添加远程仓库 (如果还没有)
git remote add origin https://github.com/tcJackClay/HuanuCanvas.git

# 3. 拉取最新代码
git fetch origin

# 4. 查看可用分支
git branch -a

# 5. 创建并切换到测试环境分支 (如果不存在)
git checkout -b test-environment origin/test-environment

# 6. 或者直接切换到远程测试分支
git checkout -t origin/test-environment

# 7. 合并最新的更改
git merge origin/test-environment

# 8. 解决冲突 (如果有)
# 编辑冲突文件，然后:
git add .
git commit -m "resolve merge conflicts"

# 9. 更新依赖
npm install

# 10. 验证更新
bash test-linux-env.sh
```

## 🔍 验证更新成功

### 检查分支状态
```bash
git branch -vv
# 应该显示: * test-environment 26634f8 [ahead 1] docs: 添加Linux环境优化部署状态文档
```

### 检查关键文件
```bash
# 确认配置文件存在
ls -la .npmrc .env.linux install-linux.sh test-linux-env.sh

# 确认package.json已更新
grep -A 20 '"devDependencies":' package.json | grep -E "(electron|vite|@types/node)"
```

### 测试构建
```bash
# 运行环境验证
bash test-linux-env.sh

# 或手动测试
npm run build
npm run dev:linux
```

## ⚠️ 注意事项

1. **备份重要数据**: 在更新前备份自定义配置
2. **网络问题**: 如果下载慢，使用npm镜像:
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```
3. **权限问题**: 如果遇到权限错误:
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```
4. **Python依赖**: 确保安装了Python3和构建工具:
   ```bash
   sudo apt-get install -y build-essential python3
   ```

## 🎯 更新后的优势

- ✅ 兼容Node.js 18.20.8
- ✅ 优化的Electron 31.3.0
- ✅ 国内镜像加速
- ✅ 自动化安装脚本
- ✅ 完整的环境验证
- ✅ 测试环境配置

## 📞 问题排查

如果更新后遇到问题:

1. **清理重装**:
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

2. **检查Node.js版本**:
   ```bash
   node --version  # 应该是 v18.x.x
   npm --version   # 应该是 8.x.x 或更高
   ```

3. **查看详细错误**:
   ```bash
   npm install --verbose
   ```

---
**推荐使用方法一**，既快速又安全！
