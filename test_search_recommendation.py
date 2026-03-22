from playwright.sync_api import sync_playwright
import sys

def test_search_and_recommendation():
    errors = []
    console_logs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        def handle_console(msg):
            if msg.type == 'error':
                console_logs.append(f"Console Error: {msg.text}")
                errors.append(f"Console Error: {msg.text}")

        page.on('console', handle_console)

        try:
            print("1. Testing homepage...")
            page.goto('http://localhost:5173')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Check if homepage loaded
            title = page.title()
            print(f"   Homepage title: {title}")

            # Check for search bar
            search_input = page.locator('input[placeholder*="搜索"]')
            if search_input.count() > 0:
                print("   ✓ Search bar found")
            else:
                print("   ✗ Search bar NOT found")
                errors.append("Search bar not found on homepage")

            # Check for recommendation sections
            page.wait_for_timeout(2000)
            recommendation_headers = page.locator('text=热门推荐').all()
            if len(recommendation_headers) > 0:
                print(f"   ✓ Found {len(recommendation_headers)} recommendation section(s)")
            else:
                print("   ! Recommendation section not visible yet (may need backend data)")

            print("\n2. Testing search functionality...")
            if search_input.count() > 0:
                search_input.first.fill('python')
                page.wait_for_timeout(500)

                # Press Enter to search
                page.keyboard.press('Enter')
                page.wait_for_timeout(3000)

                # Check if we're on search page or results
                current_url = page.url
                print(f"   Current URL after search: {current_url}")

                if '/search' in current_url:
                    print("   ✓ Navigated to search page")
                else:
                    print("   ! URL did not change to /search")

            print("\n3. Testing navigation to skills page...")
            page.goto('http://localhost:5173/skills')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            skills_title = page.locator('h1, h2').first.inner_text() if page.locator('h1, h2').count() > 0 else "No title"
            print(f"   Skills page title: {skills_title}")

            print("\n4. Checking for errors...")
            if console_logs:
                print(f"   Console errors found: {len(console_logs)}")
                for log in console_logs[:5]:
                    print(f"      - {log}")
            else:
                print("   ✓ No console errors")

        except Exception as e:
            print(f"\n✗ Test failed with exception: {e}")
            errors.append(str(e))

        finally:
            browser.close()

    print("\n" + "="*50)
    if errors:
        print("TEST RESULT: FAILED")
        print("Errors found:")
        for err in errors:
            print(f"  - {err}")
        return 1
    else:
        print("TEST RESULT: PASSED")
        print("All basic tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(test_search_and_recommendation())
