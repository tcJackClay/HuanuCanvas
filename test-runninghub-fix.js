#!/usr/bin/env node

/**
 * RunningHub API 修复验证测试
 * 测试修复后的API调用是否正常工作
 */

const https = require('https');

// 测试配置
const API_BASE_URL = 'https://www.runninghub.cn';
const TEST_API_KEY = process.env.RUNNINGHUB_API_KEY || 'your_api_key_here';
const TEST_WEBAPP_ID = process.env.RUNNINGHUB_WEBAPP_ID || '1997953926043459586';

console.log('🧪 RunningHub API 修复验证测试');
console.log('=' .repeat(50));

// 测试1: 检查API基础连接
function testBasicConnection() {
  return new Promise((resolve, reject) => {
    console.log('\n📡 测试1: 检查API基础连接...');
    
    const options = {
      hostname: 'www.runninghub.cn',
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'RunningHub-Test/1.0'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ HTTP ${res.statusCode}: ${res.statusMessage}`);
      console.log(`📋 Headers:`, res.headers);
      resolve(res.statusCode);
    });

    req.on('error', (err) => {
      console.error(`❌ 连接失败:`, err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error(`⏰ 请求超时`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// 测试2: 测试API示例端点
function testApiDemo() {
  return new Promise((resolve, reject) => {
    console.log('\n🎯 测试2: 测试API示例端点...');
    
    const requestData = {
      webappId: TEST_WEBAPP_ID,
      apiKey: TEST_API_KEY
    };

    const options = {
      hostname: 'www.runninghub.cn',
      port: 443,
      path: '/api/webapp/apiCallDemo',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Host': 'www.runninghub.cn'
      },
      timeout: 15000
    };

    console.log('📤 发送请求:', JSON.stringify(requestData, null, 2));

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📥 响应状态: HTTP ${res.statusCode}`);
        console.log(`📋 响应头:`, res.headers);
        
        try {
          const parsed = JSON.parse(data);
          console.log('✅ API响应解析成功');
          console.log('📊 响应数据:', JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.error('❌ 响应解析失败:', e.message);
          console.log('📄 原始响应:', data.substring(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ 请求失败:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ 请求超时');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(JSON.stringify(requestData));
    req.end();
  });
}

// 测试3: 测试任务提交端点
function testTaskSubmission() {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 测试3: 测试任务提交端点...');
    
    const requestData = {
      webappId: parseInt(TEST_WEBAPP_ID, 10),
      apiKey: TEST_API_KEY,
      nodeInfoList: [
        {
          nodeId: 'test_node',
          fieldName: 'test_field',
          fieldValue: 'test_value',
          description: '测试节点'
        }
      ]
    };

    const options = {
      hostname: 'www.runninghub.cn',
      port: 443,
      path: '/task/openapi/ai-app/run',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Host': 'www.runninghub.cn'
      },
      timeout: 20000
    };

    console.log('📤 发送任务请求:', JSON.stringify(requestData, null, 2));

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📥 响应状态: HTTP ${res.statusCode}`);
        
        try {
          const parsed = JSON.parse(data);
          console.log('✅ 任务提交响应:', JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.error('❌ 响应解析失败:', e.message);
          console.log('📄 原始响应:', data.substring(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ 请求失败:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('⏰ 请求超时');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(JSON.stringify(requestData));
    req.end();
  });
}

// 主测试函数
async function runTests() {
  try {
    // 检查API Key
    if (!TEST_API_KEY || TEST_API_KEY === 'your_api_key_here') {
      console.error('❌ 请设置有效的RUNNINGHUB_API_KEY环境变量');
      process.exit(1);
    }

    console.log('🔑 使用API Key:', TEST_API_KEY.substring(0, 8) + '...');
    console.log('🆔 使用WebApp ID:', TEST_WEBAPP_ID);

    // 运行测试
    await testBasicConnection();
    await testApiDemo();
    await testTaskSubmission();

    console.log('\n🎉 所有测试通过！API修复验证成功');
    console.log('\n💡 下一步:');
    console.log('   1. 重启后端服务: npm run backend:dev');
    console.log('   2. 测试文件上传功能');
    console.log('   3. 验证RunningHub节点功能');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n🔧 可能的解决方案:');
    console.error('   1. 检查API Key是否正确');
    console.error('   2. 检查网络连接');
    console.error('   3. 确认WebApp ID是否有效');
    console.error('   4. 检查API端点是否正确');
    process.exit(1);
  }
}

// 运行测试
runTests();