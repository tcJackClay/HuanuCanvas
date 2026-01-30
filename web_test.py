#!/usr/bin/env python3
"""
简单的Web测试 - 检查RUNNINGHUB按钮
"""
import requests
from bs4 import BeautifulSoup

def test_huanu_canvas():
    """测试HuanuCanvas应用"""
    print("🚀 测试HuanuCanvas RUNNINGHUB按钮...")
    
    # 测试不同端口
    ports = [5206, 5207, 5208, 5209]
    working_url = None
    
    for port in ports:
        try:
            print(f"🔍 测试端口 {port}...")
            response = requests.get(f'http://localhost:{port}', timeout=3)
            
            if response.status_code == 200:
                content = response.text
                
                # 检查是否是HuanuCanvas
                if 'HuanuCanvas' in content or 'React' in content:
                    working_url = f'http://localhost:{port}'
                    print(f"✅ 找到HuanuCanvas在端口 {port}")
                    break
                else:
                    print(f"  端口 {port}: 响应但不是HuanuCanvas")
            else:
                print(f"  端口 {port}: 状态码 {response.status_code}")
                
        except requests.exceptions.RequestException:
            print(f"  端口 {port}: 无响应")
        except Exception as e:
            print(f"  端口 {port}: 错误 {e}")
    
    if not working_url:
        print("❌ 未找到运行中的HuanuCanvas服务")
        return False
    
    # 测试找到的服务
    try:
        print(f"\\n🎯 详细测试 {working_url}...")
        response = requests.get(working_url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ 页面状态码错误: {response.status_code}")
            return False
        
        html = BeautifulSoup(response.text, 'html.parser')
        
        # 检查基本HTML结构
        title = html.find('title')
        if title:
            print(f"📄 页面标题: {title.get_text()}")
        
        # 检查是否包含React和Canvas相关内容
        page_content = response.text
        
        indicators = {
            'React应用': 'React' in page_content,
            'Canvas内容': 'Canvas' in page_content or 'canvas' in page_content,
            'Vite应用': 'vite' in page_content.lower(),
            'HuanuCanvas标题': 'HuanuCanvas' in page_content
        }
        
        print("\\n📊 内容检查:")
        for name, found in indicators.items():
            status = "✅" if found else "❌"
            print(f"  {status} {name}")
        
        # 查找按钮元素（通过HTML结构）
        buttons = html.find_all('button')
        print(f"\\n📋 HTML中找到 {len(buttons)} 个按钮")
        
        # 检查按钮文本
        runninghub_buttons = []
        rocket_buttons = []
        
        for button in buttons:
            text = button.get_text()
            if text:
                if 'RUNNINGHUB' in text.upper():
                    runninghub_buttons.append(text.strip())
                if '🚀' in text:
                    rocket_buttons.append(text.strip())
        
        print(f"\\n🔍 按钮文本检查:")
        print(f"  RUNNINGHUB按钮: {len(runninghub_buttons)} 个")
        for btn in runninghub_buttons:
            print(f"    ✅ {btn}")
        
        print(f"  🚀图标按钮: {len(rocket_buttons)} 个")
        for btn in rocket_buttons:
            print(f"    ✅ {btn}")
        
        # 总结
        if runninghub_buttons or rocket_buttons:
            print("\\n🎉 成功! RUNNINGHUB按钮已找到!")
            print(f"\\n🌐 请在浏览器中访问: {working_url}")
            print("📍 进入Canvas页面，查看左上角的🚀按钮")
            return True
        else:
            print("\\n❌ RUNNINGHUB按钮未找到")
            print("\\n🔍 可能原因:")
            print("  1. 组件未正确编译")
            print("  2. 条件渲染逻辑问题")
            print("  3. JavaScript加载问题")
            print("\\n💡 建议:")
            print("  - 检查浏览器开发者工具中的控制台错误")
            print("  - 确认Canvas页面已正确加载")
            print("  - 检查React组件是否正确渲染")
            return False
            
    except Exception as e:
        print(f"❌ 测试过程中出错: {e}")
        return False

if __name__ == "__main__":
    test_huanu_canvas()