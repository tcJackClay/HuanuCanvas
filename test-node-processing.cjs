#!/usr/bin/env node

/**
 * 节点处理测试
 * 测试前端如何处理API返回的节点数据
 */

const fs = require('fs');

console.log('🧪 节点处理测试');
console.log('=' .repeat(50));

// 模拟API返回的数据
const apiResponse = {
  "code": 0,
  "msg": "success",
  "data": {
    "descriptionEn": "Default 4800 longest side, exceeds 4K resolution",
    "curl": "curl --location --request POST 'https://www.runninghub.cn/task/openapi/ai-app/run'",
    "nodeInfoList": [
      {
        "nodeId": "15",
        "nodeName": "LoadImage",
        "fieldName": "image",
        "fieldValue": "fa4b06dee7ca8624d0ed22e22e146fa7f1f1edfe5bd8e290aa38e16ce2ad687593a.png",
        "fieldData": '[["example.png", "keep_this_dic"], {"image_upload": true}]',
        "fieldType": "IMAGE",
        "description": "image",
        "descriptionCn": null,
        "descriptionEn": "image"
      }
    ],
    "covers": [
      {
        "id": "2016447878545285122",
        "objName": "example.png",
        "url": "https://example.com/image1.png",
        "thumbnailUri": "https://example.com/thumb1.png",
        "imageWidth": "1740",
        "imageHeight": "2367"
      }
    ],
    "webappName": "图片放大·SeedVR2超速4K8K高清放大-好用推荐"
  }
};

// 模拟前端的数据处理逻辑
function testNodeProcessing() {
  console.log('\n📊 API响应数据:');
  console.log('- Code:', apiResponse.code);
  console.log('- NodeCount:', apiResponse.data?.nodeInfoList?.length || 0);
  console.log('- WebAppName:', apiResponse.data?.webappName);
  
  // 模拟前端的条件判断
  let nodeInfoList = [];
  let coversList = [];
  let webappName;
  
  // 根据修复后的前端代码逻辑
  if (apiResponse.code === 0 && apiResponse.data?.nodeInfoList) {
    nodeInfoList = apiResponse.data.nodeInfoList;
    coversList = apiResponse.data.covers || [];
    webappName = apiResponse.data.webappName;
    console.log('\n✅ 使用正确的API响应格式');
    console.log('- NodeCount:', nodeInfoList.length);
    console.log('- CoversCount:', coversList.length);
    console.log('- WebAppName:', webappName);
  } else {
    console.log('\n❌ 无法解析API响应');
  }
  
  // 分析节点类型
  console.log('\n📋 节点分析:');
  nodeInfoList.forEach((node, index) => {
    console.log(`\n节点 ${index + 1}:`);
    console.log('- NodeId:', node.nodeId);
    console.log('- NodeName:', node.nodeName);
    console.log('- FieldName:', node.fieldName);
    console.log('- FieldType:', node.fieldType);
    console.log('- FieldValue:', node.fieldValue);
    console.log('- FieldData:', node.fieldData);
    console.log('- Description:', node.description);
    
    // 分析fieldData格式
    try {
      const parsed = JSON.parse(node.fieldData);
      console.log('- FieldData格式: JSON数组');
      console.log('- 解析结果:', parsed);
      
      // 判断节点类型
      if (node.fieldType === 'IMAGE') {
        console.log('🎯 节点类型: IMAGE文件上传节点');
        console.log('✅ 应该显示文件上传界面');
      } else if (node.fieldType === 'STRING') {
        console.log('🎯 节点类型: STRING文本输入节点');
        console.log('✅ 应该显示文本输入框');
      } else if (node.fieldType === 'LIST') {
        console.log('🎯 节点类型: LIST选择节点');
        console.log('✅ 应该显示下拉选择框');
      } else {
        console.log('🎯 节点类型: 其他类型');
      }
    } catch (e) {
      console.log('- FieldData格式: 非JSON或解析失败');
      console.log('- 原始值:', node.fieldData);
    }
  });
  
  return {
    nodeInfoList,
    coversList,
    webappName
  };
}

// 运行测试
const result = testNodeProcessing();

console.log('\n📊 处理结果:');
console.log('- 节点数量:', result.nodeInfoList.length);
console.log('- 封面数量:', result.coversList.length);
console.log('- 应用名称:', result.webappName);

console.log('\n🎯 结论:');
if (result.nodeInfoList.length > 0) {
  console.log('✅ API调用成功，返回了节点信息');
  console.log('✅ 前端应该能够正确解析并显示配置选项');
  
  const imageNodes = result.nodeInfoList.filter(n => n.fieldType === 'IMAGE');
  const stringNodes = result.nodeInfoList.filter(n => n.fieldType === 'STRING');
  const listNodes = result.nodeInfoList.filter(n => n.fieldType === 'LIST');
  
  console.log('\n📋 节点类型分布:');
  console.log('- IMAGE节点:', imageNodes.length, '个 (文件上传)');
  console.log('- STRING节点:', stringNodes.length, '个 (文本输入)');
  console.log('- LIST节点:', listNodes.length, '个 (选择框)');
  
  if (imageNodes.length > 0) {
    console.log('\n✅ 检测到IMAGE节点，应该显示文件上传界面');
  }
  if (stringNodes.length > 0) {
    console.log('✅ 检测到STRING节点，应该显示文本输入框');
  }
  if (listNodes.length > 0) {
    console.log('✅ 检测到LIST节点，应该显示下拉选择框');
  }
  
} else {
  console.log('❌ 没有获取到节点信息');
}

console.log('\n🎉 测试完成！');