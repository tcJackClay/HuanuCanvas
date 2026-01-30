// 测试配置文件读取
const path = require('path');

// 模拟后端配置读取
const PROJECT_DIR = path.resolve(__dirname, '..');
const BASE_DIR = PROJECT_DIR;
const settingsPath = path.join(PROJECT_DIR, 'src', 'data', 'settings.json');

console.log('🔍 测试配置文件读取...');
console.log('项目目录:', PROJECT_DIR);
console.log('设置文件路径:', settingsPath);

try {
  const fs = require('fs');
  if (fs.existsSync(settingsPath)) {
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);
    
    console.log('✅ settings.json读取成功');
    console.log('可用的RunningHub功能:', settings.runningHubFunctions?.length || 0);
    
    if (settings.runningHubFunctions && settings.runningHubFunctions.length > 0) {
      const availableWebApps = settings.runningHubFunctions.map(func => ({
        id: func.id,
        name: func.name,
        webappId: func.webappId,
        category: func.category,
        description: func.description,
        icon: func.icon,
        color: func.color
      }));
      
      const defaultWebAppId = availableWebApps[0].webappId;
      
      console.log('默认WebApp ID:', defaultWebAppId);
      console.log('可用应用:');
      availableWebApps.forEach(app => {
        console.log(`  - ${app.name}: ${app.webappId}`);
      });
      
      // 模拟API配置响应
      console.log('\n📤 模拟API配置响应:');
      const response = {
        apiKey: process.env.RUNNINGHUB_API_KEY || '5d9bcfcdde79473ab2fb0f4819d2652d',
        webappId: defaultWebAppId,
        baseUrl: 'https://api.runninghub.com',
        enabled: true,
        configured: true,
        availableWebApps: availableWebApps,
        defaultWebAppId: defaultWebAppId,
        settingsPath: settingsPath
      };
      
      console.log(JSON.stringify(response, null, 2));
      
    }
  } else {
    console.log('❌ settings.json不存在');
  }
} catch (error) {
  console.error('❌ 读取配置文件失败:', error.message);
}