// TranOptim Cloudflare配置
const CloudflareConfig = {
    // 是否启用Cloudflare部署模式 - 本地开发时设为false
    isCloudflare: false,
    
    // Cloudflare Pages URL，部署后修改为实际地址
    cloudflareUrl: 'http://localhost:3001',
    
    // API路径
    apiPaths: {
        translateText: '/api/translate/text',
        translateImage: '/api/translate/image',
        polishText: '/api/polish/text'
    },
    
    // 获取API请求URL
    getApiUrl: function(path) {
        return this.isCloudflare ? `${this.cloudflareUrl}${path}` : path;
    }
};

// 导出配置
(function() {
    // 如果在浏览器环境中，则在window上挂载配置
    if (typeof window !== 'undefined') {
        window.CloudflareConfig = CloudflareConfig;
    }
    // 如果在Node.js环境中，则导出配置
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CloudflareConfig;
    }
})(); 