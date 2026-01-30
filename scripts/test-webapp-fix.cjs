#!/usr/bin/env node

/**
 * 测试WebApp ID修复效果的脚本
 */

const http = require('http');

console.log('🧪 测试WebApp ID修复效果');
console.log('='.repeat(50));

// 测试任务提交
function testTaskExecution() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      webappId: '2007596875607707650', // 从settings.json读取的WebApp ID
      apiKey: '5d9bcfcdde79473ab2fb0f4819d2652d',
      nodeInfoList2: [{
        nodeId: 'test-123',
        fieldName: 'image',
        fieldValue: '/test/image.jpg',
        description: 'Test image input',
        fieldType: 'IMAGE'
      }]
    });

    const options = {
      hostname: '127.0.0.1',
      port: 8766,
      path: '/api/runninghub/save_nodes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
      }
    };

    console.log('📤 测试任务执行...');
    console.log('   WebApp ID: 2007596875607707650 (从settings.json)');
    console.log('   API Key: 5d9bcfcd... (已配置)');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📥 任务执行响应:');
          console.log('   状态码:', res.statusCode);
          console.log('   成功:', result.success);
          console.log('   消息:', result.message);
          console.log('   任务ID:', result.taskId);
          
          if (result.success) {
            console.log('\n✅ 修复成功！WebApp ID配置生效');
          } else if (result.message === 'APIKEY_TASK_STATUS_ERROR') {
            console.log('\n❌ 仍然显示APIKEY_TASK_STATUS_ERROR错误');
            console.log('   需要进一步修复');
          } else {
            console.log('\n⚠️  其他错误:', result.message);
          }
          
          resolve(result);
        } catch (e) {
          console.log('❌ 响应解析失败:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      reject(err);
    });

    req.write(testData);
    req.end();

    req.setTimeout(20000, () => {
      console.log('⏰ 请求超时');
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 检查配置
async function checkConfiguration() {
  console.log('\n1️⃣ 检查当前配置...');
  
  try {
    const config = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:8766/api/runninghub/config', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    
    console.log('   API Key:', config.apiKey ? '已配置' : '未配置');
    console.log('   WebApp ID:', config.webappId || '未配置');
    console.log('   可用应用数:', config.availableWebApps?.length || 0);
    console.log('   默认应用:', config.availableWebApps?.[0]?.name || '未设置');
    
    return config;
  } catch (e) {
    console.log('   ❌ 配置检查失败:', e.message);
    return null;
  }
}

// 主测试函数
async function main() {
  try {
    const config = await checkConfiguration();
    
    if (!config) {
      console.log('\n❌ 无法连接到后端服务');
      return;
    }
    
    console.log('\n2️⃣ 测试任务执行...');
    const result = await testTaskExecution();
    
    console.log('\n🎯 测试总结:');
    if (result.success) {
      console.log('   ✅ WebApp ID修复成功');
      console.log('   ✅ API配置正确');
      console.log('   ✅ 可以正常执行任务');
    } else if (result.message && result.message.includes('APIKEY_TASK_STATUS_ERROR')) {
      console.log('   ❌ 仍需进一步修复');
      console.log('   可能需要检查API权限或网络连接');
    } else {
      console.log('   ⚠️  部分问题已解决，但有其他错误');
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}