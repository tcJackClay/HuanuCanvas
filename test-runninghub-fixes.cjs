#!/usr/bin/env node

/**
 * RunningHub 修复验证测试
 * 测试修复后的API调用是否正常工作
 */

const https = require('https');

console.log('🧪 RunningHub API 修复验证测试');
console.log('=' .repeat(50));

// 测试1: 检查配置读取
function testConfigReading() {
  try {
    const config = require('./src/backend/src/config.js');
    const runningHubConfig = config.RUNNINGHUB;
    
    console.log('\n📋 配置读取测试:');
    console.log('✅ API Base URL:', runningHubConfig.API_BASE_URL);
    console.log('✅ API Key:', runningHubConfig.DEFAULT_API_KEY ? runningHubConfig.DEFAULT_API_KEY.substring(0, 8) + '...' : '❌ 未配置');
    console.log('✅ WebApp ID:', runningHubConfig.DEFAULT_WEBAPP_ID);
    
    return runningHubConfig.DEFAULT_API_KEY && runningHubConfig.DEFAULT_WEBAPP_ID;
  } catch (error) {
    console.error('❌ 配置读取失败:', error.message);
    return false;
  }
}

// 测试2: 测试API连接
function testApiConnection(config) {
  return new Promise((resolve, reject) => {
    console.log('\n🌐 API连接测试...');
    
    const options = {
      hostname: 'www.runninghub.cn',
      port: 443,
      path: '/api/webapp/apiCallDemo?apiKey=' + config.DEFAULT_API_KEY + '&webappId=' + config.DEFAULT_WEBAPP_ID,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + config.DEFAULT_API_KEY,
        'Host': 'www.runninghub.cn'
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 响应状态: HTTP ' + res.statusCode);
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.code === 0) {
            console.log('✅ API连接成功');
            console.log('📊 应用名称:', parsed.data?.webappName);
            console.log('📊 节点数量:', parsed.data?.nodeInfoList?.length || 0);
            resolve(true);
          } else {
            console.log('❌ API响应错误:', parsed.msg || parsed.message);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ 响应解析失败:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ 连接失败:', err.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('⏰ 请求超时');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 主测试函数
async function runTests() {
  try {
    // 测试配置读取
    const configOk = testConfigReading();
    if (!configOk) {
      console.log('\n❌ 配置读取失败，停止测试');
      process.exit(1);
    }

    // 测试API连接
    const config = require('./src/backend/src/config.js').RUNNINGHUB;
    const apiOk = await testApiConnection(config);

    console.log('\n📊 测试结果:');
    console.log('✅ 配置读取: 通过');
    console.log(apiOk ? '✅ API连接: 通过' : '❌ API连接: 失败');

    if (apiOk) {
      console.log('\n🎉 所有测试通过！修复验证成功');
      console.log('\n💡 下一步:');
      console.log('   1. 重启后端服务: npm run backend:dev');
      console.log('   2. 测试前端功能');
      console.log('   3. 验证文件上传');
    } else {
      console.log('\n⚠️ API连接失败，请检查:');
      console.log('   1. API Key是否有效');
      console.log('   2. WebApp ID是否正确');
      console.log('   3. 网络连接是否正常');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();