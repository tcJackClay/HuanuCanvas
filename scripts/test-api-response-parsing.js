// RunningHub API响应解析测试脚本
// 测试各种响应格式的解析逻辑

const testApiResponseParsing = () => {
  console.log('=== RunningHub API响应解析测试 ===\n');

  // 模拟后端实际返回的响应格式
  const mockBackendResponse = {
    success: true,
    hasNodes: true,
    nodeCount: 3,
    data: {
      code: 0,
      data: {
        nodeInfoList: [
          {
            nodeId: "1",
            nodeName: "文本输入",
            nodeType: "STRING",
            fieldName: "text",
            fieldType: "TEXT",
            required: false
          },
          {
            nodeId: "2", 
            nodeName: "图片上传",
            nodeType: "IMAGE",
            fieldName: "image",
            fieldType: "IMAGE",
            required: true
          }
        ],
        covers: [
          {
            coverId: "cover1",
            name: "基础模板"
          }
        ],
        webappName: "测试应用"
      }
    }
  };

  // 模拟其他可能的响应格式
  const otherFormats = {
    // 格式1: 正确的API响应格式
    format1: {
      code: 0,
      data: {
        nodeInfoList: [{ nodeId: "1", nodeName: "测试" }],
        covers: [],
        webappName: "应用1"
      }
    },
    
    // 格式2: 旧的嵌套格式
    format2: {
      data: {
        code: 0,
        data: {
          nodeInfoList: [{ nodeId: "1", nodeName: "测试" }],
          covers: [],
          webappName: "应用2"
        }
      }
    },
    
    // 格式3: 备用格式
    format3: {
      data: {
        nodeInfoList: [{ nodeId: "1", nodeName: "测试" }],
        covers: [],
        webappName: "应用3"
      }
    },
    
    // 格式4: 直接数组格式
    format4: [
      { nodeId: "1", nodeName: "测试" },
      { nodeId: "2", nodeName: "测试2" }
    ]
  };

  // 解析逻辑函数
  const parseApiResponse = (data) => {
    console.log('📝 测试响应格式:', JSON.stringify(data, null, 2));
    
    let nodeInfoList = [];
    let coversList = [];
    let webappName;

    try {
      // 使用与前端相同的解析逻辑（按新顺序）
      // 后端实际返回格式：{ success: true, hasNodes: true, nodeCount: number, data: result }
      if (data.success && data.data) {
        const actualData = data.data;
        
        if (actualData.code === 0 && actualData.data?.nodeInfoList) {
          // 嵌套的API响应格式
          nodeInfoList = actualData.data.nodeInfoList;
          coversList = actualData.data.covers || [];
          webappName = actualData.data.webappName;
          console.log('✅ 解析成功: 使用后端实际返回的嵌套API响应格式');
        } else if (actualData.data?.nodeInfoList) {
          // 双层嵌套格式
          nodeInfoList = actualData.data.nodeInfoList;
          coversList = actualData.data.covers || [];
          webappName = actualData.data.webappName;
          console.log('✅ 解析成功: 使用后端实际返回的双层嵌套格式');
        } else if (actualData.nodeInfoList) {
          // 单层格式
          nodeInfoList = actualData.nodeInfoList;
          coversList = actualData.covers || [];
          webappName = actualData.webappName;
          console.log('✅ 解析成功: 使用后端实际返回的单层格式');
        } else if (Array.isArray(actualData)) {
          // 直接数组格式
          nodeInfoList = actualData;
          console.log('✅ 解析成功: 使用后端实际返回的数组格式');
        } else {
          console.log('❌ 解析失败: 无法识别后端实际返回的API响应格式');
          console.log('响应详情:', {
            data: actualData,
            keys: Object.keys(actualData),
            hasData: !!actualData.data,
            hasCode: 'code' in actualData,
            hasNodeInfoList: !!actualData.nodeInfoList
          });
        }
      } else if (data.code === 0 && data.data?.nodeInfoList) {
        // 正确的API响应格式
        nodeInfoList = data.data.nodeInfoList;
        coversList = data.data.covers || [];
        webappName = data.data.webappName;
        console.log('✅ 解析成功: 使用正确的API响应格式');
      } else if (data.data?.code === 0 && data.data?.data?.nodeInfoList) {
        // 旧的嵌套格式
        nodeInfoList = data.data.data.nodeInfoList;
        coversList = data.data.data.covers || [];
        webappName = data.data.data.webappName;
        console.log('✅ 解析成功: 使用旧的嵌套响应格式');
      } else if (data.data?.nodeInfoList) {
        // 备用格式
        nodeInfoList = data.data.nodeInfoList;
        coversList = data.data.covers || [];
        webappName = data.data.webappName;
        console.log('✅ 解析成功: 使用备用响应格式');
      } else if (Array.isArray(data)) {
        // 直接数组格式
        nodeInfoList = data;
        console.log('✅ 解析成功: 使用直接数组格式');
      } else {
        console.log('❌ 解析失败: 无法识别API响应格式');
        console.log('响应详情:', {
          data,
          keys: Object.keys(data),
          hasData: !!data.data,
          hasCode: 'code' in data
        });
      }

      console.log('📊 解析结果:', {
        nodeCount: nodeInfoList.length,
        coversCount: coversList.length,
        webappName: webappName,
        nodes: nodeInfoList.map(n => ({ id: n.nodeId, name: n.nodeName }))
      });

    } catch (error) {
      console.log('❌ 解析异常:', error.message);
    }

    console.log('---\n');
  };

  // 测试各种格式
  console.log('🧪 测试格式1: 后端实际返回格式');
  parseApiResponse(mockBackendResponse);
  
  console.log('🧪 测试格式2: 正确API响应格式');
  parseApiResponse(otherFormats.format1);
  
  console.log('🧪 测试格式3: 旧嵌套格式');
  parseApiResponse(otherFormats.format2);
  
  console.log('🧪 测试格式4: 备用格式');
  parseApiResponse(otherFormats.format3);
  
  console.log('🧪 测试格式5: 直接数组格式');
  parseApiResponse(otherFormats.format4);

  console.log('=== 测试完成 ===');
};

// 运行测试
testApiResponseParsing();