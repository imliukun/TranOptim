// TranOptim 认证管理脚本

// 检查用户是否已登录
function isLoggedIn() {
    // 从localStorage获取认证数据
    const authDataStr = localStorage.getItem('tranOptimAuth');
    if (!authDataStr) {
        return false;
    }
    
    try {
        // 解析认证数据
        const authData = JSON.parse(authDataStr);
        
        // 检查令牌是否过期
        const currentTime = new Date().getTime();
        if (currentTime > authData.expiryTime) {
            // 令牌已过期，清除认证数据
            localStorage.removeItem('tranOptimAuth');
            return false;
        }
        
        // 令牌有效
        return true;
    } catch (error) {
        console.error('[AUTH] 解析认证数据出错:', error);
        return false;
    }
}

// 重定向到登录页
function redirectToLogin() {
    window.location.href = 'login.html';
}

// 获取当前用户名
function getCurrentUsername() {
    const authDataStr = localStorage.getItem('tranOptimAuth');
    if (!authDataStr) {
        return null;
    }
    
    try {
        const authData = JSON.parse(authDataStr);
        const token = authData.token;
        // 从token中提取用户名（格式：username:timestamp:random）
        const username = token.split(':')[0];
        return username;
    } catch (error) {
        console.error('[AUTH] 获取用户名出错:', error);
        return null;
    }
}

// 退出登录
function logout() {
    // 清除localStorage中的认证数据
    localStorage.removeItem('tranOptimAuth');
    
    // 清除cookie中的认证数据
    document.cookie = 'tranOptimAuth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 重定向到登录页
    redirectToLogin();
}

// 初始化认证检查
function initAuthCheck() {
    console.log('[AUTH] 初始化认证检查');
    
    // 检查配置文件中是否启用了认证
    if (window.AuthConfig && window.AuthConfig.settings.enabled) {
        // 如果未登录，重定向到登录页
        if (!isLoggedIn()) {
            console.log('[AUTH] 用户未登录，重定向到登录页');
            redirectToLogin();
            return false;
        }
        
        // 已登录
        console.log('[AUTH] 用户已登录:', getCurrentUsername());
        return true;
    } else {
        console.log('[AUTH] 认证功能已禁用，跳过检查');
        return true;
    }
}

// 导出工具函数
window.AuthManager = {
    isLoggedIn,
    redirectToLogin,
    getCurrentUsername,
    logout,
    initAuthCheck
}; 