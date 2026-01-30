#!/usr/bin/env python3
"""
测试RUNNINGHUB功能按钮是否正确显示
"""
import time
from playwright.sync_api import sync_playwright

def test_runninghub_button():
    """测试RUNNINGHUB按钮是否正确显示"""
    print("🚀 开始测试RUNNINGHUB功能按钮...")
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            # 导航到Canvas页面
            print("📍 导航到Canvas页面...")
            page.goto('http://localhost:5207', wait_until='networkidle')
            
            # 等待页面完全加载
            time.sleep(3)
            
            # 查找Canvas容器
            canvas_container = page.locator('[data-testid="canvas-container"]')
            if canvas_container.count() == 0:
                # 如果没有找到Canvas容器，尝试其他选择器
                canvas_container = page.locator('.react-flow')
            
            print(f"🔍 Canvas容器数量: {canvas_container.count()}")
            
            # 截取屏幕截图
            page.screenshot(path='/tmp/huanu_canvas_test.png', full_page=True)
            print("📸 已保存截图到 /tmp/huanu_canvas_test.png")
            
            # 检查页面内容
            page_content = page.content()
            print(f"📄 页面内容长度: {len(page_content)} 字符")
            
            # 查找RUNNINGHUB相关元素
            print("🔍 查找RUNNINGHUB相关元素...")
            
            # 方法1: 查找包含"RUNNINGHUB"文本的按钮
            runninghub_buttons = page.locator('button').filter(has_text='RUNNINGHUB')
            print(f"📋 包含'RUNNINGHUB'文本的按钮数量: {runninghub_buttons.count()}")
            
            # 方法2: 查找包含🚀图标的按钮
            rocket_buttons = page.locator('button:has-text("🚀")')
            print(f"📋 包含🚀图标的按钮数量: {rocket_buttons.count()}")
            
            # 方法3: 查找所有按钮
            all_buttons = page.locator('button')
            print(f"📋 总按钮数量: {all_buttons.count()}")
            
            # 列出所有按钮的文本内容
            print("\n📝 所有按钮文本内容:")
            for i in range(min(all_buttons.count(), 20)):  # 最多显示20个按钮
                try:
                    button_text = all_buttons.nth(i).inner_text()
                    if button_text.strip():
                        print(f"  按钮 {i+1}: '{button_text.strip()}'")
                except:
                    print(f"  按钮 {i+1}: (无法获取文本)")
            
            # 检查Canvas左侧工具面板是否存在
            print("\n🎨 检查Canvas工具面板...")
            left_panel = page.locator('.panel').filter(has_text='节点工具箱')
            print(f"📋 左侧工具面板数量: {left_panel.count()}")
            
            if left_panel.count() > 0:
                # 查找左侧面板内的所有按钮
                panel_buttons = left_panel.locator('button')
                print(f"📋 左侧面板内的按钮数量: {panel_buttons.count()}")
                
                print("\n📝 左侧面板按钮文本:")
                for i in range(min(panel_buttons.count(), 15)):
                    try:
                        button_text = panel_buttons.nth(i).inner_text()
                        if button_text.strip():
                            print(f"  面板按钮 {i+1}: '{button_text.strip()}'")
                    except:
                        print(f"  面板按钮 {i+1}: (无法获取文本)")
            
            # 检查控制台错误
            print("\n🔍 检查控制台错误...")
            console_logs = []
            
            def handle_console(msg):
                console_logs.append(f"{msg.type}: {msg.text}")
            
            page.on('console', handle_console)
            
            # 重新加载页面以捕获控制台日志
            page.reload(wait_until='networkidle')
            time.sleep(2)
            
            if console_logs:
                print("📋 控制台日志:")
                for log in console_logs[-10:]:  # 显示最后10条日志
                    print(f"  {log}")
            else:
                print("✅ 没有发现控制台错误")
            
            # 等待更长时间确保所有组件加载完成
            print("\n⏳ 等待组件完全加载...")
            time.sleep(5)
            
            # 再次检查RUNNINGHUB按钮
            runninghub_buttons_after = page.locator('button').filter(has_text='RUNNINGHUB')
            rocket_buttons_after = page.locator('button:has-text("🚀")')
            
            print(f"\n📊 最终检查结果:")
            print(f"  🚀 包含'RUNNINGHUB'文本的按钮: {runninghub_buttons_after.count()}")
            print(f"  🚀 包含🚀图标的按钮: {rocket_buttons_after.count()}")
            
            if runninghub_buttons_after.count() > 0 or rocket_buttons_after.count() > 0:
                print("✅ 找到RUNNINGHUB按钮!")
                
                # 尝试点击按钮
                if rocket_buttons_after.count() > 0:
                    print("🖱️ 点击🚀按钮...")
                    rocket_buttons_after.first.click()
                    time.sleep(2)
                    
                    # 检查是否打开了功能面板
                    panel_visible = page.locator('[data-testid="functions-panel"]').count() > 0 or \
                                   page.locator('.running-hub-panel').count() > 0 or \
                                   page.locator('div').filter(has_text='功能面板').count() > 0
                    
                    if panel_visible:
                        print("✅ 功能面板已打开!")
                    else:
                        print("⚠️ 功能面板可能未正确打开")
                
            else:
                print("❌ 未找到RUNNINGHUB按钮")
                print("🔍 可能的原因:")
                print("  1. 代码编译错误")
                print("  2. 组件未正确导入")
                print("  3. 条件渲染逻辑问题")
                print("  4. TypeScript类型错误")
            
            # 再次截图显示当前状态
            page.screenshot(path='/tmp/huanu_canvas_final_test.png', full_page=True)
            print("📸 最终状态截图已保存")
            
        except Exception as e:
            print(f"❌ 测试过程中发生错误: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            browser.close()
            print("🔚 浏览器已关闭")

if __name__ == "__main__":
    test_runninghub_button()