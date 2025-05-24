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
    
    return new Response(JSON.stringify(result), {
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
  // 注意: Cloudflare Workers对FormData处理有一定限制
  // 实际实现时需要调整图片处理逻辑
  return new Response(JSON.stringify({
    error: '图片翻译功能在Cloudflare部署中暂不支持，请考虑使用其他云服务'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 文本润色处理函数
async function handleTextPolish(request, env) {
  // 类似于文本翻译的处理逻辑
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
    const { text, style, service } = requestData;
    
    if (!text) {
      return new Response(JSON.stringify({ 
        error: '请提供需要润色的文本' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 实际润色处理逻辑
    const result = await callPolishService(text, style, service, env);
    
    return new Response(JSON.stringify(result), {
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
  // 这里是简化版实现，实际需要对接各种API
  // 每个服务的实现需要单独编写
  
  // 示例: 调用OpenAI API
  if (service === 'gpt') {
    // 使用环境变量中的API密钥
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('缺少OpenAI API密钥');
    }
    
    // 实际API调用逻辑
    // ...
  }
  
  // 注意: 完整实现需要参考server.js中的各种API调用逻辑
  
  return {
    success: true,
    translatedText: `[${service}翻译示例] ${text}`,
    message: 'Cloudflare部署时需完整实现此函数'
  };
}

// 调用润色服务的辅助函数
async function callPolishService(text, style, service, env) {
  // 类似于翻译服务的实现逻辑
  // ...
  
  return {
    success: true,
    polishedText: `[${service}润色示例 - ${style}风格] ${text}`,
    message: 'Cloudflare部署时需完整实现此函数'
  };
} 