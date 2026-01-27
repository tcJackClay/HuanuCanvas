#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 分析导入路径问题的测试脚本
console.log('=== HuanuCanvas Import Path Analysis ===\n');

const projectRoot = path.join(__dirname, 'src', 'frontend', 'components');
const files = fs.readdirSync(projectRoot).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let issues = [];

files.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('import') && line.includes('from')) {
      // 检查组件导入路径
      if (line.includes('./components/')) {
        const match = line.match(/from ['"](\.\/components\/[^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          const componentName = importPath.replace('./components/', '');
          const actualFile = path.join(projectRoot, componentName + (componentName.endsWith('.tsx') ? '' : '.tsx'));
          
          if (fs.existsSync(actualFile)) {
            issues.push({
              file,
              line: index + 1,
              type: 'component-import',
              current: importPath,
              suggested: `./${componentName}`,
              issue: 'Unnecessary ./components/ prefix'
            });
          }
        }
      }
      
      // 检查服务导入路径
      if (line.includes('./services/')) {
        issues.push({
          file,
          line: index + 1,
          type: 'service-import',
          current: 'from ./services/',
          suggested: 'from ../../../services/',
          issue: 'Wrong service import path'
        });
      }
      
      // 检查 Modals 导入路径
      if (line.includes('./Modals/')) {
        issues.push({
          file,
          line: index + 1,
          type: 'modal-import',
          current: 'from ./Modals/',
          suggested: 'from ../Modals/',
          issue: 'Wrong modal import path'
        });
      }
    }
  });
});

console.log(`Found ${issues.length} import path issues:\n`);
issues.forEach(issue => {
  console.log(`${issue.file}:${issue.line}`);
  console.log(`  Type: ${issue.type}`);
  console.log(`  Issue: ${issue.issue}`);
  console.log(`  Current: ${issue.current}`);
  console.log(`  Suggested: ${issue.suggested}`);
  console.log('');
});

if (issues.length === 0) {
  console.log('No import path issues found!');
} else {
  console.log('Issues found that need fixing.');
}