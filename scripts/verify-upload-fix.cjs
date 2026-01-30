#!/usr/bin/env node

/**
 * 文件上传修复验证脚本
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔧 文件上传修复验证');
console.log('='.repeat(50));

// 创建测试图片
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-fix.png');
  const testImageData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );
  
  fs.writeFileSync(testImagePath, testImageData);
  console.log('✅ 测试图片已创建:', testImagePath);
  return testImagePath;
}

// 测试文件上传
function testFileUpload(testImagePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    const formData = `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="file"; filename="test-fix.png"\r\n' +
      'Content-Type: image/png\r\n\r\n' +
      fs.readFileSync(testImagePath) + `\r\n` +
      `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="apiKey"\r\n\r\n' +
      '5d9bcfcdde79473ab2fb0f4819d2652d\r\n' +
      `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="fileType"\r\n\r\n' +
      'input\r\n' +
      `--${boundary}--`;
    
    const options = {
      hostname: '127.0.0.1',
      port: 8766,
      path: '/api/runninghub/upload-file',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      }
    };
    
    console.log('📤 发送文件上传请求...');
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('📥 收到响应:', {
          statusCode: res.statusCode,
          dataLength: responseData.length
        });
        
        try {
          const parsed = JSON.parse(responseData);
          console.log('📊 响应解析成功:', {
            success: parsed.success,
            hasThirdParty: !!parsed.thirdPartyResponse,
            thirdPartyKeys: Object.keys(parsed.thirdPartyResponse || {}),
            dataKeys: Object.keys(parsed.thirdPartyResponse?.data || {})
          });
          
          resolve(parsed);
        } catch (e) {
          console.error('❌ 响应解析失败:', e.message);
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ 请求失败:', err.message);
      reject(err);
    });
    
    req.write(formData);
    req.end();
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
    
    // 创建测试图片
    const testImagePath = createTestImage();
    
    // 测试文件上传
    console.log('\n🧪 开始文件上传测试...');
    const uploadResult = await testFileUpload(testImagePath);
    
    console.log('\n🎯 测试结果:');
    console.log('✅ 文件上传成功:', uploadResult.success);
    
    if (uploadResult.thirdPartyResponse?.data?.fileName) {
      console.log('✅ 文件名提取成功:', uploadResult.thirdPartyResponse.data.fileName);
    } else {
      console.log('❌ 文件名提取失败');
    }
    
    // 清理
    fs.unlinkSync(testImagePath);
    console.log('\n🧹 测试文件已清理');
    
    console.log('\n🎉 修复验证完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}