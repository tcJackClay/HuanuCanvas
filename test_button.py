#!/usr/bin/env python3
"""
测试RUNNINGHUB功能按钮
"""
import time
import asyncio
from playwright.async_api import async_playwright

async def test_runninghub_button():
    """测试RUNNINGHUB按钮是否正确显示"""
    print("🚀 开始测试RUNNINGHUB功能按钮...")
    
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # 导航到Canvas页面
            print("📍 导航到Canvas页面...")
            await page.goto('http://localhost:5207', wait_until='networkidle')
            
            # 等待页面完全加载
            await asyncio.sleep(3)
            
            # 截取屏幕截图
            await page.screenshot(path='/tmp/huanu_canvas_test.png', full_page=True)
            print("📸 已保存截图到 /tmp/huanu_canvas_test.png")
            
            # 查找RUNNINGHUB相关元素
            print("🔍 查找RUNNINGHUB相关元素...")
            
            # 方法1: 查找包含"RUNNINGHUB"文本的按钮
            try:
                runninghub_buttons = await page.get_by_text('RUNNINGHUB').count()
                print(f"📋 包含'RUNNINGHUB'文本的按钮数量: {runninghub_buttons}")
            except:
                runninghub_buttons = 0
                print(f"📋 包含'RUNNINGHUB'文本的按钮数量: 0")
            
            # 方法2: 查找包含🚀图标的按钮
            try:
                rocket_buttons = await page.get_by_text('🚀').count()
                print(f"📋 包含🚀图标的按钮数量: {rocket_buttons}")
            except:
                rocket_buttons = 0
                print(f"📋 包含🚀图标的按钮数量: 0")
            
            # 方法3: 查找所有按钮并检查文本
            try:
                all_buttons = page.locator('button')
                button_count = await all_buttons.count()
                print(f"📋 总按钮数量: {button_count}")
                
                print("\n📝 所有按钮文本内容:")
                for i in range(min(button_count, 20)):  # 最多显示20个按钮
                    try:
                        button_text = await all_buttons.nth(i).inner_text()
                        if button_text.strip():
                            print(f"  按钮 {i+1}: '{button_text.strip()}'")
                    except:
                        print(f"  按钮 {i+1}: (无法获取文本)")
            except Exception as e:
                print(f"❌ 获取按钮列表失败: {e}")
            
            # 检查Canvas工具面板
            print("\n🎨 检查Canvas工具面板...")
            try:
                # 查找包含"节点工具箱"的元素
                toolboxes = page.locator('text=节点工具箱')
                toolbox_count = await toolboxes.count()
                print(f"📋 节点工具箱数量: {toolbox_count}")
                
                if toolbox_count > 0:
                    # 在工具箱内查找RUNNINGHUB相关按钮
                    for i in range(toolbox_count):
                        try:
                            toolbox = toolboxes.nth(i)
                            toolbox_buttons = toolbox.locator('button')
                            button_count = await toolbox_buttons.count()
                            print(f"  工具箱 {i+1} 内的按钮数量: {button_count}")
                            
                            # 检查工具箱内是否有RUNNINGHUB按钮
                            for j in range(min(button_count, 10)):
                                try:
                                    button_text = await toolbox_buttons.nth(j).inner_text()
                                    if 'RUNNINGHUB' in button_text.upper() or '🚀' in button_text:
                                        print(f"  ✅ 在工具箱内找到RUNNINGHUB按钮: '{button_text}'")
                                except:
                                    pass
                        except:
                            pass
            except Exception as e:
                print(f"❌ 检查工具箱失败: {e}")
            
            # 检查控制台错误
            print("\n🔍 检查控制台错误...")
            console_messages = []
            
            def handle_console(msg):
                console_messages.append(f"{msg.type}: {msg.text}")
            
            page.on('console', handle_console)
            
            # 重新加载页面以捕获控制台日志
            await page.reload(wait_until='networkidle')
            await asyncio.sleep(2)
            
            if console_messages:
                print("📋 控制台日志:")
                for log in console_messages[-10:]:  # 显示最后10条日志
                    print(f"  {log}")
            else:
                print("✅ 没有发现控制台错误")
            
            # 等待更长时间确保所有组件加载完成
            print("\n⏳ 等待组件完全加载...")
            await asyncio.sleep(5)
            
            # 再次检查RUNNINGHUB按钮
            try:
                final_runninghub_count = await page.get_by_text('RUNNINGHUB').count()
                final_rocket_count = await page.get_by_text('🚀').count()
            except:
                final_runninghub_count = 0
                final_rocket_count = 0
            
            print(f"\n📊 最终检查结果:")
            print(f"  🚀 包含'RUNNINGHUB'文本的按钮: {final_runninghub_count}")
            print(f"  🚀 包含🚀图标的按钮: {final_rocket_count}")
            
            if final_runninghub_count > 0 or final_rocket_count > 0:
                print("✅ 找到RUNNINGHUB按钮!")
                
                # 尝试点击按钮
                try:
                    if final_rocket_count > 0:
                        print("🖱️ 点击🚀按钮...")
                        await page.get_by_text('🚀').first.click()
                        await asyncio.sleep(2)
                        
                        # 检查是否打开了功能面板
                        panel_selectors = [
                            '[data-testid="functions-panel"]',
                            '.running-hub-panel',
                            'text=功能面板',
                            'text=RUNNINGHUB',
                            '[class*="runninghub"]'
                        ]
                        
                        panel_found = False
                        for selector in panel_selectors:
                            try:
                                if await page.locator(selector).count() > 0:
                                    print(f"✅ 功能面板已打开 (选择器: {selector})!")
                                    panel_found = True
                                    break
                            except:
                                pass
                        
                        if not panel_found:
                            print("⚠️ 功能面板可能未正确打开")
                
                except Exception as e:
                    print(f"❌ 点击按钮失败: {e}")
                
            else:
                print("❌ 未找到RUNNINGHUB按钮")
                print("🔍 可能的原因:")
                print("  1. 代码编译错误")
                print("  2. 组件未正确导入")
                print("  3. 条件渲染逻辑问题")
                print("  4. TypeScript类型错误")
            
            # 再次截图显示当前状态
            await page.screenshot(path='/tmp/huanu_canvas_final_test.png', full_page=True)
            print("📸 最终状态截图已保存")
            
        except Exception as e:
            print(f"❌ 测试过程中发生错误: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("🔚 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_runninghub_button())