#!/usr/bin/env python3
"""
修复导入路径的脚本
"""

import os
import re
from pathlib import Path

def fix_import_paths():
    """修复所有TypeScript文件中的导入路径"""
    
    base_path = Path(r"D:\工作\Huanu\VibeCode\HuanuCanvas\src\frontend")
    
    # 查找所有TypeScript文件
    ts_files = list(base_path.rglob("*.ts")) + list(base_path.rglob("*.tsx"))
    
    print(f"找到 {len(ts_files)} 个TypeScript文件")
    
    # 定义路径修复规则
    fix_rules = [
        # API导入路径修复
        (r"from ['\"]([^'\"]*)services/api/([^'\"]*)['\"]", r"from '\1services/original-services/api/\2'"),
        # canvas API 特殊处理
        (r"from ['\"]\.\./services/api/canvas['\"]", r"from '../services/original-services/api/canvas'"),
        # 其他服务API
        (r"from ['\"]\.\./services/api/files['\"]", r"from '../services/original-services/api/files'"),
        (r"from ['\"]\.\./services/api/creativeIdeas['\"]", r"from '../services/original-services/api/creativeIdeas'"),
        (r"from ['\"]\.\./services/api/history['\"]", r"from '../services/original-services/api/history'"),
        (r"from ['\"]\.\./services/api/desktop['\"]", r"from '../services/original-services/api/desktop'"),
        # 动态导入修复
        (r"import\('\./services/api/([^'\"]*)\)", r"import('./services/original-services/api/\1'"),
    ]
    
    modified_files = 0
    
    for file_path in ts_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # 应用修复规则
            for pattern, replacement in fix_rules:
                content = re.sub(pattern, replacement, content)
            
            # 如果内容有变化，写回文件
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_files += 1
                print(f"✅ 修复: {file_path.name}")
            
        except Exception as e:
            print(f"❌ 错误处理文件 {file_path}: {e}")
    
    print(f"\n🎯 修复完成! 共修改 {modified_files} 个文件")

if __name__ == "__main__":
    fix_import_paths()