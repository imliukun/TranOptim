// TranOptim - 智能翻译与润色工具 后端服务器

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');
const crypto = require('crypto');

// 获取代理（如果有）
function getAxiosProxyConfig() {
    // 检查是否禁用代理
    if (process.env.DISABLE_PROXY === 'true') {
        console.log('代理已禁用，使用直接连接');
        return {};
    }
    
    // 优先使用环境变量中的代理设置，如果没有则使用默认的Clash代理
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:7890';
    console.log('使用系统代理服务器:', proxy);
    return {
        httpsAgent: new HttpsProxyAgent(proxy),
        proxy: false // 禁用axios自带的proxy机制，全部走agent
    };
}

const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('已创建上传目录:', uploadDir);
}

// 临时文件清理函数 - 删除超过1小时的临时文件
function cleanupTempFiles() {
    if (fs.existsSync(uploadDir)) {
        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                console.error('读取上传目录出错:', err);
                return;
            }
            
            const currentTime = Date.now();
            files.forEach(file => {
                const filePath = path.join(uploadDir, file);
                fs.stat(filePath, (statErr, stats) => {
                    if (statErr) {
                        console.error('获取文件状态出错:', statErr);
                        return;
                    }
                    
                    // 删除超过1小时的文件
                    const fileAge = (currentTime - stats.mtimeMs) / 1000 / 60 / 60; // 小时
                    if (fileAge > 1) {
                        fs.unlink(filePath, unlinkErr => {
                            if (unlinkErr) {
                                console.error('删除临时文件出错:', unlinkErr);
                            } else {
                                console.log('已删除临时文件:', file);
                            }
                        });
                    }
                });
            });
        });
    }
}

// 每小时执行一次临时文件清理
setInterval(cleanupTempFiles, 3600000); // 3600000毫秒 = 1小时
console.log('临时文件清理任务已设置，每小时执行一次');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 限制5MB
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('只允许上传图片文件！'), false);
        }
        cb(null, true);
    }
});

// API密钥配置（实际应用中应使用环境变量）
const API_KEYS = {
    gpt: process.env.OPENAI_API_KEY || '在这里填入你的OpenAI API密钥',
    gemini: process.env.GEMINI_API_KEY || '在这里填入你的Gemini API密钥',
    deepseek: process.env.DEEPSEEK_API_KEY || '在这里填入你的SiliconFlow平台API密钥',
    qwen: process.env.QWEN_API_KEY || '在这里填入你的SiliconFlow平台API密钥',
    doubao: process.env.DOUBAO_API_KEY || '在这里填入你的VolcEngine平台API密钥',
    volcengine: process.env.VOLCENGINE_API_KEY || '在这里填入你的火山引擎API密钥'
};

// 设置OpenAI API密钥的路由
app.post('/api/set-api-key', (req, res) => {
    try {
        const { service, apiKey } = req.body;
        
        if (!service || !apiKey) {
            return res.status(400).json({ error: '请提供服务名称和API密钥' });
        }
        
        // 更新API密钥
        if (service in API_KEYS) {
            API_KEYS[service] = apiKey;
            return res.json({ success: true, message: `${service} API密钥已更新` });
        } else {
            return res.status(400).json({ error: '不支持的服务' });
        }
    } catch (error) {
        console.error('设置API密钥错误:', error);
        res.status(500).json({ error: '设置API密钥出错: ' + error.message });
    }
});

// 获取API密钥状态的路由
app.get('/api/check-api-key/:service', (req, res) => {
    const service = req.params.service;
    
    if (service in API_KEYS) {
        const hasKey = !!API_KEYS[service] && API_KEYS[service] !== 'your-' + service + '-api-key';
        return res.json({ hasKey });
    } else {
        return res.status(400).json({ error: '不支持的服务' });
    }
});

// 文本翻译API路由
app.post('/api/translate/text', async (req, res) => {
    try {
        console.log('---API请求开始---');
        console.log('请求体:', JSON.stringify(req.body, null, 2));
        
        const { text, sourceLang, targetLang, service, style } = req.body;
        
        if (!text) {
            console.log('错误: 请求中缺少文本');
            return res.status(400).json({ error: '请提供需要翻译的文本' });
        }
        
        console.log('收到API请求:', { 
            text: text.substring(0, 30) + '...', 
            sourceLang, 
            targetLang, 
            service, 
            style,
            isPolishRequest: !sourceLang && !targetLang
        });
        
        // 根据不同服务调用不同的API
        let result;
        try {
            // 润色请求的特殊处理
            if (!sourceLang && !targetLang) {
                console.log('检测到润色请求，使用AI润色处理');
                
                // 根据选择的服务进行润色
                switch (service) {
                    case 'gpt':
                        result = await polishWithGPT(text, style || 'professional');
                        break;
                    case 'gemini':
                        result = await polishWithGemini(text, style || 'professional');
                        break;
                    case 'deepseek':
                        result = await polishWithDeepSeek(text, style || 'professional');
                        break;
                    case 'qwen':
                        result = await polishWithQwen(text, style || 'professional');
                        break;
                    case 'doubao':
                        result = await polishWithDoubao(text, style || 'professional');
                        break;
                    default:
                        return res.status(400).json({ error: '不支持的润色服务' });
                }
                
                console.log('润色服务返回结果:', {
                    service: result.service,
                    style: result.style,
                    hasError: !!result.error,
                    originalTextLength: result.originalText?.length || 0,
                    translatedTextPreview: result.translatedText?.substring(0, 50) + '...',
                });
            } else {
                // 翻译请求处理
                switch (service) {
                    case 'gpt':
                        result = await translateWithGPT(text, sourceLang, targetLang);
                        break;
                    case 'gemini':
                        result = await translateWithGemini(text, sourceLang, targetLang);
                        break;
                    case 'deepseek':
                        result = await translateWithDeepSeek(text, sourceLang, targetLang);
                        break;
                    case 'qwen':
                        result = await translateWithQwen(text, sourceLang, targetLang);
                        break;
                    case 'doubao':
                        result = await translateWithDoubao(text, targetLang, sourceLang);
                        break;
                    case 'volcengine':
                        result = await translateWithVolcEngine(text, sourceLang, targetLang, API_KEYS.volcengine);
                        break;
                    default:
                        return res.status(400).json({ error: '不支持的翻译服务' });
                }

                console.log('翻译服务返回结果:', {
                    service: result.service,
                    fromLang: result.fromLang,
                    toLang: result.toLang,
                    hasError: !!result.error,
                    originalTextLength: result.originalText?.length || 0,
                    translatedTextPreview: result.translatedText?.substring(0, 50) + '...',
                });
            }
        } catch (serviceError) {
            console.error('API服务错误:', serviceError);
            // 确保即使服务失败，也返回一个有效的结果对象
            result = {
                originalText: text,
                translatedText: `处理失败: ${serviceError.message}`,
                service: service,
                error: true
            };
        }
        
        // 确保result不是undefined
        if (!result) {
            console.error('API服务返回undefined结果');
            result = {
                originalText: text,
                translatedText: '服务返回空结果，请稍后重试',
                service: service,
                error: true
            };
        }
        
        // 确保translatedText字段存在
        if (result.translatedText === undefined) {
            console.error('API服务返回的translatedText为undefined');
            result.translatedText = '润色结果为空，请稍后重试';
            result.error = true;
        }
        
        console.log('API处理结果:', {
            originalTextLength: result.originalText?.length || 0,
            translatedTextLength: result.translatedText?.length || 0,
            service: result.service,
            hasError: !!result.error
        });
        
        // 打印完整的返回结果
        console.log('发送给客户端的响应:', { result: {
            originalText: result.originalText?.substring(0, 30) + '...',
            translatedText: result.translatedText?.substring(0, 30) + '...',
            service: result.service,
            error: result.error
        }});
        console.log('---API请求结束---');
        
        res.json({ result });
    } catch (error) {
        console.error('API总体错误:', error);
        res.status(500).json({ 
            error: '翻译服务出错: ' + error.message,
            result: {
                originalText: req.body.text || '',
                translatedText: '服务器处理失败，请重试',
                service: req.body.service || 'unknown',
                error: true
            }
        });
    }
});

// 图片翻译API路由
app.post('/api/translate/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片' });
        }
        
        const { sourceLang, targetLang, service } = req.body;
        const imagePath = req.file.path;
        
        console.log(`收到图片翻译请求: 源语言=${sourceLang}, 目标语言=${targetLang}, 服务=${service}`);
        console.log(`图片已保存到: ${imagePath}`);
        console.log(`图片大小: ${fs.statSync(imagePath).size} 字节`);
        
        // 检查请求的服务是否支持
        if (!['gpt', 'gemini', 'deepseek', 'qwen', 'doubao'].includes(service)) {
            console.error(`请求中指定的服务不支持: ${service}`);
            return res.status(400).json({
                success: false,
                message: `不支持的服务: ${service}`,
                error: `不支持的服务: ${service}`
            });
        }

        try {
            // 检查API密钥是否已设置
            if (service === 'gpt' && !API_KEYS.gpt) {
                throw new Error('请先设置OpenAI API密钥');
            } else if (service === 'gemini' && !API_KEYS.gemini) {
                throw new Error('请先设置Gemini API密钥');
            } else if (service === 'deepseek' && !API_KEYS.deepseek) {
                throw new Error('请先设置DeepSeek API密钥');
            } else if (service === 'qwen' && !API_KEYS.qwen) {
                throw new Error('请先设置Qwen API密钥');
            } else if (service === 'doubao' && !API_KEYS.doubao) {
                throw new Error('请先设置豆包API密钥');
            }
            
            console.log(`开始调用图片翻译函数: ${service}`);
            console.time(`${service}图片翻译耗时`);
            
            // 调用相应的翻译函数
            let result;
            if (service === 'gpt') {
                result = await translateImageWithGPT(imagePath, sourceLang, targetLang, req.body.ocr_engine || 'openai');
            } else if (service === 'gemini') {
                result = await translateImageWithGemini(imagePath, sourceLang, targetLang, req.body.ocr_engine || 'openai');
            } else if (service === 'deepseek') {
                result = await translateImageWithDeepSeek(imagePath, sourceLang, targetLang, req.body.ocr_engine || 'openai');
            } else if (service === 'qwen') {
                result = await translateImageWithQwen(imagePath, sourceLang, targetLang, req.body.ocr_engine || 'openai');
            } else if (service === 'doubao') {
                result = await translateImageWithDoubao(imagePath, sourceLang, targetLang, req.body.ocr_engine || 'openai');
            }
            
            console.timeEnd(`${service}图片翻译耗时`);
            console.log(`图片翻译完成: ${service}, 结果长度: ${result.translatedText?.length || 0}`);
            
            // 清理上传的图片文件
            try {
                fs.unlinkSync(imagePath);
                console.log(`已删除临时图片文件: ${imagePath}`);
            } catch (unlinkError) {
                console.error(`删除临时图片文件出错: ${imagePath}`, unlinkError);
            }
            
            // 返回结果
            return res.json({
                result: result
            });
            
        } catch (error) {
            console.error(`调用 ${service} 图片翻译函数出错:`, error);
            
            // 清理上传的图片文件，即使处理失败
            try {
                fs.unlinkSync(imagePath);
                console.log(`已删除临时图片文件: ${imagePath}`);
            } catch (unlinkError) {
                console.error(`删除临时图片文件出错: ${imagePath}`, unlinkError);
            }
            
            // 根据不同的错误类型返回不同的用户友好信息
            if (error.message.includes('API密钥')) {
                return res.status(400).json({
                    result: {
                        originalText: '图片内容',
                        translatedText: `请在设置中配置 ${service} 的API密钥`,
                        service: service,
                        error: true
                    }
                });
            } else if (error.message.includes('网络') || error.message.includes('连接') || error.message.includes('network')) {
                return res.status(503).json({
                    result: {
                        originalText: '图片内容',
                        translatedText: `${service} 图片翻译服务连接失败，请检查网络或代理设置`,
                        service: service,
                        error: true
                    }
                });
            } else {
                return res.status(500).json({
                    result: {
                        originalText: '图片内容',
                        translatedText: `${service} 图片翻译失败: ${error.message}`,
                        service: service,
                        error: true
                    }
                });
            }
        }
    } catch (error) {
        console.error('图片翻译错误:', error);
        res.status(500).json({ 
            result: {
                originalText: '图片内容',
                translatedText: '图片处理失败，请重试',
                service: req.body.service || 'unknown',
                error: true
            }
        });
    }
});

// 添加火山引擎翻译API路由
app.post('/api/translate/volcengine', async (req, res) => {
    try {
        const { text, from, to } = req.body;
        const result = await translateWithVolcEngine(text, from, to, API_KEYS.volcengine);
        res.json(result);
    } catch (error) {
        console.error('火山引擎翻译错误:', error);
        res.status(500).json({ error: '翻译失败: ' + error.message });
    }
});

// ChatGPT翻译实现
async function translateWithGPT(text, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.gpt) {
            throw new Error('请先设置OpenAI API密钥');
        }
        
        console.log(`使用ChatGPT翻译: ${sourceLang} -> ${targetLang}`);
        
        // 获取语言名称
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        console.log(`翻译语言: ${fromLangName} -> ${toLangName}`);
        
        try {
            // 准备请求配置，包括可选的代理
            const requestConfig = {
                headers: {
                    'Authorization': `Bearer ${API_KEYS.gpt}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'  // 最新API版本标识
                },
                timeout: 120000 // 增加到120秒超时，以便在网络条件不佳时有更多时间完成请求
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('ChatGPT API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            } else {
                console.log('ChatGPT API请求不使用代理，直接连接');
            }
            
            console.log('OpenAI API请求配置:', {
                hasHeaders: !!requestConfig.headers,
                timeout: requestConfig.timeout,
                hasProxy: !!(requestConfig.httpsAgent)
            });
            
            // 遵循最新的OpenAI API规范调用API
            console.log('开始发送OpenAI API请求');
            console.time('OpenAI API请求时间');
            
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个专业的翻译助手，请将以下${fromLangName}文本翻译成${toLangName}，保持原文的意思、风格和格式。只返回翻译结果，不要添加任何解释或注释。`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 2048,
                top_p: 1.0,
                frequency_penalty: 0,
                presence_penalty: 0
            }, requestConfig);
            
            console.timeEnd('OpenAI API请求时间');
            console.log('OpenAI API响应状态:', response.status);
            
            if (!response.data || !response.data.choices || !response.data.choices.length) {
                console.error('OpenAI返回异常响应:', response.data);
                throw new Error('OpenAI返回异常响应，请检查API密钥是否有效');
            }
            
            const translatedText = response.data.choices[0].message.content;
            console.log('OpenAI翻译成功, 结果长度:', translatedText.length);
            
            // 返回翻译结果
            return {
                originalText: text,
                translatedText: translatedText,
                service: 'ChatGPT',
                fromLang: sourceLang,
                toLang: targetLang
            };
        } catch (apiError) {
            console.error('OpenAI API调用失败:', apiError);
            if (apiError.response) {
                console.error('OpenAI错误详情:', {
                    status: apiError.response.status,
                    statusText: apiError.response.statusText,
                    data: apiError.response.data
                });
                
                // 判断是否是网络问题
                if (apiError.response.status === 0 || apiError.response.status >= 500) {
                    throw new Error('OpenAI API网络请求失败，请检查网络连接或代理设置');
                }
                
                // 判断是否是API密钥问题
                if (apiError.response.status === 401 || apiError.response.status === 403) {
                    throw new Error('OpenAI API密钥无效或未授权，请检查API密钥设置');
                }
                
                // 判断是否是额度超限等问题
                if (apiError.response.status === 429) {
                    throw new Error('OpenAI API请求超过频率限制或额度用尽，请稍后再试');
                }
                
                throw new Error('OpenAI API调用失败: ' + (apiError.response?.data?.error?.message || apiError.message));
            } else if (apiError.request) {
                console.error('OpenAI请求未收到响应:', apiError.code || 'UNKNOWN_ERROR');
                
                // 明确区分超时和网络错误
                if (apiError.code === 'ECONNABORTED') {
                    throw new Error('OpenAI API请求超时，可能需要设置代理。请在设置中配置有效的代理服务器。');
                } else {
                    throw new Error('OpenAI API请求失败，无法连接到服务器，请检查网络连接或配置代理。');
                }
            } else {
                console.error('OpenAI请求配置错误:', apiError.message);
                throw new Error('OpenAI API请求配置错误: ' + apiError.message);
            }
        }
    } catch (error) {
        console.error('ChatGPT翻译错误:', error);
        return {
            originalText: text,
            translatedText: '翻译失败: ' + error.message,
            service: 'ChatGPT',
            fromLang: sourceLang,
            toLang: targetLang,
            error: true
        };
    }
}

// Gemini翻译实现
async function translateWithGemini(text, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.gemini) {
            throw new Error('请先设置Gemini API密钥');
        }
        
        console.log(`使用Gemini翻译: ${sourceLang} -> ${targetLang}`);
        
        // 获取语言名称
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        console.log(`翻译语言: ${fromLangName} -> ${toLangName}`);
        
        try {
            // 调用Google Gemini API - 确保API密钥正确编码
            const apiKey = encodeURIComponent(API_KEYS.gemini.trim());
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            console.log(`使用Gemini API URL: ${apiUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
            
            // 准备请求配置，包括可选的代理
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // 增加到120秒超时，以便在网络条件不佳时有更多时间完成请求
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('Gemini API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            } else {
                console.log('Gemini API请求不使用代理，直接连接');
            }
            
            console.log('Gemini API请求配置:', {
                hasHeaders: !!requestConfig.headers,
                timeout: requestConfig.timeout,
                hasProxy: !!(requestConfig.httpsAgent)
            });
            
            // 构建请求体
            const requestBody = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `你是一个专业的翻译助手，请将以下${fromLangName}文本翻译成${toLangName}，保持原文的意思、风格和格式。只返回翻译结果，不要添加任何解释或注释。\n\n${text}`
                            }
                        ]
                    }
                ],
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
            };
            
            console.log('Gemini API发送请求');
            console.time('Gemini API请求时间');
            
            const response = await axios.post(apiUrl, requestBody, requestConfig);
            
            console.timeEnd('Gemini API请求时间');
            console.log('Gemini API响应状态:', response.status);
            
            // 检查响应数据
            if (!response.data) {
                console.error('Gemini返回空响应');
                throw new Error('Gemini返回空响应');
            }
            
            if (!response.data.candidates || !response.data.candidates.length) {
                console.error('Gemini返回异常响应:', JSON.stringify(response.data, null, 2));
                
                // 检查是否存在prompts相关错误
                if (response.data.promptFeedback && response.data.promptFeedback.blockReason) {
                    throw new Error(`Gemini提示被拒绝: ${response.data.promptFeedback.blockReason}`);
                }
                
                throw new Error('Gemini返回异常响应: ' + JSON.stringify(response.data.error || response.data));
            }
            
            // 提取翻译结果
            const candidate = response.data.candidates[0];
            if (!candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
                console.error('Gemini返回数据格式异常:', JSON.stringify(candidate, null, 2));
                throw new Error('Gemini返回数据格式异常');
            }
            
            const translatedText = candidate.content.parts[0].text;
            if (!translatedText) {
                throw new Error('Gemini返回的翻译结果为空');
            }
            
            console.log('Gemini翻译成功, 结果长度:', translatedText.length);
            
            return {
                originalText: text,
                translatedText: translatedText,
                service: 'Gemini',
                fromLang: sourceLang,
                toLang: targetLang
            };
        } catch (apiError) {
            console.error('Gemini API调用失败:', apiError.message);
            
            // 详细记录错误信息
            if (apiError.response) {
                console.error('Gemini错误响应:', {
                    status: apiError.response.status,
                    statusText: apiError.response.statusText,
                    data: JSON.stringify(apiError.response.data, null, 2)
                });
                
                // 判断是否是网络问题
                if (apiError.response.status === 0 || apiError.response.status >= 500) {
                    throw new Error('Gemini API网络请求失败，请检查网络连接或代理设置');
                }
                
                // 判断是否是API密钥问题
                if (apiError.response.status === 401 || apiError.response.status === 403) {
                    throw new Error('Gemini API密钥无效或未授权，请检查API密钥设置');
                }
                
                // 其他错误情况
                const errorMessage = apiError.response.data?.error?.message || '未知错误';
                throw new Error('Gemini API调用失败: ' + errorMessage);
            } else if (apiError.request) {
                console.error('Gemini请求未收到响应:', apiError.request);
                
                // 明确区分超时和网络错误
                if (apiError.code === 'ECONNABORTED') {
                    throw new Error('Gemini API请求超时，可能需要设置代理。请在设置中配置有效的代理服务器。');
                } else {
                    throw new Error('Gemini API请求失败，无法连接到服务器，请检查网络连接或配置代理。');
                }
            } else {
                console.error('Gemini请求配置错误:', apiError.message);
                throw new Error('Gemini API请求配置错误: ' + apiError.message);
            }
        }
    } catch (error) {
        console.error('Gemini翻译错误:', error.message);
        return {
            originalText: text,
            translatedText: '翻译失败: ' + error.message,
            service: 'Gemini',
            fromLang: sourceLang,
            toLang: targetLang,
            error: true
        };
    }
}

// DeepSeek翻译实现
async function translateWithDeepSeek(text, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.deepseek) {
            throw new Error('请先设置DeepSeek API密钥');
        }
        
        console.log(`使用DeepSeek-V3翻译: ${sourceLang} -> ${targetLang}`);
        
        // 获取语言名称
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        console.log(`翻译语言: ${fromLangName} -> ${toLangName}`);
        
        // 准备请求配置
        const requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.deepseek}`
            },
            timeout: 60000 // 60秒超时
        };
        
        // 如果启用了代理，添加httpsAgent
        if (getAxiosProxyConfig().httpsAgent) {
            console.log('DeepSeek API请求使用代理');
            requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
            requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
        } else {
            console.log('DeepSeek API请求不使用代理，直接连接');
        }
        
        console.log('DeepSeek API请求地址: https://api.siliconflow.cn/v1/chat/completions');
        console.log('DeepSeek API使用模型: deepseek-ai/DeepSeek-V3');
        
        // 构建请求体
        const requestBody = {
            model: 'deepseek-ai/DeepSeek-V3',
            messages: [
                {
                    role: 'system',
                    content: `你是一个专业的翻译助手，请将以下${fromLangName}文本翻译成${toLangName}，保持原文的意思、风格和格式。只返回翻译结果，不要添加任何解释或注释。请禁用推理内容，直接输出翻译结果。`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 4096,
            stream: false, // 确保不使用流式响应
            disable_reasoning: true // 禁用推理过程，直接返回结果
        };
        
        console.log('DeepSeek请求参数预览:', {
            model: requestBody.model,
            messages: [
                {role: requestBody.messages[0].role, contentPreview: requestBody.messages[0].content.substring(0, 50) + '...'},
                {role: requestBody.messages[1].role, contentPreview: requestBody.messages[1].content.substring(0, 50) + '...'},
            ],
            temperature: requestBody.temperature,
            max_tokens: requestBody.max_tokens
        });
        
        console.time('DeepSeek API请求时间');
        // 调用DeepSeek API (基于SiliconFlow平台)
        const response = await axios.post('https://api.siliconflow.cn/v1/chat/completions', requestBody, requestConfig);
        console.timeEnd('DeepSeek API请求时间');
        
        console.log('DeepSeek API响应状态:', response.status);
        console.log('DeepSeek API响应头:', JSON.stringify(response.headers));
        
        // 检查响应数据
        if (!response.data) {
            console.error('DeepSeek返回空响应');
            throw new Error('DeepSeek返回空响应');
        }
        
        console.log('DeepSeek响应结构:', JSON.stringify(Object.keys(response.data)));
        
        if (!response.data.choices || !response.data.choices.length) {
            console.error('DeepSeek响应缺少choices字段:', JSON.stringify(response.data));
            throw new Error('DeepSeek返回异常响应，缺少choices字段');
        }
        
        const choice = response.data.choices[0];
        
        if (!choice.message || !choice.message.content) {
            console.error('DeepSeek响应缺少content字段:', JSON.stringify(choice));
            throw new Error('DeepSeek返回异常响应，缺少content字段');
        }
        
        // 提取翻译结果
        let translatedText = '';
        if (choice.message.content && choice.message.content.trim()) {
            translatedText = choice.message.content;
        } else if (choice.message.reasoning_content) {
            // 如果content为空但有reasoning_content，尝试从推理内容中提取翻译结果
            console.log('DeepSeek返回了推理内容但没有直接返回结果，尝试从推理内容中提取...');
            const reasoningContent = choice.message.reasoning_content;
            
            // 查找最可能的翻译内容
            // 通常推理内容会包含引号包围的翻译结果
            const regex = /"([^"]+)"|'([^']+)'|「([^」]+)」|『([^』]+)』|翻译[为成](.*?)[。\n]|译为[：:](.*?)[。\n]|译文[：:](.*?)[。\n]/g;
            const matches = [...reasoningContent.matchAll(regex)];
            
            if (matches.length > 0) {
                // 找到最后一个匹配项，通常是最终结论
                const lastMatch = matches[matches.length - 1];
                // 从捕获组中找到第一个非空的值
                translatedText = lastMatch.slice(1).find(m => m) || '';
                console.log('从推理内容中提取的翻译结果:', translatedText);
            }
            
            // 如果没有找到明确的翻译，使用后半部分文本作为近似结果
            if (!translatedText.trim()) {
                const lines = reasoningContent.split('\n');
                if (lines.length > 2) {
                    // 取最后一段作为可能的翻译结果
                    translatedText = lines[lines.length - 1].trim();
                    console.log('使用推理内容的最后一行作为翻译结果:', translatedText);
                } else {
                    // 如果只有一两行，取后半部分
                    translatedText = reasoningContent.substring(Math.floor(reasoningContent.length / 2)).trim();
                    console.log('使用推理内容的后半部分作为翻译结果:', translatedText);
                }
            }
        }
        
        if (!translatedText.trim()) {
            // 如果仍然无法提取，返回一个占位符结果
            translatedText = '无法从DeepSeek响应中提取翻译结果，请尝试使用其他模型。';
        }
        
        console.log('DeepSeek翻译成功, 结果长度:', translatedText.length);
        
        return {
            originalText: text,
            translatedText: translatedText,
            service: 'DeepSeek-V3',
            fromLang: sourceLang,
            toLang: targetLang
        };
    } catch (error) {
        console.error('DeepSeek翻译错误:', error);
        
        let errorMessage = error.message || '未知错误';
        
        if (error.response) {
            console.error('DeepSeek响应状态:', error.response.status);
            console.error('DeepSeek响应头:', JSON.stringify(error.response.headers));
            
            if (error.response.data) {
                console.error('DeepSeek响应数据:', JSON.stringify(error.response.data, null, 2));
                
                // 尝试从响应中提取更详细的错误信息
                if (error.response.data.error && error.response.data.error.message) {
                    errorMessage = error.response.data.error.message;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            
            // 根据状态码提供更具体的错误消息
            if (error.response.status === 401 || error.response.status === 403) {
                errorMessage = 'DeepSeek API密钥无效或未授权，请检查API密钥设置';
            } else if (error.response.status === 404) {
                errorMessage = 'DeepSeek API端点不存在，请检查API地址';
            } else if (error.response.status >= 500) {
                errorMessage = 'DeepSeek服务器内部错误，请稍后重试';
            }
        } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('DeepSeek请求未收到响应:', error.code || 'UNKNOWN_ERROR');
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'DeepSeek请求超时，请尝试配置代理服务器或增加超时时间';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'DeepSeek连接被拒绝，API服务器可能不可用';
            } else {
                errorMessage = `网络请求失败 (${error.code || 'UNKNOWN_ERROR'})，无法连接到DeepSeek服务`;
            }
        }
        
        // 返回错误信息
        return {
            originalText: text,
            translatedText: '翻译失败: ' + errorMessage,
            service: 'DeepSeek-V3',
            fromLang: sourceLang,
            toLang: targetLang,
            error: true
        };
    }
}

// Qwen2.5翻译实现
async function translateWithQwen(text, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.qwen) {
            throw new Error('请先设置Qwen API密钥');
        }
        
        console.log(`使用Qwen2.5翻译: ${sourceLang} -> ${targetLang}`);
        
        // 获取语言名称
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        console.log(`翻译语言: ${fromLangName} -> ${toLangName}`);
        
        // 准备请求配置
        const requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.qwen}`
            },
            timeout: 60000 // 60秒超时
        };
        
        // 如果启用了代理，添加httpsAgent
        if (getAxiosProxyConfig().httpsAgent) {
            console.log('Qwen API请求使用代理');
            requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
            requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
        } else {
            console.log('Qwen API请求不使用代理，直接连接');
        }
        
        console.log('Qwen API请求地址: https://api.siliconflow.cn/v1/chat/completions');
        console.log('Qwen API使用模型: Qwen/Qwen2.5-72B-Instruct');
        
        // 构建请求体
        const requestBody = {
            model: 'Qwen/Qwen2.5-72B-Instruct',
            messages: [
                {
                    role: 'system',
                    content: `你是一个专业的翻译助手，请将以下${fromLangName}文本翻译成${toLangName}，保持原文的意思、风格和格式。只返回翻译结果，不要添加任何解释或注释。`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 4096,
            stream: false // 确保不使用流式响应
        };
        
        console.log('Qwen请求参数预览:', {
            model: requestBody.model,
            messages: [
                {role: requestBody.messages[0].role, contentPreview: requestBody.messages[0].content.substring(0, 50) + '...'},
                {role: requestBody.messages[1].role, contentPreview: requestBody.messages[1].content.substring(0, 50) + '...'},
            ],
            temperature: requestBody.temperature,
            max_tokens: requestBody.max_tokens
        });
        
        console.time('Qwen API请求时间');
        // 调用Qwen API (基于SiliconFlow平台)
        const response = await axios.post('https://api.siliconflow.cn/v1/chat/completions', requestBody, requestConfig);
        console.timeEnd('Qwen API请求时间');
        
        console.log('Qwen API响应状态:', response.status);
        console.log('Qwen API响应头:', JSON.stringify(response.headers));
        
        // 检查响应数据
        if (!response.data) {
            console.error('Qwen返回空响应');
            throw new Error('Qwen返回空响应');
        }
        
        console.log('Qwen响应结构:', JSON.stringify(Object.keys(response.data)));
        
        if (!response.data.choices || !response.data.choices.length) {
            console.error('Qwen响应缺少choices字段:', JSON.stringify(response.data));
            throw new Error('Qwen返回异常响应，缺少choices字段');
        }
        
        const choice = response.data.choices[0];
        
        if (!choice.message || !choice.message.content) {
            console.error('Qwen响应缺少content字段:', JSON.stringify(choice));
            throw new Error('Qwen返回异常响应，缺少content字段');
        }
        
        // 提取翻译结果
        const translatedText = choice.message.content;
        console.log('Qwen翻译成功, 结果长度:', translatedText.length);
        
        return {
            originalText: text,
            translatedText: translatedText,
            service: 'Qwen2.5',
            fromLang: sourceLang,
            toLang: targetLang
        };
    } catch (error) {
        console.error('Qwen翻译错误:', error);
        
        let errorMessage = error.message || '未知错误';
        
        if (error.response) {
            console.error('Qwen响应状态:', error.response.status);
            console.error('Qwen响应头:', JSON.stringify(error.response.headers));
            
            if (error.response.data) {
                console.error('Qwen响应数据:', JSON.stringify(error.response.data, null, 2));
                
                // 尝试从响应中提取更详细的错误信息
                if (error.response.data.error && error.response.data.error.message) {
                    errorMessage = error.response.data.error.message;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            
            // 根据状态码提供更具体的错误消息
            if (error.response.status === 401 || error.response.status === 403) {
                errorMessage = 'Qwen API密钥无效或未授权，请检查API密钥设置';
            } else if (error.response.status === 404) {
                errorMessage = 'Qwen API端点不存在，请检查API地址';
            } else if (error.response.status >= 500) {
                errorMessage = 'Qwen服务器内部错误，请稍后重试';
            }
        } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('Qwen请求未收到响应:', error.code || 'UNKNOWN_ERROR');
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Qwen请求超时，请尝试配置代理服务器或增加超时时间';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Qwen连接被拒绝，API服务器可能不可用';
            } else {
                errorMessage = `网络请求失败 (${error.code || 'UNKNOWN_ERROR'})，无法连接到Qwen服务`;
            }
        }
        
        // 返回错误信息
        return {
            originalText: text,
            translatedText: '翻译失败: ' + errorMessage,
            service: 'Qwen2.5',
            fromLang: sourceLang,
            toLang: targetLang,
            error: true
        };
    }
}

// 辅助函数 - 获取语言名称
function getLanguageName(langCode) {
    const langMap = {
        'zh': '中文',
        'en': '英文',
        'ja': '日文',
        'ko': '韩文',
        'fr': '法文',
        'de': '德文',
        'es': '西班牙文',
        'ru': '俄文',
        'auto': '自动检测的'
    };
    
    return langMap[langCode] || langCode;
}

// 将语言代码映射到火山引擎API支持的格式
function mapLanguageToVolcEngineCode(code) {
    const map = {
        'auto': 'auto',
        'zh': 'zh',
        'en': 'en',
        'ja': 'ja',
        'ko': 'ko',
        'fr': 'fr',
        'es': 'es',
        'ru': 'ru',
        'de': 'de',
        'it': 'it',
        'pt': 'pt',
        'vi': 'vi',
        'th': 'th',
        'ms': 'ms',
        'ar': 'ar'
        // 如有需要可以添加更多映射
    };
    
    return map[code] || code;
}

// 将语言代码映射为火山引擎翻译支持的语言代码
function mapLanguageToVolcTranslateCode(langCode) {
    const mapping = {
        'auto': 'auto',
        'zh': 'zh',
        'en': 'en',
        'ja': 'ja',
        'ko': 'ko',
        'fr': 'fr',
        'es': 'es',
        'ru': 'ru',
        'de': 'de',
        'it': 'it',
        'tr': 'tr',
        'pt': 'pt',
        'vi': 'vi',
        'id': 'id',
        'th': 'th',
        'ms': 'ms',
        'ar': 'ar',
        'hi': 'hi'
        // 可根据火山引擎支持的语言列表继续添加更多映射
    };

    return mapping[langCode] || langCode;
}

// 实现火山引擎的签名算法
function generateVolcengineSignature(accessKeyId, secretAccessKey, method, path, headers, query, body) {
    // 1. 创建标准请求字符串
    const canonicalRequest = buildCanonicalRequest(method, path, query, headers, body);
    
    // 2. 计算签名
    const date = headers['x-date'];
    const dateNoTime = date.substring(0, 8);
    const scope = `${dateNoTime}/cn-north-1/volc/request`;
    
    const stringToSign = [
        'SDK-HMAC-SHA256',
        date,
        scope,
        crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');
    
    // 3. 生成签名密钥
    const kDate = crypto.createHmac('sha256', `VOLC${secretAccessKey}`).update(dateNoTime).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update('cn-north-1').digest();
    const kService = crypto.createHmac('sha256', kRegion).update('volc').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
    
    // 4. 计算签名
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    
    return signature;
}

// 创建标准请求字符串
function buildCanonicalRequest(method, path, query, headers, body) {
    // 1. HTTP请求方法
    const canonicalMethod = method.toUpperCase();
    
    // 2. 规范URI
    const canonicalURI = path;
    
    // 3. 规范查询字符串
    const canonicalQueryString = Object.keys(query).sort().map(key => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`;
    }).join('&');
    
    // 4. 规范头部
    const signedHeaders = Object.keys(headers).filter(header => {
        // 只包含小写字母的头部，且忽略Content-Length
        return /^[a-z-]+$/.test(header) && header !== 'content-length';
    }).sort();
    
    const canonicalHeaders = signedHeaders.map(header => {
        // 头部名称小写，去除值前后空格
        return `${header}:${headers[header].trim()}`;
    }).join('\n') + '\n';
    
    const signedHeadersString = signedHeaders.join(';');
    
    // 5. 请求载荷的SHA256哈希值
    const bodyHash = crypto.createHash('sha256').update(body || '').digest('hex');
    
    // 组合成标准请求字符串
    return [
        canonicalMethod,
        canonicalURI,
        canonicalQueryString,
        canonicalHeaders,
        signedHeadersString,
        bodyHash
    ].join('\n');
}

// 使用火山引擎进行翻译
async function translateWithVolcEngine(text, from, to, apiKey) {
    try {
        if (!apiKey || apiKey === '在这里填入你的火山引擎API密钥') {
            throw new Error('请先设置火山引擎API密钥');
        }
        
        console.log(`使用火山引擎进行翻译: ${from} -> ${to}`);
        
        // 使用我们的映射函数将语言代码转换为火山引擎翻译API支持的格式
        const fromLang = mapLanguageToVolcTranslateCode(from);
        const toLang = mapLanguageToVolcTranslateCode(to);
        
        // 调用火山引擎翻译API
        const url = 'https://open.volcengineapi.com/api/v1/mt/translate';  // 修改为与豆包翻译相同的URL
        const response = await axios.post(url, {
            Action: "TranslateText",  // 添加必要的Action参数
            SourceLanguage: fromLang,
            TargetLanguage: toLang,
            TextList: [text]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 30000 // 30秒超时
        });
        
        // 检查响应并提取翻译结果
        if (response.data && response.data.TranslationList && response.data.TranslationList.length > 0) {
            const translatedText = response.data.TranslationList[0].Translation;
            console.log('火山引擎翻译成功');
            
            return {
                originalText: text,
                translatedText: translatedText,
                service: '火山引擎',
                fromLang: from,
                toLang: to
            };
        } else {
            console.error('火山引擎翻译返回了无效的响应:', response.data);
            throw new Error('火山引擎翻译服务返回异常响应');
        }
    } catch (error) {
        console.error('火山引擎翻译错误:', error);
        return {
            originalText: text,
            translatedText: '翻译失败: ' + error.message,
            service: '火山引擎',
            error: true,
            fromLang: from,
            toLang: to
        };
    }
}

// 将语言代码映射到ISO标准代码（用于豆包API）
function mapLanguageToISOCode(langCode) {
    const langMap = {
        'zh': 'zh-CN',
        'zh-Hans': 'zh-CN',
        'zh-CN': 'zh-CN',
        'zh-Hant': 'zh-TW',
        'zh-TW': 'zh-TW',
        'en': 'en',
        'ja': 'ja',
        'ko': 'ko',
        'fr': 'fr',
        'es': 'es',
        'ru': 'ru',
        'de': 'de',
        'it': 'it',
        'pt': 'pt',
        'vi': 'vi',
        'id': 'id',
        'th': 'th',
        'ms': 'ms',
        'ar': 'ar',
        'hi': 'hi',
        'auto': 'auto'
    };
    
    return langMap[langCode] || langCode;
}

// 使用豆包进行翻译实现
async function translateWithDoubao(text, targetLang, sourceLang = 'auto') {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.doubao) {
            throw new Error('请先设置豆包API密钥');
        }

        console.log(`使用豆包进行翻译: ${sourceLang} -> ${targetLang}`);
        console.log(`使用的API密钥: ${API_KEYS.doubao.substring(0, 5)}...${API_KEYS.doubao.substring(API_KEYS.doubao.length - 5)}`);

        // 获取源语言和目标语言代码
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);

        // 准备API请求URL - 使用新的正确的豆包API URL
        const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

        // 构建请求数据 - 使用chat completions格式
        const requestData = {
            model: "doubao-1-5-pro-32k-250115",
            messages: [
                {
                    role: "system",
                    content: `你是一个专业的翻译助手。请将以下${fromLangName}文本翻译成${toLangName}。只输出翻译结果，不要有任何解释、注释或额外内容。`
                },
                {
                    role: "user",
                    content: text
                }
            ]
        };
        
        // 准备请求配置
        const requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.doubao}`
            },
            timeout: 30000 // 30秒超时
        };

        console.log('豆包翻译请求URL:', apiUrl);
        console.log('豆包翻译请求参数:', {
            model: requestData.model,
            messagesPreview: [
                {role: requestData.messages[0].role, contentPreview: requestData.messages[0].content.substring(0, 30) + '...'},
                {role: requestData.messages[1].role, contentPreview: requestData.messages[1].content.substring(0, 30) + '...'}
            ]
        });
        
        // 尝试不使用代理直接连接
        try {
            console.log('尝试直接连接豆包API，不使用代理');
            console.time('豆包翻译API直连请求时间');
            const response = await axios.post(apiUrl, requestData, requestConfig);
            console.timeEnd('豆包翻译API直连请求时间');
            
            console.log('豆包API直连成功，响应状态:', response.status);
            
            // 解析翻译结果
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                const translatedText = response.data.choices[0].message.content;
                
                return {
                    originalText: text,
                    translatedText: translatedText,
                    service: '豆包翻译',
                    fromLang: sourceLang,
                    toLang: targetLang
                };
            } else {
                console.log('API直连成功但返回结构异常:', JSON.stringify(response.data, null, 2));
                throw new Error('豆包翻译服务返回格式异常响应');
            }
        } catch (directError) {
            console.error('直连豆包API失败:', directError.message);
            
            // 如果直连失败，尝试使用代理
            console.log('尝试使用代理连接豆包API');
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('豆包翻译API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            }
            
            try {
                console.time('豆包翻译API代理请求时间');
                const proxyResponse = await axios.post(apiUrl, requestData, requestConfig);
                console.timeEnd('豆包翻译API代理请求时间');
                
                // 检查响应
                if (!proxyResponse.data) {
                    throw new Error('豆包翻译服务返回空响应');
                }
                
                console.log('豆包翻译代理响应状态:', proxyResponse.status);
                console.log('豆包翻译代理响应结构:', JSON.stringify(Object.keys(proxyResponse.data)));
                
                // 解析翻译结果
                if (proxyResponse.data.choices && proxyResponse.data.choices.length > 0) {
                    const translatedText = proxyResponse.data.choices[0].message.content;
                
                    return {
                        originalText: text,
                        translatedText: translatedText,
                        service: '豆包翻译',
                        fromLang: sourceLang,
                        toLang: targetLang
                    };
                } else {
                    console.log('API代理请求返回结构异常:', JSON.stringify(proxyResponse.data, null, 2));
                    throw new Error('豆包翻译服务返回格式异常响应');
                }
            } catch (proxyError) {
                console.error('使用代理连接豆包翻译API也失败:', proxyError.message);
                throw new Error('豆包API当前不可用，请更新API密钥或稍后再试');
            }
        }
    } catch (error) {
        console.error('豆包翻译错误:', error);
        
        let errorMessage = error.message || '未知错误';
        
        // 检查是否有详细的错误信息
        if (error.response && error.response.data) {
            console.error('豆包翻译错误详情:', JSON.stringify(error.response.data, null, 2));
            if (error.response.data.error) {
                errorMessage = error.response.data.error.message || error.response.data.error.code;
            }
        }
        
        // 返回错误信息
        return {
            originalText: text,
            translatedText: '豆包翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
            service: '豆包翻译',
            fromLang: sourceLang,
            toLang: targetLang,
            error: true
        };
    }
}

// 使用豆包进行文本润色
async function polishWithDoubao(text, style = 'professional') {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.doubao) {
            throw new Error('请先设置豆包API密钥');
        }

        console.log(`使用豆包进行文本润色，风格: ${style}`);
        console.log(`使用的API密钥: ${API_KEYS.doubao.substring(0, 5)}...${API_KEYS.doubao.substring(API_KEYS.doubao.length - 5)}`);
        
        // 根据风格构建适当的提示词
        let stylePrompt = "";
        switch (style) {
            case 'normal':
                stylePrompt = "润色语句使之更适合图书出版，通俗易懂，朗朗上口，符合中文表达习惯，不过分文绉绉";
                break;
            case 'rephrase':
                stylePrompt = "利用近义词、改变语句结构、改变主语、反译等方式在不改变原意的前提下更改表述方式";
                break;
            case 'professional':
                stylePrompt = "专业正式的风格，保持原意，提高表达质量";
                break;
            case 'creative':
                stylePrompt = "创意活泼的风格，增加表现力和生动性";
                break;
            case 'academic':
                stylePrompt = "学术严谨的风格，使用专业术语和规范表达";
                break;
            case 'simple':
                stylePrompt = "简洁明了的风格，去除冗余，保持清晰";
                break;
            default:
                stylePrompt = "提高表达质量和可读性";
        }
        
        // 准备API请求URL - 使用新的API端点
        const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
        
        // 构建请求数据
        const requestData = {
            model: "doubao-1-5-pro-32k-250115",
            messages: [
                {
                    role: "system",
                    content: `你是一位图书作家，正在润色文章。请将以下文本润色为${stylePrompt}的风格。不要额外添加文中没有的内容，专注于改善表达方式。只输出润色后的文本，不要有任何解释、注释或额外内容。`
                },
                {
                    role: "user",
                    content: text
                }
            ]
        };
        
        // 准备请求配置
        const requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.doubao}`
            },
            timeout: 30000 // 30秒超时
        };

        console.log('豆包润色请求URL:', apiUrl);
        console.log('豆包润色请求参数:', {
            model: requestData.model,
            style: style,
            messagesPreview: [
                {role: requestData.messages[0].role, contentPreview: requestData.messages[0].content.substring(0, 30) + '...'},
                {role: requestData.messages[1].role, contentPreview: requestData.messages[1].content.substring(0, 30) + '...'}
            ]
        });

        // 尝试不使用代理直接连接
        try {
            console.log('尝试直接连接豆包润色API，不使用代理');
            console.time('豆包润色API直连请求时间');
            const response = await axios.post(apiUrl, requestData, requestConfig);
            console.timeEnd('豆包润色API直连请求时间');
            
            console.log('豆包润色API直连成功，响应状态:', response.status);
            
            // 解析润色结果
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                const polishedText = response.data.choices[0].message.content;
                
                return {
                    originalText: text,
                    translatedText: polishedText,
                    service: '豆包1.5-Pro',
                    style: style
                };
            } else {
                console.log('API直连成功但返回结构异常:', JSON.stringify(response.data, null, 2));
                throw new Error('豆包润色服务返回格式异常响应');
            }
        } catch (directError) {
            console.error('直连豆包润色API失败:', directError.message);
            
            // 如果直连失败，尝试使用代理
            console.log('尝试使用代理连接豆包润色API');
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('豆包润色API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            }
            
            try {
                console.time('豆包润色API代理请求时间');
                const proxyResponse = await axios.post(apiUrl, requestData, requestConfig);
                console.timeEnd('豆包润色API代理请求时间');
                
                // 检查响应
                if (!proxyResponse.data) {
                    throw new Error('豆包润色服务返回空响应');
                }
                
                console.log('豆包润色代理响应状态:', proxyResponse.status);
                
                // 解析响应数据
                if (proxyResponse.data.choices && proxyResponse.data.choices.length > 0) {
                    const polishedText = proxyResponse.data.choices[0].message.content;
                    
                    return {
                        originalText: text,
                        translatedText: polishedText,
                        service: '豆包1.5-Pro',
                        style: style
                    };
                } else {
                    console.log('API代理请求成功但返回结构异常:', JSON.stringify(proxyResponse.data, null, 2));
                    throw new Error('豆包润色服务返回格式异常响应');
                }
            } catch (proxyError) {
                console.error('使用代理连接豆包润色API也失败:', proxyError.message);
                throw new Error('豆包润色服务暂时不可用: ' + proxyError.message);
            }
        }
    } catch (error) {
        console.error('豆包润色错误:', error);
        return {
            originalText: text,
            translatedText: '润色失败: ' + error.message,
            service: '豆包1.5-Pro',
            style: style,
            error: true
        };
    }
}

// 使用GPT进行文本润色
async function polishWithGPT(text, style = 'professional') {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.gpt) {
            throw new Error('请先设置OpenAI API密钥');
        }
        
        console.log(`使用ChatGPT进行文本润色，风格: ${style}`);
        
        // 根据风格构建适当的提示词
        let stylePrompt = "";
        switch (style) {
            case 'normal':
                stylePrompt = "润色语句使之更适合图书出版，通俗易懂，朗朗上口，符合表达习惯，不过分文绉绉";
                break;
            case 'rephrase':
                stylePrompt = "利用近义词、改变语句结构、改变主语、反译等方式在不改变原意的前提下更改表述方式";
                break;
            case 'professional':
                stylePrompt = "专业正式的风格，保持原意，提高表达质量";
                break;
            case 'creative':
                stylePrompt = "创意活泼的风格，增加表现力和生动性";
                break;
            case 'academic':
                stylePrompt = "学术严谨的风格，使用专业术语和规范表达";
                break;
            case 'simple':
                stylePrompt = "简洁明了的风格，去除冗余，保持清晰";
                break;
            default:
                stylePrompt = "提高表达质量和可读性";
        }
        
        try {
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Authorization': `Bearer ${API_KEYS.gpt}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 1分钟超时
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('ChatGPT润色API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            }
            
            console.log('开始发送OpenAI润色API请求');
            console.time('OpenAI润色API请求时间');
            
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `你是一位专业文本润色助手。请将以下文本润色为${stylePrompt}。不要额外添加原文中没有的内容，只专注于改善表达方式。只返回润色后的文本，不要添加任何解释或注释。`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            }, requestConfig);
            
            console.timeEnd('OpenAI润色API请求时间');
            
            if (!response.data || !response.data.choices || !response.data.choices.length) {
                throw new Error('OpenAI返回异常响应');
            }
            
            const polishedText = response.data.choices[0].message.content;
            
            return {
                originalText: text,
                translatedText: polishedText,
                service: 'ChatGPT',
                style: style
            };
        } catch (error) {
            console.error('OpenAI润色API调用失败:', error);
            throw new Error('OpenAI润色服务暂时不可用: ' + (error.response?.data?.error?.message || error.message));
        }
    } catch (error) {
        console.error('ChatGPT润色错误:', error);
        return {
            originalText: text,
            translatedText: '润色失败: ' + error.message,
            service: 'ChatGPT',
            style: style,
            error: true
        };
    }
}

// 使用Gemini进行文本润色
async function polishWithGemini(text, style = 'professional', customPrompt = '') {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.gemini) {
            throw new Error('请先设置Gemini API密钥');
        }
        
        console.log(`使用Gemini进行文本润色，风格: ${style}`);
        
        // 根据风格构建适当的提示词
        let stylePrompt = "";
        switch (style) {
            case 'normal':
                stylePrompt = "润色语句使之更适合图书出版，通俗易懂，朗朗上口，符合表达习惯，不过分文绉绉";
                break;
            case 'rephrase':
                stylePrompt = "利用近义词、改变语句结构、改变主语、反译等方式在不改变原意的前提下更改表述方式";
                break;
            case 'professional':
                stylePrompt = "专业正式的风格，保持原意，提高表达质量";
                break;
            case 'creative':
                stylePrompt = "创意活泼的风格，增加表现力和生动性";
                break;
            case 'academic':
                stylePrompt = "学术严谨的风格，使用专业术语和规范表达";
                break;
            case 'simple':
                stylePrompt = "简洁明了的风格，去除冗余，保持清晰";
                break;
            default:
                stylePrompt = "提高表达质量和可读性";
        }
        
        // 如果有自定义提示词，添加到提示中
        if (customPrompt) {
            stylePrompt += "。" + customPrompt;
        }
        
        try {
            // 调用Google Gemini API
            const apiKey = encodeURIComponent(API_KEYS.gemini.trim());
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 1分钟超时
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('Gemini润色API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            }
            
            console.log('开始发送Gemini润色API请求');
            console.time('Gemini润色API请求时间');
            
            const response = await axios.post(apiUrl, {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `请作为文本润色助手，将以下文本润色为${stylePrompt}。不要额外添加原文中没有的内容，只专注于改善表达方式。只返回润色后的文本，不要添加任何解释或注释。\n\n${text}`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            }, requestConfig);
            
            console.timeEnd('Gemini润色API请求时间');
            
            if (!response.data || !response.data.candidates || !response.data.candidates.length) {
                throw new Error('Gemini返回异常响应');
            }
            
            const polishedText = response.data.candidates[0].content.parts[0].text;
            
            return {
                originalText: text,
                translatedText: polishedText,
                service: 'Gemini',
                style: style
            };
        } catch (error) {
            console.error('Gemini润色API调用失败:', error);
            throw new Error('Gemini润色服务暂时不可用: ' + (error.response?.data?.error?.message || error.message));
        }
    } catch (error) {
        console.error('Gemini润色错误:', error);
        return {
            originalText: text,
            translatedText: '润色失败: ' + error.message,
            service: 'Gemini',
            style: style,
            error: true
        };
    }
}

// 使用DeepSeek进行文本润色
async function polishWithDeepSeek(text, style = 'professional') {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.deepseek) {
            throw new Error('请先设置DeepSeek API密钥');
        }
        
        console.log(`使用DeepSeek进行文本润色，风格: ${style}`);
        
        // 根据风格构建适当的提示词
        let stylePrompt = "";
        switch (style) {
            case 'normal':
                stylePrompt = "润色语句使之更适合图书出版，通俗易懂，朗朗上口，符合表达习惯，不过分文绉绉";
                break;
            case 'rephrase':
                stylePrompt = "利用近义词、改变语句结构、改变主语、反译等方式在不改变原意的前提下更改表述方式";
                break;
            case 'professional':
                stylePrompt = "专业正式的风格，保持原意，提高表达质量";
                break;
            case 'creative':
                stylePrompt = "创意活泼的风格，增加表现力和生动性";
                break;
            case 'academic':
                stylePrompt = "学术严谨的风格，使用专业术语和规范表达";
                break;
            case 'simple':
                stylePrompt = "简洁明了的风格，去除冗余，保持清晰";
                break;
            default:
                stylePrompt = "提高表达质量和可读性";
        }
        
        try {
            // 调用DeepSeek API
            const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
            
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEYS.deepseek}`
                },
                timeout: 60000 // 1分钟超时
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('DeepSeek润色API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            }
            
            console.log('开始发送DeepSeek润色API请求');
            console.time('DeepSeek润色API请求时间');
            
            const response = await axios.post(apiUrl, {
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是一位专业文本润色助手。请将以下文本润色为${stylePrompt}。不要额外添加原文中没有的内容，只专注于改善表达方式。只返回润色后的文本，不要添加任何解释或注释。`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            }, requestConfig);
            
            console.timeEnd('DeepSeek润色API请求时间');
            
            if (!response.data || !response.data.choices || !response.data.choices.length) {
                throw new Error('DeepSeek返回异常响应');
            }
            
            const polishedText = response.data.choices[0].message.content;
            
            return {
                originalText: text,
                translatedText: polishedText,
                service: 'DeepSeek-R1',
                style: style
            };
        } catch (error) {
            console.error('DeepSeek润色API调用失败:', error);
            throw new Error('DeepSeek润色服务暂时不可用: ' + (error.response?.data?.error?.message || error.message));
        }
    } catch (error) {
        console.error('DeepSeek润色错误:', error);
        return {
            originalText: text,
            translatedText: '润色失败: ' + error.message,
            service: 'DeepSeek-R1',
            style: style,
            error: true
        };
    }
}

// 使用千问进行文本润色
async function polishWithQwen(text, style = 'professional') {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.qwen) {
            throw new Error('请先设置千问API密钥');
        }
        
        console.log(`使用千问进行文本润色，风格: ${style}`);
        
        // 根据风格构建适当的提示词
        let stylePrompt = "";
        switch (style) {
            case 'normal':
                stylePrompt = "润色语句使之更适合图书出版，通俗易懂，朗朗上口，符合中文表达习惯，不过分文绉绉";
                break;
            case 'rephrase':
                stylePrompt = "利用近义词、改变语句结构、改变主语、反译等方式在不改变原意的前提下更改表述方式";
                break;
            case 'professional':
                stylePrompt = "专业正式的风格，保持原意，提高表达质量";
                break;
            case 'creative':
                stylePrompt = "创意活泼的风格，增加表现力和生动性";
                break;
            case 'academic':
                stylePrompt = "学术严谨的风格，使用专业术语和规范表达";
                break;
            case 'simple':
                stylePrompt = "简洁明了的风格，去除冗余，保持清晰";
                break;
            default:
                stylePrompt = "提高表达质量和可读性";
        }
        
        try {
            // 调用千问API
            const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
            
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEYS.qwen}`
                },
                timeout: 60000 // 1分钟超时
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('千问润色API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false; // 当使用httpsAgent时，设置proxy为false以避免冲突
            }
            
            console.log('开始发送千问润色API请求');
            console.time('千问润色API请求时间');
            
            const response = await axios.post(apiUrl, {
                model: 'qwen2.5-72b-instruct',
                input: {
                    messages: [
                        {
                            role: 'system',
                            content: `你是一位专业文本润色助手。请将以下文本润色为${stylePrompt}。不要额外添加原文中没有的内容，只专注于改善表达方式。只返回润色后的文本，不要添加任何解释或注释。`
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ]
                },
                parameters: {
                    temperature: 0.7,
                    max_tokens: 2048
                }
            }, requestConfig);
            
            console.timeEnd('千问润色API请求时间');
            
            if (!response.data || !response.data.output || !response.data.output.text) {
                throw new Error('千问返回异常响应');
            }
            
            const polishedText = response.data.output.text;
            
            return {
                originalText: text,
                translatedText: polishedText,
                service: '通义千问',
                style: style
            };
        } catch (error) {
            console.error('千问润色API调用失败:', error);
            throw new Error('千问润色服务暂时不可用: ' + (error.response?.data?.message || error.message));
        }
    } catch (error) {
        console.error('千问润色错误:', error);
        return {
            originalText: text,
            translatedText: '润色失败: ' + error.message,
            service: '通义千问',
            style: style,
            error: true
        };
    }
}

// 文本润色接口
app.post('/api/polish/text', async (req, res) => {
    try {
        const { text, style, service, customPrompt, multiStyle } = req.body;
        if (!text) {
            return res.status(400).json({ error: '缺少待润色文本' });
        }

        console.log('收到润色请求:', { 
            textPreview: text.substring(0, 30) + '...',
            style,
            service,
            hasCustomPrompt: !!customPrompt,
            multiStyle: !!multiStyle
        });

        // 验证润色风格是否有效
        const validStyles = ['normal', 'rephrase', 'professional', 'creative', 'academic', 'simple'];
        const finalStyle = validStyles.includes(style) ? style : 'normal';
        
        // 检查是否需要多风格润色
        if (multiStyle) {
            // 同时发起两种风格的润色请求
            let normalResult, rephraseResult;
            let error = null;

            try {
                // 根据 service 字段选择模型
                if (service === 'gemini') {
                    normalResult = await polishWithGemini(text, 'normal');
                    rephraseResult = await polishWithGemini(text, 'rephrase');
                } else if (service === 'deepseek') {
                    normalResult = await polishWithDeepSeek(text, 'normal');
                    rephraseResult = await polishWithDeepSeek(text, 'rephrase');
                } else if (service === 'qwen') {
                    normalResult = await polishWithQwen(text, 'normal');
                    rephraseResult = await polishWithQwen(text, 'rephrase');
                } else if (service === 'doubao') {
                    normalResult = await polishWithDoubao(text, 'normal');
                    rephraseResult = await polishWithDoubao(text, 'rephrase');
                } else {
                    normalResult = await polishWithGPT(text, 'normal');
                    rephraseResult = await polishWithGPT(text, 'rephrase');
                }
                
                // 返回合并的结果
                return res.json({ 
                    result: {
                        originalText: text,
                        normalStyle: normalResult.translatedText,
                        rephraseStyle: rephraseResult.translatedText,
                        service: normalResult.service
                    }
                });
            } catch (err) {
                console.error('多风格润色处理错误:', err);
                error = err.message || '润色过程中出现错误';
                
                // 确保结果对象存在，即使出错也返回原文
                normalResult = normalResult || {
                    originalText: text,
                    translatedText: '常规优化风格润色失败: ' + (err.message || '未知错误'),
                    service: service || 'unknown',
                    style: 'normal',
                    error: true
                };
                
                rephraseResult = rephraseResult || {
                    originalText: text,
                    translatedText: '转换语言风格润色失败: ' + (err.message || '未知错误'),
                    service: service || 'unknown',
                    style: 'rephrase',
                    error: true
                };
                
                // 即使出错也返回合并结果
                return res.json({ 
                    result: {
                        originalText: text,
                        normalStyle: normalResult.translatedText,
                        rephraseStyle: rephraseResult.translatedText,
                        service: normalResult.service || service || 'unknown'
                    }
                });
            }
        } else {
            // 原有的单风格润色处理逻辑
            let result;
            
            // 根据 service 字段选择模型，默认用 GPT
            if (service === 'gemini') {
                result = await polishWithGemini(text, finalStyle, customPrompt);
            } else if (service === 'deepseek') {
                result = await polishWithDeepSeek(text, finalStyle);
            } else if (service === 'qwen') {
                result = await polishWithQwen(text, finalStyle);
            } else if (service === 'doubao') {
                result = await polishWithDoubao(text, finalStyle);
            } else {
                result = await polishWithGPT(text, finalStyle);
            }

            console.log('润色完成:', {
                service: result.service,
                style: result.style,
                originalTextLength: result.originalText?.length || 0,
                resultTextLength: result.translatedText?.length || 0,
                hasError: !!result.error
            });

            res.json({ result });
        }
    } catch (error) {
        console.error('润色接口错误:', error);
        
        if (req.body.multiStyle) {
            // 多风格润色出错时的返回格式
            res.status(500).json({ 
                result: {
                    originalText: req.body.text || '',
                    normalStyle: '常规优化风格润色失败: ' + (error.message || '润色服务暂时不可用'),
                    rephraseStyle: '转换语言风格润色失败: ' + (error.message || '润色服务暂时不可用'),
                    service: req.body.service || 'unknown',
                    error: true
                }
            });
        } else {
            // 单风格润色出错时的返回格式
            res.status(500).json({ 
                error: error.message || '润色失败',
                result: {
                    originalText: req.body.text || '',
                    translatedText: '润色服务暂时不可用',
                    service: req.body.service || 'unknown',
                    style: req.body.style || 'normal',
                    error: true
                }
            });
        }
    }
});

// OpenAI连通性测试接口
app.get('/api/test-openai', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: '未配置 OPENAI_API_KEY'
        });
    }
    try {
        const response = await axios.get('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            ...getAxiosProxyConfig(),
            timeout: 10000
        });
        res.json({
            success: true,
            status: response.status,
            data: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message || '未知错误',
            detail: error.response?.data || null
        });
    }
});

// 图片翻译功能的实现
async function translateImageWithGPT(imagePath, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.gpt) {
            throw new Error('请先设置OpenAI API密钥');
        }
        
        console.log(`使用ChatGPT进行图片OCR和翻译: ${sourceLang} -> ${targetLang}`);
        
        // 读取图片文件并转换为base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg'; // 假设为jpeg，也可以根据实际文件确定
        
        // 获取语言名称用于提示词
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        try {
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Authorization': `Bearer ${API_KEYS.gpt}`,
                    'Content-Type': 'application/json'
                },
                timeout: 180000 // 增加超时时间到3分钟
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('ChatGPT图片API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false;
            }
            
            console.log('开始发送OpenAI图片API请求');
            console.time('OpenAI图片API请求时间');
            
            // 使用GPT-4 Vision模型进行图片OCR和翻译
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个专业的图片OCR和翻译助手。请首先识别图片中的文本内容，然后将识别到的${fromLangName}文本翻译成${toLangName}。请按照以下格式返回结果：
                        
原始文本:
[识别到的原始文本]

翻译结果:
[翻译后的文本]

如果图片中没有文本，请返回"图片中未检测到文本"。`
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `请识别这张图片中的文本，并将其从${fromLangName}翻译成${toLangName}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 4096,
                temperature: 0.3,
                top_p: 1.0
            }, requestConfig);
            
            console.timeEnd('OpenAI图片API请求时间');
            
            if (!response.data || !response.data.choices || !response.data.choices.length) {
                throw new Error('OpenAI返回异常响应，请检查API密钥是否有效');
            }
            
            const result = response.data.choices[0].message.content;
            console.log('OpenAI图片处理成功，结果长度:', result.length);
            
            // 提取原始文本和翻译结果
            let originalText = '';
            let translatedText = '';
            
            const originalTextMatch = result.match(/原始文本:\n([\s\S]*?)(?:\n\n翻译结果:|\n翻译结果:)/);
            if (originalTextMatch && originalTextMatch[1]) {
                originalText = originalTextMatch[1].trim();
            }
            
            const translatedTextMatch = result.match(/翻译结果:\n([\s\S]*?)$/);
            if (translatedTextMatch && translatedTextMatch[1]) {
                translatedText = translatedTextMatch[1].trim();
            }
            
            // 如果没有检测到文本，设置默认信息
            if (!originalText) {
                if (result.includes('图片中未检测到文本')) {
                    originalText = '图片中未检测到文本';
                    translatedText = '图片中未检测到文本';
                } else {
                    originalText = '无法识别图片中的文本';
                    translatedText = '无法识别图片中的文本';
                }
            }
            
            // 返回OCR和翻译结果
            return {
                originalText,
                translatedText,
                service: 'ChatGPT Vision',
                fromLang: sourceLang,
                toLang: targetLang
            };
        } catch (apiError) {
            console.error('OpenAI图片API调用失败:', apiError);
            
            if (apiError.response) {
                console.error('OpenAI图片错误详情:', {
                    status: apiError.response.status,
                    statusText: apiError.response.statusText,
                    data: apiError.response.data
                });
                
                if (apiError.response.status === 429) {
                    return {
                        originalText: '图片处理失败',
                        translatedText: 'OpenAI API请求超过频率限制或额度用尽，请稍后再试',
                        service: 'ChatGPT Vision',
                        error: true
                    };
                }
                
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: 'ChatGPT图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: 'ChatGPT Vision',
                    error: true
                };
            } else {
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: 'ChatGPT图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: 'ChatGPT Vision',
                    error: true
                };
            }
        }
    } catch (error) {
        console.error('ChatGPT图片处理错误:', error);
        return {
            originalText: '图片处理失败',
            translatedText: `ChatGPT图片服务出错: ${error.message}`,
            service: 'ChatGPT Vision',
            error: true
        };
    }
}

async function translateImageWithGemini(imagePath, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.gemini) {
            throw new Error('请先设置Gemini API密钥');
        }
        
        console.log(`使用Gemini进行图片OCR和翻译: ${sourceLang} -> ${targetLang}`);
        
        // 读取图片文件并转换为base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg'; // 假设为jpeg，也可以根据实际文件确定
        
        // 获取语言名称用于提示词
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        try {
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEYS.gemini
                },
                timeout: 180000 // 增加超时时间到3分钟
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('Gemini图片API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false;
            }
            
            console.log('开始发送Gemini图片API请求');
            console.time('Gemini图片API请求时间');
            
            // 使用Gemini 1.5 Flash模型进行图片OCR和翻译
            const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `你是一个专业的图片OCR和翻译助手。请首先识别图片中的文本内容，然后将识别到的${fromLangName}文本翻译成${toLangName}。请按照以下格式返回结果：
                                
原始文本:
[识别到的原始文本]

翻译结果:
[翻译后的文本]

如果图片中没有文本，请返回"图片中未检测到文本"。`
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ],
                generation_config: {
                    temperature: 0.4,
                    top_p: 1.0,
                    max_output_tokens: 2048
                }
            }, requestConfig);
            
            console.timeEnd('Gemini图片API请求时间');
            
            if (!response.data || !response.data.candidates || !response.data.candidates.length) {
                throw new Error('Gemini返回异常响应，请检查API密钥是否有效');
            }
            
            const result = response.data.candidates[0].content.parts[0].text;
            console.log('Gemini图片处理成功，结果长度:', result.length);
            
            // 提取原始文本和翻译结果
            let originalText = '';
            let translatedText = '';
            
            const originalTextMatch = result.match(/原始文本:\n([\s\S]*?)(?:\n\n翻译结果:|\n翻译结果:)/);
            if (originalTextMatch && originalTextMatch[1]) {
                originalText = originalTextMatch[1].trim();
            }
            
            const translatedTextMatch = result.match(/翻译结果:\n([\s\S]*?)$/);
            if (translatedTextMatch && translatedTextMatch[1]) {
                translatedText = translatedTextMatch[1].trim();
            }
            
            // 如果没有检测到文本，设置默认信息
            if (!originalText) {
                if (result.includes('图片中未检测到文本')) {
                    originalText = '图片中未检测到文本';
                    translatedText = '图片中未检测到文本';
                } else {
                    originalText = '无法识别图片中的文本';
                    translatedText = '无法识别图片中的文本';
                }
            }
            
            // 返回OCR和翻译结果
            return {
                originalText,
                translatedText,
                service: 'Gemini Vision',
                fromLang: sourceLang,
                toLang: targetLang
            };
        } catch (apiError) {
            console.error('Gemini图片API调用失败:', apiError);
            
            if (apiError.response) {
                console.error('Gemini图片错误详情:', {
                    status: apiError.response.status,
                    statusText: apiError.response.statusText,
                    data: apiError.response.data
                });
                
                if (apiError.response.status === 429) {
                    throw new Error('Gemini API请求超过频率限制，请稍后再试');
                }
                
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: 'Gemini图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: 'Gemini Vision',
                    error: true
                };
            } else {
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: 'Gemini图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: 'Gemini Vision',
                    error: true
                };
            }
        }
    } catch (error) {
        console.error('Gemini图片处理错误:', error);
        return {
            originalText: '图片处理失败',
            translatedText: `Gemini图片服务出错: ${error.message}`,
            service: 'Gemini Vision',
            error: true
        };
    }
}

async function translateImageWithDeepSeek(imagePath, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.deepseek) {
            throw new Error('请先设置DeepSeek API密钥');
        }
        
        console.log(`使用DeepSeek进行图片OCR和翻译: ${sourceLang} -> ${targetLang}`);
        
        // 读取图片文件并转换为base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg'; // 假设为jpeg，也可以根据实际文件确定
        
        // 获取语言名称用于提示词
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        try {
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEYS.deepseek}`
                },
                timeout: 180000 // 增加超时时间到3分钟
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('DeepSeek图片API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false;
            }
            
            console.log('开始发送DeepSeek图片API请求');
            console.time('DeepSeek图片API请求时间');
            
            // 使用DeepSeek Vision模型进行图片OCR和翻译
            const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
                model: 'deepseek-vision',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个专业的图片OCR和翻译助手。请首先识别图片中的文本内容，然后将识别到的${fromLangName}文本翻译成${toLangName}。`
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `请识别这张图片中的文本内容，并将其从${fromLangName}翻译成${toLangName}。请按照以下格式返回：

原始文本:
[识别到的原始文本]

翻译结果:
[翻译后的文本]

如果图片中没有文本，请返回"图片中未检测到文本"。`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.3,
                max_tokens: 2048
            }, requestConfig);
            
            console.timeEnd('DeepSeek图片API请求时间');
            
            if (!response.data || !response.data.choices || !response.data.choices.length) {
                throw new Error('DeepSeek返回异常响应，请检查API密钥是否有效');
            }
            
            const result = response.data.choices[0].message.content;
            console.log('DeepSeek图片处理成功，结果长度:', result.length);
            
            // 提取原始文本和翻译结果
            let originalText = '';
            let translatedText = '';
            
            const originalTextMatch = result.match(/原始文本:\n([\s\S]*?)(?:\n\n翻译结果:|\n翻译结果:)/);
            if (originalTextMatch && originalTextMatch[1]) {
                originalText = originalTextMatch[1].trim();
            }
            
            const translatedTextMatch = result.match(/翻译结果:\n([\s\S]*?)$/);
            if (translatedTextMatch && translatedTextMatch[1]) {
                translatedText = translatedTextMatch[1].trim();
            }
            
            // 如果没有检测到文本，设置默认信息
            if (!originalText) {
                if (result.includes('图片中未检测到文本')) {
                    originalText = '图片中未检测到文本';
                    translatedText = '图片中未检测到文本';
                } else {
                    originalText = '无法识别图片中的文本';
                    translatedText = '无法识别图片中的文本';
                }
            }
            
            // 返回OCR和翻译结果
            return {
                originalText,
                translatedText,
                service: 'DeepSeek Vision',
                fromLang: sourceLang,
                toLang: targetLang
            };
        } catch (apiError) {
            console.error('DeepSeek图片API调用失败:', apiError);
            
            if (apiError.response) {
                console.error('DeepSeek图片错误详情:', {
                    status: apiError.response.status,
                    statusText: apiError.response.statusText,
                    data: apiError.response.data
                });
                
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: 'DeepSeek图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: 'DeepSeek Vision',
                    error: true
                };
            } else {
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: 'DeepSeek图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: 'DeepSeek Vision',
                    error: true
                };
            }
        }
    } catch (error) {
        console.error('DeepSeek图片处理错误:', error);
        return {
            originalText: '图片处理失败',
            translatedText: `DeepSeek图片服务出错: ${error.message}`,
            service: 'DeepSeek Vision',
            error: true
        };
    }
}

async function translateImageWithQwen(imagePath, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.qwen) {
            throw new Error('请先设置通义千问 API密钥');
        }
        
        console.log(`使用通义千问进行图片OCR和翻译: ${sourceLang} -> ${targetLang}`);
        
        // 读取图片文件并转换为base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        // 获取语言名称用于提示词
        const fromLangName = getLanguageName(sourceLang);
        const toLangName = getLanguageName(targetLang);
        
        try {
            // 准备请求配置
            const requestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEYS.qwen}`
                },
                timeout: 180000 // 增加超时时间到3分钟
            };
            
            // 如果启用了代理，添加httpsAgent
            if (getAxiosProxyConfig().httpsAgent) {
                console.log('Qwen图片API请求使用代理');
                requestConfig.httpsAgent = getAxiosProxyConfig().httpsAgent;
                requestConfig.proxy = false;
            }
            
            console.log('开始发送Qwen图片API请求');
            console.time('Qwen图片API请求时间');
            
            // 使用通义千问多模态模型进行图片OCR和翻译
            const response = await axios.post('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
                model: 'qwen-vl-plus',
                input: {
                    messages: [
                        {
                            role: 'system',
                            content: [
                                {
                                    text: `你是一个专业的图片OCR和翻译助手。请首先识别图片中的文本内容，然后将识别到的${fromLangName}文本翻译成${toLangName}。`
                                }
                            ]
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    text: `请识别这张图片中的文本内容，并将其从${fromLangName}翻译成${toLangName}。请按照以下格式返回：

原始文本:
[识别到的原始文本]

翻译结果:
[翻译后的文本]

如果图片中没有文本，请返回"图片中未检测到文本"。`
                                },
                                {
                                    image: base64Image
                                }
                            ]
                        }
                    ]
                },
                parameters: {
                    result_format: 'message',
                    temperature: 0.3,
                    max_tokens: 2048
                }
            }, requestConfig);
            
            console.timeEnd('Qwen图片API请求时间');
            
            if (!response.data || !response.data.output || !response.data.output.choices || !response.data.output.choices.length) {
                throw new Error('通义千问返回异常响应，请检查API密钥是否有效');
            }
            
            const result = response.data.output.choices[0].message.content[0].text;
            console.log('通义千问图片处理成功，结果长度:', result.length);
            
            // 提取原始文本和翻译结果
            let originalText = '';
            let translatedText = '';
            
            const originalTextMatch = result.match(/原始文本:\n([\s\S]*?)(?:\n\n翻译结果:|\n翻译结果:)/);
            if (originalTextMatch && originalTextMatch[1]) {
                originalText = originalTextMatch[1].trim();
            }
            
            const translatedTextMatch = result.match(/翻译结果:\n([\s\S]*?)$/);
            if (translatedTextMatch && translatedTextMatch[1]) {
                translatedText = translatedTextMatch[1].trim();
            }
            
            // 如果没有检测到文本，设置默认信息
            if (!originalText) {
                if (result.includes('图片中未检测到文本')) {
                    originalText = '图片中未检测到文本';
                    translatedText = '图片中未检测到文本';
                } else {
                    originalText = '无法识别图片中的文本';
                    translatedText = '无法识别图片中的文本';
                }
            }
            
            // 返回OCR和翻译结果
            return {
                originalText,
                translatedText,
                service: '通义千问',
                fromLang: sourceLang,
                toLang: targetLang
            };
        } catch (apiError) {
            console.error('通义千问图片API调用失败:', apiError);
            
            if (apiError.response) {
                console.error('通义千问图片错误详情:', {
                    status: apiError.response.status,
                    statusText: apiError.response.statusText,
                    data: apiError.response.data
                });
                
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: '通义千问图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: '通义千问',
                    error: true
                };
            } else {
                // 返回用户友好的错误信息
                return {
                    originalText: '图片处理失败',
                    translatedText: '通义千问图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                    service: '通义千问',
                    error: true
                };
            }
        }
    } catch (error) {
        console.error('通义千问图片处理错误:', error);
        return {
            originalText: '图片处理失败',
            translatedText: `通义千问图片服务出错: ${error.message}`,
            service: '通义千问',
            error: true
        };
    }
}

async function translateImageWithDoubao(imagePath, sourceLang, targetLang) {
    try {
        // 检查API密钥是否已设置
        if (!API_KEYS.doubao) {
            throw new Error('请先设置豆包 API密钥');
        }
        
        console.log(`使用替代方案处理图片: ${sourceLang} -> ${targetLang}`);
        console.log(`图片路径: ${imagePath}`);
        
        // 根据源语言选择不同的示例文本
        let mockText = '';
        switch (sourceLang) {
            case 'en':
                mockText = 'This is a sample text extracted from the image. Due to network connectivity issues, we are using this example to demonstrate the translation capabilities. In a production environment, please use a proper OCR service.';
                break;
            case 'zh':
                mockText = '这是从图片中提取的示例文本。由于网络连接问题，我们使用这个例子来演示翻译功能。在生产环境中，请使用适当的OCR服务。';
                break;
            case 'ja':
                mockText = 'これは画像から抽出されたサンプルテキストです。ネットワーク接続の問題により、このような例で翻訳機能を紹介しています。実際の環境では、適切なOCRサービスを使用してください。';
                break;
            case 'ko':
                mockText = '이것은 이미지에서 추출한 샘플 텍스트입니다. 네트워크 연결 문제로 인해 이 예시를 사용하여 번역 기능을 시연하고 있습니다. 실제 환경에서는 적절한 OCR 서비스를 사용하세요.';
                break;
            case 'fr':
                mockText = 'Ceci est un exemple de texte extrait de l\'image. En raison de problèmes de connectivité réseau, nous utilisons cet exemple pour démontrer les capacités de traduction. Dans un environnement de production, veuillez utiliser un service OCR approprié.';
                break;
            case 'de':
                mockText = 'Dies ist ein Beispieltext, der aus dem Bild extrahiert wurde. Aufgrund von Netzwerkverbindungsproblemen verwenden wir dieses Beispiel, um die Übersetzungsfähigkeiten zu demonstrieren. In einer Produktionsumgebung verwenden Sie bitte einen geeigneten OCR-Dienst.';
                break;
            case 'es':
                mockText = 'Este es un texto de ejemplo extraído de la imagen. Debido a problemas de conectividad de red, estamos utilizando este ejemplo para demostrar las capacidades de traducción. En un entorno de producción, utilice un servicio OCR adecuado.';
                break;
            case 'ru':
                mockText = 'Это пример текста, извлеченного из изображения. Из-за проблем с подключением к сети мы используем этот пример, чтобы продемонстрировать возможности перевода. В производственной среде используйте соответствующий сервис OCR.';
                break;
            default:
                mockText = '这是从图片中提取的示例文本。由于网络连接问题，我们使用这个例子来演示翻译功能。在生产环境中，请使用适当的OCR服务。';
        }
        
        try {
            // 使用豆包翻译这段文本
            console.log('使用豆包翻译模拟文本');
            console.log('源语言:', sourceLang, '目标语言:', targetLang);
            console.log('模拟文本:', mockText.substring(0, 50) + '...');
            
            const translationResult = await translateWithDoubao(mockText, targetLang, sourceLang);
            
            // 返回组合结果
            return {
                originalText: mockText,
                translatedText: translationResult.translatedText,
                service: '豆包1.5-Pro (图片模拟)',
                fromLang: sourceLang,
                toLang: targetLang,
                error: false
            };
            
        } catch (apiError) {
            console.error('豆包图片模拟翻译失败:', apiError);
            
            // 返回用户友好的错误信息
            return {
                originalText: '图片处理失败',
                translatedText: '图片翻译服务暂时不可用，请稍后再试或尝试其他翻译服务',
                service: '豆包1.5-Pro (图片模拟)',
                error: true
            };
        }
    } catch (error) {
        console.error('豆包图片处理错误:', error);
        return {
            originalText: '图片处理失败',
            translatedText: `图片服务出错: ${error.message}`,
            service: '豆包1.5-Pro (图片模拟)',
            error: true
        };
    }
}

// 启动服务器
app.listen(port, () => {
    console.log(`TranOptim服务器运行在 http://localhost:${port}`);
});