const axios = require('axios');
const path = require('path');
const fs = require('fs');

function getConfig() {
  const PROJECT_DIR = path.resolve(__dirname, '..');
  const settingsPath = path.join(PROJECT_DIR, 'src', 'data', 'settings.json');
  
  let availableWebApps = [];
  let defaultWebAppId = '';
  
  if (fs.existsSync(settingsPath)) {
    try {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      
      if (settings.runningHubFunctions && settings.runningHubFunctions.length > 0) {
        availableWebApps = settings.runningHubFunctions.map(func => ({
          id: func.id,
          name: func.name,
          webappId: func.webappId,
          category: func.category,
          description: func.description,
          icon: func.icon,
          color: func.color
        }));
        
        defaultWebAppId = availableWebApps[0].webappId;
      }
    } catch (error) {
      console.warn('读取settings.json失败:', error.message);
    }
  }
  
  const hardcodedApiKey = '5d9bcfcdde79473ab2fb0f4819d2652d';
  const envApiKey = process.env.RUNNINGHUB_API_KEY || hardcodedApiKey;
  const envWebappId = process.env.RUNNINGHUB_WEBAPP_ID && process.env.RUNNINGHUB_WEBAPP_ID !== 'your_webapp_id_here' 
                     ? process.env.RUNNINGHUB_WEBAPP_ID 
                     : '';
  
  const effectiveWebappId = envWebappId || defaultWebAppId || '';
  
  return {
    apiKey: envApiKey,
    webappId: effectiveWebappId,
    baseUrl: 'https://api.runninghub.com',
    enabled: !!(envApiKey && effectiveWebappId),
    configured: !!(envApiKey && effectiveWebappId),
    availableWebApps: availableWebApps,
    defaultWebAppId: defaultWebAppId,
    settingsPath: settingsPath
  };
}

async function quickVerification() {
  console.log('🔍 RunningHub修复效果快速验证\n');
  
  const config = getConfig();
  
  console.log('📋 配置状态:');
  console.log(`  API Key: ${config.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`  WebApp ID: ${config.webappId || '❌ 未设置'}`);
  console.log(`  可用应用: ${config.availableWebApps.length} 个`);
  
  if (config.availableWebApps.length > 0) {
    console.log('  应用列表:');
    config.availableWebApps.forEach(app => {
      console.log(`    - ${app.name}: ${app.webappId}`);
    });
  }
  
  if (!config.apiKey || !config.webappId) {
    console.log('\n❌ 配置不完整，无法继续验证');
    return;
  }
  
  try {
    // 1. 测试配置API
    console.log('\n🔧 测试配置API...');
    const configResponse = await axios.get('http://127.0.0.1:8766/api/runninghub/config', {
      timeout: 5000
    });
    
    const apiConfig = configResponse.data;
    console.log('API配置响应:');
    console.log(`  WebApp ID: ${apiConfig.webappId || '❌ 缺失'}`);
    console.log(`  可用应用: ${apiConfig.availableWebApps?.length || 0} 个`);
    
    // 2. 测试节点信息获取
    console.log('\n🔧 测试节点信息获取...');
    const nodeInfoResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/node-info', {
      webappId: config.webappId,
      apiKey: config.apiKey
    }, { timeout: 10000 });
    
    const nodeInfoList = nodeInfoResponse.data.data?.data?.nodeInfoList || [];
    console.log(`✅ 获取到 ${nodeInfoList.length} 个节点`);
    
    // 3. 测试格式清理
    if (nodeInfoList.length > 0) {
      console.log('\n🧹 测试节点信息格式清理...');
      
      // 模拟前端构建的带额外字段的数据
      const mockNodeInfoList2 = nodeInfoList.map(node => ({
        ...node,
        uploadStatus: 'success',
        hasServerPath: false,
        extraField: 'test'
      }));
      
      console.log('原始字段数:', Object.keys(mockNodeInfoList2[0]).length);
      
      // 清理后的数据应该只有4个字段
      const cleaned = mockNodeInfoList2.map(node => ({
        nodeId: node.nodeId,
        fieldName: node.fieldName,
        fieldValue: node.fieldValue || '',
        description: node.description || ''
      }));
      
      console.log('清理后字段数:', Object.keys(cleaned[0]).length);
      console.log('✅ 格式清理正常');
    }
    
    // 4. 快速任务提交测试
    console.log('\n🚀 测试任务提交（快速）...');
    
    const quickTestData = nodeInfoList.map(node => ({
      nodeId: node.nodeId,
      fieldName: node.fieldName,
      fieldValue: node.fieldValue || '',
      description: node.description || ''
    }));
    
    const submitResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/save_nodes', {
      webappId: config.webappId,
      apiKey: config.apiKey,
      nodeInfoList2: quickTestData
    }, { 
      timeout: 10000,
      validateStatus: (status) => status < 500
    });
    
    if (submitResponse.data.success) {
      console.log('✅ 任务提交成功！修复有效！');
      
      if (submitResponse.data.immediateSuccess) {
        console.log('  - 任务立即完成');
      } else if (submitResponse.data.taskId) {
        console.log(`  - 任务ID: ${submitResponse.data.taskId}`);
      }
    } else {
      console.log('❌ 任务提交失败');
      console.log('  错误:', submitResponse.data.message);
      
      if (submitResponse.data.data?.code === 805) {
        console.log('  💡 仍然是格式问题，需要重启服务');
      }
    }
    
    console.log('\n🎉 验证完成！');
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 请确保后端服务正在运行 (npm run backend:dev)');
    }
  }
}

quickVerification().catch(console.error);