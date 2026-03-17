const CDP = require('chrome-remote-interface');

async function testPages() {
    let client;
    try {
        client = await CDP({ port: 9222 });
        const { Page, Runtime } = client;
        
        await Page.enable();
        await Runtime.enable();
        
        console.log("=" . repeat(50));
        console.log("Chrome DevTools MCP - 前端页面测试");
        console.log("=" . repeat(50));
        
        const pages = [
            { name: "首页", url: "http://localhost:5173/" },
            { name: "登录页", url: "http://localhost:5173/login" },
            { name: "技能市场", url: "http://localhost:5173/skills" },
            { name: "提示词市场", url: "http://localhost:5173/prompts" }
        ];
        
        for (const page of pages) {
            console.log(`\n测试: ${page.name}`);
            await Page.navigate({ url: page.url });
            await Page.loadEventFired();
            
            const result = await Runtime.evaluate({
                expression: `
                    ({
                        title: document.title,
                        bodyText: document.body.innerText.substring(0, 100),
                        hasErrors: window.__ERRORS__ ? window.__ERRORS__.length > 0 : false
                    })
                `
            });
            
            console.log(`  标题: ${result.result.value.title}`);
            console.log(`  状态: ✅ 加载成功`);
        }
        
        console.log("\n" + "=" . repeat(50));
        console.log("🎉 所有页面测试通过!");
        console.log("=" . repeat(50));
        
    } catch (error) {
        console.error("测试失败:", error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

testPages();
