#!/usr/bin/env python3
"""
HuanuCanvas 服务测试脚本
测试前端和后端服务是否正常运行
"""

import asyncio
import aiohttp
import sys
from playwright.sync_api import sync_playwright
import time

def test_backend_api():
    """测试后端API服务"""
    print("🔍 测试后端API服务...")
    
    try:
        with aiohttp.ClientSession() as session:
            # 测试基本API端点
            urls_to_test = [
                'http://localhost:8766/',
                'http://localhost:8766/api/runninghub/functions',
                'http://localhost:8766/api/runninghub/nodes'
            ]
            
            for url in urls_to_test:
                try:
                    response = session.get(url, timeout=10)
                    if response.status == 200:
                        print(f"✅ {url} - 响应正常 ({response.status})")
                    else:
                        print(f"⚠️ {url} - 响应异常 ({response.status})")
                except Exception as e:
                    print(f"❌ {url} - 连接失败: {e}")
                    
    except Exception as e:
        print(f"❌ 后端服务测试失败: {e}")
        return False
    
    return True

def test_frontend_dev_server():
    """测试前端开发服务器"""
    print("🔍 测试前端开发服务器...")
    
    try:
        with aiohttp.ClientSession() as session:
            response = session.get('http://localhost:5206', timeout=10)
            if response.status == 200:
                print("✅ 前端开发服务器响应正常 (5206端口)")
                return True
            else:
                print(f"⚠️ 前端开发服务器响应异常 ({response.status})")
                return False
    except Exception as e:
        print(f"❌ 前端开发服务器连接失败: {e}")
        return False

def test_frontend_functionality():
    """测试前端应用功能"""
    print("🔍 测试前端应用功能...")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # 访问前端页面
            page.goto('http://localhost:5206', wait_until='networkidle')
            
            # 检查页面标题
            title = page.title()
            print(f"📄 页面标题: {title}")
            
            # 检查是否加载了React应用
            try:
                # 等待React应用渲染
                page.wait_for_timeout(3000)
                
                # 检查关键元素
                elements_to_check = [
                    'h1',
                    'canvas',
                    '[data-testid="app"]',
                    '.sidebar'
                ]
                
                found_elements = 0
                for selector in elements_to_check:
                    try:
                        if page.locator(selector).count() > 0:
                            found_elements += 1
                            print(f"✅ 找到元素: {selector}")
                    except:
                        pass
                
                if found_elements > 0:
                    print(f"✅ 前端应用渲染成功 ({found_elements}/{len(elements_to_check)} 个元素)")
                    return True
                else:
                    print("⚠️ 前端应用可能未完全渲染")
                    return False
                    
            except Exception as e:
                print(f"❌ 前端功能测试失败: {e}")
                return False
            finally:
                browser.close()
                
    except Exception as e:
        print(f"❌ 前端功能测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🧪 开始HuanuCanvas服务测试")
    print("=" * 50)
    
    # 测试后端服务
    backend_ok = test_backend_api()
    
    print("-" * 30)
    
    # 测试前端服务
    frontend_ok = test_frontend_dev_server()
    
    print("-" * 30)
    
    # 测试前端功能
    if frontend_ok:
        functionality_ok = test_frontend_functionality()
    else:
        functionality_ok = False
    
    print("=" * 50)
    print("📊 测试结果总结:")
    print(f"  后端API服务: {'✅ 正常' if backend_ok else '❌ 失败'}")
    print(f"  前端服务器: {'✅ 正常' if frontend_ok else '❌ 失败'}")
    print(f"  前端功能: {'✅ 正常' if functionality_ok else '❌ 失败'}")
    
    if backend_ok and frontend_ok and functionality_ok:
        print("\n🎉 所有测试通过！服务运行正常。")
        return 0
    else:
        print("\n⚠️ 存在测试失败项，需要进一步检查。")
        return 1

if __name__ == "__main__":
    sys.exit(main())