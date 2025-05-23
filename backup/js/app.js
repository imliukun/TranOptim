// TranOptim - 智能翻译与润色工具 JavaScript
console.log('[DEBUG] TranOptim app.js script started loading!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOMContentLoaded event fired in app.js. Initializing app...');

    // 获取DOM元素 - 通用元素
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const loadingOverlay = document.getElementById('loading-overlay');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    // （已移除API密钥相关元素）
    let apiKeyModal = document.getElementById('api-key-modal');
    let apiKeyInput = document.getElementById('api-key-input');
    
    // 如果设置区域不存在，则创建
    if (!document.querySelector('.api-settings')) {
        // （已移除API密钥和代理按钮创建）
    }
    
    // 重新获取按钮引用
    // 已移除API密钥和代理相关按钮，无需事件绑定
    
    // 修改加载提示文本
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector('p') || document.createElement('p');
        loadingText.textContent = '正在处理，请稍候...';
        if (!loadingOverlay.contains(loadingText)) {
            loadingOverlay.appendChild(loadingText);
        }
    }
    
    // 全局安全超时机制：确保页面上的任何加载提示在5秒后自动消失
    // 这是为了防止加载状态卡住的情况
    setTimeout(() => {
        console.log('[安全检查] 检查是否有未清除的加载状态...');
        checkAndClearLoadingStates();
    }, 5000);
    
    // 每30秒执行一次安全检查，确保界面不会卡在加载状态
    setInterval(checkAndClearLoadingStates, 30000);
    
    // 安全检查函数：检查并清除所有加载状态
    function checkAndClearLoadingStates() {
        // 检查并清除全局加载遮罩
        if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
            console.log('[安全机制] 检测到遗留的全局加载遮罩，正在清除...');
            hideLoadingOverlay();
            showNotification('加载状态已自动重置', 'info');
        }
        
        // 检查并清除中心加载提示
        const centerLoader = document.querySelector('.center-loading');
        if (centerLoader) {
            console.log('[安全机制] 检测到遗留的中心加载提示，正在清除...');
            hideCenterLoading();
        }
        
        // 重置所有加载状态的按钮
        const loadingButtons = document.querySelectorAll('.loading');
        if (loadingButtons.length > 0) {
            console.log('[安全机制] 检测到处于加载状态的按钮，正在重置...');
            loadingButtons.forEach(btn => {
                btn.classList.remove('loading');
                btn.disabled = false;
            });
        }
        
        console.log('[安全检查] 加载状态检查完成');
    }
    
    // （已移除代理设置模态框相关代码）
    if (!document.getElementById('proxy-modal')) {
        const proxyModal = document.createElement('div');
        proxyModal.id = 'proxy-modal';
        proxyModal.className = 'modal';
        proxyModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>网络代理设置</h2>
                    <span class="close" id="closeProxyModal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="proxy-info">
                        <p><i class="fas fa-info-circle"></i> 如果您的网络环境无法直接访问OpenAI或Google Gemini等服务，可以配置代理服务器。</p>
                        <p class="tip">提示: 代理配置是所有翻译服务共用的，如果配置错误可能会导致所有服务都无法使用。</p>
                    </div>
                    <form class="api-key-form">
                        <label class="proxy-switch">
                            <input type="checkbox" id="enable-proxy">
                            <span class="switch-text">启用代理服务器</span>
                        </label>
                        <div class="proxy-host-container">
                            <label for="proxy-host">代理服务器地址:</label>
                            <input type="text" id="proxy-host" placeholder="例如: http://127.0.0.1:7890">
                            <div class="help-text">
                                <p>格式示例: <code>http://127.0.0.1:7890</code> 或 <code>http://username:password@127.0.0.1:7890</code></p>
                                <p>常见代理软件默认地址：</p>
                                <ul>
                                    <li>Clash: <code>http://127.0.0.1:7890</code></li>
                                    <li>v2rayN: <code>http://127.0.0.1:10809</code></li>
                                    <li>Shadowsocks: <code>http://127.0.0.1:1080</code></li>
                                </ul>
                            </div>
                        </div>
                        <div class="proxy-test-container">
                            <button type="button" id="test-proxy-btn" class="btn btn-secondary">测试代理连接</button>
                            <span id="test-result"></span>
                        </div>
                        <div class="buttons">
                            <button type="button" id="save-proxy-btn" class="btn btn-primary">保存设置</button>
                            <button type="button" id="cancel-proxy-btn" class="btn btn-secondary">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(proxyModal);
    }
    
    // 获取DOM元素 - 输入区域
    const uploadArea = document.getElementById('upload-area');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const translateBtn = document.getElementById('translate-btn');
    const sourceText = document.getElementById('source-text');
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    
    // 获取DOM元素 - 结果区域
    const resultContent = document.getElementById('result-content');
    const resultDisplayArea = document.getElementById('result-display-area');
    const editText = document.getElementById('edit-text');
    const copyResultBtn = document.getElementById('copy-result');
    const editResultBtn = document.getElementById('edit-result-btn');
    const polishResultBtn = document.getElementById('polish-result-btn');
    
    // 获取DOM元素 - 润色区域
    const polishOptionsArea = document.getElementById('polish-options-area');
    const startPolishBtn = document.getElementById('start-polish-btn');
    const polishResultArea = document.getElementById('polish-result-area');
    const polishResult = document.getElementById('polish-result');
    const copyPolishResultBtn = document.getElementById('copy-polish-result');
    
    // 获取部分标签元素
    const sectionLabels = document.querySelectorAll('.section-label');
    
    // 初始化状态
    let currentMode = 'translate'; // translate, edit, polish
    let translationResult = '';
    
    // 部分标签切换功能
    sectionLabels.forEach(label => {
        label.addEventListener('click', () => {
            const sectionId = label.id.split('-')[1]; // 获取部分ID: translate, edit, polish
            
            // 更新活动标签
            sectionLabels.forEach(l => l.classList.remove('active'));
            label.classList.add('active');
            
            // 切换模式
            switchMode(sectionId);
        });
    });
    
    // 标签页切换功能
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // 更新活动标签按钮
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新活动内容区域
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-input`).classList.add('active');
        });
    });
    
    // 图片上传功能 - 添加存在性检查
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            imageUpload.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('active');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('active');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('active');
            
            if (e.dataTransfer.files.length) {
                handleImageUpload(e.dataTransfer.files[0]);
            }
        });
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleImageUpload(e.target.files[0]);
            }
        });
    }
    
    function handleImageUpload(file) {
        if (!file.type.match('image.*')) {
            showNotification('请上传图片文件');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            uploadArea.classList.add('hidden');
            imagePreview.classList.remove('hidden');
            
            // 创建图片预览
            imagePreview.innerHTML = `
                <div class="preview-container">
                    <img src="${e.target.result}" alt="上传的图片">
                    <button class="remove-btn" title="移除图片">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="image-info">图片已上传，点击翻译按钮开始处理</p>
            `;
            
            // 添加移除图片的功能
            const removeBtn = imagePreview.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                imagePreview.classList.add('hidden');
                uploadArea.classList.remove('hidden');
                imageUpload.value = '';
            });
        };
        
        reader.readAsDataURL(file);
    }
    
    // 显示通知函数
    function showNotification(message, target = null, type = 'success') {
        // 如果提供了目标元素（例如按钮），则在目标元素旁显示通知
        if (target && target instanceof HTMLElement) {
            // 检查元素上是否已经有通知，如果有则删除
            const existingNotification = target.querySelector('.button-notification');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            // 创建新的通知元素
            const buttonNotification = document.createElement('div');
            buttonNotification.className = 'button-notification';
            buttonNotification.textContent = message;
            
            // 添加到目标元素
            target.appendChild(buttonNotification);
            
            // 显示通知
            setTimeout(() => {
                buttonNotification.classList.add('show');
            }, 10);
            
            // 3秒后自动隐藏
            setTimeout(() => {
                buttonNotification.classList.remove('show');
                // 动画完成后移除元素
                setTimeout(() => {
                    buttonNotification.remove();
                }, 300);
            }, 2000);
        } else {
            // 使用全局通知（居中显示）
            if (!notification) return;
            
            // 更新通知样式
            notification.className = 'notification';
            notification.classList.add('show');
            notification.classList.add(`notification-${type}`);
            
            if (notificationMessage) {
                notificationMessage.textContent = message;
            } else {
                notification.textContent = message;
            }
            
            setTimeout(() => {
                notification.classList.remove('show');
                // 延迟后移除类型样式
                setTimeout(() => {
                    notification.classList.remove(`notification-${type}`);
                }, 300);
            }, 3000);
        }
    }
    
    // 加载覆盖层操作
    function showLoadingOverlay(message = '正在处理中，请稍候...') {
        if (loadingOverlay) {
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.textContent = message;
            }
            
            loadingOverlay.classList.remove('hidden');
        }
    }
    
    function hideLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
    
    // 创建中心加载提示函数
    function showCenterLoading(message, details = '', showNetworkStatus = true) {
        // 删除任何现有的中心加载提示
        const existingLoader = document.querySelector('.center-loading');
        if (existingLoader) {
            document.body.removeChild(existingLoader);
        }
        
        // 创建新的中心加载提示
        const centerLoader = document.createElement('div');
        centerLoader.className = 'center-loading';
        centerLoader.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-message">
                <p>${message || '正在处理，请稍候...'}</p>
                ${details ? `<p class="loading-details">${details}</p>` : ''}
                ${showNetworkStatus ? `<p class="network-status" id="network-status">检查网络连接...</p>` : ''}
            </div>
        `;
        document.body.appendChild(centerLoader);
        
        // 如果需要显示网络状态，开始检查并更新
        if (showNetworkStatus) {
            updateNetworkStatus();
        }
        
        return centerLoader;
    }

    // 更新网络连接状态信息
    function updateNetworkStatus() {
        const statusElement = document.getElementById('network-status');
        if (!statusElement) return;
        
        // 检查网络连接状态
        if (!navigator.onLine) {
            statusElement.textContent = '⚠️ 离线状态，请检查网络连接';
            statusElement.style.color = '#e53e3e';
            return;
        }
        
        // 测试与主要API服务的连接
        const services = [
            { name: 'OpenAI', url: 'https://api.openai.com/healthz' },
            { name: 'Google', url: 'https://generativelanguage.googleapis.com/' }
        ];
        
        let testedCount = 0;
        statusElement.textContent = '正在测试网络连接...';
        
        services.forEach(service => {
            // 使用fetch API检测连接状态，但设置较短的超时时间
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            fetch(service.url, { 
                method: 'HEAD',
                mode: 'no-cors', // 允许跨域请求，但无法获取响应内容
                signal: controller.signal 
            })
            .then(() => {
                clearTimeout(timeoutId);
                testedCount++;
                if (testedCount === services.length && statusElement) {
                    statusElement.textContent = '✅ 网络连接正常';
                    statusElement.style.color = '#38a169';
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                testedCount++;
                console.log(`${service.name} 连接测试失败:`, error);
                
                if (statusElement) {
                    if (error.name === 'AbortError') {
                        statusElement.textContent = `⚠️ ${service.name} 服务响应缓慢，可能需要使用代理`;
                    } else {
                        statusElement.textContent = `⚠️ ${service.name} 连接不畅，建议使用代理`;
                    }
                    statusElement.style.color = '#dd6b20';
                }
            });
        });
        
        // 60秒后自动清除状态信息（如果加载时间过长）
        setTimeout(() => {
            if (statusElement && document.body.contains(statusElement)) {
                statusElement.textContent = '请耐心等待，或检查代理设置...';
                statusElement.style.color = '#718096';
            }
        }, 60000);
    }

    // 隐藏中心加载提示函数
    function hideCenterLoading() {
        const centerLoader = document.querySelector('.center-loading');
        if (centerLoader) {
            // 添加淡出动画
            centerLoader.style.animation = 'fadeOut 0.3s ease forwards';
            
            // 动画结束后移除元素
            setTimeout(() => {
                if (centerLoader.parentNode) {
                    centerLoader.parentNode.removeChild(centerLoader);
                }
            }, 300);
        }
    }
    
    // 复制文本到剪贴板函数
    function copyTextToClipboard(text) {
        const tempElement = document.createElement('textarea');
        tempElement.value = text;
        document.body.appendChild(tempElement);
        tempElement.select();
        document.execCommand('copy');
        document.body.removeChild(tempElement);
    }
    
    // 导出为全局函数，使其它脚本可以使用
    window.showNotification = showNotification;
    window.showLoadingOverlay = showLoadingOverlay;
    window.hideLoadingOverlay = hideLoadingOverlay;
    window.showCenterLoading = showCenterLoading;
    window.hideCenterLoading = hideCenterLoading;
    window.copyTextToClipboard = copyTextToClipboard;

    if (apiKeyModal) {
        apiKeyModal.classList.add('hidden');
    }
});

// 添加页面加载和卸载事件处理
window.addEventListener('load', function() {
    console.log('[页面加载] 页面完全加载，确保清除所有加载状态');
    // 页面加载完成时，检查并清除所有加载状态
    if (typeof checkAndClearLoadingStates === 'function') {
        checkAndClearLoadingStates();
    }
});

window.addEventListener('beforeunload', function() {
    console.log('[页面卸载] 准备离开页面，清除所有加载状态');
    // 尝试清除已知的加载状态元素
    try {
        // 获取DOM元素 - 可能不存在，所以用try-catch包裹
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        
        const centerLoader = document.querySelector('.center-loading');
        if (centerLoader && centerLoader.parentNode) {
            centerLoader.parentNode.removeChild(centerLoader);
        }
    } catch (e) {
        console.error('[页面卸载] 清除加载状态出错:', e);
    }
});

// 获取认证Token - 添加到现有API请求头
function getAuthToken() {
    const authDataStr = localStorage.getItem('tranOptimAuth');
    if (!authDataStr) {
        return null;
    }
    
    try {
        const authData = JSON.parse(authDataStr);
        return authData.token;
    } catch (error) {
        console.error('[AUTH] 获取认证Token出错:', error);
        return null;
    }
}

// 修改API请求函数，添加认证头
function getRequestHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 如果存在认证Token，添加到请求头
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// 更新API请求的fetch调用，使用认证头
function callApi(url, data) {
    // 获取实际API URL（处理Cloudflare部署）
    const apiUrl = window.CloudflareConfig && window.CloudflareConfig.isCloudflare 
        ? window.CloudflareConfig.getApiUrl(url) 
        : url;
    
    return fetch(apiUrl, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(data)
    })
    .then(response => {
        // 处理401未授权响应
        if (response.status === 401) {
            // 如果存在AuthManager，则重定向到登录页
            if (window.AuthManager) {
                console.error('[AUTH] API请求未授权，重定向到登录页');
                window.AuthManager.redirectToLogin();
                throw new Error('未授权访问，请先登录');
            }
        }
        return response.json();
    });
}