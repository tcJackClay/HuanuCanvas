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

// 读取所有 API 配置
function getAllApisConfig() {
  const appConfigPath = path.join(BASE_DIR, 'data', 'app-config.json');
  const defaultConfigs = {
    gemini: { enabled: false, apiKey: '', baseUrl: 'https://generativelanguage.googleapis.com' },
    runninghub: { enabled: true, apiKey: '', baseUrl: 'https://www.runninghub.cn' },
    thirdParty: { enabled: false, apiKey: '', baseUrl: 'https://ai.t8star.cn' },
    sora: { enabled: false, apiKey: '', baseUrl: 'https://api.openai.com' },
    veo: { enabled: false, apiKey: '', baseUrl: 'https://generativelanguage.googleapis.com' },
    jimeng: { enabled: false, sessionId: '', baseUrl: 'http://localhost:5100', region: 'cn', model: 'jimeng-4.5' },
  };

  try {
    console.log('[Config] 尝试读取配置文件:', appConfigPath);

    if (fs.existsSync(appConfigPath)) {
      const appConfigData = fs.readFileSync(appConfigPath, 'utf8');
      const appConfig = JSON.parse(appConfigData);
      console.log('[Config] 配置文件读取成功，开始解析配置...');

      const apis = appConfig.apis || {};
      const result = {};

      for (const [provider, defaultConfig] of Object.entries(defaultConfigs)) {
        const userConfig = apis[provider] || {};
        result[provider] = {
          ...defaultConfig,
          ...userConfig,
        };
        // 特殊处理 jimeng 的 sessionId
        if (provider === 'jimeng') {
          result[provider].sessionId = userConfig.sessionId || defaultConfig.sessionId;
        } else {
          result[provider].apiKey = userConfig.apiKey || defaultConfig.apiKey;
        }
        result[provider].baseUrl = userConfig.baseUrl || defaultConfig.baseUrl;
        result[provider].enabled = userConfig.enabled ?? defaultConfig.enabled;

        if (provider === 'jimeng') {
          console.log(`[Config] ${provider} API配置:`, {
            enabled: result[provider].enabled,
            hasSessionId: !!result[provider].sessionId,
            baseUrl: result[provider].baseUrl,
            region: result[provider].region,
            model: result[provider].model,
          });
        } else {
          console.log(`[Config] ${provider} API配置:`, {
            enabled: result[provider].enabled,
            hasApiKey: !!result[provider].apiKey,
            baseUrl: result[provider].baseUrl,
          });
        }
      }

      console.log('[Config] 配置文件解析完成');
      return result;
    } else {
      console.warn('[Config] 配置文件不存在，使用默认配置:', appConfigPath);
      return defaultConfigs;
    }
  } catch (error) {
    console.error('[Config] 读取app-config.json失败:', error.message);
    return defaultConfigs;
  }
}

// 读取RunningHub配置（保持向后兼容）
function getRunningHubConfig() {
  const allApis = getAllApisConfig();
  const runningHubConfig = allApis.runninghub || {};

  return {
    API_BASE_URL: runningHubConfig.baseUrl || 'https://www.runninghub.cn',
    DEFAULT_API_KEY: runningHubConfig.apiKey || '',
    DEFAULT_WEBAPP_ID: '',
  };
}

// 获取RunningHub功能列表
function getRunningHubFunctions() {
  const appConfigPath = path.join(BASE_DIR, 'data', 'app-config.json');

  try {
    if (fs.existsSync(appConfigPath)) {
      const appConfigData = fs.readFileSync(appConfigPath, 'utf8');
      const appConfig = JSON.parse(appConfigData);
      const functions = appConfig.features?.runningHubFunctions || [];

      console.log('[Config] 获取功能列表:', {
        count: functions.length,
        names: functions.map(f => f.name)
      });

      return functions;
    }
  } catch (error) {
    console.error('[Config] 获取功能列表失败:', error.message);
  }

  return [];
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

  // RunningHub 配置（向后兼容）
  RUNNINGHUB: getRunningHubConfig(),

  // 所有 API 配置
  APIS: getAllApisConfig(),
};

// 导出配置和工具函数
config.getRunningHubFunctions = getRunningHubFunctions;

module.exports = config;
