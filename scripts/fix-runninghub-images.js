#!/usr/bin/env node

/**
 * RunningHub图片问题修复和测试脚本
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入图片验证工具
const imageValidator = require('../src/backend/src/utils/imageValidator.js');

class RunningHubImageFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.thumbnailsDir = path.join(this.projectRoot, 'src', 'thumbnails');
    this.inputDir = path.join(this.projectRoot, 'src', 'input');
    this.outputDir = path.join(this.projectRoot, 'src', 'output');
  }

  /**
   * 检查和创建必要的目录
   */
  ensureDirectories() {
    const dirs = [this.thumbnailsDir, this.inputDir, this.outputDir];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        console.log(`[修复] 创建目录: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 模拟创建测试图片
   */
  async createTestImages() {
    console.log('[修复] 创建测试图片...');
    
    const testImages = [
      {
        filename: '3ae2d052ec7b0f9c1c9dbf8abb2bdfd2_thumb.jpg',
        width: 512,
        height: 512,
        format: 'jpeg'
      },
      {
        filename: 'c09d27624d55c83bcc70783e2c12592d.jpg',
        width: 1024,
        height: 768,
        format: 'jpeg'
      }
    ];

    try {
      const sharp = require('sharp');
      
      for (const img of testImages) {
        const filePath = path.join(this.thumbnailsDir, img.filename);
        
        // 创建简单的测试图片
        const buffer = await sharp({
          create: {
            width: img.width,
            height: img.height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        }).jpeg().toBuffer();
        
        fs.writeFileSync(filePath, buffer);
        console.log(`[修复] 创建测试图片: ${img.filename} (${img.width}x${img.height})`);
      }
      
      return true;
    } catch (error) {
      console.error('[修复] 创建测试图片失败:', error);
      return false;
    }
  }

  /**
   * 验证图片文件
   */
  async validateImages() {
    console.log('\n[验证] 开始验证图片文件...');
    
    try {
      const validationResults = await imageValidator.validateImageDirectory(this.thumbnailsDir);
      const report = imageValidator.generateImageReport(validationResults);
      
      console.log(report);
      
      return validationResults;
    } catch (error) {
      console.error('[验证] 图片验证失败:', error);
      return {};
    }
  }

  /**
   * 修复损坏的图片
   */
  async fixCorruptedImages() {
    console.log('\n[修复] 开始修复损坏的图片...');
    
    try {
      const validationResults = await imageValidator.validateImageDirectory(this.thumbnailsDir);
      const corruptedFiles = Object.entries(validationResults)
        .filter(([_, result]) => !result.isValid)
        .map(([filename, _]) => filename);

      if (corruptedFiles.length === 0) {
        console.log('[修复] 没有发现损坏的图片文件');
        return true;
      }

      console.log(`[修复] 发现 ${corruptedFiles.length} 个损坏的文件，准备修复...`);

      for (const filename of corruptedFiles) {
        const inputPath = path.join(this.thumbnailsDir, filename);
        const fixedPath = path.join(this.thumbnailsDir, `fixed_${filename}`);
        
        console.log(`[修复] 修复文件: ${filename}`);
        
        const result = await imageValidator.fixImageFile(inputPath, fixedPath, {
          targetFormat: 'jpeg',
          quality: 85,
          maxSize: { width: 2048, height: 2048 }
        });

        if (result.isValid) {
          console.log(`[修复] ✅ 修复成功: ${filename}`);
          // 用修复后的文件替换原文件
          fs.renameSync(fixedPath, inputPath);
        } else {
          console.log(`[修复] ❌ 修复失败: ${filename} - ${result.error}`);
        }
      }

      return true;
    } catch (error) {
      console.error('[修复] 修复过程失败:', error);
      return false;
    }
  }

  /**
   * 测试RunningHub API连接
   */
  async testRunningHubAPI() {
    console.log('\n[测试] 测试RunningHub API连接...');
    
    try {
      const axios = require('axios');
      
      const testData = {
        webappId: 'test_webapp_id',
        apiKey: 'test_api_key',
        nodeInfoList2: []
      };

      const response = await axios.post(
        'http://127.0.0.1:8766/api/runninghub/save_nodes',
        testData,
        { 
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('[测试] API连接测试结果:', {
        success: response.data.success,
        message: response.data.message
      });

      return response.data;
    } catch (error) {
      console.log('[测试] API连接测试失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成修复报告
   */
  generateFixReport(validationResults) {
    const validCount = Object.values(validationResults).filter(r => r.isValid).length;
    const totalCount = Object.keys(validationResults).length;
    
    let report = '\n=== RunningHub图片修复报告 ===\n\n';
    report += `修复时间: ${new Date().toLocaleString('zh-CN')}\n`;
    report += `项目路径: ${this.projectRoot}\n`;
    report += `缩略图目录: ${this.thumbnailsDir}\n\n`;
    
    report += `验证结果:\n`;
    report += `  总文件数: ${totalCount}\n`;
    report += `  有效文件: ${validCount}\n`;
    report += `  损坏文件: ${totalCount - validCount}\n\n`;

    if (totalCount - validCount > 0) {
      report += `修复状态: ❌ 需要手动修复\n`;
      report += `建议: 请检查损坏的图片文件并重新上传\n`;
    } else {
      report += `修复状态: ✅ 所有文件正常\n`;
      report += `建议: RunningHub功能应该可以正常工作\n`;
    }

    console.log(report);
    
    // 保存报告到文件
    const reportPath = path.join(this.projectRoot, 'image_fix_report.txt');
    fs.writeFileSync(reportPath, report);
    console.log(`\n[报告] 修复报告已保存到: ${reportPath}`);
  }

  /**
   * 执行完整的修复流程
   */
  async run() {
    console.log('🚀 开始RunningHub图片问题修复...');
    console.log('='.repeat(50));

    try {
      // 1. 确保目录存在
      this.ensureDirectories();

      // 2. 创建测试图片
      await this.createTestImages();

      // 3. 验证图片
      const validationResults = await this.validateImages();

      // 4. 修复损坏的图片
      await this.fixCorruptedImages();

      // 5. 重新验证
      console.log('\n[验证] 重新验证修复结果...');
      const finalResults = await this.validateImages();
      
      // 6. 测试API连接
      await this.testRunningHubAPI();

      // 7. 生成报告
      this.generateFixReport(finalResults);

      console.log('\n✅ RunningHub图片修复完成！');
      console.log('='.repeat(50));

      return finalResults;

    } catch (error) {
      console.error('\n❌ 修复过程失败:', error);
      throw error;
    }
  }
}

// 主函数
async function main() {
  const fixer = new RunningHubImageFixer();
  await fixer.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RunningHubImageFixer };