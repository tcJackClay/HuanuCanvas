#!/bin/bash

# GitFlow自动化脚本
# 用于HuanuCanvas项目的GitFlow工作流管理

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "HuanuCanvas GitFlow管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  init-flow           初始化GitFlow分支结构"
    echo "  start-feature       开始新功能分支"
    echo "  finish-feature      完成功能分支并合并"
    echo "  start-hotfix        开始热修复分支"
    echo "  finish-hotfix       完成热修复分支"
    echo "  start-release       开始发布分支"
    echo "  finish-release      完成发布分支"
    echo "  cleanup             清理已合并的分支"
    echo "  status              显示分支状态"
    echo "  sync                同步最新变更"
    echo ""
    echo "选项:"
    echo "  -h, --help         显示此帮助信息"
    echo "  -v, --verbose      详细输出"
    echo ""
    echo "示例:"
    echo "  $0 init-flow"
    echo "  $0 start-feature user-authentication"
    echo "  $0 finish-feature"
    echo "  $0 start-hotfix security-patch"
    echo "  $0 cleanup"
}

# 检查Git仓库
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "当前目录不是Git仓库"
        exit 1
    fi
}

# 检查远程仓库
check_remote() {
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_error "未找到origin远程仓库"
        exit 1
    fi
}

# 初始化GitFlow
init_flow() {
    print_info "初始化GitFlow分支结构..."
    
    # 确保在main分支
    git checkout main 2>/dev/null || git checkout -b main
    
    # 创建develop分支
    if git show-ref --verify --quiet refs/remotes/origin/develop; then
        git checkout develop
        print_success "develop分支已存在"
    else
        git checkout -b develop
        git push -u origin develop
        print_success "创建并推送develop分支"
    fi
    
    # 切换回main
    git checkout main
    
    print_success "GitFlow初始化完成"
    print_info "分支结构:"
    echo "  main    - 生产环境分支"
    echo "  develop - 开发集成分支"
    echo ""
    print_info "支持的分支类型:"
    echo "  feature/* - 功能开发分支"
    echo "  hotfix/*  - 紧急修复分支"
    echo "  release/* - 发布准备分支"
}

# 开始新功能
start_feature() {
    local feature_name=$1
    
    if [[ -z "$feature_name" ]]; then
        print_error "请提供功能分支名称"
        echo "示例: $0 start-feature user-authentication"
        exit 1
    fi
    
    print_info "开始新功能分支: feature/$feature_name"
    
    # 确保在develop分支
    git checkout develop
    git pull origin develop
    
    # 创建功能分支
    local branch_name="feature/$feature_name"
    git checkout -b "$branch_name"
    git push -u origin "$branch_name"
    
    print_success "功能分支 $branch_name 已创建并推送"
    print_info "开发完成后使用: $0 finish-feature $feature_name"
}

# 完成功能分支
finish_feature() {
    local feature_name=$1
    
    if [[ -z "$feature_name" ]]; then
        # 自动检测当前功能分支
        local current_branch=$(git branch --show-current)
        if [[ $current_branch =~ ^feature/ ]]; then
            feature_name=${current_branch#feature/}
        else
            print_error "请提供功能分支名称或切换到功能分支"
            echo "示例: $0 finish-feature user-authentication"
            exit 1
        fi
    fi
    
    local branch_name="feature/$feature_name"
    
    print_info "完成功能分支: $branch_name"
    
    # 检查分支是否存在
    if ! git show-ref --verify --quiet refs/remotes/origin/"$branch_name"; then
        print_error "分支 $branch_name 不存在"
        exit 1
    fi
    
    # 切换到develop分支
    git checkout develop
    git pull origin develop
    
    # 合并功能分支
    git merge --no-ff "$branch_name"
    
    # 删除本地和远程分支
    git branch -d "$branch_name"
    git push origin --delete "$branch_name"
    
    # 推送develop分支
    git push origin develop
    
    print_success "功能分支 $branch_name 已完成并合并"
}

# 开始热修复
start_hotfix() {
    local hotfix_name=$1
    
    if [[ -z "$hotfix_name" ]]; then
        print_error "请提供热修复分支名称"
        echo "示例: $0 start-hotfix security-patch"
        exit 1
    fi
    
    print_info "开始热修复分支: hotfix/$hotfix_name"
    
    # 确保在main分支
    git checkout main
    git pull origin main
    
    # 创建热修复分支
    local branch_name="hotfix/$hotfix_name"
    git checkout -b "$branch_name"
    git push -u origin "$branch_name"
    
    print_success "热修复分支 $branch_name 已创建并推送"
    print_info "修复完成后使用: $0 finish-hotfix $hotfix_name"
}

# 完成热修复
finish_hotfix() {
    local hotfix_name=$1
    
    if [[ -z "$hotfix_name" ]]; then
        # 自动检测当前热修复分支
        local current_branch=$(git branch --show-current)
        if [[ $current_branch =~ ^hotfix/ ]]; then
            hotfix_name=${current_branch#hotfix/}
        else
            print_error "请提供热修复分支名称或切换到热修复分支"
            echo "示例: $0 finish-hotfix security-patch"
            exit 1
        fi
    fi
    
    local branch_name="hotfix/$hotfix_name"
    
    print_info "完成热修复分支: $branch_name"
    
    # 检查分支是否存在
    if ! git show-ref --verify --quiet refs/remotes/origin/"$branch_name"; then
        print_error "分支 $branch_name 不存在"
        exit 1
    fi
    
    # 切换到main分支
    git checkout main
    git pull origin main
    
    # 合并热修复分支
    git merge --no-ff "$branch_name"
    
    # 删除分支
    git branch -d "$branch_name"
    git push origin --delete "$branch_name"
    
    # 推送到远程
    git push origin main
    
    print_success "热修复分支 $branch_name 已完成并合并到main"
}

# 开始发布
start_release() {
    local version=$1
    
    if [[ -z "$version" ]]; then
        print_error "请提供发布版本号"
        echo "示例: $0 start-release v1.5.0"
        exit 1
    fi
    
    print_info "开始发布分支: release/$version"
    
    # 确保在develop分支
    git checkout develop
    git pull origin develop
    
    # 创建发布分支
    local branch_name="release/$version"
    git checkout -b "$branch_name"
    git push -u origin "$branch_name"
    
    print_success "发布分支 $branch_name 已创建并推送"
    print_info "发布完成后使用: $0 finish-release $version"
}

# 完成发布
finish_release() {
    local version=$1
    
    if [[ -z "$version" ]]; then
        print_error "请提供发布版本号"
        echo "示例: $0 finish-release v1.5.0"
        exit 1
    fi
    
    local branch_name="release/$version"
    
    print_info "完成发布分支: $branch_name"
    
    # 检查分支是否存在
    if ! git show-ref --verify --quiet refs/remotes/origin/"$branch_name"; then
        print_error "分支 $branch_name 不存在"
        exit 1
    fi
    
    # 合并到main
    git checkout main
    git pull origin main
    git merge --no-ff "$branch_name"
    
    # 合并到develop
    git checkout develop
    git pull origin develop
    git merge --no-ff "$branch_name"
    
    # 创建标签
    git tag -a "$version" -m "Release $version"
    git push origin "$version"
    
    # 删除分支
    git branch -d "$branch_name"
    git push origin --delete "$branch_name"
    
    # 推送更改
    git push origin main develop
    
    print_success "发布 $version 已完成"
}

# 清理分支
cleanup() {
    print_info "清理已合并的分支..."
    
    # 同步远程分支
    git remote prune origin
    
    # 获取已合并到develop的分支
    local merged_branches=$(git branch --merged develop | grep -v "\\*\\|develop\\|main" | tr -d ' ')
    
    if [[ -z "$merged_branches" ]]; then
        print_success "没有需要清理的分支"
        return
    fi
    
    # 删除本地分支
    for branch in $merged_branches; do
        git branch -d "$branch" 2>/dev/null && print_success "已删除本地分支: $branch" || print_warning "无法删除本地分支: $branch"
    done
    
    # 获取远程已合并的分支
    print_info "远程分支清理需要在GitHub网页界面手动执行"
    print_info "请访问: https://github.com/tcJackClay/HuanuCanvas/branches"
}

# 显示分支状态
show_status() {
    print_info "当前分支状态:"
    echo ""
    
    # 当前分支
    local current_branch=$(git branch --show-current)
    echo "当前分支: $current_branch"
    
    # 本地分支
    echo ""
    echo "本地分支:"
    git branch -v
    
    # 远程分支
    echo ""
    echo "远程分支:"
    git branch -r -v
    
    # 未推送的提交
    echo ""
    echo "未推送到远程的提交:"
    git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null || echo "无未推送的提交"
    
    # 领先/落后远程分支的情况
    echo ""
    echo "分支同步状态:"
    git status -uno --porcelain=v1 --branch | head -5
}

# 同步最新变更
sync_changes() {
    print_info "同步最新变更..."
    
    local current_branch=$(git branch --show-current)
    
    if [[ "$current_branch" == "main" ]]; then
        git checkout main
        git pull origin main
        print_success "main分支已同步"
    elif [[ "$current_branch" == "develop" ]]; then
        git checkout develop
        git pull origin develop
        print_success "develop分支已同步"
    else
        # 功能分支，先同步develop
        git checkout develop
        git pull origin develop
        
        # 再回到当前分支
        git checkout "$current_branch"
        git rebase develop
        
        print_success "当前分支已同步到develop的最新变更"
    fi
}

# 主函数
main() {
    check_git_repo
    check_remote
    
    case "${1:-}" in
        init-flow)
            init_flow
            ;;
        start-feature)
            start_feature "$2"
            ;;
        finish-feature)
            finish_feature "$2"
            ;;
        start-hotfix)
            start_hotfix "$2"
            ;;
        finish-hotfix)
            finish_hotfix "$2"
            ;;
        start-release)
            start_release "$2"
            ;;
        finish-release)
            finish_release "$2"
            ;;
        cleanup)
            cleanup
            ;;
        status)
            show_status
            ;;
        sync)
            sync_changes
            ;;
        -h|--help)
            show_help
            ;;
        *)
            print_error "未知命令: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"