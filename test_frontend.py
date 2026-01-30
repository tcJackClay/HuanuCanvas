#!/usr/bin/env python3
"""
HuanuCanvas 前端功能测试脚本
使用Playwright测试前端应用的完整功能
"""

import asyncio
from playwright.sync_api import sync_playwright
import sys
import time

def test_frontend_functionality():
    """测试前端应用功能"""
    print("🧪 开始前端功能测试...")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, slow_mo=1000)
            page = browser.new_page()
            
            # 监听控制台错误
            errors = []
            page.on('console', lambda msg: print(f"📱 控制台 [{msg.type}]: {msg.text}" if msg.type == 'error' else None))
            page.on('pageerror', lambda exc: errors.append(str(exc)))
            
            # 访问前端页面
            print("🔗 访问前端应用...")
            page.goto('http://localhost:5206', wait_until='networkidle', timeout=30000)
            
            # 等待页面加载
            print("⏳ 等待页面渲染...")
            page.wait_for_timeout(5000)
            
            # 检查页面标题
            title = page.title()
            print(f"📄 页面标题: {title}")
            
            # 检查React应用是否加载
            try:
                # 等待React应用渲染
                page.wait_for_function("document.querySelector('body').innerText.length > 0", timeout=10000)
                print("✅ React应用渲染成功")
            except Exception as e:
                print(f"⚠️ React应用渲染检查: {e}")
            
            # 查找关键UI元素
            print("🔍 查找关键UI元素...")
            
            ui_elements = {
                '页面标题': 'title, h1, h2',
                '侧边栏': '.sidebar, [data-testid="sidebar"], .sidebar-container',
                '画布区域': 'canvas, .canvas, [data-testid="canvas"]',
                '按钮元素': 'button, .btn, [role="button"]',
                '导航元素': 'nav, .nav, .navigation'
            }
            
            found_elements = 0
            for name, selector in ui_elements.items():
                try:
                    if page.locator(selector).count() > 0:
                        print(f"✅ 找到{name}: {selector}")
                        found_elements += 1
                    else:
                        print(f"⚠️ 未找到{name}: {selector}")
                except Exception as e:
                    print(f"❌ 查找{name}失败: {e}")
            
            # 检查网络请求
            print("🌐 检查网络请求...")
            
            # 检查是否加载了主要的JavaScript文件
            js_files = [
                'index._iRvpQIs.js',
                'react-vendor.DEunMAVK.js', 
                'three-vendor.DTbbhw94.js'
            ]
            
            loaded_files = 0
            for js_file in js_files:
                try:
                    response = page.evaluate(f"fetch('/assets/{js_file}').then(r => r.status)")
                    if response == 200:
                        print(f"✅ 成功加载: {js_file}")
                        loaded_files += 1
                    else:
                        print(f"⚠️ 文件状态异常: {js_file} (状态码: {response})")
                except Exception as e:
                    print(f"❌ 加载失败: {js_file} - {e}")
            
            # 测试基本交互
            print("🖱️ 测试基本交互...")
            
            try:
                # 尝试点击页面
                page.click('body', timeout=5000)
                print("✅ 页面交互正常")
            except Exception as e:
                print(f"⚠️ 页面交互测试: {e}")
            
            # 检查错误
            if errors:
                print(f"❌ 发现JavaScript错误 ({len(errors)} 个):")
                for error in errors[:3]:  # 只显示前3个错误
                    print(f"  - {error}")
            else:
                print("✅ 未发现JavaScript错误")
            
            # 截图保存
            try:
                page.screenshot(path='frontend_test_screenshot.png', full_page=True)
                print("📸 截图已保存: frontend_test_screenshot.png")
            except Exception as e:
                print(f"⚠️ 截图失败: {e}")
            
            browser.close()
            
            # 总结测试结果
            print("\n" + "=" * 50)
            print("📊 前端功能测试结果:")
            print(f"  页面加载: {'✅ 成功' if title else '❌ 失败'}")
            print(f"  UI元素: {found_elements}/{len(ui_elements)} 个找到")
            print(f"  资源文件: {loaded_files}/{len(js_files)} 个加载成功")
            print(f"  JavaScript错误: {len(errors)} 个")
            
            if found_elements >= len(ui_elements) * 0.6 and loaded_files >= len(js_files) * 0.6 and len(errors) <= 3:
                print("\n🎉 前端功能测试通过！")
                return True
            else:
                print("\n⚠️ 前端功能测试部分通过")
                return False
                
    except Exception as e:
        print(f"❌ 前端功能测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🧪 HuanuCanvas 前端功能测试")
    print("=" * 50)
    
    # 检查服务状态
    print("🔍 检查服务状态...")
    try:
        import aiohttp
        with aiohttp.ClientSession() as session:
            response = session.get('http://localhost:5206', timeout=5)
            print(f"✅ 前端服务器正常 (状态码: {response.status})")
    except Exception as e:
        print(f"❌ 前端服务器异常: {e}")
        return 1
    
    # 运行前端功能测试
    success = test_frontend_functionality()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())