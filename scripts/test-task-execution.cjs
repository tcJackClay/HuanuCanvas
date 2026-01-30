#!/usr/bin/env node

/**
 * RunningHub任务执行测试脚本
 * 测试API密钥任务状态错误修复
 */

const http = require('http');
const fs = require('fs');

console.log('🧪 RunningHub任务执行测试');
console.log('='.repeat(50));

// 测试任务提交
function testTaskSubmission() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      webappId: 'your_webapp_id_here', // 这个是占位符，应该会触发错误
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

    console.log('📤 提交测试任务...');
    console.log('   WebApp ID: your_webapp_id_here (占位符)');
    console.log('   API Key: 5d9bcfcd... (已配置)');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📥 收到响应:');
          console.log('   状态码:', res.statusCode);
          console.log('   成功:', result.success);
          console.log('   消息:', result.message);
          console.log('   错误代码:', result.data?.code);
          
          if (result.message === 'APIKEY_TASK_STATUS_ERROR') {
            console.log('\n✅ 成功复现了APIKEY_TASK_STATUS_ERROR错误');
            console.log('🔧 修复验证: 错误信息应该更详细');
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

    req.setTimeout(30000, () => {
      console.log('⏰ 请求超时');
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 主测试函数
async function main() {
  try {
    // 检查后端服务
    console.log('🔍 检查后端服务...');
    const configResponse = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:8766/api/runninghub/config', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    
    console.log('✅ 后端服务正常:', configResponse);

    // 测试任务提交
    console.log('\n🧪 开始任务执行测试...');
    const taskResult = await testTaskSubmission();
    
    console.log('\n📊 测试结果:');
    if (taskResult.success) {
      console.log('✅ 任务提交成功');
    } else {
      console.log('❌ 任务提交失败');
      console.log('   错误信息:', taskResult.message);
      
      // 检查是否有详细的错误信息
      if (taskResult.message === 'APIKEY_TASK_STATUS_ERROR') {
        console.log('🎯 预期错误已触发');
      }
    }

    console.log('\n🎉 任务执行测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}