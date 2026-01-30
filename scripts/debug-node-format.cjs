const axios = require('axios');
const path = require('path');
const config = require('../src/backend/src/config');

async function debugNodeFormat() {
  console.log('🔍 开始调试节点信息格式问题...\n');

  // 1. 获取配置
  console.log('📋 获取RunningHub配置...');
  try {
    const configResponse = await axios.get('http://127.0.0.1:8766/api/runninghub/config');
    console.log('✅ 配置获取成功:', {
      hasApiKey: !!configResponse.data.apiKey,
      webappId: configResponse.data.webappId,
      availableApps: configResponse.data.availableWebApps?.length || 0
    });

    const apiKey = configResponse.data.apiKey;
    const webappId = configResponse.data.webappId;

    if (!apiKey || !webappId) {
      console.error('❌ 配置不完整:', { apiKey: !!apiKey, webappId: !!webappId });
      return;
    }

    // 2. 获取节点信息
    console.log('\n🔧 获取节点信息...');
    const nodeInfoResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/node-info', {
      webappId: webappId,
      apiKey: apiKey
    });

    console.log('✅ 节点信息获取成功:', {
      nodeCount: nodeInfoResponse.data.nodeCount,
      hasData: !!nodeInfoResponse.data.data
    });

    // 3. 分析节点数据结构
    const nodeInfoList = nodeInfoResponse.data.data?.data?.nodeInfoList || [];
    console.log(`\n📊 分析 ${nodeInfoList.length} 个节点的格式:`);

    nodeInfoList.forEach((node, index) => {
      console.log(`\n节点 ${index + 1}:`);
      console.log(`  - nodeId: ${node.nodeId}`);
      console.log(`  - fieldName: ${node.fieldName}`);
      console.log(`  - fieldType: ${node.fieldType}`);
      console.log(`  - description: ${node.description}`);
      console.log(`  - fieldValue: ${node.fieldValue ? '[已设置值]' : '[空值]'}`);
      console.log(`  - 其他字段:`, Object.keys(node).filter(k => !['nodeId', 'fieldName', 'fieldType', 'description', 'fieldValue'].includes(k)));
    });

    // 4. 模拟提交任务的数据格式
    console.log('\n🧪 模拟构建提交任务的数据格式...');
    
    const mockNodeInfoList2 = nodeInfoList.map(node => {
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

    console.log('📤 提交任务的数据格式:', JSON.stringify(mockNodeInfoList2, null, 2));

    // 5. 尝试提交任务看看具体的错误信息
    console.log('\n🚀 尝试提交任务（仅用于调试）...');
    try {
      const submitResponse = await axios.post('http://127.0.0.1:8766/api/runninghub/save_nodes', {
        webappId: webappId,
        apiKey: apiKey,
        nodeInfoList2: mockNodeInfoList2
      });

      console.log('📥 提交响应:', JSON.stringify(submitResponse.data, null, 2));
      
      if (submitResponse.data.success === false) {
        console.log('\n❌ 任务提交失败，详细分析:');
        console.log('错误消息:', submitResponse.data.message);
        console.log('错误详情:', submitResponse.data.data);
        
        // 尝试解析具体的错误原因
        const errorData = submitResponse.data.data;
        if (errorData && typeof errorData === 'object') {
          console.log('\n🔍 错误数据详细分析:');
          console.log('错误代码:', errorData.code);
          console.log('错误消息:', errorData.msg || errorData.message);
          console.log('完整响应结构:', JSON.stringify(errorData, null, 2));
        }
      }

    } catch (submitError) {
      console.error('❌ 提交任务时发生网络错误:', submitError.message);
      if (submitError.response) {
        console.error('响应状态:', submitError.response.status);
        console.error('响应数据:', JSON.stringify(submitError.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugNodeFormat().catch(console.error);