// TranOptim 登录脚本
document.addEventListener('DOMContentLoaded', function() {
    console.log('[AUTH] 登录页面初始化');
    
    // 获取DOM元素
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const errorMessage = document.getElementById('errorMessage');
    
    // 检查是否已经登录，如果是则重定向到主页
    if (isLoggedIn()) {
        console.log('[AUTH] 用户已登录，重定向到首页');
        redirectToHome();
        return;
    }
    
    // 为登录按钮添加点击事件
    loginBtn.addEventListener('click', handleLogin);
    
    // 为输入框添加回车键事件
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
    
    // 登录处理函数
    function handleLogin() {
        // 重置错误信息
        hideError();
        
        // 获取用户输入
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeCheckbox.checked;
        
        // 验证输入
        if (!username) {
            showError('请输入用户名');
            usernameInput.focus();
            return;
        }
        
        if (!password) {
            showError('请输入密码');
            passwordInput.focus();
            return;
        }
        
        // 验证账号密码
        if (validateCredentials(username, password)) {
            // 生成登录Token并存储
            const authToken = generateAuthToken(username);
            saveAuthToken(authToken, rememberMe);
            
            // 登录成功，重定向到首页
            console.log('[AUTH] 登录成功，重定向到首页');
            redirectToHome();
        } else {
            // 登录失败
            showError('用户名或密码错误');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    // 显示错误信息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        
        // 添加抖动效果
        errorMessage.style.animation = 'none';
        setTimeout(() => {
            errorMessage.style.animation = 'shake 0.5s ease-in-out';
        }, 10);
    }
    
    // 隐藏错误信息
    function hideError() {
        errorMessage.textContent = '';
        errorMessage.classList.remove('show');
    }
    
    // 验证用户凭据
    function validateCredentials(username, password) {
        // 从AuthConfig获取用户列表
        const users = window.AuthConfig.users;
        
        // 检查用户名是否存在，并且密码是否匹配
        return users[username] === password;
    }
    
    // 生成认证Token
    function generateAuthToken(username) {
        // 获取当前时间戳
        const timestamp = new Date().getTime();
        // 生成简单的Token（用户名 + 时间戳 + 随机字符串）
        const randomStr = Math.random().toString(36).substring(2);
        // 基本Token
        const token = `${username}:${timestamp}:${randomStr}`;
        
        return token;
    }
    
    // 保存认证Token
    function saveAuthToken(token, rememberMe) {
        // 计算过期时间
        const expiryTime = new Date().getTime() + window.AuthConfig.settings.sessionTimeout;
        
        // 创建认证数据对象
        const authData = {
            token: token,
            expiryTime: expiryTime
        };
        
        // 存储到localStorage
        localStorage.setItem('tranOptimAuth', JSON.stringify(authData));
        
        // 如果"记住我"被勾选，还可以存储到cookie以提高持久性
        if (rememberMe) {
            const cookieExpiry = new Date();
            cookieExpiry.setTime(expiryTime);
            document.cookie = `tranOptimAuth=${encodeURIComponent(JSON.stringify(authData))};expires=${cookieExpiry.toUTCString()};path=/`;
        }
    }
});

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

// 重定向到首页
function redirectToHome() {
    window.location.href = 'index.html';
} 