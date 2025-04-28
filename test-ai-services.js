// TranOptim - AI服务调用测试脚本
require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');
const path = require('path');

// 获取代理配置
function getAxiosProxyConfig() {
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || null;
    if (!proxy) {
        console.log('未配置代理，将直接连接API服务');
        return {};
    }
    
    console.log('使用代理服务器:', proxy);
    return {
        httpsAgent: new HttpsProxyAgent(proxy),
        proxy: false // 禁用axios自带的proxy机制，全部走agent
    };
}

// 检查API密钥是否存在
function checkApiKey(service, key) {
    if (!key || key.includes('在这里填入你的') || key.includes('your') || key.startsWith('sk-') && key.length < 30) {
        console.error(`❌ ${service} API密钥未设置或格式不正确`);
        return false;
    }
    return true;
}

// 测试OpenAI API
async function testOpenAI() {
    console.log('\n===== 测试 OpenAI API =====');
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!checkApiKey('OpenAI', apiKey)) return;
    
    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000,
            ...getAxiosProxyConfig()
        };
        
        console.log('正在测试 OpenAI API 连接...');
        const response = await axios.get('https://api.openai.com/v1/models', config);
        
        console.log('✅ OpenAI API 连接成功!');
        console.log(`状态码: ${response.status}`);
        console.log(`可用模型数量: ${response.data.data.length}`);
        
        // 测试翻译功能
        console.log('\n正在测试翻译功能...');
        const translationResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的翻译助手，请将以下英文文本翻译成中文，保持原文的意思、风格和格式。只返回翻译结果，不要添加任何解释或注释。'
                },
                {
                    role: 'user',
                    content: 'Hello world! This is a test message.'
                }
            ],
            temperature: 0.3,
            max_tokens: 100
        }, config);
        
        console.log('✅ 翻译请求成功!');
        console.log('翻译结果:', translationResponse.data.choices[0].message.content);
        
    } catch (error) {
        console.error('❌ OpenAI API 测试失败:', error.message);
        if (error.response) {
            console.error('错误状态码:', error.response.status);
            console.error('错误详情:', error.response.data);
        }
    }
}

// 测试Gemini API
async function testGemini() {
    console.log('\n===== 测试 Gemini API =====');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!checkApiKey('Gemini', apiKey)) return;
    
    try {
        // Gemini API使用查询参数传递API密钥
        const encodedApiKey = encodeURIComponent(apiKey.trim());
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodedApiKey}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000,
            ...getAxiosProxyConfig()
        };
        
        console.log('正在测试 Gemini API 翻译功能...');
        const response = await axios.post(apiUrl, {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: "请将以下英文翻译成中文：Hello world! This is a test message."
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 100
            }
        }, config);
        
        console.log('✅ Gemini API 请求成功!');
        console.log('响应结果:', response.data.candidates[0].content.parts[0].text);
        
    } catch (error) {
        console.error('❌ Gemini API 测试失败:', error.message);
        if (error.response) {
            console.error('错误状态码:', error.response.status);
            console.error('错误详情:', error.response.data);
        }
    }
}

// 测试DeepSeek API
async function testDeepSeek() {
    console.log('\n===== 测试 DeepSeek API =====');
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!checkApiKey('DeepSeek', apiKey)) return;
    
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 30000, // 增加超时时间到30秒
            ...getAxiosProxyConfig()
        };
        
        console.log('正在测试 DeepSeek API 翻译功能...');
        console.log('使用API接口:', 'https://api.siliconflow.cn/v1/chat/completions');
        console.log('使用模型:', 'deepseek-ai/DeepSeek-V3');
        
        const response = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: 'deepseek-ai/DeepSeek-V3',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的翻译助手，请将以下英文文本翻译成中文，保持原文的意思、风格和格式。只返回翻译结果，不要添加任何解释或注释。'
                },
                {
                    role: 'user',
                    content: 'Hello world! This is a test message.'
                }
            ],
            temperature: 0.3,
            max_tokens: 100,
            stream: false // 确保不使用流式响应
        }, config);
        
        console.log('✅ DeepSeek API 请求成功!');
        console.log('响应状态:', response.status);
        console.log('响应头:', JSON.stringify(response.headers));
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            if (response.data.choices[0].message && response.data.choices[0].message.content) {
                console.log('翻译结果:', response.data.choices[0].message.content);
            } else {
                console.log('警告: 响应中缺少预期的翻译内容');
                console.log('完整响应结构:', JSON.stringify(response.data, null, 2));
            }
        } else {
            console.log('警告: 响应格式异常');
            console.log('完整响应结构:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ DeepSeek API 测试失败:', error.message);
        if (error.response) {
            console.error('错误状态码:', error.response.status);
            console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
        }
        
        // 尝试通过服务器接口测试
        try {
            console.log('\n尝试通过TranOptim服务器接口测试DeepSeek...');
            const serverResponse = await axios.post('http://localhost:3001/api/translate/text', {
                text: 'Hello world! This is a test message.',
                sourceLang: 'en',
                targetLang: 'zh',
                service: 'deepseek'
            });
            
            console.log('✅ 服务器DeepSeek请求成功!');
            console.log('翻译结果:', serverResponse.data.translatedText);
        } catch (serverError) {
            console.error('❌ 服务器DeepSeek请求也失败:', serverError.message);
        }
    }
}

// 测试Qwen API
async function testQwen() {
    console.log('\n===== 测试 Qwen API =====');
    const apiKey = process.env.QWEN_API_KEY;
    
    if (!checkApiKey('Qwen', apiKey)) return;
    
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 30000, // 增加超时时间到30秒
            ...getAxiosProxyConfig()
        };
        
        console.log('正在测试 Qwen API 翻译功能...');
        console.log('使用API接口:', 'https://api.siliconflow.cn/v1/chat/completions');
        console.log('使用模型:', 'Qwen/Qwen2.5-72B-Instruct');
        
        const response = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
            model: 'Qwen/Qwen2.5-72B-Instruct',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的翻译助手，请将以下英文文本翻译成中文，保持原文的意思、风格和格式。只返回翻译结果，不要添加任何解释或注释。'
                },
                {
                    role: 'user',
                    content: 'Hello world! This is a test message.'
                }
            ],
            temperature: 0.3,
            max_tokens: 100,
            stream: false // 确保不使用流式响应
        }, config);
        
        console.log('✅ Qwen API 请求成功!');
        console.log('响应状态:', response.status);
        console.log('响应头:', JSON.stringify(response.headers));
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            if (response.data.choices[0].message && response.data.choices[0].message.content) {
                console.log('翻译结果:', response.data.choices[0].message.content);
            } else {
                console.log('警告: 响应中缺少预期的翻译内容');
                console.log('完整响应结构:', JSON.stringify(response.data, null, 2));
            }
        } else {
            console.log('警告: 响应格式异常');
            console.log('完整响应结构:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Qwen API 测试失败:', error.message);
        if (error.response) {
            console.error('错误状态码:', error.response.status);
            console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
        }
        
        // 尝试通过服务器接口测试
        try {
            console.log('\n尝试通过TranOptim服务器接口测试Qwen...');
            const serverResponse = await axios.post('http://localhost:3001/api/translate/text', {
                text: 'Hello world! This is a test message.',
                sourceLang: 'en',
                targetLang: 'zh',
                service: 'qwen'
            });
            
            console.log('✅ 服务器Qwen请求成功!');
            console.log('翻译结果:', serverResponse.data.translatedText);
        } catch (serverError) {
            console.error('❌ 服务器Qwen请求也失败:', serverError.message);
        }
    }
}

// 测试豆包翻译服务通过服务器
async function testDoubao() {
    try {
        console.log('\n===== 测试 豆包 API =====');
        console.log('豆包API使用火山引擎的接口，需要AK/SK认证');
        
        // 检查环境变量
        if (!process.env.DOUBAO_SECRET) {
            console.log('⚠️ 警告: DOUBAO_SECRET 环境变量未设置，豆包API可能无法正常工作');
            console.log('请在 .env 文件中设置 DOUBAO_SECRET=你的豆包密钥');
        }
        
        console.log('直接通过TranOptim服务器接口测试豆包功能');
        console.log('使用TranOptim服务器接口进行豆包API测试...');
        console.log('提示：请确保已运行 node server.js 启动TranOptim服务器');
        
        const testText = "Hello world! This is a test message.";
        const targetLang = "zh"; // 中文
        
        const requestData = {
            text: testText,
            targetLang: targetLang,
            sourceLang: "en",
            service: "doubao"
        };
        
        const response = await axios.post('http://localhost:3000/api/translate/text', requestData);
        
        if (response.status === 200) {
            const data = response.data;
            
            if (data.translatedText && data.translatedText.startsWith('翻译失败:')) {
                console.log('❌ 豆包 API 请求返回错误!');
                console.log('错误信息:', data.translatedText);
            } else if (data.translatedText) {
                console.log('✅ 豆包 API 请求成功!');
                console.log('翻译结果:', data.translatedText);
            } else {
                console.log('❌ 豆包 API 返回异常结果!');
                console.log('返回内容:', JSON.stringify(data));
            }
        } else {
            console.log('❌ 豆包 API 请求失败，状态码:', response.status);
        }
    } catch (error) {
        console.log('❌ 豆包 API 请求错误!');
        if (error.response) {
            console.log('错误状态码:', error.response.status);
            console.log('错误信息:', error.response.data);
        } else if (error.request) {
            console.log('请求错误:', error.message);
            console.log('提示: 请确保TranOptim服务器已启动 (node server.js)');
        } else {
            console.log('错误信息:', error.message);
        }
    }
}

// 主函数 - 运行所有测试
async function runAllTests() {
    console.log('====================================');
    console.log('TranOptim - AI服务调用测试');
    console.log('====================================\n');
    
    // 检查环境变量
    console.log('检查环境变量配置:');
    const requiredEnvVars = [
        'OPENAI_API_KEY', 
        'GEMINI_API_KEY', 
        'DEEPSEEK_API_KEY', 
        'QWEN_API_KEY', 
        'DOUBAO_API_KEY'
    ];
    
    requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
            const maskedKey = process.env[varName].substring(0, 4) + '****' + process.env[varName].substring(process.env[varName].length - 4);
            console.log(`✓ ${varName}: 已配置 (${maskedKey})`);
        } else {
            console.log(`✗ ${varName}: 未配置`);
        }
    });
    
    // 运行各服务测试
    try {
        await testOpenAI();
        await testGemini();
        await testDeepSeek();
        await testQwen();
        await testDoubao();

        console.log('\n====================================');
        console.log('所有测试完成!');
        console.log('====================================');
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 运行测试
runAllTests(); 