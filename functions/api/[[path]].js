// TranOptim API for Cloudflare Pages Functions

// 认证配置
const AuthConfig = {
  // 预设用户列表，格式为：用户名:密码
  // 实际部署时建议通过环境变量覆盖这些默认值
  users: {
    "admin": "admin123",
    "user1": "password123",
    "demo": "demo2024"
  },
  
  // 认证相关设置
  settings: {
    // 是否启用认证功能 - 默认禁用以保持兼容性
    enabled: false
  }
};

// 代理配置 - 用于访问可能被地区限制的API
function getProxyConfig(env) {
  return {
    openai: {
      useProxy: true,
      // 支持多个代理服务器，按优先级尝试
      urls: [
        env.OPENAI_PROXY_URL || 'https://api.openai-sb.com/v1',
        'https://api.openai.com/v1', // 官方直连
        'https://openai.api2d.net/v1', // API2D代理
        'https://api.chatanywhere.com.cn/v1' // ChatAnywhere代理
      ]
    },
    gemini: {
      useProxy: true,
      urls: [
        env.GEMINI_PROXY_URL || 'https://generativelanguage.googleapis.com/v1beta',
        'https://generativelanguage.googleapis.com/v1beta' // 官方直连
      ]
    }
  };
}

export async function onRequest(context) {
  // 获取请求信息
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  // API路由分发
  // 认证相关API路由不需要验证
  if (path === 'auth/login') {
    return await handleLogin(request, env);
  } else if (path === 'auth/validate') {
    return await handleValidateToken(request, env);
  }
  
  // 其他API需要验证认证
  const isAuthenticated = await validateAuthentication(request, env);
  if (!isAuthenticated) {
    return new Response(JSON.stringify({
      error: '未授权访问，请先登录'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // 根据路径处理不同API请求
  if (path === 'translate/text') {
    return await handleTextTranslate(request, env);
  } else if (path === 'translate/image') {
    return await handleImageTranslate(request, env);
  } else if (path === 'polish/text') {
    return await handleTextPolish(request, env);
  } else {
    return new Response(JSON.stringify({
      error: '未找到请求的API路径'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// 处理OPTIONS预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 验证用户认证
async function validateAuthentication(request, env) {
  // 如果认证功能被禁用，直接返回通过
  if (env.AUTH_ENABLED === 'false' || !AuthConfig.settings.enabled) {
    return true;
  }
  
  // 从请求头获取认证Token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  if (!token) {
    return false;
  }
  
  // 简单验证：验证Token有效性（真实环境应使用JWT或其他加密方式）
  try {
    // Token格式：username:timestamp:randomString
    const parts = token.split(':');
    if (parts.length < 2) {
      return false;
    }
    
    const username = parts[0];
    const timestamp = parseInt(parts[1]);
    const currentTime = new Date().getTime();
    
    // 验证Token是否过期（7天有效期）
    const validityPeriod = 7 * 24 * 60 * 60 * 1000;
    if (currentTime - timestamp > validityPeriod) {
      return false;
    }
    
    // 验证用户是否存在
    const users = env.AUTH_USERS ? JSON.parse(env.AUTH_USERS) : AuthConfig.users;
    return !!users[username];
  } catch (error) {
    console.error('认证验证错误:', error);
    return false;
  }
}

// 处理登录请求
async function handleLogin(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: '仅支持POST请求' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ 
        error: '请提供用户名和密码' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 从环境变量或默认配置获取用户列表
    const users = env.AUTH_USERS ? JSON.parse(env.AUTH_USERS) : AuthConfig.users;
    
    // 验证用户凭据
    if (users[username] === password) {
      // 生成简单的认证Token
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2);
      const token = `${username}:${timestamp}:${randomStr}`;
      
      // 计算过期时间（7天）
      const expiryTime = timestamp + (7 * 24 * 60 * 60 * 1000);
      
      return new Response(JSON.stringify({
        success: true,
        token: token,
        expiryTime: expiryTime,
        username: username
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: '处理登录请求时出错: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 验证Token有效性
async function handleValidateToken(request, env) {
  // 检查是否有认证头
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      valid: false,
      error: '缺少认证Token'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.substring(7);
  const isValid = await validateAuthentication(request, env);
  
  return new Response(JSON.stringify({
    valid: isValid
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 文本翻译处理函数
async function handleTextTranslate(request, env) {
  // 检查是否是POST请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: '仅支持POST请求' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解析请求体
    const requestData = await request.json();
    const { text, sourceLang, targetLang, service } = requestData;
    
    if (!text) {
      return new Response(JSON.stringify({ 
        error: '请提供需要翻译的文本' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 实际翻译处理逻辑
    // 注意: 这里将调用外部API，需要根据服务提供商调整
    const result = await callTranslationService(text, sourceLang, targetLang, service, env);
    
    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: '处理请求时出错: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 图片翻译处理函数
async function handleImageTranslate(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: '仅支持POST请求' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解析FormData
    const formData = await request.formData();
    const image = formData.get('image');
    const sourceLang = formData.get('sourceLang');
    const targetLang = formData.get('targetLang');
    const service = formData.get('service');
    
    if (!image) {
  return new Response(JSON.stringify({
        error: '请上传图片' 
  }), {
        status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
    }

    // 简化的图片翻译实现
    const result = {
      originalText: '[图片识别文字]',
      translatedText: `[Cloudflare ${service}图片翻译] 图片翻译功能在Cloudflare部署中为简化版本，请使用本地服务获得完整功能。`,
      service: service === 'gpt' ? 'ChatGPT' : service.toUpperCase(),
      error: false
    };
    
    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: '处理图片请求时出错: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 文本润色处理函数
async function handleTextPolish(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: '仅支持POST请求' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestData = await request.json();
    const { text, style, service, multiStyle } = requestData;
    
    if (!text) {
      return new Response(JSON.stringify({ 
        error: '请提供需要润色的文本' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 实际润色处理逻辑
    const result = await callPolishService(text, style, service, env, multiStyle);
    
    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: '处理请求时出错: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 调用翻译服务的辅助函数
async function callTranslationService(text, sourceLang, targetLang, service, env) {
  try {
    if (service === 'gpt') {
      return await callOpenAITranslation(text, sourceLang, targetLang, env);
    } else if (service === 'deepseek') {
      return await callDeepSeekTranslation(text, sourceLang, targetLang, env);
    } else if (service === 'qwen') {
      return await callQwenTranslation(text, sourceLang, targetLang, env);
    } else if (service === 'gemini') {
      return await callGeminiTranslation(text, sourceLang, targetLang, env);
    } else if (service === 'doubao') {
      return await callDoubaoTranslation(text, sourceLang, targetLang, env);
    } else {
      throw new Error(`不支持的翻译服务: ${service}`);
    }
  } catch (error) {
    console.error(`${service}翻译失败:`, error);
    console.error(`错误详情 - 服务: ${service}, 状态: ${error.status || 'unknown'}, 消息: ${error.message}`);
    
    // 根据错误类型提供更详细的错误信息
    let errorMessage = error.message;
    if (error.message.includes('403')) {
      errorMessage = `${service} API密钥无效或没有权限访问所请求的模型`;
    } else if (error.message.includes('400')) {
      errorMessage = `${service} API请求格式错误，请检查配置`;
    } else if (error.message.includes('404')) {
      errorMessage = `${service} API端点不存在或模型不可用`;
    } else if (error.message.includes('429')) {
      errorMessage = `${service} API请求频率超限，请稍后重试`;
    } else if (error.message.includes('500')) {
      errorMessage = `${service} 服务器内部错误，请稍后重试`;
    }
    
    return {
      originalText: text,
      translatedText: `翻译失败: ${errorMessage}`,
      service: service === 'gpt' ? 'ChatGPT' : service.toUpperCase(),
      error: true
    };
  }
}

// OpenAI翻译实现
async function callOpenAITranslation(text, sourceLang, targetLang, env) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 OPENAI_API_KEY 环境变量');
  }

  const fromLangName = getLanguageName(sourceLang);
  const toLangName = getLanguageName(targetLang);
  
  const prompt = sourceLang === 'auto' 
    ? `请将以下文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`
    : `请将以下${fromLangName}文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`;

  // 尝试使用gpt-4o，如果失败则降级到gpt-3.5-turbo
  const models = ['gpt-4o', 'gpt-3.5-turbo'];
  let lastError;
  
  for (const model of models) {
    try {
      // 尝试不同的API端点
      const apiUrls = getProxyConfig(env).openai.urls;
      
      for (const baseUrl of apiUrls) {
        try {
          const apiUrl = `${baseUrl}/chat/completions`;
          console.log(`尝试OpenAI API: ${model} @ ${apiUrl}`);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [{
                role: 'user',
                content: prompt
              }],
              max_tokens: 2048,
              temperature: 0.3
            })
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`OpenAI API错误: ${response.status} ${response.statusText} - ${errorData}`);
          }

          const data = await response.json();
          const translatedText = data.choices[0]?.message?.content?.trim();
          
          if (!translatedText) {
            throw new Error('OpenAI返回空结果');
          }

          console.log(`OpenAI翻译成功: ${model} @ ${apiUrl}`);
          return {
            originalText: text,
            translatedText: translatedText,
            service: 'ChatGPT',
            error: false
          };
        } catch (urlError) {
          console.log(`OpenAI API ${baseUrl} 失败:`, urlError.message);
          if (baseUrl === apiUrls[apiUrls.length - 1]) {
            throw urlError; // 如果是最后一个URL也失败了，抛出错误
          }
        }
      }
    } catch (error) {
      lastError = error;
      console.log(`OpenAI模型 ${model} 失败，尝试下一个模型:`, error.message);
      if (model === models[models.length - 1]) {
        // 如果是最后一个模型也失败了，抛出错误
        throw lastError;
      }
    }
  }
}

// DeepSeek翻译实现
async function callDeepSeekTranslation(text, sourceLang, targetLang, env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 DEEPSEEK_API_KEY 环境变量');
  }

  const fromLangName = getLanguageName(sourceLang);
  const toLangName = getLanguageName(targetLang);
  
  const prompt = sourceLang === 'auto' 
    ? `请将以下文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`
    : `请将以下${fromLangName}文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`;

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2048,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const translatedText = data.choices[0]?.message?.content?.trim();
  
  if (!translatedText) {
    throw new Error('DeepSeek返回空结果');
  }

  return {
    originalText: text,
    translatedText: translatedText,
    service: 'DeepSeek',
    error: false
  };
}

// 获取语言名称的辅助函数
function getLanguageName(langCode) {
  const langMap = {
    'zh': '中文',
    'en': '英文',
    'ja': '日文',
    'ko': '韩文',
    'fr': '法文',
    'de': '德文',
    'es': '西班牙文',
    'pt': '葡萄牙文',
    'ru': '俄文',
    'it': '意大利文',
    'auto': '自动检测'
  };
  return langMap[langCode] || langCode;
}

// Qwen翻译实现
async function callQwenTranslation(text, sourceLang, targetLang, env) {
  const apiKey = env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 QWEN_API_KEY 环境变量');
  }

  const fromLangName = getLanguageName(sourceLang);
  const toLangName = getLanguageName(targetLang);
  
  const prompt = sourceLang === 'auto' 
    ? `请将以下文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`
    : `请将以下${fromLangName}文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`;

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2048,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`Qwen API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const translatedText = data.choices[0]?.message?.content?.trim();
  
  if (!translatedText) {
    throw new Error('Qwen返回空结果');
  }

  return {
    originalText: text,
    translatedText: translatedText,
    service: 'Qwen',
    error: false
  };
}

// Gemini翻译实现
async function callGeminiTranslation(text, sourceLang, targetLang, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 GEMINI_API_KEY 环境变量');
  }

  const fromLangName = getLanguageName(sourceLang);
  const toLangName = getLanguageName(targetLang);
  
  const prompt = sourceLang === 'auto' 
    ? `请将以下文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`
    : `请将以下${fromLangName}文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`;

  // 尝试不同的API端点
  const apiUrls = getProxyConfig(env).gemini.urls;
  
  for (const baseUrl of apiUrls) {
    try {
      const apiUrl = `${baseUrl}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      console.log(`尝试Gemini API: ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates.length) {
        if (data.promptFeedback && data.promptFeedback.blockReason) {
          throw new Error(`Gemini提示被拒绝: ${data.promptFeedback.blockReason}`);
        }
        throw new Error('Gemini返回异常响应');
      }
      
      const translatedText = data.candidates[0].content.parts[0].text.trim();
      
      if (!translatedText) {
        throw new Error('Gemini返回空结果');
      }

      console.log(`Gemini翻译成功: ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
      return {
        originalText: text,
        translatedText: translatedText,
        service: 'Gemini',
        error: false
      };
    } catch (urlError) {
      console.log(`Gemini API ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')} 失败:`, urlError.message);
      if (baseUrl === apiUrls[apiUrls.length - 1]) {
        throw urlError; // 如果是最后一个URL也失败了，抛出错误
      }
    }
  }
}

// 豆包翻译实现
async function callDoubaoTranslation(text, sourceLang, targetLang, env) {
  const apiKey = env.DOUBAO_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 DOUBAO_API_KEY 环境变量');
  }

  const fromLangName = getLanguageName(sourceLang);
  const toLangName = getLanguageName(targetLang);
  
  const prompt = sourceLang === 'auto' 
    ? `请将以下文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`
    : `请将以下${fromLangName}文本翻译成${toLangName}，请直接输出翻译结果，不要包含任何解释或额外内容：\n\n${text}`;

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'doubao-1-5-pro-32k-250115',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`豆包 API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const translatedText = data.choices[0]?.message?.content?.trim();
  
  if (!translatedText) {
    throw new Error('豆包返回空结果');
  }
  
  return {
    originalText: text,
    translatedText: translatedText,
    service: '豆包',
    error: false
  };
}

// 调用润色服务的辅助函数
async function callPolishService(text, style, service, env, multiStyle = false) {
  try {
    if (multiStyle) {
      // 多风格润色
      const normalResult = await callPolishAPI(text, 'normal', service, env);
      const rephraseResult = await callPolishAPI(text, 'rephrase', service, env);
      
      return {
        originalText: text,
        normalStyle: normalResult.translatedText,
        rephraseStyle: rephraseResult.translatedText,
        service: normalResult.service
      };
    } else {
      // 单风格润色
      return await callPolishAPI(text, style, service, env);
    }
  } catch (error) {
    console.error(`${service}润色失败:`, error);
    if (multiStyle) {
      return {
        originalText: text,
        normalStyle: `润色失败: ${error.message}`,
        rephraseStyle: `润色失败: ${error.message}`,
        service: service === 'gpt' ? 'ChatGPT' : service.toUpperCase()
      };
    } else {
      return {
        originalText: text,
        translatedText: `润色失败: ${error.message}`,
        service: service === 'gpt' ? 'ChatGPT' : service.toUpperCase(),
        style: style,
        error: true
      };
    }
  }
}

// 调用润色API的通用函数
async function callPolishAPI(text, style, service, env) {
  if (service === 'gpt') {
    return await callOpenAIPolish(text, style, env);
  } else if (service === 'deepseek') {
    return await callDeepSeekPolish(text, style, env);
  } else if (service === 'gemini') {
    return await callGeminiPolish(text, style, env);
  } else if (service === 'qwen') {
    return await callQwenPolish(text, style, env);
  } else if (service === 'doubao') {
    return await callDoubaoPolish(text, style, env);
  } else {
    throw new Error(`不支持的润色服务: ${service}`);
  }
}

// OpenAI润色实现
async function callOpenAIPolish(text, style, env) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 OPENAI_API_KEY 环境变量');
  }

  let prompt;
  if (style === 'normal') {
    prompt = `请对以下文本进行常规优化，保持原意的同时提升表达质量和流畅度。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  } else if (style === 'rephrase') {
    prompt = `请重新组织以下文本的表达方式，保持核心内容不变但使用不同的语言结构和词汇。请直接输出改写后的文本，不要包含任何解释：\n\n${text}`;
  } else {
    prompt = `请对以下文本进行${style}风格的润色优化。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  }

  // 尝试使用gpt-4o，如果失败则降级到gpt-3.5-turbo
  const models = ['gpt-4o', 'gpt-3.5-turbo'];
  let lastError;
  
  for (const model of models) {
    try {
      // 尝试不同的API端点
      const apiUrls = getProxyConfig(env).openai.urls;
      
      for (const baseUrl of apiUrls) {
        try {
          const apiUrl = `${baseUrl}/chat/completions`;
          console.log(`尝试OpenAI润色API: ${model} @ ${apiUrl}`);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [{
                role: 'user',
                content: prompt
              }],
              max_tokens: 2048,
              temperature: 0.7
            })
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`OpenAI API错误: ${response.status} ${response.statusText} - ${errorData}`);
          }

          const data = await response.json();
          const polishedText = data.choices[0]?.message?.content?.trim();
          
          if (!polishedText) {
            throw new Error('OpenAI返回空结果');
          }

          console.log(`OpenAI润色成功: ${model} @ ${apiUrl}`);
          return {
            originalText: text,
            translatedText: polishedText,
            service: 'ChatGPT',
            style: style,
            error: false
          };
        } catch (urlError) {
          console.log(`OpenAI润色API ${baseUrl} 失败:`, urlError.message);
          if (baseUrl === apiUrls[apiUrls.length - 1]) {
            throw urlError; // 如果是最后一个URL也失败了，抛出错误
          }
        }
      }
    } catch (error) {
      lastError = error;
      console.log(`OpenAI润色模型 ${model} 失败，尝试下一个模型:`, error.message);
      if (model === models[models.length - 1]) {
        // 如果是最后一个模型也失败了，抛出错误
        throw lastError;
      }
    }
  }
}

// DeepSeek润色实现
async function callDeepSeekPolish(text, style, env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 DEEPSEEK_API_KEY 环境变量');
  }

  let prompt;
  if (style === 'normal') {
    prompt = `请对以下文本进行常规优化，保持原意的同时提升表达质量和流畅度。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  } else if (style === 'rephrase') {
    prompt = `请重新组织以下文本的表达方式，保持核心内容不变但使用不同的语言结构和词汇。请直接输出改写后的文本，不要包含任何解释：\n\n${text}`;
  } else {
    prompt = `请对以下文本进行${style}风格的润色优化。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  }

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const polishedText = data.choices[0]?.message?.content?.trim();
  
  if (!polishedText) {
    throw new Error('DeepSeek返回空结果');
  }

  return {
    originalText: text,
    translatedText: polishedText,
    service: 'DeepSeek',
    style: style,
    error: false
  };
}

// Gemini润色实现
async function callGeminiPolish(text, style, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 GEMINI_API_KEY 环境变量');
  }

  let prompt;
  if (style === 'normal') {
    prompt = `请对以下文本进行常规优化，保持原意的同时提升表达质量和流畅度。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  } else if (style === 'rephrase') {
    prompt = `请重新组织以下文本的表达方式，保持核心内容不变但使用不同的语言结构和词汇。请直接输出改写后的文本，不要包含任何解释：\n\n${text}`;
  } else {
    prompt = `请对以下文本进行${style}风格的润色优化。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  }

  // 尝试不同的API端点
  const apiUrls = getProxyConfig(env).gemini.urls;
  
  for (const baseUrl of apiUrls) {
    try {
      const apiUrl = `${baseUrl}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      console.log(`尝试Gemini润色API: ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates.length) {
        throw new Error('Gemini返回异常响应');
      }
      
      const polishedText = data.candidates[0].content.parts[0].text.trim();
      
      if (!polishedText) {
        throw new Error('Gemini返回空结果');
      }

      console.log(`Gemini润色成功: ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
      return {
        originalText: text,
        translatedText: polishedText,
        service: 'Gemini',
        style: style,
        error: false
      };
    } catch (urlError) {
      console.log(`Gemini润色API ${baseUrl} 失败:`, urlError.message);
      if (baseUrl === apiUrls[apiUrls.length - 1]) {
        throw urlError; // 如果是最后一个URL也失败了，抛出错误
      }
    }
  }
}

// Qwen润色实现
async function callQwenPolish(text, style, env) {
  const apiKey = env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 QWEN_API_KEY 环境变量');
  }

  let prompt;
  if (style === 'normal') {
    prompt = `请对以下文本进行常规优化，保持原意的同时提升表达质量和流畅度。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  } else if (style === 'rephrase') {
    prompt = `请重新组织以下文本的表达方式，保持核心内容不变但使用不同的语言结构和词汇。请直接输出改写后的文本，不要包含任何解释：\n\n${text}`;
  } else {
    prompt = `请对以下文本进行${style}风格的润色优化。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  }

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Qwen API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const polishedText = data.choices[0]?.message?.content?.trim();
  
  if (!polishedText) {
    throw new Error('Qwen返回空结果');
  }

  return {
    originalText: text,
    translatedText: polishedText,
    service: 'Qwen',
    style: style,
    error: false
  };
}

// 豆包润色实现
async function callDoubaoPolish(text, style, env) {
  const apiKey = env.DOUBAO_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 DOUBAO_API_KEY 环境变量');
  }

  let prompt;
  if (style === 'normal') {
    prompt = `请对以下文本进行常规优化，保持原意的同时提升表达质量和流畅度。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  } else if (style === 'rephrase') {
    prompt = `请重新组织以下文本的表达方式，保持核心内容不变但使用不同的语言结构和词汇。请直接输出改写后的文本，不要包含任何解释：\n\n${text}`;
  } else {
    prompt = `请对以下文本进行${style}风格的润色优化。请直接输出优化后的文本，不要包含任何解释：\n\n${text}`;
  }

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'doubao-1-5-pro-32k-250115',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`豆包 API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const polishedText = data.choices[0]?.message?.content?.trim();
  
  if (!polishedText) {
    throw new Error('豆包返回空结果');
  }
  
  return {
    originalText: text,
    translatedText: polishedText,
    service: '豆包',
    style: style,
    error: false
  };
} 