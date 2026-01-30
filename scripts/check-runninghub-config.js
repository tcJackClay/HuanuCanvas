#!/usr/bin/env node

/**
 * RunningHub配置检查脚本
 * 用于诊断API配置问题
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');
const fs = require('fs');
const path = require('path');
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取配置
function getConfig() {
  const config = {
    backendUrl: 'http://127.0.0.1:8766',
    runningHubApiKey: process.env.RUNNINGHUB_API_KEY || '',
    runningHubWebAppId: process.env.RUNNINGHUB_WEBAPP_ID || '',
    runningHubBaseUrl: process.env.RUNNINGHUB_API_BASE_URL || 'https://www.runninghub.cn'
  };
  
  return config;
}

// HTTP请求辅助函数
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 检查后端服务
async function checkBackendService() {
  const config = getConfig();
  console.log('🔍 检查后端服务...');
  
  try {
    const url = new URL(`${config.backendUrl}/api/runninghub/config`);
    const response = await makeHttpRequest(url, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log('✅ 后端服务正常运行');
      return true;
    }
  } catch (error) {
    console.log('❌ 后端服务未运行或无法访问');
    console.log(`   请确保后端服务启动: npm run backend:dev`);
    return false;
  }
}

// 检查配置
function checkConfiguration() {
  const config = getConfig();
  console.log('\n🔍 检查RunningHub配置...');
  
  const issues = [];
  
  if (!config.runningHubApiKey) {
    issues.push('❌ RUNNINGHUB_API_KEY未配置');
  } else {
    console.log('✅ API Key已配置');
  }
  
  if (!config.runningHubWebAppId) {
    issues.push('❌ RUNNINGHUB_WEBAPP_ID未配置');
  } else {
    console.log('✅ WebApp ID已配置');
  }
  
  console.log(`ℹ️  API Base URL: ${config.runningHubBaseUrl}`);
  
  return issues;
}

// 测试API连接
async function testApiConnection() {
  const config = getConfig();
  console.log('\n🔍 测试API连接...');
  
  if (!config.runningHubApiKey || !config.runningHubWebAppId) {
    console.log('❌ 无法测试：缺少API配置');
    return;
  }
  
  try {
    const testData = {
      webappId: config.runningHubWebAppId,
      apiKey: config.runningHubApiKey,
      nodeInfoList2: []
    };
    
    const url = new URL(`${config.backendUrl}/api/runninghub/save_nodes`);
    const response = await makeHttpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData),
      timeout: 10000
    });
    
    if (response.data.success) {
      console.log('✅ API连接正常');
    } else {
      console.log('⚠️  API响应异常:', response.data.message);
    }
    
  } catch (error) {
    console.log('❌ API连接失败:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   - 后端服务未启动');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   - 网络连接问题');
    } else {
      console.log(`   - ${error.message}`);
    }
  }
}

// 生成配置建议
function generateConfigSuggestions() {
  console.log('\n📝 配置建议:');
  console.log('');
  console.log('1. 创建.env文件并添加:');
  console.log('   RUNNINGHUB_API_KEY=your_api_key_here');
  console.log('   RUNNINGHUB_WEBAPP_ID=your_webapp_id_here');
  console.log('');
  console.log('2. 获取API密钥:');
  console.log('   - 访问 https://www.runninghub.cn');
  console.log('   - 登录账户 → API设置');
  console.log('');
  console.log('3. 重启后端服务:');
  console.log('   npm run backend:dev');
}

// 主函数
async function main() {
  console.log('🚀 RunningHub配置诊断工具');
  console.log('='.repeat(40));
  
  // 检查后端服务
  const backendOk = await checkBackendService();
  
  // 检查配置
  const configIssues = checkConfiguration();
  
  // 测试API连接
  if (backendOk) {
    await testApiConnection();
  }
  
  // 显示问题和建议
  if (configIssues.length > 0) {
    console.log('\n❌ 发现配置问题:');
    configIssues.forEach(issue => console.log(`   ${issue}`));
    generateConfigSuggestions();
  } else if (backendOk) {
    console.log('\n✅ 配置检查完成，未发现问题');
  }
  
  console.log('\n' + '='.repeat(40));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { getConfig, checkBackendService, checkConfiguration, testApiConnection };