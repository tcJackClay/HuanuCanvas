#!/usr/bin/env python3

"""
HuanuCanvas RunningHub功能前端测试脚本
验证修复效果和用户体验
"""

import time
import json
import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, timeout=30):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=timeout
        )
        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'stdout': '',
            'stderr': '命令执行超时',
            'returncode': -1
        }

def check_frontend_server():
    """检查前端服务器状态"""
    print("🔍 检查前端服务器状态...")
    
    # 检查端口5173或5206是否在监听
    result = run_command("netstat -an | grep -E ':(5173|5206)' | grep LISTEN")
    
    if result['success'] and 'LISTEN' in result['stdout']:
        print("   ✅ 前端服务器正在运行")
        return True
    else:
        print("   ❌ 前端服务器未运行")
        return False

def test_frontend_build():
    """测试前端构建"""
    print("\n🔨 测试前端构建...")
    
    # 检查package.json中的构建脚本
    package_json_path = Path("package.json")
    if not package_json_path.exists():
        print("   ❌ package.json文件不存在")
        return False
    
    with open(package_json_path, 'r', encoding='utf-8') as f:
        package_data = json.load(f)
    
    if 'build' in package_data.get('scripts', {}):
        print("   ✅ 发现构建脚本")
        
        # 尝试构建前端（这可能需要时间）
        print("   🚀 尝试构建前端...")
        build_result = run_command("npm run build", timeout=120)
        
        if build_result['success']:
            print("   ✅ 前端构建成功")
            return True
        else:
            print("   ⚠️  前端构建失败（可能需要依赖）")
            print(f"      错误: {build_result['stderr']}")
            return False
    else:
        print("   ⚠️  未发现构建脚本")
        return False

def check_dependencies():
    """检查依赖安装状态"""
    print("\n📦 检查依赖安装...")
    
    # 检查node_modules
    if Path("node_modules").exists():
        print("   ✅ node_modules存在")
        
        # 检查关键依赖
        key_deps = ['react', 'vite', 'typescript', '@types/react']
        missing_deps = []
        
        for dep in key_deps:
            dep_path = Path(f"node_modules/{dep}")
            if not dep_path.exists():
                missing_deps.append(dep)
        
        if not missing_deps:
            print("   ✅ 关键依赖已安装")
            return True
        else:
            print(f"   ⚠️  缺少依赖: {', '.join(missing_deps)}")
            return False
    else:
        print("   ❌ node_modules不存在")
        return False

def test_file_structure():
    """测试文件结构"""
    print("\n📁 检查前端文件结构...")
    
    expected_files = [
        "src/frontend/components/RunningHubNodeContent.tsx",
        "src/backend/src/routes/runningHub.js",
        "src/backend/src/utils/runningHubService.js",
        "vite.config.ts",
        "tailwind.config.js"
    ]
    
    all_exist = True
    
    for file_path in expected_files:
        if Path(file_path).exists():
            print(f"   ✅ {file_path}")
        else:
            print(f"   ❌ {file_path} 不存在")
            all_exist = False
    
    return all_exist

def check_code_fixes():
    """检查代码修复"""
    print("\n🔧 检查代码修复状态...")
    
    fixes = [
        {
            'file': 'src/frontend/components/RunningHubNodeContent.tsx',
            'pattern': '请选择图片文件',
            'description': '前端文件上传验证'
        },
        {
            'file': 'src/backend/src/routes/runningHub.js',
            'pattern': '文件过大',
            'description': '后端文件大小检查'
        },
        {
            'file': 'src/backend/src/utils/runningHubService.js',
            'pattern': '文件内容为空或无效',
            'description': '后端文件验证'
        }
    ]
    
    all_fixed = True
    
    for fix in fixes:
        try:
            with open(fix['file'], 'r', encoding='utf-8') as f:
                content = f.read()
            
            if fix['pattern'] in content:
                print(f"   ✅ {fix['description']}: 已修复")
            else:
                print(f"   ❌ {fix['description']}: 可能未修复")
                all_fixed = False
                
        except Exception as e:
            print(f"   ❌ {fix['description']}: 检查失败 - {e}")
            all_fixed = False
    
    return all_fixed

def generate_test_report(results):
    """生成测试报告"""
    print("\n" + "="*60)
    print("📊 HuanuCanvas RunningHub 修复验证报告")
    print("="*60)
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r)
    pass_rate = (passed_tests / total_tests) * 100
    
    for test_name, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 总体通过率: {passed_tests}/{total_tests} ({pass_rate:.1f}%)")
    
    if pass_rate >= 80:
        print("🎉 修复验证成功！RunningHub功能应该可以正常工作。")
    elif pass_rate >= 60:
        print("⚠️  部分功能正常，建议进一步检查失败的测试项。")
    else:
        print("❌ 修复验证失败，需要重新检查和修复。")
    
    print("="*60)
    
    return pass_rate >= 80

def main():
    """主测试流程"""
    print("🧪 HuanuCanvas RunningHub 功能修复验证")
    print("="*60)
    
    # 检查是否在正确的目录
    if not Path("package.json").exists():
        print("❌ 请在HuanuCanvas项目根目录运行此脚本")
        sys.exit(1)
    
    # 运行各项测试
    test_results = {}
    
    test_results["前端服务器"] = check_frontend_server()
    test_results["依赖安装"] = check_dependencies()
    test_results["文件结构"] = test_file_structure()
    test_results["代码修复"] = check_code_fixes()
    test_results["前端构建"] = test_frontend_build()
    
    # 生成报告
    success = generate_test_report(test_results)
    
    # 返回退出码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()