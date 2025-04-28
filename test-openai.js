require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const apiKey = process.env.OPENAI_API_KEY;

const config = {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  },
  timeout: 10000
};

if (proxy) {
  config.httpsAgent = new HttpsProxyAgent(proxy);
  config.proxy = false;
}

axios.get('https://api.openai.com/v1/models', config)
  .then(res => console.log('success:', res.status, res.data))
  .catch(err => console.error('error:', err.message, err.response?.data || ''));