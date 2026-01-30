#!/usr/bin/env node

/**
 * 简化的RunningHub测试脚本
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 开始RunningHub功能测试...');

// 测试1: 检查后端服务
async function testBackendService() {
  console.log('\n1. 检查后端服务...');
  
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8766/api/runninghub/config', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const config = JSON.parse(data);
          console.log('   ✅ 后端服务正常');
          console.log('   📋 API Key已配置:', config.apiKey ? '是' : '否');
          resolve(true);
        } catch (e) {
          console.log('   ❌ 后端服务响应异常');
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      console.log('   ❌ 后端服务无法访问');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ⏰ 后端服务响应超时');
      resolve(false);
    });
  });
}

// 测试2: 检查文件结构
function testFileStructure() {
  console.log('\n2. 检查文件结构...');
  
  const dirs = [
    'src/thumbnails',
    'src/input', 
    'src/output',
    'src/backend/src/routes',
    'src/frontend/components'
  ];
  
  let allExists = true;
  
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`   ✅ ${dir}`);
    } else {
      console.log(`   ❌ ${dir} 不存在`);
      allExists = false;
    }
  });
  
  return allExists;
}

// 测试3: 模拟API调用
async function testApiCall() {
  console.log('\n3. 测试RunningHub API调用...');
  
  const testData = JSON.stringify({
    webappId: 'test_webapp_id',
    apiKey: 'test_api_key',
    nodeInfoList2: []
  });
  
  return new Promise((resolve) => {
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
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('   📊 API响应:', {
            success: result.success,
            message: result.message || 'OK'
          });
          resolve(result.success !== false);
        } catch (e) {
          console.log('   ❌ API响应格式错误');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('   ❌ API调用失败:', err.message);
      resolve(false);
    });
    
    req.write(testData);
    req.end();
    
    req.setTimeout(10000, () => {
      console.log('   ⏰ API调用超时');
      resolve(false);
    });
  });
}

// 测试4: 检查修复的代码
function testFixedCode() {
  console.log('\n4. 检查修复的代码...');
  
  const checks = [
    {
      file: 'src/backend/src/utils/runningHubService.js',
      pattern: '文件内容为空或无效'
    },
    {
      file: 'src/backend/src/routes/runningHub.js', 
      pattern: '文件过大'
    },
    {
      file: 'src/frontend/components/RunningHubNodeContent.tsx',
      pattern: '请选择图片文件'
    }
  ];
  
  let allFixed = true;
  
  checks.forEach(check => {
    try {
      if (fs.existsSync(check.file)) {
        const content = fs.readFileSync(check.file, 'utf8');
        if (content.includes(check.pattern)) {
          console.log(`   ✅ ${check.file}: 已修复`);
        } else {
          console.log(`   ⚠️  ${check.file}: 可能未完全修复`);
          allFixed = false;
        }
      } else {
        console.log(`   ❌ ${check.file}: 文件不存在`);
        allFixed = false;
      }
    } catch (e) {
      console.log(`   ❌ ${check.file}: 读取失败`);
      allFixed = false;
    }
  });
  
  return allFixed;
}

// 主测试函数
async function runTests() {
  console.log('='.repeat(50));
  
  const results = {
    backend: await testBackendService(),
    files: testFileStructure(),
    api: await testApiCall(),
    code: testFixedCode()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结:');
  console.log(`   后端服务: ${results.backend ? '✅' : '❌'}`);
  console.log(`   文件结构: ${results.files ? '✅' : '❌'}`);
  console.log(`   API调用: ${results.api ? '✅' : '❌'}`);
  console.log(`   代码修复: ${results.code ? '✅' : '❌'}`);
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！RunningHub功能应该可以正常工作。');
  } else {
    console.log('⚠️  部分测试失败，请检查上述问题。');
  }
  
  console.log('='.repeat(50));
}

// 运行测试
runTests().catch(console.error);