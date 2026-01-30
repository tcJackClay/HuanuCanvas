const path = require('path');
const fs = require('fs');

// 判断是否在 Electron 打包环境中运行
const IS_ELECTRON = process.env.IS_ELECTRON === 'true';
const USER_DATA_PATH = process.env.USER_DATA_PATH;

// 获取项目根目录 (backend-nodejs的上一级)
const PROJECT_DIR = path.resolve(__dirname, '../../..');

// 数据存储基础目录：
// - Electron 打包环境：使用用户数据目录 (%APPDATA%/penguin-magic)
// - 开发环境：使用项目目录
const BASE_DIR = IS_ELECTRON && USER_DATA_PATH ? USER_DATA_PATH : PROJECT_DIR;

// 计算 DIST_DIR：
// - Electron 打包环境：dist 在 app.asar 包内
// - 开发环境：在项目根目录的 dist
function getDistDir() {
  if (IS_ELECTRON) {
    // 打包后：__dirname 是 resources/app.asar.unpacked/backend-nodejs/src
    // dist 在 resources/app.asar.unpacked/dist（因为 dist 在 asarUnpack 配置中）
    return path.resolve(__dirname, '..', '..', 'dist');
  }
  return path.join(PROJECT_DIR, 'dist');
}

// 读取RunningHub配置
function getRunningHubConfig() {
  const appConfigPath = path.join(BASE_DIR, 'data', 'app-config.json');
  let apiKey = '';
  let baseUrl = '';
  let defaultWebAppId = '';
  let functions = [];
  
  try {
    console.log('[Config] 尝试读取配置文件:', appConfigPath);
    
    if (fs.existsSync(appConfigPath)) {
      const appConfigData = fs.readFileSync(appConfigPath, 'utf8');
      const appConfig = JSON.parse(appConfigData);
      
      console.log('[Config] 配置文件读取成功，开始解析配置...');
      
      // 读取RunningHub API配置
      const runningHubConfig = appConfig.apis?.runninghub;
      if (runningHubConfig) {
        apiKey = runningHubConfig.apiKey || '';
        baseUrl = runningHubConfig.baseUrl || 'https://www.runninghub.cn';
        console.log('[Config] RunningHub API配置读取成功:', {
          hasApiKey: !!apiKey,
          baseUrl,
          enabled: runningHubConfig.enabled
        });
      } else {
        console.warn('[Config] 未找到RunningHub API配置，使用默认配置');
      }
      
      // 读取RunningHub功能列表
      functions = appConfig.features?.runningHubFunctions || [];
      if (functions.length > 0) {
        defaultWebAppId = functions[0].webappId;
        console.log('[Config] RunningHub功能列表读取成功:', {
          functionCount: functions.length,
          firstWebAppId: defaultWebAppId,
          functionNames: functions.map(f => f.name)
        });
      } else {
        console.warn('[Config] RunningHub功能列表为空');
      }
      
      console.log('[Config] 配置文件解析完成:', {
        apiKey: apiKey ? apiKey.substring(0, 8) + '...' : '未配置',
        baseUrl,
        defaultWebAppId,
        functionCount: functions.length
      });
      
    } else {
      console.error('[Config] 配置文件不存在:', appConfigPath);
    }
  } catch (error) {
    console.error('[Config] 读取app-config.json失败:', {
      error: error.message,
      path: appConfigPath,
      stack: error.stack
    });
  }
  
  // 直接返回配置值，不使用环境变量
  return {
    API_BASE_URL: baseUrl || 'https://www.runninghub.cn',
    DEFAULT_API_KEY: apiKey,
    DEFAULT_WEBAPP_ID: defaultWebAppId,
  };
}

// 配置项
const config = {
  // 服务器配置
  HOST: process.env.HOST || '127.0.0.1',
  PORT: process.env.PORT || 8766,
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // 目录路径（用户数据目录）
  BASE_DIR: BASE_DIR,
  INPUT_DIR: path.join(BASE_DIR, 'input'),
  OUTPUT_DIR: path.join(BASE_DIR, 'output'),
  THUMBNAILS_DIR: path.join(BASE_DIR, 'thumbnails'),
  DATA_DIR: path.join(BASE_DIR, 'data'),
  CREATIVE_IMAGES_DIR: path.join(BASE_DIR, 'creative_images'),
  
  // 静态资源目录
  DIST_DIR: getDistDir(),
  
  // 缩略图配置
  THUMBNAIL_SIZE: 160, // 缩略图大小（像素）
  THUMBNAIL_QUALITY: 80, // 缩略图质量（JPEG）
  
  // 数据文件路径
  CREATIVE_IDEAS_FILE: path.join(BASE_DIR, 'data', 'creative_ideas.json'),
  HISTORY_FILE: path.join(BASE_DIR, 'data', 'history.json'),
  SETTINGS_FILE: path.join(BASE_DIR, 'data', 'settings.json'),
  DESKTOP_ITEMS_FILE: path.join(BASE_DIR, 'data', 'desktop_items.json'),
  CANVAS_FILE: path.join(BASE_DIR, 'data', 'canvas_list.json'), // 画布列表
  
  // 业务配置
  MAX_HISTORY_COUNT: 500,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // RunningHub 配置
  RUNNINGHUB: getRunningHubConfig(),
};

module.exports = config;
