const axios = require('axios');

async function testConfigDirect() {
  console.log('🔍 直接测试配置API...');
  
  try {
    // 直接调用配置API
    const response = await axios.get('http://127.0.0.1:8766/api/runninghub/config', {
      timeout: 5000
    });
    
    console.log('✅ 配置API响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const { apiKey, webappId, availableWebApps } = response.data;
    
    if (!apiKey) {
      console.log('\n❌ API Key缺失，检查环境变量...');
      console.log('process.env.RUNNINGHUB_API_KEY:', process.env.RUNNINGHUB_API_KEY || 'undefined');
    }
    
    if (!webappId) {
      console.log('\n❌ WebApp ID缺失');
      if (availableWebApps && availableWebApps.length > 0) {
        console.log('可用应用列表:');
        availableWebApps.forEach(app => {
          console.log(`  - ${app.name}: ${app.webappId}`);
        });
        
        // 使用第一个可用应用的webappId
        const fallbackWebAppId = availableWebApps[0].webappId;
        console.log(`\n🔧 使用备用WebApp ID: ${fallbackWebAppId}`);
        
        // 测试节点信息获取
        console.log('\n🧪 测试节点信息获取...');
        const nodeInfoResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/node-info', {
          webappId: fallbackWebAppId,
          apiKey: process.env.RUNNINGHUB_API_KEY || ''
        }, { timeout: 10000 });
        
        console.log('节点信息响应:', JSON.stringify(nodeInfoResponse.data, null, 2));
        
        // 如果有节点信息，测试提交任务
        const nodeInfoList = nodeInfoResponse.data.data?.data?.nodeInfoList || [];
        if (nodeInfoList.length > 0) {
          console.log(`\n📝 找到 ${nodeInfoList.length} 个节点，测试任务提交...`);
          
          const mockNodeInfoList2 = nodeInfoList.map(node => ({
            nodeId: node.nodeId,
            fieldName: node.fieldName,
            fieldValue: node.fieldValue || '',
            description: node.description || '',
            fieldType: node.fieldType,
            uploadStatus: 'success',
            hasServerPath: false
          }));
          
          console.log('提交数据:', JSON.stringify(mockNodeInfoList2, null, 2));
          
          const submitResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/save_nodes', {
            webappId: fallbackWebAppId,
            apiKey: process.env.RUNNINGHUB_API_KEY || '',
            nodeInfoList2: mockNodeInfoList2
          }, { timeout: 10000 });
          
          console.log('\n📥 任务提交响应:', JSON.stringify(submitResponse.data, null, 2));
          
          if (submitResponse.data.success === false) {
            console.log('\n❌ 任务提交失败 - 分析错误信息:');
            console.log('错误消息:', submitResponse.data.message);
            console.log('错误详情:', submitResponse.data.data);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testConfigDirect().catch(console.error);