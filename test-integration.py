from playwright.sync_api import sync_playwright
import time

def test_frontend_pages():
    """测试前端页面加载"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        test_results = []
        
        # 测试首页
        print("测试首页...")
        page.goto('http://localhost:5173/')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        if page.title():
            test_results.append(("首页加载", True, f"标题: {page.title()}"))
        else:
            test_results.append(("首页加载", False, "无法获取标题"))
        
        # 测试登录页
        print("测试登录页...")
        page.goto('http://localhost:5173/login')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        login_button = page.locator('button:has-text("Login")').count()
        test_results.append(("登录页 OAuth 按钮", login_button > 0, f"找到 {login_button} 个 Login 按钮"))
        
        # 测试技能市场页
        print("测试技能市场页...")
        page.goto('http://localhost:5173/skills')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        skills_content = page.content()
        test_results.append(("技能市场页加载", len(skills_content) > 1000, f"内容长度: {len(skills_content)}"))
        
        # 测试提示词市场页
        print("测试提示词市场页...")
        page.goto('http://localhost:5173/prompts')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        
        prompts_content = page.content()
        test_results.append(("提示词市场页加载", len(prompts_content) > 1000, f"内容长度: {len(prompts_content)}"))
        
        browser.close()
        
        # 打印结果
        print("\n" + "="*50)
        print("前端页面测试结果:")
        print("="*50)
        
        all_passed = True
        for name, passed, detail in test_results:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status} - {name}: {detail}")
            if not passed:
                all_passed = False
        
        print(f"\n控制台错误数量: {len(console_errors)}")
        if console_errors:
            print("错误详情:")
            for err in console_errors[:5]:
                print(f"  - {err}")
        
        return all_passed

def test_backend_api():
    """测试后端 API"""
    import requests
    
    print("\n" + "="*50)
    print("后端 API 测试:")
    print("="*50)
    
    base_url = "http://localhost:3002"
    test_results = []
    
    # 测试技能列表 API
    print("测试 GET /api/skills...")
    try:
        resp = requests.get(f"{base_url}/api/skills", timeout=5)
        test_results.append(("GET /api/skills", resp.status_code == 200, f"状态码: {resp.status_code}"))
    except Exception as e:
        test_results.append(("GET /api/skills", False, str(e)))
    
    # 测试提示词列表 API
    print("测试 GET /api/prompts...")
    try:
        resp = requests.get(f"{base_url}/api/prompts", timeout=5)
        test_results.append(("GET /api/prompts", resp.status_code == 200, f"状态码: {resp.status_code}"))
    except Exception as e:
        test_results.append(("GET /api/prompts", False, str(e)))
    
    # 测试自定义页面 API
    print("测试 GET /api/custom-pages...")
    try:
        resp = requests.get(f"{base_url}/api/custom-pages", timeout=5)
        test_results.append(("GET /api/custom-pages", resp.status_code == 200, f"状态码: {resp.status_code}"))
    except Exception as e:
        test_results.append(("GET /api/custom-pages", False, str(e)))
    
    # 测试 OAuth 提供商 API
    print("测试 GET /api/oauth/providers...")
    try:
        resp = requests.get(f"{base_url}/api/oauth/providers", timeout=5)
        test_results.append(("GET /api/oauth/providers", resp.status_code == 200, f"状态码: {resp.status_code}"))
    except Exception as e:
        test_results.append(("GET /api/oauth/providers", False, str(e)))
    
    # 测试版本 API
    print("测试 GET /api/versions...")
    try:
        resp = requests.get(f"{base_url}/api/versions", timeout=5)
        test_results.append(("GET /api/versions", resp.status_code == 200, f"状态码: {resp.status_code}"))
    except Exception as e:
        test_results.append(("GET /api/versions", False, str(e)))
    
    # 测试 Agent API
    print("测试 GET /api/agents...")
    try:
        resp = requests.get(f"{base_url}/api/agents", timeout=5)
        test_results.append(("GET /api/agents", resp.status_code in [200, 401], f"状态码: {resp.status_code}"))
    except Exception as e:
        test_results.append(("GET /api/agents", False, str(e)))
    
    all_passed = True
    for name, passed, detail in test_results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}: {detail}")
        if not passed:
            all_passed = False
    
    return all_passed

if __name__ == "__main__":
    print("开始前后端联调测试...\n")
    
    frontend_passed = test_frontend_pages()
    backend_passed = test_backend_api()
    
    print("\n" + "="*50)
    print("测试总结:")
    print("="*50)
    print(f"前端测试: {'✅ 全部通过' if frontend_passed else '❌ 有失败项'}")
    print(f"后端测试: {'✅ 全部通过' if backend_passed else '❌ 有失败项'}")
    
    if frontend_passed and backend_passed:
        print("\n🎉 所有测试通过!")
    else:
        print("\n⚠️ 部分测试失败，请检查")
