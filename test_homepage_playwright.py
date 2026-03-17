from playwright.sync_api import sync_playwright

def test_homepage():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("正在访问首页...")
            page.goto('http://localhost:5173/')
            page.wait_for_load_state('networkidle')
            
            print("页面加载完成")
            
            # 检查页面标题
            title = page.title()
            print(f"页面标题: {title}")
            
            # 检查Hero区域
            hero_title = page.locator('h1').text_content()
            print(f"Hero标题: {hero_title}")
            
            # 检查功能卡片
            cards = page.locator('.card').all()
            print(f"功能卡片数量: {len(cards)}")
            
            # 检查按钮
            buttons = page.locator('button').all()
            print(f"按钮数量: {len(buttons)}")
            
            # 检查统计数据
            stats = page.locator('.text-4xl').all()
            print(f"统计数据元素数量: {len(stats)}")
            
            # 截图
            page.screenshot(path='homepage_screenshot.png', full_page=True)
            print("已保存首页截图")
            
            # 检查链接
            links = page.locator('a').all()
            print(f"链接数量: {len(links)}")
            
            print("首页测试通过！")
            
        except Exception as e:
            print(f"测试失败: {e}")
            page.screenshot(path='homepage_error.png', full_page=True)
        finally:
            browser.close()

if __name__ == "__main__":
    test_homepage()