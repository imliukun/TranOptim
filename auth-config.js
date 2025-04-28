// TranOptim 认证配置
const AuthConfig = {
    // 预设用户列表，格式为：用户名:密码
    // 实际部署时建议修改这些默认凭据
    users: {
        "admin": "admin123",
        "user1": "password123",
        "demo": "demo2024",
        "haru": "haruru850127"
    },
    
    // 认证相关设置
    settings: {
        // 登录会话有效期（毫秒）- 默认7天
        sessionTimeout: 7 * 24 * 60 * 60 * 1000,
        
        // 认证token密钥（用于签名）
        // 实际部署时务必修改此密钥
        tokenSecret: "TranOptim_Secret_Key_2024",
        
        // 是否启用认证功能
        enabled: true
    }
};

// 导出配置
(function() {
    // 如果在浏览器环境中，则在window上挂载配置
    if (typeof window !== 'undefined') {
        window.AuthConfig = AuthConfig;
    }
    // 如果在Node.js环境中，则导出配置
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AuthConfig;
    }
})(); 