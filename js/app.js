// TranOptim - 智能翻译与润色工具 JavaScript
console.log('[DEBUG] TranOptim app.js script started loading!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOMContentLoaded event fired. Initializing app...');

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
    
    // 图片上传功能
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
    
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
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

    // 显示全局加载遮罩函数
    function showLoadingOverlay(message = '正在处理，请稍候...') {
        if (loadingOverlay) {
            const messageElement = loadingOverlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            } else {
                const newMessage = document.createElement('p');
                newMessage.textContent = message;
                loadingOverlay.appendChild(newMessage);
            }
            loadingOverlay.classList.remove('hidden');
        }
    }

    // 隐藏全局加载遮罩函数
    function hideLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    // 翻译功能
    translateBtn.addEventListener('click', () => {
        // 获取当前活动的输入类型
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        
        // 获取选中的翻译服务 (注意 name 属性已改为 translate-service)
        const selectedService = document.querySelector('input[name="translate-service"]:checked').value;
        
        // 获取源语言和目标语言
        const fromLang = sourceLang.value;
        const toLang = targetLang.value;
        
        // 检查输入
        if (activeTab === 'text' && !sourceText.value.trim()) {
            showNotification('请输入需要翻译的文本');
            return;
        }
        
        if (activeTab === 'image' && imagePreview.classList.contains('hidden')) {
            showNotification('请上传需要翻译的图片');
            return;
        }
        
        // 添加加载状态到按钮
        translateBtn.classList.add('loading');
        translateBtn.disabled = true;
        
        // 显示中心加载提示
        const serviceName = getServiceDisplayName(selectedService);
        const fromLangName = getLanguageName(fromLang);
        const toLangName = getLanguageName(toLang);
        
        // 根据服务类型决定是否显示网络状态
        // 对于OpenAI和Gemini这样需要国际网络的服务，显示网络连接状态
        const needsNetworkCheck = ['gpt', 'gemini'].includes(selectedService);
        
        showCenterLoading(
            `正在使用${serviceName}翻译`, 
            `从 ${fromLangName} 到 ${toLangName}`,
            needsNetworkCheck // 只在OpenAI和Gemini服务时显示网络状态
        );
        
        // 不显示全局加载遮罩，改用中心加载提示
        // loadingOverlay.classList.remove('hidden');
        
        // 准备请求数据
        let requestData = {};
        let endpoint = '';
        
        if (activeTab === 'text') {
            // 文本翻译请求
            requestData = {
                text: sourceText.value.trim(),
                sourceLang: fromLang,
                targetLang: toLang,
                service: selectedService
            };
            endpoint = '/api/translate/text';
        } else {
            // 图片翻译请求 - 需要使用FormData
            const formData = new FormData();
            formData.append('image', imageUpload.files[0]);
            formData.append('sourceLang', fromLang);
            formData.append('targetLang', toLang);
            formData.append('service', selectedService);
            
            requestData = formData;
            endpoint = '/api/translate/image';
        }
        
        // 发送API请求
        if (activeTab === 'text') {
            // 文本翻译 - 使用JSON
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => response.json())
            .then(data => handleTranslationResponse(data, activeTab))
            .catch(error => {
                console.error('翻译请求失败:', error);
                showNotification('翻译失败: ' + error.message, 'error');
                
                // 移除加载状态
                removeLoadingElements();
            });
        } else {
            // 图片翻译 - 使用FormData
            fetch(endpoint, {
                method: 'POST',
                body: requestData // FormData不需要设置Content-Type
            })
            .then(response => response.json())
            .then(data => handleTranslationResponse(data, activeTab))
            .catch(error => {
                console.error('图片翻译请求失败:', error);
                showNotification('图片翻译失败: ' + error.message, 'error');
                
                // 移除加载状态
                removeLoadingElements();
            });
        }
    });
    
    // 处理翻译响应
    function handleTranslationResponse(data, activeTab) {
        // 缩短安全超时时间并增加日志
        const safetyTimeout = setTimeout(() => {
            console.log('安全超时触发：强制移除加载状态');
            removeLoadingElements();
            showNotification('请求处理时间过长，已自动停止等待', 'warning');
        }, 3000); // 从5000减少到3000毫秒

        try {
            console.log('翻译响应:', data);
            
            // 检查各种可能的错误格式
            if (!data) {
                throw new Error('服务器返回了空响应');
            }
            
            if (data.error && !data.result) {
                throw new Error(data.error);
            }
            
            // 检查响应中是否包含result对象
            if (!data.result) {
                // 兼容直接返回结果对象的情况
                if (data.translatedText || data.originalText) {
                    data = { result: data };
                    console.log('已将直接结果转换为标准格式:', data);
                } else {
                    throw new Error('响应中缺少result字段');
                }
            }
            
            let result = '';
            
            if (activeTab === 'text' && data.result) {
                // 构建文本翻译结果HTML
                const serviceInfo = data.result.service || getServiceDisplayName(data.result.service);
                const fromLang = data.result.fromLang || sourceLang.value;
                const toLang = data.result.toLang || targetLang.value;
                
                // 从服务名称中提取服务代码
                let serviceCode = getServiceCodeFromName(data.result.service);
                
                // 添加错误提示样式
                const errorClass = data.result.error ? 'error-result' : '';
                
                result = `<div class="translation-result ${errorClass}">
                            <div class="service-info">
                                <span>${getServiceEmoji(serviceCode)} 由 ${serviceInfo} 提供的翻译</span>
                                <span class="lang-info">${getLanguageName(fromLang)} → ${getLanguageName(toLang)}</span>
                            </div>
                            <div class="translated-text">
                                ${data.result.translatedText}
                            </div>
                          </div>`;
                
                // 保存纯文本结果用于后续步骤
                translationResult = data.result.translatedText;
                
                // 如果有错误但依然有结果，显示一个通知
                if (data.result.error) {
                    showNotification(data.result.translatedText, 'warning');
                }
            } else if (activeTab === 'image' && data.result) {
                // 从服务名称中提取服务代码
                let serviceCode = getServiceCodeFromName(data.result.service);
                
                // 添加错误提示样式
                const errorClass = data.result.error ? 'error-result' : '';
                
                // 构建图片翻译结果HTML
                result = `<div class="result-image-text ${errorClass}">
                            <div class="service-info">
                                <span>${getServiceEmoji(serviceCode)} 由 ${data.result.service} 提供的翻译</span>
                            </div>
                            <p><strong>从图片中提取的文本:</strong></p>
                            <p>${data.result.originalText || '无法提取文本'}</p>
                            <hr>
                            <p><strong>翻译结果:</strong></p>
                            <p>${data.result.translatedText || '翻译失败'}</p>
                          </div>`;
                
                // 保存图片翻译结果
                translationResult = data.result.translatedText;
                
                // 如果有错误但依然有结果，显示一个通知
                if (data.result.error) {
                    showNotification(data.result.translatedText, 'warning');
                }
            } else {
                throw new Error('无法解析翻译结果');
            }
            
            // 更新结果区域
            resultContent.innerHTML = result;
            
            // 启用编辑和润色按钮
            editResultBtn.disabled = false;
            polishResultBtn.disabled = false;
            
            // 显示成功通知，但如果有错误就跳过
            if (!data.result?.error) {
                showNotification('翻译完成！');
            }
        } catch (error) {
            console.error('处理翻译响应错误:', error);
            showNotification('处理翻译结果失败: ' + error.message, 'error');
            
            // 设置错误结果
            resultContent.innerHTML = `<div class="error-result">
                                        <p><i class="fas fa-exclamation-circle"></i> 翻译失败</p>
                                        <p class="error-message">${error.message}</p>
                                      </div>`;
        } finally {
            // 清除安全超时
            clearTimeout(safetyTimeout);
            
            // 移除加载状态 - 无论成功还是失败都执行
            removeLoadingElements();
            
            // 再次确保中心加载提示被移除 (双重保障)
            hideCenterLoading();
            // 再次确保全局加载提示被移除 (双重保障)
            hideLoadingOverlay();
            
            console.log('处理完成：所有加载状态已移除');
        }
    }
    
    // 移除加载元素
    function removeLoadingElements() {
        // 移除按钮的加载状态
        translateBtn.classList.remove('loading');
        translateBtn.disabled = false;
        
        // 移除中心加载提示
        hideCenterLoading();
        
        // 隐藏全局加载动画
        hideLoadingOverlay();
    }
    
    // 获取语言名称
    function getLanguageName(langCode) {
        const langNames = {
            'zh': '中文',
            'en': '英文',
            'ja': '日文',
            'ko': '韩文',
            'fr': '法文',
            'de': '德文',
            'es': '西班牙文',
            'ru': '俄文',
            'auto': '自动检测'
        };
        return langNames[langCode] || langCode;
    }
    
    // 点击翻译结果区域直接进入编辑模式
    resultContent.addEventListener('click', () => {
        if (resultContent.textContent !== '翻译结果将显示在这里...' && !resultContent.classList.contains('hidden')) {
            switchToEditMode();
        }
    });
    
    // 编辑按钮功能
    editResultBtn.addEventListener('click', () => {
        switchToEditMode();
    });
    
    // 润色按钮功能
    polishResultBtn.addEventListener('click', () => {
        switchToPolishMode();
    });
    
    // 复制结果功能
    copyResultBtn.addEventListener('click', () => {
        if (resultContent.textContent === '翻译结果将显示在这里...') {
            return;
        }
        
        copyTextToClipboard(resultContent.textContent);
        showNotification('已复制到剪贴板！');
    });
    
    // 复制润色结果功能
    copyPolishResultBtn.addEventListener('click', () => {
        if (polishResult.textContent === '润色结果将显示在这里...') {
            return;
        }
        
        copyTextToClipboard(polishResult.textContent);
        showNotification('已复制到剪贴板！');
    });
    
    // 开始润色按钮点击事件
    startPolishBtn.addEventListener('click', function() {
        console.log('--- 双重润色请求开始 ---');
        // 获取要润色的文本
        const textToPolish = editText.value || translationResult;
        
        // 检查文本是否为空
        if (!textToPolish.trim()) {
            showNotification('请先输入或翻译内容');
            return;
        }
        
        // 获取选中的润色服务
        const selectedService = document.querySelector('input[name="polish-service"]:checked').value;
        
        // 添加加载效果
        startPolishBtn.disabled = true;
        
        // 显示中心加载提示
        const serviceName = getServiceDisplayName(selectedService);
        
        // 根据服务类型决定是否显示网络状态
        const needsNetworkCheck = ['gpt', 'gemini'].includes(selectedService);
        
        showCenterLoading(
            `正在使用${serviceName}润色文本`,
            `同时生成两种风格的润色结果`,
            needsNetworkCheck
        );
        
        // 显示结果区域但先清空
        polishResultArea.classList.remove('hidden');
        polishResult.innerHTML = '<div class="loading-placeholder">正在润色文本，请稍候...</div>';
        
        // 准备请求数据
        const requestData = {
            text: textToPolish,
            service: selectedService
        };
        
        // 添加安全超时，确保加载提示最终会被移除
        const safetyTimeout = setTimeout(() => {
            console.log('润色安全超时触发：强制移除加载状态');
            startPolishBtn.disabled = false;
            hideCenterLoading();
            showNotification('润色请求处理时间过长，已自动停止等待', 'warning');
        }, 10000); // 10秒超时（因为现在处理两种润色结果需要更多时间）

        // 发送润色请求到新的双重润色接口
        fetch('/api/polish/dual', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('双重润色响应:', data);
            
            // 清除安全超时
            clearTimeout(safetyTimeout);
            
            // 移除加载状态
            startPolishBtn.disabled = false;
            hideCenterLoading();
            
            // 检查响应
            if (data.error && !data.result) {
                // 显示错误
                polishResult.innerHTML = `
                    <div class="error-result">
                        <p><i class="fas fa-exclamation-circle"></i> 润色失败</p>
                        <p class="error-message">${data.error}</p>
                    </div>
                `;
                showNotification('润色失败: ' + data.error);
                return;
            }
            
            if (!data.result) {
                polishResult.innerHTML = `
                    <div class="error-result">
                        <p><i class="fas fa-exclamation-circle"></i> 润色失败</p>
                        <p class="error-message">服务器返回了空结果</p>
                    </div>
                `;
                showNotification('润色失败: 服务器返回了空结果');
                return;
            }
            
            // 显示双重润色结果
            displayDualPolishResult(
                data.result.originalText, 
                data.result.normalText, 
                data.result.rephraseText, 
                data.result.service
            );
            
            // 显示成功通知
            showNotification('双重润色完成！');
        })
        .catch(error => {
            console.error('润色请求失败:', error);
            
            // 清除安全超时
            clearTimeout(safetyTimeout);
            
            // 移除加载状态
            startPolishBtn.disabled = false;
            hideCenterLoading();
            
            // 显示错误
            polishResult.innerHTML = `
                <div class="error-result">
                    <p><i class="fas fa-exclamation-circle"></i> 润色请求失败</p>
                    <p class="error-message">${error.message}</p>
                </div>
            `;
            
            showNotification('润色失败: ' + error.message);
        })
        .finally(() => {
            // 再次确保加载状态被清除（双重保障）
            startPolishBtn.disabled = false;
            hideCenterLoading();
            console.log('润色处理完成：所有加载状态已移除');
        });
    });
    
    // 获取润色风格名称
    function getPolishStyleName(styleCode) {
        const styleNames = {
            'normal': '常规优化',
            'rephrase': '转换语言风格',
            'professional': '专业正式',
            'creative': '创意活泼',
            'academic': '学术严谨',
            'simple': '简洁明了'
        };
        return styleNames[styleCode] || styleCode;
    }
    
    // 获取服务显示名称
    function getServiceDisplayName(serviceCode) {
        const serviceNames = {
            'gpt': 'ChatGPT',
            'gemini': 'Google Gemini',
            'deepseek': 'DeepSeek-R1',
            'qwen': 'Qwen2.5',
            'doubao': '豆包1.5-Pro',
            'volcengine': '火山引擎'
        };
        return serviceNames[serviceCode] || serviceCode;
    }
    
    // 从服务名称中提取服务代码
    function getServiceCodeFromName(serviceName) {
        if (!serviceName) return 'unknown';
        
        const name = serviceName.toLowerCase();
        if (name.includes('gpt') || name.includes('chatgpt')) return 'gpt';
        if (name.includes('gemini')) return 'gemini';
        if (name.includes('deepseek')) return 'deepseek';
        if (name.includes('qwen') || name.includes('通义千问')) return 'qwen';
        if (name.includes('doubao') || name.includes('豆包')) return 'doubao';
        if (name.includes('volc') || name.includes('火山')) return 'volcengine';
        
        return 'unknown';
    }
    
    // 获取服务表情符号
    function getServiceEmoji(serviceCode) {
        const serviceEmojis = {
            'gpt': '🤖',
            'gemini': '💎',
            'deepseek': '🔍',
            'qwen': '🧠',
            'doubao': '📚',
            'volcengine': '🌋'
        };
        return serviceEmojis[serviceCode] || '🌐';
    }
    
    // 模式切换函数
    function switchMode(mode) {
        currentMode = mode;
        
        switch (mode) {
            case 'translate':
                // 显示翻译结果，隐藏编辑区域和润色选项
                if (resultContent.innerHTML !== '<p class="placeholder-text">翻译结果将显示在这里...</p>') {
                    resultContent.classList.remove('hidden');
                }
                editText.classList.add('hidden');
                polishOptionsArea.classList.add('hidden');
                polishResultArea.classList.add('hidden');
                break;
                
            case 'edit':
                switchToEditMode();
                break;
                
            case 'polish':
                switchToPolishMode();
                break;
        }
    }
    
    // 切换到编辑模式
    function switchToEditMode() {
        // 激活编辑标签
        sectionLabels.forEach(l => l.classList.remove('active'));
        document.getElementById('section-edit').classList.add('active');
        
        // 隐藏翻译结果，显示编辑区域
        resultContent.classList.add('hidden');
        editText.classList.remove('hidden');
        
        // 隐藏润色选项和结果
        polishOptionsArea.classList.add('hidden');
        polishResultArea.classList.add('hidden');
        
        // 如果编辑区域为空，填入翻译结果
        if (!editText.value.trim()) {
            editText.value = translationResult;
        }
        
        // 聚焦编辑区域
        editText.focus();
        
        // 更新当前模式
        currentMode = 'edit';
    }
    
    // 切换到润色模式
    function switchToPolishMode() {
        // 激活润色标签
        sectionLabels.forEach(l => l.classList.remove('active'));
        document.getElementById('section-polish').classList.add('active');
        
        // 获取当前文本内容
        let textToPolish = '';
        
        if (!editText.classList.contains('hidden')) {
            // 如果编辑区域可见，使用编辑区域的内容
            textToPolish = editText.value.trim();
        } else {
            // 否则使用翻译结果
            textToPolish = translationResult;
        }
        
        // 如果没有内容，切换到编辑模式
        if (!textToPolish) {
            showNotification('请先输入或翻译内容');
            switchToEditMode();
            return;
        }
        
        // 保存当前编辑内容
        editText.value = textToPolish;
        translationResult = textToPolish;
        
        // 显示润色选项，隐藏其他区域
        resultContent.classList.add('hidden');
        editText.classList.add('hidden');
        polishOptionsArea.classList.remove('hidden');
        
        // 更新当前模式
        currentMode = 'polish';
    }
    
    // 显示通知函数
    function showNotification(message, type = 'success') {
        notificationMessage.textContent = message;
        
        // 更新通知样式
        notification.className = 'notification';
        notification.classList.add('show');
        notification.classList.add(`notification-${type}`);
        
        setTimeout(() => {
            notification.classList.remove('show');
            // 延迟后移除类型样式
            setTimeout(() => {
                notification.classList.remove(`notification-${type}`);
            }, 300);
        }, 3000);
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
    
    // 从HTML中提取纯文本
    function getPlainTextFromHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }
    
    // 模拟翻译功能
    function simulateTranslation(text, service, fromLang, toLang) {
        // 这里只是模拟，实际应用中应该调用相应的API
        const serviceEmojis = {
            'ChatGPT': '🤖',
            'Gemini': '💎',
            'Claude': '🧠'
        };
        
        const langNames = {
            'zh': '中文',
            'en': '英文',
            'ja': '日文',
            'ko': '韩文',
            'fr': '法文',
            'de': '德文',
            'es': '西班牙文',
            'ru': '俄文',
            'auto': '自动检测'
        };
        
        // 简单的英文翻译模拟
        let translatedText = '';
        if (text.match(/[\u4e00-\u9fa5]/) && toLang === 'en') {
            // 如果输入包含中文字符且目标语言是英文
            translatedText = 'This is a simulated translation of the Chinese text you entered. In a real application, this would be the actual translation provided by ' + service + '.'
        } else if (!text.match(/[\u4e00-\u9fa5]/) && toLang === 'zh') {
            // 如果输入不包含中文字符且目标语言是中文
            translatedText = '这是您输入的英文文本的模拟翻译。在实际应用中，这里将显示由 ' + service + ' 提供的真实翻译。';
        } else {
            // 其他情况
            translatedText = '这是一个模拟的翻译结果。在实际应用中，这里将显示由 ' + service + ' 提供的真实翻译。';
        }
        
        return `<div class="translation-result">
                  <div class="service-info">
                    <span>${serviceEmojis[service] || '🌐'} 由 ${service} 提供的翻译</span>
                    <span class="lang-info">${langNames[fromLang] || fromLang} → ${langNames[toLang] || toLang}</span>
                  </div>
                  <div class="translated-text">
                    ${translatedText}
                  </div>
                </div>`;
    }
    
    // 模拟润色功能
    function simulatePolishing(text, service, style) {
        // 这里只是模拟，实际应用中应该调用相应的API
        const styleDescriptions = {
            'normal': '常规优化',
            'rephrase': '转换语言风格',
            'professional': '专业正式',
            'creative': '创意活泼',
            'academic': '学术严谨',
            'simple': '简洁明了'
        };
        
        const serviceNames = {
            'gpt': 'ChatGPT',
            'gemini': 'Google Gemini',
            'deepseek': 'DeepSeek-R1',
            'qwen': 'Qwen2.5',
            'doubao': '豆包1.5-Pro'
        };
        
        const serviceEmojis = {
            'gpt': '🤖',
            'gemini': '💎',
            'deepseek': '🔍',
            'qwen': '🧠',
            'doubao': '📚'
        };
        
        // 根据不同风格生成不同的润色结果
        let polishedText = '';
        switch (style) {
            case 'normal':
                polishedText = '这是经过常规优化的文本。语言表达更加通俗易懂，朗朗上口，符合中文表达习惯，适合图书出版。';
                break;
            case 'rephrase':
                polishedText = '这是经过语言风格转换的文本。通过改变句式结构、调整主语视角、使用近义词替换等方式，在保持原意的同时提供了全新的表达方式。';
                break;
            case 'professional':
                polishedText = '这是经过专业正式风格润色的文本。语言更加规范，表达更加严谨，适合商务和正式场合使用。';
                break;
            case 'creative':
                polishedText = '这是经过创意活泼风格润色的文本！语言生动有趣，充满创意和活力，让人眼前一亮✨';
                break;
            case 'academic':
                polishedText = '这是经过学术严谨风格润色的文本。遵循学术规范，逻辑严密，论证充分，适合学术论文和研究报告。';
                break;
            case 'simple':
                polishedText = '这是经过简洁明了风格润色的文本。删除冗余词汇，直击要点，清晰易懂。';
                break;
            default:
                polishedText = '这是经过润色的文本。在实际应用中，这里将显示真实的润色结果。';
        }
        
        return `<div class="polishing-result">
                  <div class="service-info">
                    <span>${serviceEmojis[service] || '🌐'} 由 ${serviceNames[service] || service} 提供的${styleDescriptions[style] || ''}润色</span>
                  </div>
                  <div class="original-text">
                    <h4>原文：</h4>
                    <p>${text}</p>
                  </div>
                  <div class="polished-text">
                    <h4>润色后：</h4>
                    <p>${polishedText}</p>
                  </div>
                </div>`;
    }

    // 显示双重润色结果函数
    function displayDualPolishResult(originalText, normalText, rephraseText, service) {
        console.log('[displayDualPolishResult] 开始显示双重润色结果');
        
        // 安全检查
        if (normalText === undefined || normalText === null) {
            normalText = '常规润色过程出错，请重试';
        }
        
        if (rephraseText === undefined || rephraseText === null) {
            rephraseText = '风格转换过程出错，请重试';
        }
        
        // 确保是字符串
        if (typeof normalText !== 'string') normalText = String(normalText);
        if (typeof rephraseText !== 'string') rephraseText = String(rephraseText);
        
        // 获取服务中文名称
        let serviceName = getServiceDisplayName(service);
        
        // 构建结果HTML - 同时显示两种风格的润色结果
        let resultHTML = `
            <div class="service-info">
                <span class="service-name"><i class="fas fa-robot"></i> 由 ${serviceName} 提供的润色</span>
            </div>
            <div class="original-content">
                <div class="content-header">原文：</div>
                <div class="content-body">${originalText}</div>
            </div>
            <div class="polish-results">
                <div class="result-group">
                    <div class="content-header"><i class="fas fa-sparkles"></i> 常规优化：</div>
                    <div class="content-body">${normalText}</div>
                </div>
                <div class="result-group">
                    <div class="content-header"><i class="fas fa-random"></i> 转换语言风格：</div>
                    <div class="content-body">${rephraseText}</div>
                </div>
            </div>
        `;
        
        try {
            // 设置润色结果内容
            document.getElementById('polish-result').innerHTML = resultHTML;
            
            // 显示润色结果区域
            document.getElementById('polish-result-area').classList.remove('hidden');
            console.log('[displayDualPolishResult] HTML 设置成功');
        } catch (e) {
            console.error('[displayDualPolishResult] 设置 innerHTML 失败:', e);
        }
        
        // 隐藏设置区域
        document.getElementById('polish-options-area').classList.add('hidden');
        
        // 滚动到结果区域
        document.getElementById('polish-result-area').scrollIntoView({ behavior: 'smooth' });
        console.log('[displayDualPolishResult] 双重润色结果显示完毕');
    }

    // 显示润色结果函数（保留原函数以便兼容）
    function displayPolishResult(originalText, polishedText, service, style) {
        console.log('[displayPolishResult] 开始显示结果');
        
        // 安全检查
        if (polishedText === undefined || polishedText === null) {
            console.error('[displayPolishResult] 检测到 undefined 或 null，设置为默认错误消息');
            polishedText = '润色过程出错，请重试';
        }
        
        // 确保polishedText是字符串
        if (typeof polishedText !== 'string') {
            polishedText = String(polishedText);
        }
        
        // 获取服务中文名称
        let serviceName = getServiceDisplayName(service);
        
        // 润色风格中文名称
        let styleName = getPolishStyleName(style);
        
        // 构建结果HTML - 仅显示润色后的内容，不显示原文
        let resultHTML = `
            <div class="service-info">
                <span class="service-name"><i class="fas fa-robot"></i> ${serviceName}</span>
                <span class="polish-style"><i class="fas fa-paint-brush"></i> ${styleName}风格</span>
            </div>
            <div class="polished-text">
                <pre>${polishedText}</pre>
            </div>
        `;
        
        try {
            // 设置润色结果内容
            document.getElementById('polish-result').innerHTML = resultHTML;
            
            // 显示润色结果区域
            document.getElementById('polish-result-area').classList.remove('hidden');
            console.log('[displayPolishResult] HTML 设置成功');
        } catch (e) {
            console.error('[displayPolishResult] 设置 innerHTML 失败:', e);
        }
        
        // 隐藏设置区域
        document.getElementById('polish-options-area').classList.add('hidden');
        
        // 滚动到结果区域
        document.getElementById('polish-result-area').scrollIntoView({ behavior: 'smooth' });
        console.log('[displayPolishResult] 结果显示完毕');
    }

    if (apiKeyModal) {
        apiKeyModal.classList.add('hidden');
    }
});

// 初始化设置选项卡显示
function initSettingsTab() {
    // 加载所有API密钥到表单中
    loadAllAPIKeys();
    
    // 检查所有API密钥的状态
    checkAllKeyStatus();
    
    // 加载代理设置
    loadProxySettings();
}

// 加载代理设置
function loadProxySettings() {
    fetch('/api/settings/proxy')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.config) {
                $('#proxy-enabled').prop('checked', data.config.enabled);
                $('#proxy-url').val(data.config.host || '');
            }
        })
        .catch(error => {
            console.error('获取代理设置失败:', error);
        });
}

// 保存代理设置
function saveProxySettings() {
    const enabled = $('#proxy-enabled').is(':checked');
    const host = $('#proxy-url').val().trim();
    
    fetch('/api/settings/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled, host }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('代理设置已保存', 'success');
            } else {
                showNotification('保存代理设置失败: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('保存代理设置失败:', error);
            showNotification('保存代理设置失败: ' + error.message, 'error');
        });
}

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