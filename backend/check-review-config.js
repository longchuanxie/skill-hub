const { contentReviewConfig } = require('./dist/config/contentReviewConfig.js');

console.log('当前内容审核配置:');
console.log(JSON.stringify(contentReviewConfig, null, 2));

console.log('\n配置状态:');
console.log('✓ 审核功能启用:', contentReviewConfig.enabled);
console.log('✓ 严格模式:', contentReviewConfig.strictMode);
console.log('✓ 自定义插件路径:', contentReviewConfig.customPluginPath || '未配置');
console.log('✓ 超时时间:', contentReviewConfig.timeout, 'ms');
console.log('✓ 跳过恶意代码检查:', contentReviewConfig.skipMaliciousCodeCheck);
console.log('✓ 跳过敏感信息检查:', contentReviewConfig.skipSensitiveInfoCheck);
console.log('✓ 跳过格式验证:', contentReviewConfig.skipFormatValidation);
