// TranOptim API for Cloudflare Pages Functions
export async function onRequest(context) {
  // 获取请求信息
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
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
        'Access-Control-Allow-Headers': 'Content-Type'
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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
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