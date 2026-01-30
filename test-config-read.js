#!/usr/bin/env node

/**
 * 配置读取测试脚本
 * 验证新的配置读取逻辑是否正常工作
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 配置读取测试');
console.log('=' .repeat(50));

// 模拟配置读取逻辑
function testConfigReading() {
  try {
    // 模拟 BASE_DIR
    const BASE_DIR = process.cwd();
    const appConfigPath = path.join(BASE_DIR, 'data', 'app-config.json');
    
    console.log('📂 配置文件路径:', appConfigPath);
    console.log('📂 绝对路径:', path.resolve(appConfigPath));
    console.log('📂 文件是否存在:', fs.existsSync(appConfigPath));
    
    if (fs.existsSync(appConfigPath)) {
      const appConfigData = fs.readFileSync(appConfigPath, 'utf8');
      const appConfig = JSON.parse(appConfigData);
      
      console.log('✅ 配置文件读取成功');
      
      // 读取RunningHub API配置
      const runningHubConfig = appConfig.apis?.runninghub;
      console.log('🔑 API配置:', {
        hasConfig: !!runningHubConfig,
        enabled: runningHubConfig?.enabled,
        hasApiKey: !!runningHubConfig?.apiKey,
        apiKey: runningHubConfig?.apiKey ? runningHubConfig.apiKey.substring(0, 8) + '...' : '未配置',
        baseUrl: runningHubConfig?.baseUrl
      });
      
      // 读取RunningHub功能列表
      const functions = appConfig.features?.runningHubFunctions || [];
      console.log('⚙️ 功能配置:', {
        functionCount: functions.length,
        firstWebAppId: functions[0]?.webappId,
        functionNames: functions.map(f => f.name)
      });
      
      // 构建最终配置
      const config = {
        API_BASE_URL: runningHubConfig?.baseUrl || 'https://www.runninghub.cn',
        DEFAULT_API_KEY: runningHubConfig?.apiKey || '',
        DEFAULT_WEBAPP_ID: functions[0]?.webappId || ''
      };
      
      console.log('🎯 最终配置:', {
        baseUrl: config.API_BASE_URL,
        apiKey: config.DEFAULT_API_KEY ? config.DEFAULT_API_KEY.substring(0, 8) + '...' : '未配置',
        webAppId: config.DEFAULT_WEBAPP_ID
      });
      
      return config;
    } else {
      console.error('❌ 配置文件不存在:', appConfigPath);
      return null;
    }
  } catch (error) {
    console.error('❌ 配置读取失败:', error.message);
    return null;
  }
}

// 运行测试
const config = testConfigReading();

if (config) {
  console.log('\n🎉 配置读取测试成功!');
  console.log('✅ 可以安全地重启后端服务');
} else {
  console.log('\n❌ 配置读取测试失败!');
  console.log('❗ 请检查配置文件路径和格式');
  process.exit(1);
}