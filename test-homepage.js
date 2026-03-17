import puppeteer from 'puppeteer';

async function testHomePage() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('正在访问首页...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    console.log('页面加载完成');
    
    const title = await page.title();
    console.log('页面标题:', title);
    
    const heroText = await page.$eval('h1', el => el.textContent);
    console.log('Hero标题:', heroText);
    
    const buttons = await page.$$eval('button', buttons => buttons.map(b => b.textContent));
    console.log('按钮数量:', buttons.length);
    console.log('按钮文本:', buttons);
    
    const cards = await page.$$eval('.card', cards => cards.length);
    console.log('卡片数量:', cards);
    
    const stats = await page.$$eval('.text-4xl', elements => elements.map(el => el.textContent));
    console.log('统计数据:', stats);
    
    console.log('首页测试通过！');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await browser.close();
  }
}

testHomePage();