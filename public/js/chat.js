// TranOptim - 智能翻译与润色工具 聊天界面 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 记录初始化开始
    console.log('初始化聊天界面...');
    
    // 获取DOM元素
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const translateBtn = document.getElementById('translateBtn');
    const polishBtn = document.getElementById('polishBtn');
    const uploadImageBtn = document.getElementById('uploadBtn');
    const imageUpload = document.getElementById('imageUpload');
    const sourceLang = document.getElementById('sourceLanguage');
    const targetLang = document.getElementById('targetLanguage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearChatsBtn = document.getElementById('clearChatsBtn');
    const conversationList = document.getElementById('conversationList');
    
    // 验证关键元素是否存在
    console.log('DOM元素检查：', {
        chatMessages: !!chatMessages,
        chatInput: !!chatInput,
        translateBtn: !!translateBtn,
        polishBtn: !!polishBtn,
        loadingOverlay: !!loadingOverlay
    });
    
    // 获取设置相关元素
    const translateSettingsBtn = document.getElementById('translateSettingsBtn');
    const polishSettingsBtn = document.getElementById('polishSettingsBtn');
    const translateSettingsPanel = document.getElementById('translateSettings');
    const polishSettingsPanel = document.getElementById('polishSettings');
    const closeSettingsBtns = document.querySelectorAll('.close-settings-btn');
    const polishStyle = document.getElementById('polishStyle');
    const polishLanguage = document.getElementById('polishLanguage');
    const customInstructions = document.getElementById('customInstructions');
    
    // 自动调整输入框高度的函数
    function autoResizeInput() {
        if (!chatInput) return;
        
        console.log('调整输入框高度');
        
        // 保存当前滚动位置
        const scrollTop = chatInput.scrollTop;
        
        // 重置高度，以便正确计算
        chatInput.style.height = 'auto';
        
        // 计算新高度 (取内容高度和最小高度中的较大值，但不超过最大高度)
        const minHeight = 40; // 最小高度设为40px
        const scrollHeight = chatInput.scrollHeight;
        const maxHeight = 200; // 最大高度
        
        console.log('输入框滚动高度:', scrollHeight);
        
        // 设置高度
        const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
        chatInput.style.height = newHeight + 'px';
        
        // 如果达到最大高度，允许滚动
        if (newHeight >= maxHeight) {
            chatInput.style.overflowY = 'auto';
            // 恢复滚动位置
            chatInput.scrollTop = scrollTop;
        } else {
            chatInput.style.overflowY = 'hidden';
        }
        
        console.log('新输入框高度:', newHeight, 'px');
    }
    
    // 在输入框内容变化时触发高度调整
    chatInput.addEventListener('input', autoResizeInput);
    
    // 添加更多触发条件
    chatInput.addEventListener('change', autoResizeInput);
    chatInput.addEventListener('focus', autoResizeInput);
    chatInput.addEventListener('paste', function() {
        setTimeout(autoResizeInput, 10);
    });
    chatInput.addEventListener('keydown', function(e) {
        // 对于退格键和删除键，也需要调整高度
        if (e.key === 'Backspace' || e.key === 'Delete') {
            setTimeout(autoResizeInput, 10);
        }
    });
    
    // 在窗口调整大小时也调整高度
    window.addEventListener('resize', autoResizeInput);
    
    // 延迟调用一次以初始化
    setTimeout(autoResizeInput, 100);
    
    // 创建用于显示图片缩略图的容器
    let imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.className = 'image-preview-container';
    imagePreviewContainer.style.display = 'none';
    imagePreviewContainer.innerHTML = `
        <div class="preview-wrapper">
            <img src="" alt="图片预览" class="preview-image">
            <button class="remove-image-btn">
                <i class="bi bi-x-circle"></i>
            </button>
        </div>
    `;
    
    // 在输入框上方插入图片预览容器
    const inputWrapper = document.querySelector('.textarea-wrapper');
    if (inputWrapper) {
        inputWrapper.parentNode.insertBefore(imagePreviewContainer, inputWrapper);
    }
    
    // 获取移除图片按钮
    const removeImageButton = imagePreviewContainer.querySelector('.remove-image-btn');
    
    // 初始化状态
    let currentImageFile = null;
    let messageCounter = 0;
    let conversations = [];
    let currentConversationId = null;
    let activeSettingsPanel = null; // 当前激活的设置面板
    let inputHistory = []; // 移动到这里，解决初始化问题
    let inputHistoryIndex = -1; // 移动到这里，解决初始化问题
    
    // 获取服务表情符号
    function getServiceEmoji(serviceCode) {
        const serviceEmojis = {
            'gpt': '🤖',
            'chatgpt': '🤖',
            'gemini': '💎',
            'deepseek': '🔍',
            'deepseek-r1': '🔍',
            'qwen': '🧠',
            'qwen2.5': '🧠',
            'doubao': '📚',
            '豆包1.5-pro': '📚',
            'volcengine': '🌋'
        };
        return serviceEmojis[serviceCode.toLowerCase()] || '🌐';
    }
    
    // 获取服务的显示名称
    function getServiceDisplayName(serviceCode) {
        const serviceDisplayNames = {
            'gpt': 'ChatGPT',
            'gemini': 'Gemini',
            'deepseek': 'DeepSeek-R1',
            'deepseek-r1': 'DeepSeek-R1',
            'qwen': '通义千问',
            'qwen2.5': '通义千问',
            'doubao': '豆包1.5-Pro',
            '豆包1.5-pro': '豆包1.5-Pro',
            'volcengine': '火山引擎'
        };
        return serviceDisplayNames[serviceCode.toLowerCase()] || serviceCode;
    }
    
    // 获取语言的显示名称
    function getLanguageName(langCode) {
        const languageNames = {
            'zh': '中文',
            'zh-cn': '中文',
            'en': '英文',
            'ja': '日文',
            'ko': '韩文',
            'fr': '法文',
            'de': '德文',
            'es': '西班牙文',
            'ru': '俄文',
            'it': '意大利文',
            'pt': '葡萄牙文',
            'vi': '越南文',
            'ar': '阿拉伯文',
            'auto': '自动检测'
        };
        return languageNames[langCode.toLowerCase()] || langCode;
    }
    
    // 设置按钮点击事件
    translateSettingsBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        e.preventDefault(); // 防止任何默认行为
        toggleSettingsPanel(translateSettingsPanel);
    });
    
    polishSettingsBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 阻止事件冒泡
        e.preventDefault(); // 防止任何默认行为
        toggleSettingsPanel(polishSettingsPanel);
    });
    
    // 关闭设置按钮点击事件
    closeSettingsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllSettingsPanels();
        });
    });
    
    // 点击页面其他地方关闭设置面板
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.settings-panel') && !e.target.closest('.settings-btn')) {
            closeAllSettingsPanels();
        }
    });
    
    // 切换设置面板显示/隐藏
    function toggleSettingsPanel(panel) {
        // 如果当前已有打开的面板，先关闭
        if (activeSettingsPanel && activeSettingsPanel !== panel) {
            activeSettingsPanel.classList.remove('active');
        }
        
        // 切换目标面板的显示状态
        panel.classList.toggle('active');
        
        // 强制重新计算布局，解决某些浏览器的渲染问题
        void panel.offsetWidth;
        
        // 更新当前激活的面板
        activeSettingsPanel = panel.classList.contains('active') ? panel : null;
    }
    
    // 关闭所有设置面板
    function closeAllSettingsPanels() {
        translateSettingsPanel.classList.remove('active');
        polishSettingsPanel.classList.remove('active');
        activeSettingsPanel = null;
    }
    
    // 剪贴板粘贴功能 - 新增
    chatInput.addEventListener('paste', function(e) {
        // 获取剪贴板数据
        const clipboardData = e.clipboardData || window.clipboardData;
        const items = clipboardData.items;
        
        // 判断是否包含图片
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    // 阻止默认粘贴行为（防止图片URL被粘贴到输入框）
                    e.preventDefault();
                    
                    // 获取图片文件
                    const file = items[i].getAsFile();
                    if (file) {
                        // 处理图片文件
                        handleImageUpload(file);
                    }
                    break;
                }
            }
        }
    });
    
    // 支持拖放图片
    chatInput.addEventListener('dragover', function(e) {
        e.preventDefault();
        chatInput.classList.add('dragover');
    });
    
    chatInput.addEventListener('dragleave', function() {
        chatInput.classList.remove('dragover');
    });
    
    chatInput.addEventListener('drop', function(e) {
        e.preventDefault();
        chatInput.classList.remove('dragover');
        
        // 获取拖放的文件
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.indexOf('image') !== -1) {
            handleImageUpload(files[0]);
        }
    });
    
    // 上传图片功能
    uploadImageBtn.addEventListener('click', () => {
        imageUpload.click();
    });
    
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
    // 处理图片上传/粘贴 - 修改为显示缩略图
    function handleImageUpload(file) {
        if (!file.type.match('image.*')) {
            showNotification('请上传图片文件');
            return;
        }
        
        currentImageFile = file;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // 显示图片预览
            imagePreviewContainer.style.display = 'block';
            const previewImage = imagePreviewContainer.querySelector('.preview-image');
            previewImage.src = e.target.result;
            
            // 清空输入框中可能存在的"[图片已上传]"文本
            chatInput.value = chatInput.value.replace(/\[图片已上传\]\s*/g, '');
            
            // 显示通知
            showNotification('图片已上传，可以点击翻译按钮进行处理');
            
            // 重置文件输入控件的值，使得可以重新选择同一个文件
            imageUpload.value = '';
        };
        
        reader.readAsDataURL(file);
    }
    
    // 移除图片按钮事件
    removeImageButton.addEventListener('click', function() {
        imagePreviewContainer.style.display = 'none';
        currentImageFile = null;
        // 重置文件输入控件，允许重新选择相同的文件
        imageUpload.value = '';
    });
    
    // 显示加载中覆盖层
    function showLoadingOverlay(message = '正在处理，请稍候...') {
        if (loadingOverlay) {
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingOverlay.classList.remove('hidden');
        }
    }
    
    // 隐藏加载中覆盖层
    function hideLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
    
    // 翻译按钮功能 - 修改以支持OCR和图片处理
    translateBtn.addEventListener('click', async () => {
        const inputText = chatInput.value.trim();
        const hasImage = currentImageFile !== null;
        
        // 检查是否有输入
        if (!inputText && !hasImage) {
            showNotification('请输入文本或上传图片');
            return;
        }
        
        // 关闭所有打开的设置面板
        closeAllSettingsPanels();
        
        // 获取选中的服务
        const selectedService = document.querySelector('input[name="translate-service"]:checked').value;
        
        // 获取源语言和目标语言
        const fromLang = sourceLang.value;
        const toLang = targetLang.value;
        
        // 获取自定义提示词
        const customPrompt = ""; // 页面无自定义提示词输入框，留空
        
        // 添加用户消息到聊天区域
        addUserMessage(inputText, hasImage ? currentImageFile : null);
        
        // 先添加一个带加载状态的AI消息占位
        const loadingMessageId = addLoadingMessage();
        
        // 清空输入框和图片
        chatInput.value = '';
        const savedImageFile = currentImageFile;
        currentImageFile = null;
        
        // 隐藏图片预览
        imagePreviewContainer.style.display = 'none';
        
        try {
            let result;
            
            if (hasImage) {
                // 显示加载覆盖层
                showLoadingOverlay('正在处理图片，请稍候...');
                
                // 图片翻译 - 创建FormData对象
                const formData = new FormData();
                formData.append('image', savedImageFile);
                formData.append('sourceLang', fromLang);
                formData.append('targetLang', toLang);
                formData.append('service', selectedService);
                
                // 添加自定义提示词
                if (customPrompt) {
                    formData.append('customPrompt', customPrompt);
                }
                
                // 发送请求到后端API
                const response = await fetch('/api/translate/image', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '图片翻译请求失败');
                }
                
                const data = await response.json();
                
                // 确保 data.result 存在
                if (!data || !data.result) {
                    throw new Error('服务器返回空结果，请重试');
                }
                
                result = data.result;
                
                // 重置文件输入控件，允许重新选择相同的文件
                imageUpload.value = '';
            } else {
                // 显示加载覆盖层
                showLoadingOverlay('正在翻译文本，请稍候...');
                
                // 文本翻译 - 发送请求到后端API
                const requestBody = {
                    text: inputText,
                    sourceLang: fromLang,
                    targetLang: toLang,
                    service: selectedService
                };
                
                // 添加自定义提示词
                if (customPrompt) {
                    requestBody.customPrompt = customPrompt;
                }
                
                const response = await fetch('/api/translate/text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '文本翻译请求失败');
                }
                
                const data = await response.json();
                
                // 确保 data.result 存在
                if (!data || !data.result) {
                    throw new Error('服务器返回空结果，请重试');
                }
                
                result = data.result;
            }
            
            // 移除加载消息
            removeLoadingMessage(loadingMessageId);
            
            // 添加翻译结果消息
            addAITranslationMessage(result);
            
            // 隐藏加载覆盖层
            hideLoadingOverlay();
            
            // 滚动到底部
            scrollToBottom();
        } catch (error) {
            console.error('翻译错误:', error);
            
            // 隐藏加载覆盖层
            hideLoadingOverlay();
            
            // 移除加载消息
            removeLoadingMessage(loadingMessageId);
            
            // 添加错误消息
            addErrorMessage(error.message || '翻译失败，请稍后再试');
            
            // 滚动到底部
            scrollToBottom();
        }
    });
    
    // 润色按钮功能 - 完全重写以解决事件绑定问题
    if (polishBtn) {
        // 先移除所有现有的事件监听器（如果可能的话）
        polishBtn.replaceWith(polishBtn.cloneNode(true));
        
        // 重新获取元素引用
        const newPolishBtn = document.getElementById('polishBtn');
        
        if (newPolishBtn) {
            console.log('重新绑定润色按钮事件');
            
            // 添加视觉反馈效果
            newPolishBtn.addEventListener('mousedown', function() {
                console.log('润色按钮被按下 - 视觉反馈');
                this.classList.add('button-clicked');
            });
            
            newPolishBtn.addEventListener('mouseup', function() {
                this.classList.remove('button-clicked');
            });
            
            newPolishBtn.addEventListener('mouseleave', function() {
                this.classList.remove('button-clicked');
            });
            
            // 主要功能事件处理
            newPolishBtn.addEventListener('click', async function() {
                console.log('润色按钮点击事件触发了!!! 时间戳:', new Date().toISOString());
                
                const inputText = chatInput.value.trim();
                console.log('输入文本:', inputText ? `"${inputText.substring(0, 30)}${inputText.length > 30 ? '...' : ''}"` : '空');
                
                // 检查是否有输入
                if (!inputText) {
                    console.log('没有输入文本，退出润色处理');
                    showNotification('请输入需要润色的文本');
                    return;
                }
                
                // 关闭所有打开的设置面板
                closeAllSettingsPanels();
                
                // 获取选中的服务
                const selectedService = document.querySelector('input[name="polish-service"]:checked');
                if (!selectedService) {
                    console.error('未找到选中的润色服务选项');
                    showNotification('服务选择错误，请重试');
                    return;
                }
                
                const serviceName = selectedService.value;
                console.log('选中的润色服务:', serviceName);
                
                // 固定使用两种风格: normal(常规优化)和rephrase(转换语言风格)
                console.log('使用固定的两种润色风格: normal和rephrase');
                
                // 添加用户消息到聊天区域
                addUserMessage(inputText);
                console.log('已添加用户消息到聊天区域');
                
                // 先添加一个带加载状态的AI消息占位
                const loadingMessageId = addLoadingMessage();
                console.log('已添加加载消息, ID:', loadingMessageId);
                
                // 显示加载覆盖层
                showLoadingOverlay('正在润色文本，请稍候...');
                console.log('显示加载覆盖层');
                
                // 清空输入框
                chatInput.value = '';
                
                try {
                    // 构建请求体 - 不再指定style参数
                    const requestBody = {
                        text: inputText,
                        service: serviceName,
                        multiStyle: true  // 新参数，表示需要多种风格结果
                    };
                    
                    console.log('发送润色请求:', {
                        textPreview: inputText.substring(0, 30) + (inputText.length > 30 ? '...' : ''),
                        service: serviceName,
                        multiStyle: true
                    });
                    
                    // 发送请求到后端API
                    console.log('使用XMLHttpRequest发送请求到 /api/polish/text');
                    
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/polish/text', true);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    
                    xhr.onload = function() {
                        console.log('收到XHR响应，状态:', xhr.status);
                        
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                console.log('润色请求成功，解析响应...');
                                const data = JSON.parse(xhr.responseText);
                                console.log('润色响应数据:', data);
                                
                                if (!data || !data.result) {
                                    throw new Error('服务器返回数据结构无效');
                                }
                                
                                // 隐藏加载覆盖层
                                hideLoadingOverlay();
                                console.log('隐藏加载覆盖层');
                                
                                // 移除加载消息
                                removeLoadingMessage(loadingMessageId);
                                console.log('移除加载消息');
                                
                                // 添加新格式的润色结果到聊天区域
                                console.log('添加双风格润色结果到聊天区域');
                                addMultiStylePolishMessage(data.result);
                                
                                // 显示成功通知
                                showNotification('润色完成');
                                console.log('润色处理完成');
                                
                                // 滚动到最新消息
                                scrollToBottom();
                                
                            } catch (parseError) {
                                console.error('解析响应失败:', parseError);
                                hideLoadingOverlay();
                                removeLoadingMessage(loadingMessageId);
                                addErrorMessage('解析响应失败: ' + parseError.message);
                                showNotification('润色失败: 解析响应出错');
                                scrollToBottom();
                            }
                        } else {
                            console.error('润色请求失败，状态:', xhr.status);
                            let errorMsg = '文本润色请求失败';
                            
                            try {
                                const errorData = JSON.parse(xhr.responseText);
                                errorMsg = errorData.error || errorMsg;
                            } catch (e) {
                                console.error('解析错误响应失败:', e);
                            }
                            
                            hideLoadingOverlay();
                            removeLoadingMessage(loadingMessageId);
                            addErrorMessage('润色失败: ' + errorMsg);
                            showNotification('润色失败: ' + errorMsg);
                            scrollToBottom();
                        }
                    };
                    
                    xhr.onerror = function() {
                        console.error('请求发生网络错误');
                        hideLoadingOverlay();
                        removeLoadingMessage(loadingMessageId);
                        addErrorMessage('润色失败: 网络请求错误');
                        showNotification('润色失败: 网络请求错误');
                        scrollToBottom();
                    };
                    
                    xhr.ontimeout = function() {
                        console.error('请求超时');
                        hideLoadingOverlay();
                        removeLoadingMessage(loadingMessageId);
                        addErrorMessage('润色失败: 请求超时');
                        showNotification('润色失败: 请求超时');
                        scrollToBottom();
                    };
                    
                    // 发送请求
                    xhr.send(JSON.stringify(requestBody));
                    console.log('XHR请求已发送');
                    
                } catch (error) {
                    console.error('润色过程中出错:', error);
                    
                    // 隐藏加载覆盖层
                    hideLoadingOverlay();
                    
                    // 移除加载消息
                    removeLoadingMessage(loadingMessageId);
                    
                    // 添加错误消息
                    addErrorMessage('润色失败: ' + error.message);
                    
                    // 显示错误通知
                    showNotification('润色失败: ' + error.message);
                    
                    // 滚动到底部
                    scrollToBottom();
                }
            });
            
            console.log('润色按钮事件已重新绑定');
        } else {
            console.error('重新获取润色按钮失败');
        }
    } else {
        console.error('未找到润色按钮元素');
    }
    
    // 添加加载中消息
    function addLoadingMessage() {
        const messageId = 'loading-msg-' + (++messageCounter);
        
        const messageHTML = `
            <div id="${messageId}" class="message ai loading">
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        scrollToBottom();
        
        return messageId;
    }
    
    // 移除加载中消息
    function removeLoadingMessage(messageId) {
        const loadingMessage = document.getElementById(messageId);
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }
    
    // 添加错误消息
    function addErrorMessage(errorText) {
        const messageId = 'msg-' + (++messageCounter);
        
        const messageHTML = `
            <div id="${messageId}" class="message ai error">
                <div class="message-content">
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${errorText}</p>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        scrollToBottom();
    }
    
    // 添加用户消息到聊天区域 - 修改以支持图片显示
    function addUserMessage(text, image = null) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user';
        messageElement.id = `message-${messageCounter++}`;
        
        // 消息内容容器
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        // 如果有图片，添加图片显示
        if (image) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'user-image-container';
            
            const imageReader = new FileReader();
            imageReader.onload = function(e) {
                const imageElement = document.createElement('img');
                imageElement.src = e.target.result;
                imageElement.className = 'user-image';
                imageElement.alt = '上传的图片';
                imageContainer.appendChild(imageElement);
                
                // 添加图片容器到消息内容
                contentElement.appendChild(imageContainer);
                
                // 如果还有文本，也添加文本
                if (text) {
                    const textElement = document.createElement('p');
                    textElement.className = 'user-text';
                    textElement.textContent = text;
                    contentElement.appendChild(textElement);
                } else {
                    // 如果只有图片，添加一个提示
                    const textElement = document.createElement('p');
                    textElement.className = 'user-text image-caption';
                    textElement.textContent = '[图片翻译请求]';
                    contentElement.appendChild(textElement);
                }
                
                // 保存消息到当前对话
                saveMessageToCurrentConversation({
                    type: 'user',
                    content: text || '[图片]',
                    hasImage: true,
                    time: new Date().toISOString()
                });
            };
            
            imageReader.readAsDataURL(image);
        } else {
            // 纯文本消息
            const textElement = document.createElement('p');
            textElement.textContent = text;
            contentElement.appendChild(textElement);
            
            // 保存消息到当前对话
            saveMessageToCurrentConversation({
                type: 'user',
                content: text,
                hasImage: false,
                time: new Date().toISOString()
            });
        }
        
        // 添加消息内容到消息元素
        messageElement.appendChild(contentElement);
        
        // 添加消息元素到聊天区域
        chatMessages.appendChild(messageElement);
        
        // 滚动到底部
        scrollToBottom();
    }
    
    // 修改AI翻译消息的显示，支持OCR结果
    function addAITranslationMessage(result, saveToHistory = true) {
        // 检查result是否为undefined或null
        if (!result) {
            console.error('翻译结果为空');
            addErrorMessage('翻译结果为空，请重试');
            return;
        }
        
        const messageId = 'msg-' + (++messageCounter);
        
        // 消息内容容器
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        messageDiv.id = messageId;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // 服务标识
        const serviceInfo = document.createElement('div');
        serviceInfo.className = 'service-info';
        
        // 确保result.service存在，否则使用默认值
        const serviceCode = result.service ? result.service.toLowerCase() : 'unknown';
        const serviceEmoji = getServiceEmoji(serviceCode);
        const serviceName = getServiceDisplayName(result.service || 'unknown');
        
        serviceInfo.innerHTML = `<span>${serviceEmoji} 由 ${serviceName} 提供的翻译</span>`;
        contentDiv.appendChild(serviceInfo);
        
        // 判断是否是图片OCR结果，如果是，显示OCR结果
        if (result.ocrText && result.ocrText.trim() !== '') {
            const ocrDiv = document.createElement('div');
            ocrDiv.className = 'ocr-result';
            
            const ocrTitle = document.createElement('div');
            ocrTitle.className = 'result-title';
            ocrTitle.innerHTML = '<i class="fas fa-file-alt"></i> OCR识别结果';
            ocrDiv.appendChild(ocrTitle);
            
            const ocrText = document.createElement('div');
            ocrText.className = 'ocr-text';
            ocrText.textContent = result.ocrText;
            ocrDiv.appendChild(ocrText);
            
            contentDiv.appendChild(ocrDiv);
            
            // 添加分隔线
            const divider = document.createElement('div');
            divider.className = 'result-divider';
            contentDiv.appendChild(divider);
        }
        
        // 添加翻译结果
        const translationDiv = document.createElement('div');
        translationDiv.className = 'translation-result';
        
        const translationTitle = document.createElement('div');
        translationTitle.className = 'result-title';
        
        // 显示翻译方向
        if (result.fromLang && result.toLang) {
            const fromLangName = getLanguageName(result.fromLang);
            const toLangName = getLanguageName(result.toLang);
            translationTitle.innerHTML = `<i class="fas fa-language"></i> ${fromLangName} → ${toLangName} 翻译`;
        } else {
            translationTitle.innerHTML = '<i class="fas fa-language"></i> 翻译结果';
        }
        
        translationDiv.appendChild(translationTitle);
        
        // 翻译文本
        const translatedText = document.createElement('div');
        translatedText.className = 'translated-text';
        translatedText.textContent = result.translatedText;
        translationDiv.appendChild(translatedText);
        
        contentDiv.appendChild(translationDiv);
        
        // 添加操作按钮
        const actionButtons = document.createElement('div');
        actionButtons.className = 'message-actions';
        
        // 复制按钮 - 只复制翻译结果，不复制OCR结果
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn copy-btn';
        copyButton.innerHTML = '<i class="fas fa-clipboard"></i> 复制';
        copyButton.addEventListener('click', function() {
            console.log('复制按钮点击 - 仅复制翻译结果');
            console.log('翻译结果:', result.translatedText);
            // 只复制翻译结果
            if (navigator.clipboard && window.isSecureContext) {
                // 使用现代Clipboard API
                navigator.clipboard.writeText(result.translatedText)
                    .then(() => {
                        console.log('使用Clipboard API复制成功');
                        showNotification('已复制到剪贴板', this);
                    })
                    .catch(err => {
                        console.error('Clipboard API复制失败:', err);
                        // 回退到传统方法
                        copyTextToClipboard(result.translatedText);
                        showNotification('已复制到剪贴板', this);
                    });
            } else {
                // 使用传统方法
                copyTextToClipboard(result.translatedText);
                showNotification('已复制到剪贴板', this);
            }
        });
        
        actionButtons.appendChild(copyButton);
        
        // 添加复制到对话框按钮
        const copyToInputButton = document.createElement('button');
        copyToInputButton.className = 'action-btn copy-to-input-btn';
        copyToInputButton.innerHTML = '<i class="fas fa-arrow-right"></i> 复制到对话框';
        copyToInputButton.addEventListener('click', function() {
            chatInput.value = result.translatedText;
            chatInput.focus();
            showNotification('已复制到对话框', this);
            setTimeout(autoResizeInput, 0); // 触发输入框高度调整
        });
        
        actionButtons.appendChild(copyToInputButton);
        
        contentDiv.appendChild(actionButtons);
        
        // 将消息内容添加到消息元素
        messageDiv.appendChild(contentDiv);
        
        // 添加到聊天区域
        chatMessages.appendChild(messageDiv);
        
        // 保存消息到当前对话
        if (saveToHistory) {
            saveMessageToCurrentConversation({
                type: 'ai',
                translationResult: result,
                time: new Date().toISOString()
            });
        }
        
        // 滚动到底部
        scrollToBottom();
    }
    
    // 添加新的双风格润色消息函数
    function addMultiStylePolishMessage(result) {
        const messageId = 'msg-' + (++messageCounter);
        
        const serviceEmojis = {
            'ChatGPT': '🤖',
            'Gemini': '💎',
            'DeepSeek-R1': '🧠',
            'Qwen2.5': '📚',
            'Qwen': '📚',
            '通义千问': '📚',
            '豆包1.5-Pro': '🎁',
            'Doubao': '🎁'
        };
        
        // 从结果中获取两种风格的文本
        const normalText = result.normalStyle || '常规优化风格润色失败';
        const rephraseText = result.rephraseStyle || '转换语言风格润色失败';
        
        // 创建具有两种风格的润色结果消息
        const messageContent = `
            <div class="polishing-result">
                <div class="service-info">
                    <span>${serviceEmojis[result.service] || '🌐'} 由 ${result.service} 提供的润色</span>
                </div>
                <div class="polish-results">
                    <div class="result-group">
                        <div class="content-header">常规优化</div>
                        <div class="content-body">${escapeHtml(normalText)}</div>
                    </div>
                    <div class="result-group">
                        <div class="content-header">转换语言风格</div>
                        <div class="content-body">${escapeHtml(rephraseText)}</div>
                    </div>
                </div>
                <div class="message-actions">
                    <button class="message-action-btn copy-btn-normal" data-message-id="${messageId}">
                        <i class="bi bi-clipboard"></i> 复制常规风格
                    </button>
                    <button class="message-action-btn copy-btn-rephrase" data-message-id="${messageId}">
                        <i class="bi bi-clipboard"></i> 复制转换风格
                    </button>
                    <button class="message-action-btn copy-to-input-btn" data-message-id="${messageId}">
                        <i class="bi bi-arrow-return-left"></i> 复制到对话框
                    </button>
                </div>
            </div>
        `;
        
        const messageHTML = `
            <div id="${messageId}" class="message ai">
                <div class="message-content">
                    ${messageContent}
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        
        // 添加复制常规风格按钮的事件处理
        document.querySelector(`#${messageId} .copy-btn-normal`).addEventListener('click', function() {
            copyTextToClipboard(normalText);
            // 修改：在按钮旁显示通知
            showNotification('已复制常规风格', this);
        });
        
        // 添加复制转换风格按钮的事件处理
        document.querySelector(`#${messageId} .copy-btn-rephrase`).addEventListener('click', function() {
            copyTextToClipboard(rephraseText);
            // 修改：在按钮旁显示通知
            showNotification('已复制转换风格', this);
        });
        
        // 添加复制到对话框按钮的事件处理
        document.querySelector(`#${messageId} .copy-to-input-btn`).addEventListener('click', function() {
            chatInput.value = normalText; // 默认使用常规风格
            chatInput.focus();
            // 修改：在按钮旁显示通知
            showNotification('已复制到对话框', this);
            // 触发输入框高度调整
            setTimeout(autoResizeInput, 0);
        });
        
        // 保存聊天消息到对话历史
        saveMessageToCurrentConversation({
            type: 'ai',
            polishResult: {
                normalStyle: normalText,
                rephraseStyle: rephraseText,
                service: result.service
            },
            time: new Date().toISOString()
        });
        
        // 添加到输入记忆中
        if (result.originalText) {
            addToInputHistory(result.originalText);
        }
        
        // 滚动到底部
        scrollToBottom();
    }
    
    // 逐字显示文本效果
    function typeText(element, text, speed = 10) {
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                // 随机速度，显得更自然
                const randomSpeed = speed * (0.5 + Math.random());
                // 文本太长时加速
                const lengthFactor = text.length > 500 ? 0.2 : 1;
                setTimeout(type, randomSpeed * lengthFactor);
            }
            scrollToBottom();
        }
        type();
    }
    
    // 转义HTML字符
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 新对话按钮事件
    newChatBtn.addEventListener('click', () => {
        // 保存当前的翻译和润色模型设置
        const currentTranslateService = document.querySelector('input[name="translate-service"]:checked')?.value || 'gpt';
        const currentPolishService = document.querySelector('input[name="polish-service"]:checked')?.value || 'gpt';
        
        // 使用原有的创建新对话功能
        createNewConversation();
        
        // 确保新对话时保留选定的翻译和润色模型
        document.querySelector(`input[name="translate-service"][value="${currentTranslateService}"]`)?.checked = true;
        document.querySelector(`input[name="polish-service"][value="${currentPolishService}"]`)?.checked = true;
        
        // 保存设置到localStorage
        localStorage.setItem('lastTranslateService', currentTranslateService);
        localStorage.setItem('lastPolishService', currentPolishService);
    });
    
    // 清空所有对话按钮事件
    clearChatsBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
            clearAllConversations();
        }
    });
    
    // 初始化对话管理
    initConversationManager();
    
    // 滚动到底部
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 显示通知函数
    function showNotification(message, target = null) {
        // 如果提供了目标元素，则显示目标元素旁的通知
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
            // 使用全局通知
            if (!notification) return;
            
            notification.textContent = message;
            notification.classList.add('show');
            
            // 3秒后自动隐藏
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
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
    
    // 对话管理功能
    
    // 初始化对话管理
    function initConversationManager() {
        // 从本地存储加载对话历史
        loadConversationsFromStorage();
        
        // 如果没有对话，创建一个新对话
        if (conversations.length === 0) {
            createNewConversation();
        } else {
            // 加载最近的对话
            loadConversation(conversations[0].id);
        }
        
        // 渲染对话列表
        renderConversationList();
    }
    
    // 从本地存储加载对话历史
    function loadConversationsFromStorage() {
        const savedConversations = localStorage.getItem('tranoptim-conversations');
        if (savedConversations) {
            conversations = JSON.parse(savedConversations);
        }
    }
    
    // 保存对话历史到本地存储
    function saveConversationsToStorage() {
        localStorage.setItem('tranoptim-conversations', JSON.stringify(conversations));
    }
    
    // 清空所有对话记录
    function clearAllConversations() {
        // 清空数组
        conversations = [];
        
        // 清空本地存储
        localStorage.removeItem('tranoptim-conversations');
        
        // 创建新的对话
        createNewConversation();
        
        // 显示通知
        showNotification('所有对话记录已清空');
    }
    
    // 创建新对话
    function createNewConversation() {
        // 生成唯一ID
        const newId = Date.now().toString();
        const newConversation = {
            id: newId,
            title: '新对话 ' + new Date().toLocaleString('zh-CN', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}),
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // 添加到对话列表的开头
        conversations.unshift(newConversation);
        
        // 保存到本地存储
        saveConversationsToStorage();
        
        // 设置为当前对话
        loadConversation(newId);
        
        // 更新UI
        renderConversationList();
        
        return newId;
    }
    
    // 加载指定对话
    function loadConversation(conversationId) {
        // 查找对话
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (!conversation) return;
        
        // 设置当前对话ID
        currentConversationId = conversationId;
        
        // 清空聊天区域
        chatMessages.innerHTML = '';
        messageCounter = 0;
        
        // 如果是空对话，显示欢迎消息
        if (conversation.messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="message system">
                    <div class="message-content">
                        <p>欢迎使用TranOptim智能翻译与润色工具！请在下方输入您想要翻译或润色的文本，或上传图片。</p>
                    </div>
                </div>
            `;
        } else {
            // 加载对话消息
            conversation.messages.forEach(msg => {
                if (msg.type === 'user') {
                    const messageId = 'msg-' + (++messageCounter);
                    const messageHTML = `
                        <div id="${messageId}" class="message user">
                            <div class="message-content">
                                <p>${msg.content}</p>
                            </div>
                        </div>
                    `;
                    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
                    
                    // 如果有图片，添加图片
                    if (msg.hasImage && msg.imageData) {
                        const imgElement = document.createElement('img');
                        imgElement.src = msg.imageData;
                        imgElement.alt = '上传的图片';
                        imgElement.className = 'message-image';
                        document.getElementById(messageId).querySelector('.message-content').prepend(imgElement);
                    }
                } else if (msg.type === 'ai') {
                    // 修复历史会话中的翻译和润色结果显示
                    if (msg.translationResult) {
                        addAITranslationMessage(msg.translationResult, false);
                    } else if (msg.polishResult) {
                        if (typeof msg.polishResult === 'object') {
                            addAIPolishMessage(msg.polishResult, false);
                        } else {
                            console.error('无效的润色结果格式:', msg);
                        }
                    } else if (msg.content) {
                        // 兼容旧格式的数据
                        addAITranslationMessage({
                            translatedText: msg.content,
                            service: msg.service || 'unknown',
                            error: msg.error
                        }, false);
                    }
                }
            });
        }
        
        // 更新UI，高亮当前对话
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === conversationId) {
                item.classList.add('active');
            }
        });
        
        // 滚动到底部
        scrollToBottom();
    }
    
    // 保存消息到当前对话
    function saveMessageToCurrentConversation(message) {
        if (!currentConversationId) return;
        
        // 查找当前对话
        const conversationIndex = conversations.findIndex(conv => conv.id === currentConversationId);
        if (conversationIndex === -1) return;
        
        // 添加消息
        conversations[conversationIndex].messages.push(message);
        
        // 更新对话的最后修改时间
        conversations[conversationIndex].updatedAt = new Date().toISOString();
        
        // 如果是第一条用户消息，更新对话标题
        if (message.type === 'user' && conversations[conversationIndex].messages.length === 1) {
            // 使用用户消息的前20个字符作为标题
            let title = message.content.replace(/\[图片已上传\]\s*/g, '').trim();
            if (title.length > 20) {
                title = title.substring(0, 20) + '...';
            }
            if (!title && message.hasImage) {
                title = '[图片对话]';
            }
            if (title) {
                conversations[conversationIndex].title = title;
            }
        }
        
        // 保存到本地存储
        saveConversationsToStorage();
        
        // 更新UI
        renderConversationList();
    }
    
    // 删除对话
    function deleteConversation(conversationId) {
        // 查找对话索引
        const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
        if (conversationIndex === -1) return;
        
        // 删除对话
        conversations.splice(conversationIndex, 1);
        
        // 保存到本地存储
        saveConversationsToStorage();
        
        // 如果删除的是当前对话，加载另一个对话或创建新对话
        if (conversationId === currentConversationId) {
            if (conversations.length > 0) {
                loadConversation(conversations[0].id);
            } else {
                createNewConversation();
            }
        }
        
        // 更新UI
        renderConversationList();
        
        // 显示通知
        showNotification('对话已删除');
    }
    
    // 渲染对话列表
    function renderConversationList() {
        conversationList.innerHTML = '';
        
        conversations.forEach(conversation => {
            // 计算对话更新时间的相对表示
            const updatedTime = new Date(conversation.updatedAt);
            const now = new Date();
            const diffMs = now - updatedTime;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            let timeString = '';
            if (diffDays > 0) {
                timeString = `${diffDays}天前`;
            } else if (diffHours > 0) {
                timeString = `${diffHours}小时前`;
            } else if (diffMinutes > 0) {
                timeString = `${diffMinutes}分钟前`;
            } else {
                timeString = '刚刚';
            }
            
            const conversationHTML = `
                <div class="conversation-item ${conversation.id === currentConversationId ? 'active' : ''}" data-id="${conversation.id}">
                    <div class="conversation-title">${conversation.title}</div>
                    <div class="conversation-actions">
                        <button class="conversation-action-btn delete-conversation-btn" data-id="${conversation.id}" title="删除对话">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            conversationList.insertAdjacentHTML('beforeend', conversationHTML);
        });
        
        // 添加点击事件
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', function(e) {
                // 忽略删除按钮的点击
                if (e.target.closest('.delete-conversation-btn')) return;
                
                const conversationId = this.dataset.id;
                loadConversation(conversationId);
            });
        });
        
        // 添加删除按钮事件
        document.querySelectorAll('.delete-conversation-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                const conversationId = this.dataset.id;
                if (confirm('确定要删除这个对话吗？')) {
                    deleteConversation(conversationId);
                }
            });
        });
    }
    
    // 输入历史记录管理
    // 删除这里的变量定义，已移至文件顶部
    // let inputHistory = [];
    // let inputHistoryIndex = -1;
    
    // 添加到输入记忆
    function addToInputHistory(text) {
        if (!text || text.trim() === '') return;
        
        // 避免重复添加相同的输入
        if (inputHistory.length === 0 || inputHistory[0] !== text) {
            inputHistory.unshift(text);
            if (inputHistory.length > 50) { // 限制历史记录数量
                inputHistory.pop();
            }
        }
        inputHistoryIndex = -1; // 重置索引
    }
    
    // 添加缺失的润色消息显示函数
    function addAIPolishMessage(result, saveToHistory = true) {
        // 如果结果是多风格润色格式，使用多风格显示函数
        if (result.normalStyle || result.rephraseStyle) {
            addMultiStylePolishMessage(result);
            return;
        }
        
        // 单风格润色的显示
        const messageId = 'msg-' + (++messageCounter);
        
        const serviceEmoji = getServiceEmoji(result.service || 'unknown');
        const serviceName = getServiceDisplayName(result.service || 'unknown');
        
        const messageContent = `
            <div class="polishing-result">
                <div class="service-info">
                    <span>${serviceEmoji} 由 ${serviceName} 提供的润色</span>
                </div>
                <div class="polish-results">
                    <div class="result-group">
                        <div class="content-header">润色结果</div>
                        <div class="content-body">${escapeHtml(result.translatedText || '润色失败')}</div>
                    </div>
                </div>
                <div class="message-actions">
                    <button class="message-action-btn copy-btn" data-message-id="${messageId}">
                        <i class="bi bi-clipboard"></i> 复制结果
                    </button>
                    <button class="message-action-btn copy-to-input-btn" data-message-id="${messageId}">
                        <i class="bi bi-arrow-return-left"></i> 复制到对话框
                    </button>
                </div>
            </div>
        `;
        
        const messageHTML = `
            <div id="${messageId}" class="message ai">
                <div class="message-content">
                    ${messageContent}
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        
        // 添加复制按钮事件
        document.querySelector(`#${messageId} .copy-btn`).addEventListener('click', function() {
            copyTextToClipboard(result.translatedText);
            // 修改：在按钮旁显示通知
            showNotification('已复制润色结果', this);
        });
        
        // 添加复制到对话框按钮事件
        document.querySelector(`#${messageId} .copy-to-input-btn`).addEventListener('click', function() {
            chatInput.value = result.translatedText;
            chatInput.focus();
            // 修改：在按钮旁显示通知
            showNotification('已复制到对话框', this);
            // 触发输入框高度调整
            setTimeout(autoResizeInput, 0);
        });
        
        // 保存消息到当前对话
        if (saveToHistory) {
            saveMessageToCurrentConversation({
                type: 'ai',
                polishResult: result,
                time: new Date().toISOString()
            });
        }
        
        scrollToBottom();
    }

    // 上次使用的模型设置
    let lastTranslateService = localStorage.getItem('lastTranslateService') || 'gpt';
    let lastPolishService = localStorage.getItem('lastPolishService') || 'gpt';
    
    // 应用上次使用的设置
    document.querySelector(`input[name="translate-service"][value="${lastTranslateService}"]`)?.checked = true;
    document.querySelector(`input[name="polish-service"][value="${lastPolishService}"]`)?.checked = true;
    
    // 监听翻译服务选择变化
    document.querySelectorAll('input[name="translate-service"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('lastTranslateService', this.value);
            }
        });
    });
    
    // 监听润色服务选择变化
    document.querySelectorAll('input[name="polish-service"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('lastPolishService', this.value);
            }
        });
    });
    
    // 初始化调用一次自动调整输入框高度
    autoResizeInput();
});