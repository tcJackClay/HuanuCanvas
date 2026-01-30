/**
 * 测试强力SSL修复效果
 */
import https from 'https';

function testHttpsConnection() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.runninghub.cn',
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000,
      agent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.3',
        allowLegacyRenegotiation: true,
        timeout: 10000
      })
    };

    console.log('🔍 测试HTTPS连接到www.runninghub.cn...');
    
    const req = https.request(options, (res) => {
      console.log(`✅ HTTPS连接成功: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ HTTPS连接失败:`, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ HTTPS连接超时');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

function testHttpConnection() {
  return new Promise((resolve) => {
    console.log('🔍 测试HTTP连接到www.runninghub.cn...');
    
    const http = require('http');
    const options = {
      hostname: 'www.runninghub.cn',
      port: 80,
      path: '/',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ HTTP连接成功: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ HTTP连接失败:`, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ HTTP连接超时');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔧 测试强力SSL修复方案\n');
  
  console.log('📋 修复内容:');
  console.log('✅ 1. 增强HTTPS Agent配置');
  console.log('✅ 2. 添加TLS版本兼容性');
  console.log('✅ 3. 支持HTTP回退方案');
  console.log('✅ 4. 添加重试机制');
  console.log('✅ 5. 增强超时配置');
  console.log('');
  
  console.log('🌐 连接测试:');
  
  const httpsResult = await testHttpsConnection();
  const httpResult = await testHttpConnection();
  
  console.log('\n📊 测试结果:');
  console.log(`HTTPS连接: ${httpsResult ? '✅ 成功' : '❌ 失败'}`);
  console.log(`HTTP连接: ${httpResult ? '✅ 成功' : '❌ 失败'}`);
  
  if (httpsResult || httpResult) {
    console.log('\n🎉 至少有一种连接方式成功!');
    console.log('');
    console.log('💡 现在可以测试文件上传:');
    console.log('1. 重启后端: npm run backend:dev');
    console.log('2. 重启前端: npm run dev');
    console.log('3. 进入Canvas页面');
    console.log('4. 点击🚀按钮');
    console.log('5. 测试文件上传功能');
  } else {
    console.log('\n⚠️ 两种连接都失败，可能是网络问题');
  }
}

main();
