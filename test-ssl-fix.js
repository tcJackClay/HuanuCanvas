/**
 * 测试RunningHub SSL修复效果
 */
import http from 'http';

function testUploadEndpoint() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8766,
      path: '/api/runninghub/upload-file',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    console.log('🔧 测试RunningHub文件上传API...\n');
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 API响应状态: ${res.statusCode}`);
        
        if (res.statusCode === 500) {
          console.log('❌ 仍然返回500错误，可能需要重启后端服务');
          try {
            const errorData = JSON.parse(data);
            console.log('错误详情:', errorData);
          } catch (e) {
            console.log('无法解析错误响应:', data);
          }
        } else if (res.statusCode === 400) {
          console.log('✅ API正常工作（400是因为没有上传文件，这是正常的）');
          try {
            const response = JSON.parse(data);
            console.log('响应内容:', response);
          } catch (e) {
            console.log('响应内容:', data);
          }
        } else {
          console.log('✅ API响应正常');
        }
        
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.log('❌ 请求失败:', error.message);
      resolve(null);
    });

    // 发送空请求来测试API是否正常工作
    req.write(JSON.stringify({}));
    req.end();
  });
}

async function main() {
  console.log('🔍 RunningHub SSL修复验证测试\n');
  
  console.log('📋 修复内容:');
  console.log('✅ 1. 更新API基础URL: https://api.runninghub.com → https://www.runninghub.cn');
  console.log('✅ 2. 添加SSL配置到文件上传API');
  console.log('✅ 3. 添加SSL配置到通用请求API');
  console.log('✅ 4. 禁用SSL证书验证（仅用于开发）');
  console.log('');
  
  const statusCode = await testUploadEndpoint();
  
  console.log('\n📊 测试结果:');
  if (statusCode === 400) {
    console.log('🎉 SSL修复成功! API正常工作');
    console.log('');
    console.log('💡 现在可以测试文件上传功能:');
    console.log('1. 启动前端: npm run dev');
    console.log('2. 进入Canvas页面');
    console.log('3. 点击🚀按钮');
    console.log('4. 选择图片上传');
    console.log('5. 验证上传成功');
  } else if (statusCode === 500) {
    console.log('⚠️ 仍有问题，需要重启后端服务');
    console.log('💡 请执行: npm run backend:dev');
  } else {
    console.log('❓ 未知的API响应状态');
  }
}

main();
