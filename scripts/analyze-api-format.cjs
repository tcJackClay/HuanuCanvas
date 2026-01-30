const axios = require('axios');
const path = require('path');
const fs = require('fs');

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

// 解析curl命令中的JSON数据
function parseCurlCommand(curlCommand) {
  try {
    // 提取JSON数据部分
    const jsonMatch = curlCommand.match(/--data-raw\s+'({.*?})'/s);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1];
      // 转义单引号
      const escapedJson = jsonStr.replace(/'/g, '"');
      return JSON.parse(escapedJson);
    }
  } catch (error) {
    console.warn('解析curl命令失败:', error.message);
  }
  return null;
}

async function analyzeApiFormat() {
  console.log('🔍 深入分析RunningHub API格式...\n');
  
  const config = getFixedConfig();
  console.log('📋 使用配置:', {
    webappId: config.webappId,
    apiKey: config.apiKey.substring(0, 8) + '...'
  });
  
  try {
    // 1. 获取节点信息
    console.log('\n🔧 获取节点信息...');
    const nodeInfoResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/node-info', {
      webappId: config.webappId,
      apiKey: config.apiKey
    }, { timeout: 10000 });
    
    const nodeInfoList = nodeInfoResponse.data.data?.data?.nodeInfoList || [];
    const curlCommand = nodeInfoResponse.data.data?.data?.curl;
    
    console.log(`✅ 获取到 ${nodeInfoList.length} 个节点`);
    
    // 2. 解析RunningHub官方curl命令
    console.log('\n📝 分析RunningHub官方API调用格式...');
    const officialFormat = parseCurlCommand(curlCommand);
    
    if (officialFormat) {
      console.log('RunningHub官方格式:');
      console.log(JSON.stringify(officialFormat, null, 2));
      
      console.log('\n官方节点信息格式:');
      if (officialFormat.nodeInfoList) {
        officialFormat.nodeInfoList.forEach((node, index) => {
          console.log(`节点 ${index + 1}:`, JSON.stringify(node, null, 2));
        });
      }
    }
    
    // 3. 分析我们的节点格式
    console.log('\n🔧 我们的节点信息格式:');
    nodeInfoList.forEach((node, index) => {
      console.log(`节点 ${index + 1}:`, JSON.stringify(node, null, 2));
    });
    
    // 4. 对比分析
    console.log('\n🔍 格式对比分析:');
    
    if (officialFormat && officialFormat.nodeInfoList && nodeInfoList.length > 0) {
      const officialNode = officialFormat.nodeInfoList[0];
      const ourNode = nodeInfoList[0];
      
      console.log('字段对比:');
      const officialFields = Object.keys(officialNode);
      const ourFields = Object.keys(ourNode);
      
      console.log('官方节点字段:', officialFields);
      console.log('我们的节点字段:', ourFields);
      
      const missingFields = officialFields.filter(f => !ourFields.includes(f));
      const extraFields = ourFields.filter(f => !officialFields.includes(f));
      
      if (missingFields.length > 0) {
        console.log('❌ 缺少的字段:', missingFields);
      }
      
      if (extraFields.length > 0) {
        console.log('➕ 多余的字段:', extraFields);
      }
      
      // 5. 构建正确的提交格式
      console.log('\n🛠️ 构建正确的提交格式...');
      
      const correctNodeInfoList = officialFormat.nodeInfoList.map(node => ({
        nodeId: node.nodeId,
        fieldName: node.fieldName,
        fieldValue: node.fieldValue || '',
        description: node.description || ''
        // 不包含额外的字段
      }));
      
      console.log('正确的提交格式:', JSON.stringify(correctNodeInfoList, null, 2));
      
      // 6. 测试使用官方格式
      console.log('\n🚀 测试使用官方格式提交任务...');
      
      const testSubmitData = {
        webappId: config.webappId,
        apiKey: config.apiKey,
        nodeInfoList: correctNodeInfoList  // 注意：使用nodeInfoList而非nodeInfoList2
      };
      
      console.log('提交数据:', JSON.stringify(testSubmitData, null, 2));
      
      // 这里我们不实际提交，只是分析格式
      console.log('\n💡 分析结论:');
      console.log('1. RunningHub官方API期望的字段: nodeId, fieldName, fieldValue, description');
      console.log('2. 我们的前端额外添加了: fieldType, uploadStatus, hasServerPath等');
      console.log('3. 后端应该移除这些额外字段，只保留官方API需要的字段');
      
    }
    
  } catch (error) {
    console.error('❌ 分析过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

analyzeApiFormat().catch(console.error);