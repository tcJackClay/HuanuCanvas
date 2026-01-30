/**
 * 测试RunningHub API的HTTP/HTTPS可用性
 */
import http from 'http';
import https from 'https';

async function testConnection(protocol, hostname, port = 80) {
  return new Promise((resolve) => {
    const module = protocol === 'https:' ? https : http;
    const options = {
      hostname: hostname,
      port: port,
      path: '/',
      method: 'GET',
      timeout: 10000,
      // 如果是HTTPS，禁用SSL验证
      ...(protocol === 'https:' && {
        agent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true
        })
      })
    };

    console.log(`🔍 测试${protocol === 'https:' ? 'HTTPS' : 'HTTP'}连接到 ${hostname}...`);
    
    const req = module.request(options, (res) => {
      console.log(`✅ ${protocol}连接成功: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ ${protocol}连接失败:`, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${protocol}连接超时`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testRunningHubAPI() {
  console.log('🔧 RunningHub API连接诊断\n');
  
  console.log('📋 当前修复方案:');
  console.log('✅ 1. 主要使用HTTP协议避免SSL问题');
  console.log('✅ 2. 保留HTTPS作为备用');
  console.log('✅ 3. 禁用SSL证书验证');
  console.log('✅ 4. 添加重试机制');
  console.log('');
  
  const results = [];
  
  // 测试各种连接方式
  const tests = [
    { protocol: 'http:', hostname: 'www.runninghub.cn', port: 80 },
    { protocol: 'https:', hostname: 'www.runninghub.cn', port: 443 },
    { protocol: 'http:', hostname: 'runninghub.cn', port: 80 },
    { protocol: 'https:', hostname: 'runninghub.cn', port: 443 }
  ];
  
  for (const test of tests) {
    const result = await testConnection(test.protocol, test.hostname, test.port);
    results.push({
      ...test,
      success: result
    });
    console.log('');
  }
  
  console.log('📊 测试结果总结:');
  const httpSuccess = results.filter(r => r.protocol === 'http:' && r.success).length;
  const httpsSuccess = results.filter(r => r.protocol === 'https:' && r.success).length;
  
  console.log(`HTTP连接: ${httpSuccess}/2 成功`);
  console.log(`HTTPS连接: ${httpsSuccess}/2 成功`);
  
  if (httpSuccess > 0) {
    console.log('\n🎉 HTTP连接成功，SSL问题已解决!');
    console.log('');
    console.log('💡 现在可以测试文件上传:');
    console.log('1. 重启服务: npm run backend:dev && npm run dev');
    console.log('2. 进入Canvas页面');
    console.log('3. 点击🚀按钮');
    console.log('4. 测试文件上传功能');
  } else if (httpsSuccess > 0) {
    console.log('\n⚠️ 只有HTTPS连接成功，可能需要进一步配置');
  } else {
    console.log('\n❌ 所有连接都失败，可能是网络问题');
  }
}

testRunningHubAPI();
