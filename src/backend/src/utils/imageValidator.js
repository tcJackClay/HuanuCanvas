/**
 * 图片文件验证和修复工具
 * 用于解决RunningHub图片加载问题
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} ImageValidationResult
 * @property {boolean} isValid
 * @property {number=} width
 * @property {number=} height
 * @property {string=} format
 * @property {number=} size
 * @property {string=} error
 * @property {string[]=} suggestions
 */

/**
 * 验证图片文件
 * @param {string} filePath
 * @returns {Promise<ImageValidationResult>}
 */
async function validateImageFile(filePath) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return {
        isValid: false,
        error: '文件不存在',
        suggestions: ['检查文件路径是否正确', '确保文件没有被移动或删除']
      };
    }

    // 获取文件信息
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return {
        isValid: false,
        error: '文件为空',
        suggestions: ['重新生成文件', '检查文件上传过程']
      };
    }

    // 使用sharp验证和获取图片信息
    const imageInfo = await sharp(filePath).metadata();
    
    if (!imageInfo.width || !imageInfo.height) {
      return {
        isValid: false,
        error: '无法读取图片尺寸',
        suggestions: ['检查文件格式是否支持', '尝试转换图片格式']
      };
    }

    return {
      isValid: true,
      width: imageInfo.width,
      height: imageInfo.height,
      format: imageInfo.format,
      size: stats.size
    };

  } catch (error) {
    return {
      isValid: false,
      error: `图片验证失败: ${error.message}`,
      suggestions: [
        '检查文件格式是否正确',
        '尝试重新压缩图片',
        '确保文件没有损坏'
      ]
    };
  }
}

/**
 * 修复图片文件
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {Object} options
 * @returns {Promise<ImageValidationResult>}
 */
async function fixImageFile(inputPath, outputPath, options = {}) {
  try {
    const {
      targetFormat = 'jpeg',
      quality = 85,
      maxSize = { width: 2048, height: 2048 }
    } = options;

    console.log(`[图片修复] 开始处理: ${inputPath}`);

    // 先验证原始文件
    const validation = await validateImageFile(inputPath);
    if (!validation.isValid) {
      return validation;
    }

    // 使用sharp处理图片
    let pipeline = sharp(inputPath);

    // 调整尺寸（如果需要）
    if (validation.width > maxSize.width || validation.height > maxSize.height) {
      console.log(`[图片修复] 调整图片尺寸: ${validation.width}x${validation.height} -> ${maxSize.width}x${maxSize.height}`);
      pipeline = pipeline.resize(maxSize.width, maxSize.height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // 设置输出格式和质量
    if (targetFormat === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else if (targetFormat === 'png') {
      pipeline = pipeline.png({ quality });
    } else if (targetFormat === 'webp') {
      pipeline = pipeline.webp({ quality });
    }

    // 保存修复后的文件
    await pipeline.toFile(outputPath);

    console.log(`[图片修复] 处理完成: ${outputPath}`);

    // 验证修复后的文件
    const result = await validateImageFile(outputPath);
    return result;

  } catch (error) {
    return {
      isValid: false,
      error: `图片修复失败: ${error.message}`,
      suggestions: [
        '检查输入文件是否损坏',
        '确保有足够的磁盘空间',
        '检查文件权限'
      ]
    };
  }
}

/**
 * 批量验证图片目录
 * @param {string} dirPath
 * @returns {Promise<Record<string, ImageValidationResult>>}
 */
async function validateImageDirectory(dirPath) {
  const results = {};
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i)) {
        const filePath = path.join(dirPath, file);
        results[file] = await validateImageFile(filePath);
      }
    }
  } catch (error) {
    console.error(`[图片验证] 读取目录失败: ${dirPath}`, error);
  }

  return results;
}

/**
 * 生成图片报告
 * @param {Record<string, ImageValidationResult>} results
 * @returns {string}
 */
function generateImageReport(results) {
  const validFiles = Object.entries(results).filter(([_, result]) => result.isValid);
  const invalidFiles = Object.entries(results).filter(([_, result]) => !result.isValid);

  let report = '=== 图片验证报告 ===\n\n';
  
  report += `有效文件: ${validFiles.length}\n`;
  report += `无效文件: ${invalidFiles.length}\n\n`;

  if (validFiles.length > 0) {
    report += '有效文件:\n';
    validFiles.forEach(([file, result]) => {
      report += `  ✅ ${file} (${result.width}x${result.height}, ${result.format})\n`;
    });
    report += '\n';
  }

  if (invalidFiles.length > 0) {
    report += '无效文件:\n';
    invalidFiles.forEach(([file, result]) => {
      report += `  ❌ ${file}: ${result.error}\n`;
      if (result.suggestions) {
        result.suggestions.forEach(suggestion => {
          report += `     建议: ${suggestion}\n`;
        });
      }
    });
  }

  return report;
}

module.exports = {
  validateImageFile,
  fixImageFile,
  validateImageDirectory,
  generateImageReport
};