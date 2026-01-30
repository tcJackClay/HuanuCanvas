/**
 * RunningHub配置验证脚本
 */
import http from 'http';

function testConfigEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5208,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${path}: 正常响应 (状态码: ${res.statusCode})`);
        resolve(true);
      } else {
        console.log(`⚠️ ${path}: 状态码 ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log(`❌ ${path}: 请求失败`);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔧 测试RunningHub配置修复...\n');
  
  // 测试API端点
  const endpoints = [
    '/api/creative-ideas',
    '/api/history', 
    '/api/desktop',
    '/api/runninghub/config'
  ];

  const results = await Promise.all(
    endpoints.map(endpoint => testConfigEndpoint(endpoint))
  );

  const successCount = results.filter(Boolean).length;
  console.log(`\n📊 API测试结果: ${successCount}/${endpoints.length} 个端点正常`);
  
  if (successCount === endpoints.length) {
    console.log('\n🎉 所有API端点正常！');
    console.log('💡 现在可以测试RunningHub面板:');
    console.log('   1. 访问 http://localhost:5208');
    console.log('   2. 进入Canvas页面');
    console.log('   3. 点击左上角🚀按钮');
    console.log('   4. 检查是否还显示配置错误');
  } else {
    console.log('\n⚠️ 部分API端点异常，请检查后端服务');
  }
}

main();
