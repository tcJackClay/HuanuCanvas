const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('../config');

/**
 * 本地文件操作工具函数
 * 提供 input/output 目录的文件读写功能
 */

class FileHelper {
  /**
   * 确保目录存在
   */
  static ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`[FileHelper] 创建目录: ${dirPath}`);
    }
  }

  /**
   * 保存文件到 input 目录
   * @param {Buffer|string} content - 文件内容或 base64 字符串
   * @param {string} fileName - 原始文件名
   * @param {boolean} isBase64 - content 是否为 base64 字符串
   * @returns {object} - 保存结果 { success, localPath, localUrl, fileName }
   */
  static saveToInput(content, fileName, isBase64 = false) {
    const inputDir = config.INPUT_DIR;
    this.ensureDir(inputDir);

    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const uniqueName = `${baseName}_${Date.now()}${ext}`;

    const localPath = path.join(inputDir, uniqueName);

    try {
      if (isBase64) {
        fs.writeFileSync(localPath, content, 'base64');
      } else if (Buffer.isBuffer(content)) {
        fs.writeFileSync(localPath, content);
      } else {
        fs.writeFileSync(localPath, content);
      }

      const localUrl = `/files/input/${uniqueName}`;

      console.log(`[FileHelper] 保存到 input: ${localPath}`);

      return {
        success: true,
        localPath: localPath,
        localUrl: localUrl,
        fileName: uniqueName,
        originalName: fileName
      };
    } catch (error) {
      console.error(`[FileHelper] 保存到 input 失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 保存文件到 output 目录
   * @param {Buffer|string} content - 文件内容或 base64 字符串
   * @param {string} fileName - 文件名
   * @param {boolean} isBase64 - content 是否为 base64 字符串
   * @returns {object} - 保存结果
   */
  static saveToOutput(content, fileName, isBase64 = false) {
    const outputDir = config.OUTPUT_DIR;
    this.ensureDir(outputDir);

    const ext = path.extname(fileName) || '.jpg';
    const baseName = path.basename(fileName, ext);
    const uniqueName = `${baseName}_${Date.now()}${ext}`;

    const localPath = path.join(outputDir, uniqueName);

    try {
      if (isBase64) {
        fs.writeFileSync(localPath, content, 'base64');
      } else if (Buffer.isBuffer(content)) {
        fs.writeFileSync(localPath, content);
      } else {
        fs.writeFileSync(localPath, content);
      }

      const localUrl = `/files/output/${uniqueName}`;

      console.log(`[FileHelper] 保存到 output: ${localPath}`);

      return {
        success: true,
        localPath: localPath,
        localUrl: localUrl,
        fileName: uniqueName
      };
    } catch (error) {
      console.error(`[FileHelper] 保存到 output 失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 读取本地文件
   * @param {string} localPath - 本地文件路径
   * @returns {object} - 读取结果 { success, buffer, error }
   */
  static readLocalFile(localPath) {
    try {
      if (!fs.existsSync(localPath)) {
        return {
          success: false,
          error: '文件不存在'
        };
      }

      const buffer = fs.readFileSync(localPath);

      return {
        success: true,
        buffer: buffer,
        size: buffer.length
      };
    } catch (error) {
      console.error(`[FileHelper] 读取文件失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 读取本地文件（URL 格式）
   * @param {string} localUrl - 本地 URL 路径，如 /files/input/xxx.jpg
   * @returns {object} - 读取结果
   */
  static readFromUrl(localUrl) {
    if (!localUrl || !localUrl.startsWith('/files/')) {
      return {
        success: false,
        error: '无效的本地 URL'
      };
    }

    const relativePath = localUrl.replace('/files/', '');
    const [dirName, fileName] = relativePath.split('/');
    const localPath = path.join(config.BASE_DIR, dirName, fileName);

    return this.readLocalFile(localPath);
  }

  /**
   * 下载远程图片并保存
   * @param {string} url - 远程图片 URL
   * @param {string} outputDir - 输出目录 (input/output)
   * @param {string} customName - 自定义文件名（可选）
   * @returns {object} - 下载结果
   */
  static async downloadAndSave(url, outputDir = 'output', customName = null) {
    const targetDir = outputDir === 'input' ? config.INPUT_DIR : config.OUTPUT_DIR;
    this.ensureDir(targetDir);

    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;

      const ext = path.extname(url) || '.jpg';
      const baseName = customName || path.basename(url, ext).substring(0, 50);
      const uniqueName = `${baseName}_${Date.now()}${ext}`;
      const localPath = path.join(targetDir, uniqueName);

      console.log(`[FileHelper] 下载远程文件: ${url}`);

      const req = protocol.get(url, (res) => {
        if (res.statusCode !== 200) {
          return resolve({
            success: false,
            error: `下载失败，HTTP ${res.statusCode}`
          });
        }

        const fileStream = fs.createWriteStream(localPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          const localUrl = `/${outputDir}/${uniqueName}`;

          console.log(`[FileHelper] 下载并保存: ${localPath}`);

          resolve({
            success: true,
            localPath: localPath,
            localUrl: localUrl,
            fileName: uniqueName
          });
        });
      });

      req.on('error', (error) => {
        console.error(`[FileHelper] 下载失败: ${error.message}`);
        resolve({
          success: false,
          error: error.message
        });
      });

      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          success: false,
          error: '下载超时'
        });
      });
    });
  }

  /**
   * 检查本地文件是否存在
   * @param {string} localUrl - 本地 URL 路径
   * @returns {boolean}
   */
  static exists(localUrl) {
    if (!localUrl || !localUrl.startsWith('/files/')) {
      return false;
    }

    const relativePath = localUrl.replace('/files/', '');
    const localPath = path.join(config.BASE_DIR, relativePath);

    return fs.existsSync(localPath);
  }

  /**
   * 删除本地文件
   * @param {string} localUrl - 本地 URL 路径
   * @returns {object} - 删除结果
   */
  static delete(localUrl) {
    if (!localUrl || !localUrl.startsWith('/files/')) {
      return {
        success: false,
        error: '无效的本地 URL'
      };
    }

    const relativePath = localUrl.replace('/files/', '');
    const localPath = path.join(config.BASE_DIR, relativePath);

    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`[FileHelper] 删除文件: ${localPath}`);
        return { success: true };
      }
      return { success: false, error: '文件不存在' };
    } catch (error) {
      console.error(`[FileHelper] 删除文件失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FileHelper;
