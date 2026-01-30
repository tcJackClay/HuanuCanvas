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

async function testPollingFix() {
  console.log('🔍 测试轮询修复效果...\n');
  
  const config = getConfig();
  
  console.log('📋 测试配置:');
  console.log(`  WebApp ID: ${config.webappId}`);
  console.log(`  API Key: ${config.apiKey.substring(0, 8)}...`);
  
  if (!config.apiKey || !config.webappId) {
    console.log('❌ 配置不完整，无法测试');
    return;
  }
  
  try {
    // 1. 测试节点信息获取
    console.log('\n🔧 获取节点信息...');
    const nodeInfoResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/node-info', {
      webappId: config.webappId,
      apiKey: config.apiKey
    }, { timeout: 10000 });
    
    const nodeInfoList = nodeInfoResponse.data.data?.data?.nodeInfoList || [];
    console.log(`✅ 获取到 ${nodeInfoList.length} 个节点`);
    
    if (nodeInfoList.length === 0) {
      console.log('❌ 没有节点信息，无法测试');
      return;
    }
    
    // 2. 构建正确的提交数据（使用清理后的格式）
    console.log('\n🧹 构建正确的提交数据...');
    const cleanNodeInfoList = nodeInfoList.map(node => ({
      nodeId: node.nodeId,
      fieldName: node.fieldName,
      fieldValue: node.fieldValue || '',
      description: node.description || ''
    }));
    
    console.log('清理后的节点数据:', JSON.stringify(cleanNodeInfoList, null, 2));
    
    // 3. 测试任务提交和轮询
    console.log('\n🚀 测试任务提交...');
    const submitResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/save_nodes', {
      webappId: config.webappId,
      apiKey: config.apiKey,
      nodeInfoList2: cleanNodeInfoList
    }, { 
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    console.log('\n📥 提交响应:', JSON.stringify(submitResponse.data, null, 2));
    
    if (submitResponse.data.success) {
      console.log('\n✅ 任务提交成功！');
      
      // 4. 检查pollUrl是否包含webappId
      const pollUrl = submitResponse.data.data?.pollUrl;
      if (pollUrl) {
        console.log('\n🔗 检查pollUrl:');
        console.log(`  URL: ${pollUrl}`);
        
        if (pollUrl.includes('webappId=')) {
          console.log('  ✅ pollUrl包含webappId参数');
          
          // 提取webappId
          const webappIdMatch = pollUrl.match(/webappId=([^&]+)/);
          if (webappIdMatch) {
            console.log(`  📱 从URL提取的webappId: ${webappIdMatch[1]}`);
          }
        } else {
          console.log('  ❌ pollUrl缺少webappId参数');
        }
      }
      
      // 5. 如果有taskId，测试轮询
      if (submitResponse.data.taskId) {
        console.log('\n🔄 测试轮询逻辑...');
        
        // 手动构造轮询URL来测试
        const manualPollUrl = `/api/runninghub/task-status/${submitResponse.data.taskId}?apiKey=${config.apiKey}&webappId=${config.webappId}`;
        console.log(`  手动构造的轮询URL: ${manualPollUrl}`);
        
        try {
          const pollResponse = await axios.get(manualPollUrl, { timeout: 10000 });
          console.log(`  轮询响应状态: ${pollResponse.status}`);
          
          if (pollResponse.data.code === 0) {
            console.log('  ✅ 轮询成功！任务已完成');
          } else if (pollResponse.data.code === 805) {
            console.log('  ⚠️ 轮询返回805错误，但格式正确');
          } else {
            console.log(`  📋 轮询结果: code=${pollResponse.data.code}, message=${pollResponse.data.message || pollResponse.data.msg}`);
          }
        } catch (pollError) {
          console.log(`  ⚠️ 轮询请求失败: ${pollError.message}`);
        }
      }
      
    } else {
      console.log('\n❌ 任务提交失败');
      console.log('错误:', submitResponse.data.message);
      
      if (submitResponse.data.data?.code === 805) {
        console.log('💡 仍然有805错误，可能是API权限问题');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPollingFix().catch(console.error);