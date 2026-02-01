import { GeneratedContent, CreativeIdea, SmartPlusConfig, BPField, BPAgentModel, ThirdPartyApiConfig, CreativeCategoryType, CREATIVE_CATEGORIES } from '../../../shared/types';

// 配置存储
let thirdPartyConfig: ThirdPartyApiConfig | null = null;

export const setThirdPartyConfig = (config: ThirdPartyApiConfig | null) => {
  thirdPartyConfig = config;
};

export const getThirdPartyConfig = (): ThirdPartyApiConfig | null => {
  return thirdPartyConfig;
};

// 兼容导出 - API Key 现在由后端从 data/app-config.json 读取
export const initializeAiClient = (_apiKey: string): void => {
  console.log('[Gemini] API Key 配置已移至后端 data/app-config.json，前端无需初始化 AI 客户端');
};

// 文件转 base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        const parts = reader.result.split(',');
        resolve(parts[1] || '');
      } else {
        reject(new Error('文件读取失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取出错'));
    reader.readAsDataURL(file);
  });
};

// 将 aspectRatio 转换为 Nano-banana 支持的格式
const convertAspectRatio = (ratio: string): string | undefined => {
  const validRatios = ['4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '1:1', '4:5', '5:4', '21:9'];
  if (ratio === 'Auto') {
    return undefined;
  }
  if (!validRatios.includes(ratio)) {
    return '1:1';
  }
  return ratio;
};

export interface ImageEditConfig {
  aspectRatio: string;
  imageSize: string;
  seed?: number;
}

// 贞珍API/AI 图片生成
export const editImageWithThirdPartyApi = async (
  files: File[],
  prompt: string,
  config: ImageEditConfig,
  creativeIdeaCost?: number
): Promise<GeneratedContent> => {
  if (!thirdPartyConfig || !thirdPartyConfig.enabled) {
    throw new Error("贞贞API未启用");
  }

  // 构建文件数据
  let fileDataList: { data: string; mimeType: string }[] = [];
  if (files.length > 0) {
    fileDataList = await Promise.all(files.map(async (file) => ({
      data: await fileToBase64(file),
      mimeType: file.type,
    })));
  }

  const response = await fetch('/api/ai/thirdparty/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      files: fileDataList,
      config: {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize,
        seed: config.seed,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API 请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '生成失败');
  }

  return { text: null, imageUrl: result.data.imageUrl };
};

// 贞珍API 文本处理
export const chatWithThirdPartyApi = async (
  systemPrompt: string,
  userMessage: string,
  imageFile?: File
): Promise<string> => {
  if (!thirdPartyConfig || !thirdPartyConfig.enabled) {
    throw new Error("贞贞API未启用");
  }

  let fileData: { data: string; mimeType: string } | null = null;
  if (imageFile) {
    fileData = {
      data: await fileToBase64(imageFile),
      mimeType: imageFile.type,
    };
  }

  const response = await fetch('/api/ai/thirdparty/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
      file: fileData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Chat API 请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '处理失败');
  }

  return result.data.text;
};

// 统一图片生成（后端根据配置自动选择 API）
export const editImageWithGemini = async (
  files: File[],
  prompt: string,
  config: ImageEditConfig,
  _creativeIdeaCost?: number
): Promise<GeneratedContent> => {
  // 构建文件数据
  let fileDataList: { data: string; mimeType: string }[] = [];
  if (files.length > 0) {
    fileDataList = await Promise.all(files.map(async (file) => ({
      data: await fileToBase64(file),
      mimeType: file.type,
    })));
  }

  // 调用统一端点，后端自动选择 API
  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      files: fileDataList,
      config: {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '图片生成请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '生成失败');
  }

  return { text: null, imageUrl: result.data.imageUrl };
};

// BP Agent 任务
const runBPAgentTaskWithThirdParty = async (
  file: File | null,
  instruction: string
): Promise<string> => {
  const systemInstruction = file
    ? `You are an AI analysis agent.
Your task is to analyze the image based on the user's specific instruction and extract/generate the relevant information.
Output Rule: Return ONLY the result string. Do not include labels, markdown, or conversational filler. Keep it concise and suitable for use in an image generation prompt.`
    : `You are an AI creative agent.
Your task is to generate creative content based on the user's instruction.
Output Rule: Return ONLY the result string. Do not include labels, markdown, or conversational filler. Keep it concise and suitable for use in an image generation prompt.`;

  return chatWithThirdPartyApi(systemInstruction, instruction, file || undefined);
};

const runBPAgentTask = async (
  file: File | null,
  instruction: string,
  model: BPAgentModel
): Promise<string> => {
  if (thirdPartyConfig && thirdPartyConfig.enabled) {
    return runBPAgentTaskWithThirdParty(file, instruction);
  }

  // 使用 Gemini API（通过后端代理）
  let fileData: { data: string; mimeType: string } | null = null;
  if (file) {
    fileData = {
      data: await fileToBase64(file),
      mimeType: file.type,
    };
  }

  const systemInstruction = file
    ? `You are an AI analysis agent.
Your task is to analyze the image based on the user's specific instruction and extract/generate the relevant information.
Output Rule: Return ONLY the result string.`
    : `You are an AI creative agent.
Your task is to generate creative content based on the user's instruction.
Output Rule: Return ONLY the result string.`;

  const response = await fetch('/api/ai/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: systemInstruction,
      userMessage: instruction,
      file: fileData,
      model,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API 请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '处理失败');
  }

  return result.data.text;
};

export const processBPTemplate = async (
  file: File | null,
  templateIdea: CreativeIdea,
  userInputs: Record<string, string>
): Promise<string> => {
  console.log('[BP Template] 开始处理:', {
    title: templateIdea.title,
    hasBpFields: !!templateIdea.bpFields,
    fieldsCount: templateIdea.bpFields?.length || 0,
    agentCount: templateIdea.bpFields?.filter(f => f.type === 'agent').length || 0,
    hasFile: !!file,
    userInputs,
  });

  if (!templateIdea.bpFields || templateIdea.bpFields.length === 0) {
    console.log('[BP Template] 没有bpFields，返回原始提示词');
    return templateIdea.prompt;
  }

  let finalPrompt = templateIdea.prompt;
  const fields = templateIdea.bpFields;

  const nameToId: Record<string, string> = {};
  const nameToField: Record<string, typeof fields[0]> = {};
  fields.forEach(f => {
    nameToId[f.name] = f.id;
    nameToField[f.name] = f;
  });

  const parseDependencies = (instruction: string): { inputs: string[]; agents: string[] } => {
    const inputs: string[] = [];
    const agents: string[] = [];

    const inputMatches = instruction.match(/\/([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (inputMatches) {
      inputMatches.forEach(match => {
        const name = match.slice(1);
        if (nameToField[name]?.type === 'input') {
          inputs.push(name);
        }
      });
    }

    const agentMatches = instruction.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
    if (agentMatches) {
      agentMatches.forEach(match => {
        const name = match.slice(1, -1);
        if (nameToField[name]?.type === 'agent') {
          agents.push(name);
        }
      });
    }

    return { inputs, agents };
  };

  const agentFields = fields.filter(f => f.type === 'agent');
  const inputFields = fields.filter(f => f.type === 'input');

  const agentDependencies: Record<string, { inputs: string[]; agents: string[] }> = {};
  agentFields.forEach(agent => {
    if (agent.agentConfig) {
      agentDependencies[agent.name] = parseDependencies(agent.agentConfig.instruction);
    } else {
      agentDependencies[agent.name] = { inputs: [], agents: [] };
    }
  });

  const executionOrder: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const topologicalSort = (agentName: string): boolean => {
    if (visited.has(agentName)) return true;
    if (visiting.has(agentName)) {
      console.warn(`检测到循环依赖: ${agentName}`);
      return false;
    }

    visiting.add(agentName);

    const deps = agentDependencies[agentName];
    if (deps) {
      for (const depAgent of deps.agents) {
        if (!topologicalSort(depAgent)) {
          return false;
        }
      }
    }

    visiting.delete(agentName);
    visited.add(agentName);
    executionOrder.push(agentName);
    return true;
  };

  for (const agent of agentFields) {
    topologicalSort(agent.name);
  }

  const agentResults: Record<string, string> = {};

  for (const agentName of executionOrder) {
    const field = nameToField[agentName];
    if (!field || field.type !== 'agent' || !field.agentConfig) continue;

    let instruction = field.agentConfig.instruction;

    inputFields.forEach(inputField => {
      const val = userInputs[inputField.id] || '';
      instruction = instruction.split(`/${inputField.name}`).join(val);
    });

    for (const [name, result] of Object.entries(agentResults)) {
      instruction = instruction.split(`{${name}}`).join(result);
    }

    try {
      console.log(`[BP Agent] 执行 ${agentName}...`);
      const result = await runBPAgentTask(file, instruction, field.agentConfig.model);
      console.log(`[BP Agent] ${agentName} 完成`);
      agentResults[agentName] = result;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`[BP Agent] ${agentName} 失败`);
      agentResults[agentName] = `[Agent错误: ${errorMsg}]`;
    }
  }

  for (const [name, result] of Object.entries(agentResults)) {
    finalPrompt = finalPrompt.split(`{${name}}`).join(result);
  }

  inputFields.forEach(f => {
    const val = userInputs[f.id] || '';
    finalPrompt = finalPrompt.split(`/${f.name}`).join(val);
  });

  return finalPrompt;
};

const getSmartSystemInstruction = () => `You are a "Creative Prompt Fusion Specialist." Your goal is to merge a 'Modifier Keyword' into a 'Base Prompt' intelligently.

Principles:
1. **Base Prompt is Law**: Preserve the main subject and intent.
2. **Keyword is Additive**: Treat it as a descriptive layer.
3. **Output**: ONLY the final prompt string. No explanations.`;

const getSmartPlusSystemInstruction = () => `You are a commercial **Art Director**. Synthesize a conceptual brief into a vivid scene description for a high-end product photoshoot.

Output Rules:
* Output ONLY the final prompt string.
* Single paragraph.
* Descriptive and professional. No markdown.`;

interface GeneratePromptParams {
  file: File;
  idea: CreativeIdea;
  keyword?: string;
  smartPlusConfig?: SmartPlusConfig;
}

export const generateCreativePromptFromImage = async ({
  file,
  idea,
  keyword = '',
  smartPlusConfig,
}: GeneratePromptParams): Promise<string> => {
  const useThirdParty = thirdPartyConfig && thirdPartyConfig.enabled && thirdPartyConfig.apiKey;

  if (!file) throw new Error("请上传图片");

  if (idea.isBP) {
    throw new Error("BP Mode should use processBPTemplate directly.");
  }

  let systemInstruction = '';
  let userMessage = '';

  if (idea.isSmartPlus && smartPlusConfig) {
    systemInstruction = getSmartPlusSystemInstruction();
    userMessage += `Story Brief:
"""
${idea.prompt}
"""

`;
    if (keyword.trim()) {
      userMessage += `Keywords:
"""
${keyword}
"""

`;
    }
    userMessage += `Key Elements:\n`;

    const templateConfig = idea.smartPlusConfig || [];

    templateConfig.forEach(templateComponent => {
      if (templateComponent.enabled) {
        const overrideComponent = smartPlusConfig.find(c => c.id === templateComponent.id);

        if (overrideComponent && overrideComponent.enabled) {
          const featureText = overrideComponent.features.trim() || 'Describe creatively based on the Story Brief';
          userMessage += `- ${overrideComponent.label}: ${featureText}\n`;
        } else {
          userMessage += `- ${templateComponent.label}: [GENERATE CREATIVELY]\n`;
        }
      }
    });
  } else {
    systemInstruction = getSmartSystemInstruction();
    userMessage += `Base Prompt:
"""
${idea.prompt}
"""

Modifier Keyword:
"""
${keyword}
"""

`;
  }

  userMessage += "\n\nNow, based on the provided image and all the rules, generate the final, synthesized prompt.";

  if (useThirdParty) {
    const fileData = {
      data: await fileToBase64(file),
      mimeType: file.type,
    };
    const response = await fetch('/api/ai/thirdparty/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemInstruction,
        userMessage,
        file: fileData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API 请求失败');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '处理失败');
    }

    return result.data.text;
  }

  // 使用 Gemini API（通过后端代理）
  const fileData = {
    data: await fileToBase64(file),
    mimeType: file.type,
  };

  const response = await fetch('/api/ai/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: systemInstruction,
      userMessage,
      file: fileData,
      model: 'gemini-3-pro-preview',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API 请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '处理失败');
  }

  return result.data.text;
};

export const optimizePrompt = async (userPrompt: string): Promise<string> => {
  const useThirdParty = thirdPartyConfig && thirdPartyConfig.enabled && thirdPartyConfig.apiKey;

  const systemInstruction = `You are an expert AI image generation prompt engineer. Your task is to take a user's brief description or keywords and expand them into a detailed, high-quality image generation prompt.

Rules:
1. Understand the user's intent from their brief input
2. Expand the description with relevant details about:
   - Subject details and characteristics
   - Art style and visual aesthetic
   - Lighting and atmosphere
   - Composition and framing
   - Color palette and mood
3. Keep the expanded prompt focused and coherent
4. Output ONLY the optimized prompt text, no explanations
5. The output should be in the same language as the input
6. Keep output concise but descriptive (aim for 50-150 words)`;

  const userMessage = `Please optimize and expand this brief prompt into a detailed image generation prompt:

"""${userPrompt}"""

Output the optimized prompt directly:`;

  if (useThirdParty) {
    const response = await fetch('/api/ai/thirdparty/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemInstruction,
        userMessage,
        file: null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API 请求失败');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '处理失败');
    }

    return result.data.text;
  }

  // 使用 Gemini API（通过后端代理）
  const response = await fetch('/api/ai/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: systemInstruction,
      userMessage,
      file: null,
      model: 'gemini-2.0-flash',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API 请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '处理失败');
  }

  return result.data.text;
};

export const autoClassifyCreative = async (title: string, prompt: string): Promise<CreativeCategoryType> => {
  const useThirdParty = thirdPartyConfig && thirdPartyConfig.enabled && thirdPartyConfig.apiKey;

  const validCategories = CREATIVE_CATEGORIES.map(c => c.key).join(', ');

  const systemInstruction = `You are a creative content classifier. Your task is to classify creative templates into one of these categories:

${CREATIVE_CATEGORIES.map(c => `- ${c.key}: ${c.label} (${c.icon})`).join('\n')}

Rules:
1. Analyze the title and prompt to determine the main subject
2. Output ONLY the category key (one of: ${validCategories}), nothing else`;

  const userMessage = `Classify this creative template:

Title: ${title}
Prompt: ${prompt.slice(0, 500)}${prompt.length > 500 ? '...' : ''}

Category:`;

  let result: string;

  if (useThirdParty) {
    const response = await fetch('/api/ai/thirdparty/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemInstruction,
        userMessage,
        file: null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API 请求失败');
    }

    const resData = await response.json();
    if (!resData.success) {
      throw new Error(resData.error || '处理失败');
    }

    result = resData.data.text;
  } else {
    const response = await fetch('/api/ai/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemInstruction,
        userMessage,
        file: null,
        model: 'gemini-2.0-flash',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API 请求失败');
    }

    const resData = await response.json();
    if (!resData.success) {
      throw new Error(resData.error || '处理失败');
    }

    result = resData.data.text;
  }

  const cleanResult = result.trim().toLowerCase();
  const validKeys = CREATIVE_CATEGORIES.map(c => c.key);

  if (validKeys.includes(cleanResult as CreativeCategoryType)) {
    return cleanResult as CreativeCategoryType;
  }

  for (const cat of CREATIVE_CATEGORIES) {
    if (cleanResult.includes(cat.key) || cleanResult.includes(cat.label)) {
      return cat.key;
    }
  }

  return 'other';
};

// ============ Jimeng API 服务 ============

export interface JimengConfig {
  enabled: boolean;
  sessionId: string;
  baseUrl: string;
  region: string;
  model: string;
}

let jimengConfig: JimengConfig | null = null;

export const setJimengConfig = (config: JimengConfig | null) => {
  jimengConfig = config;
};

export const getJimengConfig = (): JimengConfig | null => {
  return jimengConfig;
};

// Jimeng 文生图
export const editImageWithJimeng = async (
  files: File[],
  prompt: string,
  config: ImageEditConfig,
  _creativeIdeaCost?: number
): Promise<GeneratedContent> => {
  if (!jimengConfig || !jimengConfig.enabled) {
    throw new Error("Jimeng API 未启用");
  }

  if (!jimengConfig.sessionId) {
    throw new Error("请先配置 Jimeng Session ID");
  }

  let fileDataList: { data: string; mimeType: string }[] = [];
  if (files.length > 0) {
    fileDataList = await Promise.all(files.map(async (file) => ({
      data: await fileToBase64(file),
      mimeType: file.type,
    })));
  }

  const endpoint = fileDataList.length > 0 ? '/api/ai/jimeng/composition' : '/api/ai/jimeng/image';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      files: fileDataList.length > 0 ? fileDataList : undefined,
      config: {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Jimeng API 请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '生成失败');
  }

  return { text: null, imageUrl: result.data.imageUrl };
};

// Jimeng 图生图（显式调用）
export const composeImageWithJimeng = async (
  files: File[],
  prompt: string,
  config: ImageEditConfig
): Promise<GeneratedContent> => {
  return editImageWithJimeng(files, prompt, config);
};
