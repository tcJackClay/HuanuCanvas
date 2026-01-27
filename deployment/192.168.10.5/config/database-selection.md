# HuanuCanvas 数据库选择和配置

## 🗄️ 数据库方案对比分析

### 方案A: 继续使用JSON文件 (轻量级)
**推荐指数**: ⭐⭐⭐⭐⭐ (测试环境最佳选择)

#### 优势
- ✅ **零配置**: 无需安装数据库服务器
- ✅ **轻量级**: 适合测试环境，项目规模小
- ✅ **易于备份**: 简单的文件复制
- ✅ **快速部署**: 无需数据库初始化
- ✅ **开发友好**: 易于调试和查看数据

#### 劣势
- ❌ **并发限制**: 不适合高并发场景
- ❌ **事务支持**: 缺乏ACID特性
- ❌ **查询能力**: 复杂查询效率低
- ❌ **扩展性**: 数据量大时性能下降

#### 适用场景
- 测试环境和开发环境
- 用户数据量 < 1000
- 并发用户 < 10
- 简单的CRUD操作

### 方案B: SQLite (结构化数据，零配置)
**推荐指数**: ⭐⭐⭐⭐

#### 优势
- ✅ **零配置**: 无需独立服务器
- ✅ **事务支持**: ACID特性
- ✅ **查询能力**: SQL查询支持
- ✅ **文件数据库**: 单文件存储
- ✅ **性能良好**: 适合中小型应用

#### 劣势
- ❌ **并发限制**: 写入锁限制并发
- ❌ **网络访问**: 不支持远程连接
- ❌ **扩展性**: 适合单机应用

### 方案C: PostgreSQL (生产级别)
**推荐指数**: ⭐⭐

#### 优势
- ✅ **高性能**: 适合生产环境
- ✅ **并发支持**: 优秀的并发处理
- ✅ **功能完整**: 完整的SQL支持
- ✅ **扩展性**: 支持集群和分片

#### 劣势
- ❌ **配置复杂**: 需要专门维护
- ❌ **资源消耗**: 占用较多内存和CPU
- ❌ **过度设计**: 对于测试环境过于复杂

## 🏆 测试环境数据库选择

### 选定方案: SQLite

**选择理由**:
1. **测试环境特性**: 数据量小，并发要求低
2. **零运维成本**: 无需专门DBA
3. **开发效率**: SQL查询便于数据验证
4. **性能足够**: 满足测试环境需求
5. **升级路径**: 可平滑迁移到PostgreSQL

### SQLite配置

#### 目录结构
```
/opt/huanu-canvas/app/data/
├── huanu_canvas_test.db      # 主数据库
├── huanu_canvas_test.db-wal  # 写前日志
├── huanu_canvas_test.db-shm  # 共享内存
└── backups/                  # 数据库备份
    ├── daily/
    └── weekly/
```

#### 数据库初始化脚本
```sql
-- 创建数据库表结构
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    config JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS creative_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_images_project_id ON creative_images(project_id);
```

#### 数据库管理脚本
```bash
#!/bin/bash
# database-manager.sh - SQLite数据库管理

DB_PATH="/opt/huanu-canvas/app/data/huanu_canvas_test.db"
BACKUP_DIR="/opt/huanu-canvas/app/data/backups"

# 初始化数据库
init_database() {
    echo "初始化SQLite数据库..."
    sqlite3 $DB_PATH << EOF
    -- 创建表结构（上面的SQL）
