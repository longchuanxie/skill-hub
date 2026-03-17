import requests

base_url = "http://localhost:3002"

print("=" * 50)
print("后端 API 测试")
print("=" * 50)

tests = [
    ("GET /api/skills", "/api/skills"),
    ("GET /api/prompts", "/api/prompts"),
    ("GET /api/custom-pages", "/api/custom-pages"),
    ("GET /api/oauth/providers", "/api/oauth/providers"),
    ("GET /api/versions/:type/:id", "/api/versions/skill/000000000000000000000001"),
    ("GET /api/agents", "/api/agents"),
]

all_passed = True

for name, path in tests:
    try:
        resp = requests.get(f"{base_url}{path}", timeout=5)
        passed = resp.status_code in [200, 401]
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}: HTTP {resp.status_code}")
        if not passed:
            all_passed = False
    except Exception as e:
        print(f"❌ FAIL - {name}: {str(e)[:50]}")
        all_passed = False

print("\n" + "=" * 50)
print("前端页面测试")
print("=" * 50)

frontend_tests = [
    ("GET / (首页)", "http://localhost:5173/"),
    ("GET /login (登录页)", "http://localhost:5173/login"),
    ("GET /skills (技能市场)", "http://localhost:5173/skills"),
    ("GET /prompts (提示词市场)", "http://localhost:5173/prompts"),
]

for name, url in frontend_tests:
    try:
        resp = requests.get(url, timeout=5)
        passed = resp.status_code == 200
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}: HTTP {resp.status_code}")
        if not passed:
            all_passed = False
    except Exception as e:
        print(f"❌ FAIL - {name}: {str(e)[:50]}")
        all_passed = False

print("\n" + "=" * 50)
if all_passed:
    print("🎉 所有测试通过!")
else:
    print("⚠️ 部分测试失败")
print("=" * 50)
