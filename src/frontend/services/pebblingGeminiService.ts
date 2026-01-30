/**
 * ThirdPartyApiConfig interface
 */
export interface ThirdPartyApiConfig {
  apiKey: string;
  baseUrl: string;
  model?: string;
  timeout?: number;
}

/**
 * Get API configuration
 */
export function getApiConfig(): ThirdPartyApiConfig {
  // TODO: 实现从配置文件获取API配置
  return {
    apiKey: '',
    baseUrl: 'https://api.runninghub.com'
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