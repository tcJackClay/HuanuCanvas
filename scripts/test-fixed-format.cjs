const axios = require('axios');
const path = require('path');
const fs = require('fs');

// 模拟修复后的RunningHubService逻辑
class MockRunningHubService {
  cleanNodeInfoList(nodeInfoList) {
    if (!Array.isArray(nodeInfoList)) {
      return [];
    }
    
    return nodeInfoList.map(node => ({
      nodeId: node.nodeId,
      fieldName: node.fieldName,
      fieldValue: node.fieldValue || '',
      description: node.description || ''
    }));
  }
}

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

async function testFixedFormat() {
  console.log('🧪 测试修复后的节点信息格式...\n');
  
  const config = getFixedConfig();
  const service = new MockRunningHubService();
  
  try {
    // 1. 获取节点信息
    console.log('🔧 获取节点信息...');
    const nodeInfoResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/node-info', {
      webappId: config.webappId,
      apiKey: config.apiKey
    }, { timeout: 10000 });
    
    const rawNodeInfoList = nodeInfoResponse.data.data?.data?.nodeInfoList || [];
    console.log(`✅ 获取到 ${rawNodeInfoList.length} 个原始节点`);
    
    // 2. 模拟前端构建的nodeInfoList2
    console.log('\n🔧 模拟前端构建的nodeInfoList2...');
    const nodeInfoList2 = rawNodeInfoList.map(node => {
      let fieldValue = node.fieldValue || '';
      
      return {
        nodeId: node.nodeId,
        fieldName: node.fieldName,
        fieldValue: fieldValue,
        description: node.description || '',
        fieldType: node.fieldType,
        uploadStatus: 'success',
        hasServerPath: false,
        // 额外的字段
        nodeName: node.nodeName,
        fieldData: node.fieldData,
        descriptionCn: node.descriptionCn,
        descriptionEn: node.descriptionEn
      };
    });
    
    console.log('前端构建的数据:', JSON.stringify(nodeInfoList2, null, 2));
    
    // 3. 测试清理函数
    console.log('\n🧹 测试清理函数...');
    const cleanedNodeInfoList = service.cleanNodeInfoList(nodeInfoList2);
    console.log('清理后的数据:', JSON.stringify(cleanedNodeInfoList, null, 2));
    
    // 4. 测试提交
    console.log('\n🚀 测试提交任务...');
    
    const submitResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/save_nodes', {
      webappId: config.webappId,
      apiKey: config.apiKey,
      nodeInfoList2: nodeInfoList2  // 发送原始数据，让后端处理清理
    }, { 
      timeout: 30000,  // 增加超时时间
      validateStatus: (status) => status < 500  // 不要抛出HTTP错误
    });
    
    console.log('\n📥 提交响应:', JSON.stringify(submitResponse.data, null, 2));
    
    // 5. 分析结果
    if (submitResponse.data.success) {
      console.log('\n✅ 任务提交成功！格式修复有效！');
      
      if (submitResponse.data.immediateSuccess) {
        console.log('任务立即完成');
      } else if (submitResponse.data.taskId) {
        console.log(`任务ID: ${submitResponse.data.taskId}，需要前端轮询`);
      }
    } else {
      console.log('\n❌ 任务提交仍然失败');
      console.log('错误消息:', submitResponse.data.message);
      
      if (submitResponse.data.data) {
        console.log('错误详情:', JSON.stringify(submitResponse.data.data, null, 2));
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

testFixedFormat().catch(console.error);