const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testFileUpload() {
  console.log('🧪 测试文件上传修复...\n');
  
  // 创建一个测试图片文件（1x1像素的PNG）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');
  const testFilePath = path.join(__dirname, 'test_upload.png');
  
  // 写入测试文件
  fs.writeFileSync(testFilePath, testImageBuffer);
  
  try {
    console.log('📤 正在上传测试文件...');
    
    // 创建FormData
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', testImageBuffer, {
      filename: 'test_image.png',
      contentType: 'image/png'
    });
    form.append('fileType', 'input');
    form.append('apiKey', '5d9bcfcdde79473ab2fb0f4819d2652d');
    
    const response = await axios.post('http://127.0.0.1:8766/api/runninghub/upload-file', form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: 30000
    });
    
    console.log('\n📥 上传响应:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ 文件上传成功！');
      
      if (response.data.filePath) {
        console.log(`📄 文件路径: ${response.data.filePath}`);
      }
      
      if (response.data.thirdPartyResponse) {
        console.log('🔗 第三方响应:', JSON.stringify(response.data.thirdPartyResponse, null, 2));
      }
      
    } else {
      console.log('\n❌ 文件上传失败');
      console.log('错误:', response.data.error);
      console.log('详情:', response.data.details);
      
      if (response.data.code) {
        console.log('错误代码:', response.data.code);
      }
    }
    
  } catch (error) {
    console.error('\n❌ 上传过程中发生错误:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// 检查form-data是否可用
try {
  require('form-data');
  testFileUpload();
} catch (error) {
  console.log('❌ 缺少form-data依赖，跳过文件上传测试');
  console.log('错误:', error.message);
}