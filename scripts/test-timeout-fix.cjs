#!/usr/bin/env node

/**
 * 测试save_nodes超时修复的脚本
 */

const http = require('http');

console.log('🧪 测试save_nodes超时修复');
console.log('='.repeat(50));

// 测试save_nodes端点
function testSaveNodes() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      webappId: '2007596875607707650',
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
      },
      timeout: 30000 // 30秒超时
    };

    console.log('📤 发送save_nodes请求...');
    console.log('   WebApp ID: 2007596875607707650');
    console.log('   API Key: 5d9bcfcd...');
    console.log('   超时限制: 30秒');

    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`\n📥 收到响应 (${duration}秒):`);
        console.log('   状态码:', res.statusCode);
        console.log('   响应大小:', data.length, '字节');
        
        try {
          const result = JSON.parse(data);
          console.log('   成功:', result.success);
          console.log('   消息:', result.message);
          console.log('   任务ID:', result.taskId || '无');
          
          if (result.success) {
            console.log('\n✅ save_nodes响应正常，没有超时!');
            console.log('   修复成功：响应时间', duration, '秒');
          } else {
            console.log('\n⚠️  请求失败但没有超时');
            console.log('   错误信息:', result.message || result.error);
          }
          
          resolve({ success: true, duration, result });
        } catch (e) {
          console.log('\n❌ 响应解析失败:', e.message);
          console.log('   原始响应:', data.substring(0, 200));
          resolve({ success: false, duration, error: e.message });
        }
      });
    });

    req.on('error', (err) => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log('\n❌ 请求失败:', err.message);
      console.log('   耗时:', duration, '秒');
      resolve({ success: false, duration, error: err.message });
    });

    req.on('timeout', () => {
      console.log('\n⏰ 请求超时');
      req.destroy();
      resolve({ success: false, duration: 30, error: '请求超时' });
    });

    req.write(testData);
    req.end();
  });
}

// 主测试函数
async function main() {
  try {
    console.log('🔍 检查后端服务...');
    await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:8766/api/runninghub/config', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('   ✅ 后端服务正常运行');
          resolve();
        });
      }).on('error', reject);
    });
    
    console.log('\n🧪 开始save_nodes测试...');
    const result = await testSaveNodes();
    
    console.log('\n📊 测试结果总结:');
    if (result.success && result.duration < 30) {
      console.log('   ✅ 修复成功: save_nodes响应正常');
      console.log('   ✅ 响应时间:', result.duration, '秒 (远低于30秒限制)');
      console.log('   ✅ 不再出现504超时错误');
    } else if (result.duration >= 30) {
      console.log('   ❌ 仍然超时: 响应时间', result.duration, '秒');
      console.log('   ⚠️  需要进一步优化');
    } else {
      console.log('   ⚠️  其他问题:', result.error || '未知错误');
    }
    
    console.log('\n🎯 修复验证完成!');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}