/**
 * ThirdPartyApiConfig interface
 */
export interface ThirdPartyApiConfig {
  apiKey: string;
  baseUrl: string;
  model?: string;
  timeout?: number;
}

// 导入配置服务
import { getApiConfig } from './configService';

/**
 * Get API configuration
 */
export function getApiConfigLegacy(): ThirdPartyApiConfig {
  return {
    apiKey: '',
    baseUrl: 'https://www.runninghub.cn'
  };
}

/**
 * Save API configuration
 */
export function saveApiConfig(config: ThirdPartyApiConfig): void {
  // TODO: 实现保存API配置到本地存储
  console.log('Saving API config:', config);
}

/**
 * Check API balance
 */
export async function checkBalance(): Promise<{ balance: number; currency: string }> {
  // TODO: 实现检查API余额
  return {
    balance: 0,
    currency: 'CNY'
  };
}