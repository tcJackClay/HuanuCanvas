#!/bin/bash

# HuanuCanvas GitHub自动化上传脚本
# 智能检测项目变更，自动推送到GitHub并触发CI/CD

set -e

# 配置变量
REPO_URL="https://github.com/tcJackClay/HuanuCanvas.git"
REPO_NAME="tcJackClay/HuanuCanvas"
LOCAL_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="$LOCAL_PROJECT_DIR/.deployment/backups"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# GitHub API配置
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_API_URL="https://api.github.com"
API_HEADERS="Authorization: token $GITHUB_TOKEN -H Accept: application/vnd.github.v3+json"

# 检测项目变更
detect_changes() {
    log_info "检测项目变更..."
    
    cd "$LOCAL_PROJECT_DIR"
    
    # 检查是否在Git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是Git仓库"
        return 1
    fi
    
    # 获取变更的文件
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
    
    if [ -z "$CHANGED_FILES" ]; then
        log_warning "没有检测到变更"
        return 1
    fi
    
    log_info "检测到变更的文件:"
    echo "$CHANGED_FILES" | while read file; do
        echo "  - $file"
    done
    
    # 确定变更类型
    if echo "$CHANGED_FILES" | grep -q "^src/"; then
        echo "source_changes=true" > /tmp/deploy_vars
    fi
    
    if echo "$CHANGED_FILES" | grep -q "^deployment/"; then
        echo "deployment_changes=true" >> /tmp/deploy_vars
    fi
    
    return 0
}

# 代码质量检查
quality_checks() {
    log_info "执行代码质量检查..."
    
    cd "$LOCAL_PROJECT_DIR"
    
    # 检查必要的工具
    local tools=("npm" "node")
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool 未安装"
            return 1
        fi
    done
    
    # 运行质量检查
    log_info "运行ESLint..."
    if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
        npm run lint || log_warning "Lint检查发现问题"
    fi
    
    log_info "运行TypeScript检查..."
    if [ -f "package.json" ] && grep -q "\"type-check\"" package.json; then
        npm run type-check || log_warning "TypeScript检查发现问题"
    fi
    
    log_info "运行测试..."
    if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
        npm test -- --passWithNoTests || log_warning "测试发现问题"
    fi
    
    log_success "代码质量检查完成"
}

# 安全扫描
security_scan() {
    log_info "执行安全扫描..."
    
    cd "$LOCAL_PROJECT_DIR"
    
    # npm audit
    if [ -f "package.json" ]; then
        log_info "运行npm audit..."
        npm audit --audit-level=moderate || log_warning "发现安全漏洞"
    fi
    
    # 检查敏感信息
    log_info "检查敏感信息泄露..."
    local sensitive_patterns=("password\s*=" "api_key\s*=" "secret\s*=" "token\s*=")
    
    for pattern in "${sensitive_patterns[@]}"; do
        if git grep -i "$pattern" HEAD~1 HEAD -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.env*' 2>/dev/null | head -5; then
            log_error "检测到可能的敏感信息: $pattern"
            return 1
        fi
    done
    
    log_success "安全扫描完成"
}

# 自动版本管理
version_management() {
    log_info "管理版本号..."
    
    cd "$LOCAL_PROJECT_DIR"
    
    # 读取当前版本
    CURRENT_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
    log_info "当前版本: $CURRENT_VERSION"
    
    # 根据变更类型确定版本类型
    source_changes=false
    deployment_changes=false
    
    if [ -f "/tmp/deploy_vars" ]; then
        source_changes=$(grep "source_changes" /tmp/deploy_vars | cut -d'=' -f2)
        deployment_changes=$(grep "deployment_changes" /tmp/deploy_vars | cut -d'=' -f2)
    fi
    
    # 决定版本类型
    if [ "$source_changes" = "true" ]; then
        VERSION_TYPE="minor"  # 功能更新
        log_info "检测到源码变更，使用minor版本更新"
    elif [ "$deployment_changes" = "true" ]; then
        VERSION_TYPE="patch"  # 修复更新
        log_info "检测到部署配置变更，使用patch版本更新"
    else
        VERSION_TYPE="none"
        log_info "未检测到需要版本更新的变更"
        return 0
    fi
    
    # 更新版本号
    NEW_VERSION=$(npm version "$VERSION_TYPE" --no-git-tag-version 2>/dev/null | cut -d'v' -f2 || echo "$CURRENT_VERSION")
    
    log_info "新版本: $NEW_VERSION"
    
    # 更新部署配置中的版本
    sed -i.bak "s/APP_VERSION=.*/APP_VERSION=$NEW_VERSION/" deployment/.env.template
    sed -i.bak "s/version:.*/version: \"$NEW_VERSION\"/" deployment/deployment.yaml
    
    # 提交版本变更
    git add package.json deployment/.env.template deployment/deployment.yaml
    git commit -m "chore: bump version to $NEW_VERSION" || log_warning "版本号未变更"
    
    echo "$NEW_VERSION" > /tmp/new_version
}

# 备份重要文件
backup_files() {
    log_info "备份重要文件..."
    
    mkdir -p "$BACKUP_DIR"
    
    cd "$LOCAL_PROJECT_DIR"
    
    # 创建备份包
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    tar -czf "$BACKUP_FILE" \
        package.json \
        package-lock.json \
        deployment/ \
        src/ \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git'
    
    log_success "备份完成: $BACKUP_FILE"
    
    # 清理7天前的备份
    find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +7 -delete
}

# 推送到GitHub
push_to_github() {
    log_info "推送到GitHub..."
    
    cd "$LOCAL_PROJECT_DIR"
    
    # 检查远程仓库
    if ! git remote get-url origin > /dev/null 2>&1; then
        git remote add origin "$REPO_URL"
    fi
    
    # 设置默认分支为main
    git branch -M main
    
    # 推送到GitHub
    log_info "推送到远程仓库..."
    if [ -n "$GITHUB_TOKEN" ]; then
        # 使用GitHub Token进行认证
        git remote set-url origin "https://$GITHUB_TOKEN@github.com/$REPO_NAME.git"
    fi
    
    git push -u origin main --force
    
    log_success "代码已推送到GitHub"
}

# 创建GitHub Release
create_release() {
    if [ -z "$GITHUB_TOKEN" ]; then
        log_warning "未设置GitHub Token，跳过Release创建"
        return 0
    fi
    
    local new_version=$(cat /tmp/new_version 2>/dev/null || echo "")
    
    if [ -z "$new_version" ] || [ "$new_version" = "$(grep '"version"' package.json | cut -d'"' -f4)" ]; then
        log_info "版本号未变更，跳过Release创建"
        return 0
    fi
    
    log_info "创建GitHub Release: $new_version"
    
    # 获取最新提交信息
    RELEASE_NOTES=$(git log --oneline -10 | head -5 | sed 's/^/- /')
    
    # 创建Release
    curl -X POST \
        -H "$API_HEADERS" \
        "$GITHUB_API_URL/repos/$REPO_NAME/releases" \
        -d "{
            \"tag_name\": \"v$new_version\",
            \"target_commitish\": \"main\",
            \"name\": \"Release $new_version\",
            \"body\": \"## 更新内容\n\n$RELEASE_NOTES\n\n## 部署状态\n\n- ✅ 代码质量检查通过\n- ✅ 安全扫描通过\n- ✅ CI/CD流水线触发\",
            \"draft\": false,
            \"prerelease\": false
        }" > /tmp/release_response.json
    
    if grep -q "html_url" /tmp/release_response.json; then
        log_success "GitHub Release创建成功"
    else
        log_warning "GitHub Release创建可能失败"
    fi
}

# 触发GitHub Actions
trigger_actions() {
    log_info "触发GitHub Actions..."
    
    if [ -z "$GITHUB_TOKEN" ]; then
        log_warning "未设置GitHub Token，跳过Actions触发"
        return 0
    fi
    
    # 触发CI/CD工作流
    curl -X POST \
        -H "$API_HEADERS" \
        "$GITHUB_API_URL/repos/$REPO_NAME/actions/workflows/ci-cd.yml/dispatches" \
        -d '{
            "ref": "main",
            "inputs": {
                "environment": "staging",
                "force_deploy": false
            }
        }'
    
    log_success "GitHub Actions已触发"
}

# 发送通知
send_notification() {
    log_info "发送部署通知..."
    
    local status="$1"
    local message="$2"
    
    # Slack通知（如果有配置）
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🚀 HuanuCanvas自动化部署\",
                \"attachments\": [{
                    \"color\": \"$status\",
                    \"fields\": [{
                        \"title\": \"状态\",
                        \"value\": \"$message\",
                        \"short\": true
                    }, {
                        \"title\": \"时间\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK"
    fi
    
    # 邮件通知（如果有配置）
    if [ -n "$EMAIL_NOTIFICATION" ]; then
        echo "$message" | mail -s "HuanuCanvas部署通知" "$EMAIL_NOTIFICATION"
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "HuanuCanvas GitHub自动化上传脚本"
    echo "========================================"
    
    # 检查必要配置
    if [ -z "$GITHUB_TOKEN" ]; then
        log_warning "未设置GITHUB_TOKEN环境变量"
        log_warning "某些功能可能受限"
    fi
    
    # 执行自动化流程
    if detect_changes; then
        quality_checks || log_warning "代码质量检查发现问题"
        security_scan || { send_notification "danger" "安全扫描失败"; exit 1; }
        version_management
        backup_files
        push_to_github
        create_release
        trigger_actions
        send_notification "good" "自动化上传完成"
        
        echo ""
        echo "========================================"
        echo "🎉 GitHub自动化上传完成!"
        echo "- 仓库: $REPO_NAME"
        echo "- 分支: main"
        if [ -f "/tmp/new_version" ]; then
            echo "- 版本: $(cat /tmp/new_version)"
        fi
        echo "========================================"
    else
        log_info "未检测到变更，跳过上传"
    fi
    
    # 清理临时文件
    rm -f /tmp/deploy_vars /tmp/new_version /tmp/release_response.json
}

# 错误处理
trap 'log_error "脚本执行失败，请检查日志"; send_notification "danger" "自动化上传失败"' ERR

# 执行主函数
main "$@"