// 测试豆包API的脚本
require('dotenv').config();
const axios = require('axios');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

async function testDoubaoAPI() {
    try {
        const apiKey = process.env.DOUBAO_API_KEY;
        
        if (!apiKey) {
            console.error('错误: 未设置DOUBAO_API_KEY环境变量');
            return;
        }
        
        console.log('使用API密钥:', apiKey);
        
        // 准备API请求URL
        const apiUrl = 'https://modelslab.bytedance.com/api/v1/translate';
        
        // 构建请求数据
        const requestData = {
            text: 'Hello world',
            source_lang: 'en',
            target_lang: 'zh-CN'
        };
        
        // 准备请求配置
        const requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 30000 // 30秒超时
        };
        
        // 是否使用代理
        const useProxy = process.argv.includes('--no-proxy') ? false : true;
        
        // 如果有代理且启用了代理，添加代理配置
        const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
        if (proxy && useProxy) {
            console.log('使用代理:', proxy);
            requestConfig.httpsAgent = new HttpsProxyAgent(proxy);
            requestConfig.proxy = false;
        } else {
            console.log('不使用代理，直接连接');
        }
        
        console.log('请求URL:', apiUrl);
        console.log('请求参数:', requestData);
        console.log('请求头:', {
            'Content-Type': requestConfig.headers['Content-Type'],
            'Authorization': requestConfig.headers['Authorization'].substring(0, 13) + '...'
        });
        
        // 测试不同的URL组合
        const urlVariants = [
            'https://modelslab.bytedance.com/api/v1/translate',
            'https://modelslab.bytedance.com/api/v1/text/translate', 
            'https://open.volcengineapi.com/api/v1/mt/translate'
        ];
        
        // 测试不同的请求头格式
        const authVariants = [
            apiKey, 
            `Bearer ${apiKey}`
        ];
        
        console.log('尝试不同的URL和授权组合:');
        
        for (const url of urlVariants) {
            for (const auth of authVariants) {
                console.log(`\n测试 URL: ${url}`);
                console.log(`授权: ${auth.substring(0, auth.startsWith('Bearer') ? 13 : 8)}...`);
                
                try {
                    const testConfig = {
                        ...requestConfig,
                        headers: {
                            ...requestConfig.headers,
                            'Authorization': auth
                        }
                    };
                    
                    console.log('发送请求...');
                    const response = await axios.post(url, requestData, testConfig);
                    console.log('响应状态:', response.status);
                    console.log('响应数据:', JSON.stringify(response.data, null, 2));
                    
                    // 成功则记录组合
                    console.log(`成功! URL: ${url}, 授权格式: ${auth.startsWith('Bearer') ? 'Bearer Token' : '普通Token'}`);
                    break;
                } catch (error) {
                    console.log(`失败: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('请求失败:', error);
        
        if (error.response) {
            // 服务器返回了响应，但状态码不是2xx
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else if (error.request) {
            // 请求已发送，但没有收到响应
            console.error('未收到响应，请求详情:', error.request);
        } else {
            // 设置请求时出错
            console.error('请求设置错误:', error.message);
        }
        
        // 如果有详细错误信息，打印出来
        if (error.config) {
            console.error('请求配置:', {
                url: error.config.url,
                method: error.config.method,
                headers: {
                    'Content-Type': error.config.headers['Content-Type']
                }
            });
        }
    }
}

testDoubaoAPI(); 