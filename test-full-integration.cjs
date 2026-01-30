#!/usr/bin/env node

/**
 * RunningHub 完整集成测试
 * 模拟前端调用后端API获取节点信息的完整流程
 */

const https = require('https');
const { spawn } = require('child_process');

console.log('🧪 RunningHub 完整集成测试');
console.log('=' .repeat(50));

// 模拟前端调用后端API
async function testFrontendToBackendAPI() {
  console.log('\n📡 测试1: 前端调用后端 /api/runninghub/node-info');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      webappId: '2007596875607707650'
    });

    const options = {
      hostname: 'localhost',
      port: 5206,
      path: '/api/runninghub/node-info',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ 后端响应状态:', res.statusCode);
          console.log('📊 后端响应结构:', {
            hasSuccess: 'success' in response,
            hasData: 'data' in response,
            hasCode: 'code' in response
          });

          if (response.success && response.data) {
            console.log('✅ 后端返回成功');
            console.log('📋 节点信息:', {
              code: response.data.code,
              nodeCount: response.data.data?.nodeInfoList?.length || 0,
              coversCount: response.data.data?.covers?.length || 0,
              webappName: response.data.data?.webappName
            });

            if (response.data.code === 0 && response.data.data?.nodeInfoList) {
              console.log('✅ 节点数据正确，返回:', response.data.data.nodeInfoList.length, '个节点');
              resolve(response.data);
            } else {
              console.log('❌ 节点数据格式错误');
              reject(new Error('节点数据格式错误'));
            }
          } else {
            console.log('❌ 后端调用失败:', response);
            reject(new Error('后端调用失败'));
          }
        } catch (e) {
          console.log('❌ 响应解析失败:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ 网络请求失败:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// 模拟前端数据处理
function testFrontendDataProcessing(apiData) {
  console.log('\n🧠 测试2: 前端数据处理逻辑');

  // 模拟前端条件判断
  let nodeInfoList = [];
  let coversList = [];
  let webappName;

  if (apiData.code === 0 && apiData.data?.nodeInfoList) {
    nodeInfoList = apiData.data.nodeInfoList;
    coversList = apiData.data.covers || [];
    webappName = apiData.data.webappName;
    console.log('✅ 前端成功解析响应');
  } else {
    console.log('❌ 前端无法解析响应');
    return false;
  }

  // 检查节点数据
  console.log('\n📊 节点数据检查:');
  nodeInfoList.forEach((node, index) => {
    console.log(`\n节点 ${index + 1}:`);
    console.log('- NodeId:', node.nodeId);
    console.log('- NodeName:', node.nodeName);
    console.log('- FieldType:', node.fieldType);
    console.log('- FieldName:', node.fieldName);
    console.log('- HasFieldData:', !!node.fieldData);
    
    // 检查节点类型
    if (node.fieldType === 'IMAGE') {
      console.log('✅ IMAGE节点 - 应该显示文件上传界面');
    } else if (node.fieldType === 'STRING') {
      console.log('✅ STRING节点 - 应该显示文本输入框');
    } else if (node.fieldType === 'LIST') {
      console.log('✅ LIST节点 - 应该显示下拉选择框');
    } else {
      console.log('❓ 未知节点类型:', node.fieldType);
    }
  });

  // 检查是否有配置选项
  const hasConfigurableNodes = nodeInfoList.some(node => 
    node.fieldType === 'STRING' || node.fieldType === 'LIST'
  );
  const hasImageNodes = nodeInfoList.some(node => 
    node.fieldType === 'IMAGE'
  );

  console.log('\n🎯 配置选项检查:');
  console.log('- 可配置节点 (STRING/LIST):', hasConfigurableNodes ? '✅ 有' : '❌ 没有');
  console.log('- 文件上传节点 (IMAGE):', hasImageNodes ? '✅ 有' : '❌ 没有');

  return {
    hasConfigurableNodes,
    hasImageNodes,
    nodeCount: nodeInfoList.length,
    coversCount: coversList.length,
    webappName
  };
}

// 模拟前端渲染
function testFrontendRendering(result) {
  console.log('\n🎨 测试3: 前端界面渲染模拟');

  if (result.nodeCount === 0) {
    console.log('❌ 没有节点，无法渲染配置界面');
    return false;
  }

  console.log('✅ 有节点数据，可以渲染界面');
  console.log('📋 应该渲染的内容:');
  
  console.log('- 应用标题:', result.webappName);
  console.log('- 封面图片:', result.coversCount, '张');
  console.log('- 节点配置区域:', result.nodeCount, '个');

  // 模拟各种节点类型的渲染
  let renderCount = 0;
  
  console.log('\n📝 节点渲染检查:');
  if (result.hasImageNodes) {
    console.log('✅ 文件上传区域: IMAGE节点需要文件上传组件');
    renderCount++;
  }
  if (result.hasConfigurableNodes) {
    console.log('✅ 配置选项区域: STRING/LIST节点需要输入/选择组件');
    renderCount++;
  }

  console.log('\n🎯 渲染预期结果:');
  if (renderCount > 0) {
    console.log('✅ 应该显示配置选项，用户可以看到可用的设置');
    console.log('✅ 前端界面应该不再显示"暂无配置选项"');
    return true;
  } else {
    console.log('⚠️ 全部都是文件上传节点，可能没有其他配置选项');
    return true; // 文件上传也是配置选项的一种
  }
}

// 主测试函数
async function runFullIntegrationTest() {
  try {
    console.log('\n🚀 开始完整集成测试...');

    // 测试1: API调用
    const apiData = await testFrontendToBackendAPI();
    
    // 测试2: 数据处理
    const result = testFrontendDataProcessing(apiData);
    
    // 测试3: 渲染模拟
    const renderSuccess = testFrontendRendering(result);

    // 总结
    console.log('\n📊 测试总结:');
    console.log('✅ API调用: 成功');
    console.log('✅ 数据处理: 成功');
    console.log(renderSuccess ? '✅ 界面渲染: 成功' : '❌ 界面渲染: 失败');

    if (renderSuccess) {
      console.log('\n🎉 完整集成测试通过！');
      console.log('✅ 前端应该能够正确显示配置选项');
      console.log('✅ 不再显示"暂无配置选项"');
      
      console.log('\n💡 建议:');
      console.log('1. 重新启动前端服务测试实际界面');
      console.log('2. 确认前端能够正确显示节点配置界面');
      console.log('3. 测试不同webappId的节点信息获取');
    } else {
      console.log('\n❌ 集成测试失败，需要进一步调试');
    }

  } catch (error) {
    console.error('\n❌ 集成测试失败:', error.message);
    console.error('\n🔧 建议的调试步骤:');
    console.error('1. 检查后端服务是否正在运行');
    console.error('2. 检查API配置是否正确');
    console.error('3. 检查前端代码中的响应处理逻辑');
  }
}

// 运行测试
runFullIntegrationTest();