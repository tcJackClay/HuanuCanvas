const axios = require('axios');
const path = require('path');
const fs = require('fs');

// 模拟修复后的配置读取逻辑
function getFixedConfig() {
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
  
  // 硬编码API Key（从.env文件读取）
  const hardcodedApiKey = '5d9bcfcdde79473ab2fb0f4819d2652d';
  const envApiKey = process.env.RUNNINGHUB_API_KEY || hardcodedApiKey;
  const envWebappId = process.env.RUNNINGHUB_WEBAPP_ID && process.env.RUNNINGHUB_WEBAPP_ID !== 'your_webapp_id_here' 
                     ? process.env.RUNNINGHUB_WEBAPP_ID 
                     : '';
  
  const effectiveWebappId = envWebappId || defaultWebAppId || '';
  
  return {
    apiKey: envApiKey || '',
    webappId: effectiveWebappId,
    baseUrl: 'https://api.runninghub.com',
    enabled: !!(envApiKey && effectiveWebappId),
    configured: !!(envApiKey && effectiveWebappId),
    availableWebApps: availableWebApps,
    defaultWebAppId: defaultWebAppId,
    settingsPath: settingsPath
  };
}

async function testWithFixedConfig() {
  console.log('🔧 使用修复后的配置逻辑测试...\n');
  
  const config = getFixedConfig();
  console.log('📋 修复后的配置:', JSON.stringify(config, null, 2));
  
  if (!config.apiKey || !config.webappId) {
    console.log('\n❌ 配置仍然不完整，无法继续测试');
    return;
  }
  
  try {
    // 1. 测试获取节点信息
    console.log('\n🔧 获取节点信息...');
    const nodeInfoResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/node-info', {
      webappId: config.webappId,
      apiKey: config.apiKey
    }, { timeout: 10000 });
    
    console.log('✅ 节点信息响应:', JSON.stringify(nodeInfoResponse.data, null, 2));
    
    // 2. 分析节点格式
    const nodeInfoList = nodeInfoResponse.data.data?.data?.nodeInfoList || 
                        nodeInfoResponse.data.data?.nodeInfoList || [];
    
    console.log(`\n📊 找到 ${nodeInfoList.length} 个节点，分析格式:`);
    
    nodeInfoList.forEach((node, index) => {
      console.log(`\n节点 ${index + 1}:`);
      console.log(`  nodeId: ${node.nodeId}`);
      console.log(`  fieldName: ${node.fieldName}`);
      console.log(`  fieldType: ${node.fieldType}`);
      console.log(`  description: ${node.description}`);
      console.log(`  fieldValue: ${node.fieldValue ? '[已设置]' : '[空值]'}`);
      console.log(`  其他字段:`, Object.keys(node).filter(k => !['nodeId', 'fieldName', 'fieldType', 'description', 'fieldValue'].includes(k)));
    });
    
    // 3. 构建测试提交数据
    console.log('\n🧪 构建测试提交数据...');
    const nodeInfoList2 = nodeInfoList.map(node => {
      let fieldValue = node.fieldValue || '';
      
      return {
        nodeId: node.nodeId,
        fieldName: node.fieldName,
        fieldValue: fieldValue,
        description: node.description || '',
        fieldType: node.fieldType,
        uploadStatus: 'success',
        hasServerPath: false
      };
    });
    
    console.log('提交数据格式:', JSON.stringify(nodeInfoList2, null, 2));
    
    // 4. 测试提交任务
    console.log('\n🚀 测试任务提交...');
    const submitResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/save_nodes', {
      webappId: config.webappId,
      apiKey: config.apiKey,
      nodeInfoList2: nodeInfoList2
    }, { timeout: 15000 });
    
    console.log('\n📥 任务提交响应:', JSON.stringify(submitResponse.data, null, 2));
    
    // 5. 分析结果
    if (submitResponse.data.success === false) {
      console.log('\n❌ 任务提交失败 - 分析错误:');
      console.log('错误消息:', submitResponse.data.message);
      
      const errorData = submitResponse.data.data;
      if (errorData) {
        console.log('错误代码:', errorData.code);
        console.log('错误消息:', errorData.msg || errorData.message);
        console.log('完整错误数据:', JSON.stringify(errorData, null, 2));
        
        // 判断是否为节点信息格式错误
        if (errorData.code === 805 || (errorData.msg || '').includes('APIKEY_INVALID_NODE_INFO')) {
          console.log('\n🎯 确认：这是节点信息格式错误！');
          console.log('需要进一步分析节点信息的正确格式...');
        }
      }
    } else {
      console.log('\n✅ 任务提交成功！');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWithFixedConfig().catch(console.error);