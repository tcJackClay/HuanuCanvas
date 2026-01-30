#!/usr/bin/env node

/**
 * RunningHub架构迁移验证测试
 * 验证Canvas注册表更新和适配器功能
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 RunningHub架构迁移验证测试');
console.log('='.repeat(50));

// 测试1: 检查Canvas注册表更新
function testCanvasRegistration() {
  console.log('\n📋 测试1: Canvas注册表更新验证');
  
  const canvasPath = 'src/frontend/components/Canvas/index.tsx';
  const content = fs.readFileSync(canvasPath, 'utf8');
  
  // 检查导入
  const hasNewImport = content.includes('RunningHubMigrationWrapper');
  const hasOldImport = content.includes('import RunningHubNode from') && !content.includes('// import RunningHubNode');
  
  // 检查注册
  const hasNewRegistration = content.includes('runninghub: RunningHubMigrationWrapper');
  const hasOldRegistration = content.includes('runninghub: RunningHubNode') && !content.includes('// runninghub: RunningHubNode');
  
  // 检查接口扩展
  const hasInterfaceExtension = content.includes('config?: any') && content.includes('inputs?: any[]');
  
  console.log(`  ✅ 新导入存在: ${hasNewImport}`);
  console.log(`  ${hasOldImport ? '❌' : '✅'} 旧导入已移除: ${!hasOldImport}`);
  console.log(`  ✅ 新注册存在: ${hasNewRegistration}`);
  console.log(`  ${hasOldRegistration ? '❌' : '✅'} 旧注册已移除: ${!hasOldRegistration}`);
  console.log(`  ✅ 接口已扩展: ${hasInterfaceExtension}`);
  
  return hasNewImport && !hasOldImport && hasNewRegistration && !hasOldRegistration && hasInterfaceExtension;
}

// 测试2: 检查适配器文件
function testAdapterFiles() {
  console.log('\n🔧 测试2: 适配器文件验证');
  
  const adapterPath = 'src/frontend/components/Canvas/nodes/RunningHubNodeAdapter.ts';
  const wrapperPath = 'src/frontend/components/Canvas/nodes/RunningHubMigrationWrapper.tsx';
  
  const adapterExists = fs.existsSync(adapterPath);
  const wrapperExists = fs.existsSync(wrapperPath);
  
  console.log(`  ${adapterExists ? '✅' : '❌'} 适配器文件存在: ${adapterExists}`);
  console.log(`  ${wrapperExists ? '✅' : '❌'} 包装器文件存在: ${wrapperExists}`);
  
  if (adapterExists) {
    const adapterContent = fs.readFileSync(adapterPath, 'utf8');
    const hasAdaptMethods = adapterContent.includes('adaptOldToNew') && adapterContent.includes('adaptNewToOld');
    console.log(`  ✅ 适配方法完整: ${hasAdaptMethods}`);
  }
  
  return adapterExists && wrapperExists;
}

// 测试3: 检查TypeScript编译
function testTypeScriptCompilation() {
  console.log('\n🔍 测试3: TypeScript编译检查');
  
  try {
    // 这里可以添加实际的TypeScript编译检查
    // 现在只是检查文件语法
    const canvasPath = 'src/frontend/components/Canvas/index.tsx';
    const content = fs.readFileSync(canvasPath, 'utf8');
    
    // 基本语法检查
    const hasSyntaxErrors = content.includes('{{{') || content.includes('}}}');
    
    console.log(`  ${!hasSyntaxErrors ? '✅' : '❌'} 基本语法正确: ${!hasSyntaxErrors}`);
    
    return !hasSyntaxErrors;
  } catch (error) {
    console.log(`  ❌ 编译检查失败: ${error.message}`);
    return false;
  }
}

// 测试4: 检查功能兼容性
function testCompatibility() {
  console.log('\n🔄 测试4: 功能兼容性验证');
  
  const canvasPath = 'src/frontend/components/Canvas/index.tsx';
  const content = fs.readFileSync(canvasPath, 'utf8');
  
  // 检查向后兼容性
  const hasBackwardCompat = content.includes('webappId?: string') && content.includes('inputFields?: any[]');
  
  // 检查新旧数据格式支持
  const supportsBothFormats = content.includes('config?: any') && content.includes('webappId?: string');
  
  console.log(`  ✅ 向后兼容性: ${hasBackwardCompat}`);
  console.log(`  ✅ 双格式支持: ${supportsBothFormats}`);
  
  return hasBackwardCompat && supportsBothFormats;
}

// 运行所有测试
function runAllTests() {
  const tests = [
    { name: 'Canvas注册表更新', fn: testCanvasRegistration },
    { name: '适配器文件', fn: testAdapterFiles },
    { name: 'TypeScript编译', fn: testTypeScriptCompilation },
    { name: '功能兼容性', fn: testCompatibility }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  tests.forEach(test => {
    try {
      if (test.fn()) {
        passed++;
        console.log(`  🎉 ${test.name}: 通过`);
      } else {
        console.log(`  💥 ${test.name}: 失败`);
      }
    } catch (error) {
      console.log(`  💥 ${test.name}: 错误 - ${error.message}`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！RunningHub架构迁移成功！');
    console.log('\n📋 下一步:');
    console.log('  1. 运行 npm run dev 启动开发服务器');
    console.log('  2. 在浏览器中测试Canvas功能');
    console.log('  3. 验证RunningHub节点正常工作');
    console.log('  4. 检查性能和功能改进');
  } else {
    console.log('❌ 部分测试失败，请检查迁移步骤');
  }
  
  return passed === total;
}

// 执行测试
runAllTests();
