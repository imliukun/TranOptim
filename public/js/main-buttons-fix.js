// TranOptim - 主要按钮功能修复脚本 - 增强版

// 定义为全局变量，以便在chat.js中可以查看是否已加载
window.MainButtonsFixLoaded = true;

// 全局变量存储按钮引用和处理函数
window.ButtonHandlers = {
    newChatBtn: null,
    clearChatsBtn: null,
    uploadBtn: null,
    translateBtn: null,
    polishBtn: null,
    imageUpload: null
};

// 防止事件被覆盖的锁定机制
window.ButtonsLocked = false;

// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    console.log('[按钮修复] 初始化增强版按钮修复脚本');
    
    // 立即执行，确保在其他脚本之前初始化
    initButtonFixes();
    initImageUploadSupport(); // 初始化图片上传支持
    
    // 使用事件委托绑定事件 - 整个文档范围
    document.addEventListener('click', function(event) {
        // 只在按钮未锁定时处理
        if (window.ButtonsLocked) {
            console.log('[按钮修复] 按钮已锁定，忽略点击事件');
            return;
        }
        
        // 查找点击的元素ID
        const target = event.target.closest('button');
        if (!target) return;
        
        const id = target.id;
        console.log('[按钮修复] 检测到按钮点击:', id);
        
        // 根据ID分发事件 - 仅处理核心功能按钮
        if (id === 'newChatBtn') {
            event.preventDefault();
            event.stopPropagation();
            handleNewChatBtnClick(event);
        } else if (id === 'clearChatsBtn') {
            event.preventDefault();
            event.stopPropagation();
            handleClearChatsBtnClick(event);
        } else if (id === 'uploadBtn') {
            event.preventDefault();
            event.stopPropagation();
            handleUploadBtnClick(event);
        } else if (id === 'translateBtn') {
            event.preventDefault();
            event.stopPropagation();
            handleTranslateBtnClick.call(target, event);
        } else if (id === 'polishBtn') {
            event.preventDefault();
            event.stopPropagation();
            handlePolishBtnClick.call(target, event);
        }
    }, true); // 使用捕获阶段
    
    // 为图片上传添加特殊处理
    const imageUploadElement = document.getElementById('imageUpload');
    if (imageUploadElement) {
        // 保存引用
        window.ButtonHandlers.imageUpload = imageUploadElement;
        
        // 移除任何现有的事件监听器
        const newImageUpload = imageUploadElement.cloneNode(true);
        imageUploadElement.parentNode.replaceChild(newImageUpload, imageUploadElement);
        
        // 添加新的事件监听器
        newImageUpload.addEventListener('change', handleImageUploadChange, true);
    }
    
    // 在所有脚本加载完成后，再次检查按钮是否被覆盖
    window.addEventListener('load', function() {
        console.log('[按钮修复] 页面完全加载，重新检查按钮事件');
        
        // 创建一个MutationObserver来监视DOM变化
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // 解锁按钮
                    window.ButtonsLocked = false;
                    
                    // 检查按钮状态
                    checkButtonStates();
                }
            });
        });
        
        // 配置观察选项
        const config = { 
            attributes: true, 
            childList: true, 
            subtree: true 
        };
        
        // 开始观察文档变化
        observer.observe(document.body, config);
        
        // 初始检查
        checkButtonStates();
    });
    
    // 定期检查按钮状态
    setInterval(checkButtonStates, 5000);
});

// 检查按钮状态并确保事件处理正常
function checkButtonStates() {
    console.log('[按钮修复] 检查按钮状态');
    
    const buttonIds = [
        'newChatBtn', 'clearChatsBtn', 'uploadBtn', 
        'translateBtn', 'polishBtn'
    ];
    
    buttonIds.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            // 保存按钮引用
            window.ButtonHandlers[id] = button;
            
            // 为保证安全，可以再次添加数据属性
            button.setAttribute('data-fixed-event', 'true');
        }
    });
    
    // 检查并尝试恢复自动调整高度功能
    const chatInput = document.getElementById('chatInput');
    if (chatInput && window.InputAutoResize) {
        // 触发一次自动调整
        setTimeout(() => window.InputAutoResize.autoResize(chatInput), 0);
    }
}

// 新对话按钮处理函数
function handleNewChatBtnClick(event) {
    console.log('[按钮修复] 新对话按钮点击');
    
    // 锁定按钮，防止其他事件处理器干扰
    window.ButtonsLocked = true;
    
    try {
        // 使用对话管理器创建新对话
        createNewConversation();
        
        // 确保会话列表更新
        setTimeout(() => {
            renderConversationList();
            // 显示通知
            showFixNotification('已创建新对话');
        }, 100);
    } catch (error) {
        console.error('[按钮修复] 创建新对话出错:', error);
        showFixNotification('创建新对话失败', 'error');
    } finally {
        // 解锁按钮
        setTimeout(() => {
            window.ButtonsLocked = false;
        }, 500);
    }
}

// 清空按钮处理函数
function handleClearChatsBtnClick(event) {
    console.log('[按钮修复] 清空按钮点击');
    
    // 锁定按钮
    window.ButtonsLocked = true;
    
    try {
        // 确认对话框
        if (confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
            // 清空所有对话
            clearAllConversations();
            
            // 确保会话列表更新
            setTimeout(() => {
                renderConversationList();
                // 显示通知
                showFixNotification('所有对话已清空');
            }, 100);
        }
    } catch (error) {
        console.error('[按钮修复] 清空对话出错:', error);
        showFixNotification('清空对话失败', 'error');
    } finally {
        // 解锁按钮
        setTimeout(() => {
            window.ButtonsLocked = false;
        }, 500);
    }
}

// 上传按钮处理函数
function handleUploadBtnClick(event) {
    console.log('[按钮修复] 上传按钮点击');
    
    // 锁定按钮
    window.ButtonsLocked = true;
    
    try {
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.click();
        } else {
            console.error('[按钮修复] 未找到imageUpload元素');
            showFixNotification('上传功能不可用', 'error');
        }
    } catch (error) {
        console.error('[按钮修复] 处理上传按钮出错:', error);
    } finally {
        // 解锁按钮
        setTimeout(() => {
            window.ButtonsLocked = false;
        }, 500);
    }
}

// 图片上传变更处理函数
function handleImageUploadChange(e) {
    console.log('[按钮修复] 图片上传变更');
    
    // 锁定按钮
    window.ButtonsLocked = true;
    
    try {
        if (e.target.files.length) {
            handleImageUpload(e.target.files[0]);
        }
    } catch (error) {
        console.error('[按钮修复] 处理图片上传变更出错:', error);
        showFixNotification('图片上传失败', 'error');
    } finally {
        // 解锁按钮
        setTimeout(() => {
            window.ButtonsLocked = false;
        }, 500);
    }
}

// 翻译按钮处理函数
async function handleTranslateBtnClick(event) {
    console.log('[按钮修复] 翻译按钮点击');
    
    // 锁定按钮
    window.ButtonsLocked = true;
    
    try {
        // 添加视觉反馈
        const translateBtn = document.getElementById('translateBtn');
        if (translateBtn) {
            translateBtn.classList.add('button-clicked');
            setTimeout(() => translateBtn.classList.remove('button-clicked'), 200);
        }
        
        // 获取输入文本
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            showFixNotification('无法获取输入框元素', 'error');
            return;
        }
        
        const inputText = chatInput.value.trim();
        const currentImageFile = window.currentImageFile || null; // 从全局获取
        const hasImage = currentImageFile !== null;
        
        // 检查是否有输入
        if (!inputText && !hasImage) {
            showFixNotification('请输入文本或上传图片', 'error');
            return;
        }
        
        // 获取翻译参数
        const sourceLang = document.getElementById('sourceLanguage')?.value || 'auto';
        const targetLang = document.getElementById('targetLanguage')?.value || 'zh';
        const selectedService = document.querySelector('input[name="translate-service"]:checked')?.value || 'gpt';
        
        showFixNotification('正在翻译，请稍候...');
        
        // 添加用户消息
        if (typeof addUserMessage === 'function') {
            if (hasImage) {
                const imageURL = document.querySelector('.preview-image')?.src || '';
                addUserMessageWithImage(inputText, imageURL);
            } else {
                addUserMessage(inputText);
            }
        } else {
            console.error('[按钮修复] addUserMessage 函数不可用');
        }
        
        let result;
        try {
            // 执行翻译API调用
            if (hasImage && typeof translateImage === 'function') {
                console.log('[按钮修复] 调用图片翻译API');
                result = await translateImage(currentImageFile, selectedService, targetLang);
            } else if (typeof translateText === 'function') {
                console.log('[按钮修复] 调用文本翻译API');
                result = await translateText(inputText, selectedService, sourceLang, targetLang);
            } else {
                throw new Error('翻译函数不可用');
            }
        } catch (apiError) {
            console.error('[按钮修复] 翻译API调用错误:', apiError);
            
            // 模拟一个简单的结果，确保UI不会卡住
            result = {
                originalText: inputText,
                translatedText: '翻译API调用失败，请稍后再试: ' + apiError.message,
                service: selectedService
            };
        }
        
        // 处理翻译结果
        if (result && result.translatedText) {
            // 将翻译结果显示在聊天区域
            if (typeof addAITranslationMessage === 'function') {
                addAITranslationMessage(result);
            } else {
                console.error('[按钮修复] addAITranslationMessage 函数不可用');
                showFixNotification('显示翻译结果失败', 'error');
            }
            
            // 清空输入框和图片
            chatInput.value = '';
            if (typeof removeUploadedImage === 'function') {
                removeUploadedImage();
            }
            
            // 显示成功通知
            showFixNotification('翻译完成');
        } else {
            throw new Error('翻译结果无效');
        }
        
        // 滚动到底部
        scrollToBottom();
        
    } catch (error) {
        console.error('[按钮修复] 翻译错误:', error);
        showFixNotification('翻译失败: ' + error.message, 'error');
    } finally {
        // 解锁按钮
        setTimeout(() => {
            window.ButtonsLocked = false;
        }, 500);
    }
}

// 润色按钮处理函数
async function handlePolishBtnClick(event) {
    console.log('[按钮修复] 润色按钮点击');
    
    // 锁定按钮
    window.ButtonsLocked = true;
    
    try {
        // 添加视觉反馈
        const polishBtn = document.getElementById('polishBtn');
        if (polishBtn) {
            polishBtn.classList.add('button-clicked');
            setTimeout(() => polishBtn.classList.remove('button-clicked'), 200);
        }
        
        // 获取输入文本
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            showFixNotification('无法获取输入框元素', 'error');
            return;
        }
        
        const inputText = chatInput.value.trim();
        
        // 检查是否有输入
        if (!inputText) {
            showFixNotification('请输入要润色的文本', 'error');
            return;
        }
        
        // 显示加载中提示
        showFixNotification('正在润色，请稍候...');
        
        // 获取润色参数
        const selectedService = document.querySelector('input[name="polish-service"]:checked')?.value || 'gpt';
        const polishStyle = document.getElementById('polishStyle')?.value || 'professional';
        const polishLanguage = document.getElementById('polishLanguage')?.value || 'zh';
        
        // 添加用户消息到聊天区域
        if (typeof addUserMessage === 'function') {
            addUserMessage(inputText);
        } else {
            console.error('[按钮修复] addUserMessage 函数不可用');
        }
        
        // 构建请求体
        const requestBody = {
            text: inputText,
            service: selectedService,
            style: polishStyle,
            language: polishLanguage,
            multiStyle: true
        };
        
        console.log('[按钮修复] 发送润色请求:', requestBody);
        
        let response, data;
        try {
            // 发送请求
            response = await fetch('/api/polish/text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error('润色请求失败: ' + (errorData.error || response.status));
            }
            
            data = await response.json();
            
            console.log('[按钮修复] 润色响应数据:', data);
            
            if (!data || !data.result) {
                throw new Error('服务器返回无效数据');
            }
        } catch (apiError) {
            console.error('[按钮修复] 润色API调用错误:', apiError);
            
            // 模拟结果，确保UI不会卡住
            data = {
                result: {
                    normalStyle: '润色API调用失败，请稍后再试: ' + apiError.message,
                    rephraseStyle: '润色API调用失败，请稍后再试: ' + apiError.message,
                    service: selectedService
                }
            };
        }
        
        // 添加润色结果到聊天区域
        const normalStyle = data.result.normalStyle || '常规优化风格润色失败';
        const rephraseStyle = data.result.rephraseStyle || '转换语言风格润色失败';
        
        // 更新UI
        if (typeof addAIPolishMessage === 'function') {
            addAIPolishMessage({
                normalStyle: normalStyle,
                rephraseStyle: rephraseStyle,
                service: data.result.service || selectedService
            });
        } else {
            console.error('[按钮修复] addAIPolishMessage 函数不可用');
            showFixNotification('显示润色结果失败', 'error');
        }
        
        // 清空输入框
        chatInput.value = '';
        
        // 重置输入框高度
        autoResizeInput(chatInput);
        
        // 显示成功通知
        showFixNotification('润色完成');
        
        // 滚动到底部
        scrollToBottom();
        
    } catch (error) {
        console.error('[按钮修复] 润色错误:', error);
        showFixNotification('润色失败: ' + error.message, 'error');
    } finally {
        // 解锁按钮
        setTimeout(() => {
            window.ButtonsLocked = false;
        }, 500);
    }
}

// 初始化按钮修复
function initButtonFixes() {
    console.log('[按钮修复] 正在初始化按钮修复');
    
    // 按钮ID列表
    const buttonIds = [
        'newChatBtn', 'clearChatsBtn', 'uploadBtn', 
        'translateBtn', 'polishBtn'
    ];
    
    // 获取所有按钮并保存引用
    buttonIds.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            console.log('[按钮修复] 找到按钮:', id);
            window.ButtonHandlers[id] = button;
            button.setAttribute('data-fixed-event', 'true');
        } else {
            console.warn('[按钮修复] 未找到按钮:', id);
        }
    });
    
    console.log('[按钮修复] 按钮初始化完成');
}

// 辅助函数：显示通知
function showFixNotification(message, type = 'success') {
    console.log('[按钮修复] 显示通知:', message, type);
    
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('[按钮修复] 未找到通知元素');
        return;
    }
    
    // 设置通知类
    notification.className = 'notification';
    notification.classList.add(`notification-${type}`);
    
    // 设置通知内容
    notification.textContent = message;
    
    // 显示通知
    notification.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(function() {
        notification.classList.remove('show');
    }, 3000);
}

// 辅助函数：滚动到底部
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// 图片上传功能
let currentImageFile = null;

// 初始化图片上传支持
function initImageUploadSupport() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) {
        console.error('[按钮修复] 未找到聊天输入框元素');
        return;
    }
    
    console.log('[按钮修复] 初始化图片上传支持功能');
    
    // 创建图片预览容器
    createImagePreviewContainer();
    
    // 添加剪贴板粘贴事件监听
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
    
    console.log('[按钮修复] 图片上传支持功能已初始化');
}

// 创建图片预览容器
function createImagePreviewContainer() {
    // 检查是否已存在
    let existingContainer = document.querySelector('.image-preview-container');
    if (existingContainer) {
        console.log('[按钮修复] 图片预览容器已存在');
        return existingContainer;
    }
    
    // 创建容器
    let imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.className = 'image-preview-container';
    imagePreviewContainer.style.display = 'none';
    imagePreviewContainer.innerHTML = `
        <div class="preview-wrapper">
            <img src="" alt="图片预览" class="preview-image">
            <button class="remove-image-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // 在输入框上方插入图片预览容器
    const inputWrapper = document.querySelector('.textarea-wrapper');
    if (inputWrapper) {
        inputWrapper.parentNode.insertBefore(imagePreviewContainer, inputWrapper);
        
        // 获取移除图片按钮
        const removeImageButton = imagePreviewContainer.querySelector('.remove-image-btn');
        removeImageButton.addEventListener('click', function() {
            removeUploadedImage();
        });
    } else {
        console.error('[按钮修复] 未找到插入图片预览容器的位置');
    }
    
    return imagePreviewContainer;
}

// 处理图片上传
function handleImageUpload(file) {
    if (!file) {
        console.error('[按钮修复] 没有提供文件');
        return;
    }
    
    if (!file.type.match('image.*')) {
        showFixNotification('请上传图片文件', 'error');
        return;
    }
    
    // 设置当前图片文件
    currentImageFile = file;
    
    // 获取图片预览容器
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    if (!imagePreviewContainer) {
        console.error('[按钮修复] 未找到图片预览容器');
        return;
    }
    
    // 使用FileReader读取文件
    const reader = new FileReader();
    reader.onload = function(e) {
        // 显示图片预览
        imagePreviewContainer.style.display = 'block';
        const previewImage = imagePreviewContainer.querySelector('.preview-image');
        if (previewImage) {
            previewImage.src = e.target.result;
        }
        
        // 清空输入框中可能存在的"[图片已上传]"文本
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = chatInput.value.replace(/\[图片已上传\]\s*/g, '');
        }
        
        // 显示通知
        showFixNotification('图片已上传，可以点击翻译按钮进行处理');
    };
    
    reader.readAsDataURL(file);
    
    // 重置文件输入控件的值，使得可以重新选择同一个文件
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.value = '';
    }
    
    console.log('[按钮修复] 图片已上传:', file.name, file.type, file.size, 'bytes');
}

// 移除上传的图片
function removeUploadedImage() {
    // 重置当前图片文件
    currentImageFile = null;
    
    // 隐藏图片预览容器
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
    }
    
    // 重置文件输入控件
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.value = '';
    }
    
    console.log('[按钮修复] 已移除上传的图片');
}

// 添加带图片的用户消息
function addUserMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // 创建用户消息HTML
    chatMessages.innerHTML += `
        <div class="message user">
            <div class="message-content">
                <p>${text}</p>
            </div>
        </div>
    `;
    
    // 保存消息到当前对话
    saveMessageToCurrentConversation({
        type: 'user',
        content: text,
        hasImage: false,
        time: new Date().toISOString()
    });
    
    // 滚动到底部
    scrollToBottom();
}

// 添加带图片的用户消息
function addUserMessageWithImage(text, imageURL) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // 创建用户消息HTML
    let messageHTML = `
        <div class="message user">
            <div class="message-content">
                <div class="user-image-container">
                    <img src="${imageURL}" alt="上传的图片" class="user-image">
                </div>
    `;
    
    // 如果有文本，添加文本
    if (text) {
        messageHTML += `<p class="user-text">${text}</p>`;
    } else {
        messageHTML += `<p class="user-text image-caption">[图片翻译请求]</p>`;
    }
    
    // 关闭HTML标签
    messageHTML += `
            </div>
        </div>
    `;
    
    // 添加到聊天区域
    chatMessages.innerHTML += messageHTML;
    
    // 保存消息到当前对话
    saveMessageToCurrentConversation({
        type: 'user',
        content: text || '[图片]',
        hasImage: true,
        imageURL: imageURL,
        time: new Date().toISOString()
    });
    
    // 滚动到底部
    scrollToBottom();
}

// 添加AI翻译消息
function addAITranslationMessage(result) {
    if (!result) return;
    
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // 创建AI消息HTML
    let messageHTML = `
        <div class="message ai">
            <div class="message-content">
                <div class="service-info">
                    <span>🤖 由 ${result.service || 'ChatGPT'} 提供的翻译</span>
                </div>
    `;
    
    // 如果有OCR结果，显示OCR结果
    if (result.ocrText && result.ocrText.trim() !== '') {
        messageHTML += `
            <div class="ocr-result">
                <div class="result-title">
                    <i class="fas fa-file-alt"></i> OCR识别结果
                </div>
                <div class="ocr-text">${result.ocrText}</div>
            </div>
            <div class="result-divider"></div>
        `;
    }
    
    // 添加翻译结果
    messageHTML += `
        <div class="translation-result">
            <div class="result-title">
                <i class="fas fa-language"></i> ${result.fromLang && result.toLang ? 
                    `${getLanguageName(result.fromLang)} → ${getLanguageName(result.toLang)} 翻译` : 
                    '翻译结果'}
            </div>
            <div class="translated-text">
                ${result.translatedText}
            </div>
        </div>
        <div class="message-actions">
            <button class="action-btn copy-btn" onclick="copyTextToClipboard('${encodeURIComponent(result.translatedText)}')">
                <i class="fas fa-clipboard"></i> 复制
            </button>
            <button class="action-btn copy-to-input-btn" onclick="copyToInput('${encodeURIComponent(result.translatedText)}')">
                <i class="fas fa-arrow-right"></i> 复制到对话框
            </button>
        </div>
    `;
    
    // 关闭HTML标签
    messageHTML += `
            </div>
        </div>
    `;
    
    // 添加到聊天区域
    chatMessages.innerHTML += messageHTML;
    
    // 保存到当前对话
    saveMessageToCurrentConversation({
        type: 'ai',
        translationResult: result,
        time: new Date().toISOString()
    });
    
    // 滚动到底部
    scrollToBottom();
}

// 获取语言名称
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
    return languageNames[langCode?.toLowerCase()] || langCode;
}

// 文本翻译函数
async function translateText(text, service, fromLang, toLang) {
    console.log('[按钮修复] 发起文本翻译请求:', { 
        textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : ''), 
        service, 
        fromLang, 
        toLang 
    });
    
    try {
        // 构建请求体
        const requestBody = {
            text: text,
            sourceLang: fromLang,
            targetLang: toLang,
            service: service
        };
        
        // 发送请求
        const response = await fetch('/api/translate/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error('文本翻译请求失败: ' + response.status);
        }
        
        const data = await response.json();
        
        if (!data || !data.result) {
            throw new Error('服务器返回无效数据');
        }
        
        console.log('[按钮修复] 文本翻译成功:', data.result);
        
        return {
            originalText: text,
            translatedText: data.result.translatedText,
            service: data.result.service || service,
            fromLang: fromLang,
            toLang: toLang
        };
    } catch (error) {
        console.error('[按钮修复] 文本翻译错误:', error);
        throw error;
    }
}

// 图片翻译函数
async function translateImage(imageFile, service, targetLang) {
    console.log('[按钮修复] 发起图片翻译请求:', { 
        fileName: imageFile.name, 
        fileType: imageFile.type, 
        fileSize: imageFile.size, 
        service, 
        targetLang 
    });
    
    try {
        // 创建FormData
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('targetLang', targetLang);
        formData.append('service', service);
        
        // 发送请求
        const response = await fetch('/api/translate/image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('图片翻译请求失败: ' + response.status);
        }
        
        const data = await response.json();
        
        if (!data || !data.result) {
            throw new Error('服务器返回无效数据');
        }
        
        console.log('[按钮修复] 图片翻译成功:', data.result);
        
        return {
            ocrText: data.result.ocrText,
            translatedText: data.result.translatedText,
            service: data.result.service || service,
            toLang: targetLang
        };
    } catch (error) {
        console.error('[按钮修复] 图片翻译错误:', error);
        throw error;
    }
}

// 添加AI润色消息
function addAIPolishMessage(result) {
    if (!result) return;
    
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const normalStyle = result.normalStyle || '常规优化风格润色失败';
    const rephraseStyle = result.rephraseStyle || '转换语言风格润色失败';
    
    // 创建AI消息HTML
    let messageHTML = `
        <div class="message ai">
            <div class="message-content">
                <div class="service-info">
                    <span>🤖 由 ${result.service || 'ChatGPT'} 提供的润色</span>
                </div>
                <div class="polish-results">
                    <div class="result-group">
                        <div class="content-header">常规优化</div>
                        <div class="content-body">${normalStyle}</div>
                    </div>
                    <div class="result-group">
                        <div class="content-header">转换语言风格</div>
                        <div class="content-body">${rephraseStyle}</div>
                    </div>
                </div>
                <div class="message-actions">
                    <button class="action-btn copy-btn" onclick="copyTextToClipboard('${encodeURIComponent(normalStyle)}')">
                        <i class="fas fa-clipboard"></i> 复制常规风格
                    </button>
                    <button class="action-btn copy-btn" onclick="copyTextToClipboard('${encodeURIComponent(rephraseStyle)}')">
                        <i class="fas fa-clipboard"></i> 复制转换风格
                    </button>
                    <button class="action-btn copy-to-input-btn" onclick="copyToInput('${encodeURIComponent(normalStyle)}')">
                        <i class="fas fa-arrow-right"></i> 复制到对话框
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 添加到聊天区域
    chatMessages.innerHTML += messageHTML;
    
    // 保存到当前对话
    saveMessageToCurrentConversation({
        type: 'ai',
        polishResult: {
            normalStyle: normalStyle,
            rephraseStyle: rephraseStyle,
            service: result.service || 'ChatGPT'
        },
        time: new Date().toISOString()
    });
    
    // 滚动到底部
    scrollToBottom();
}

// 对话管理相关功能
let conversations = [];
let currentConversationId = null;

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
        try {
            conversations = JSON.parse(savedConversations);
        } catch (error) {
            console.error('[按钮修复] 加载对话历史出错:', error);
            conversations = [];
        }
    }
}

// 保存对话历史到本地存储
function saveConversationsToStorage() {
    try {
        localStorage.setItem('tranoptim-conversations', JSON.stringify(conversations));
    } catch (error) {
        console.error('[按钮修复] 保存对话历史出错:', error);
        showFixNotification('保存对话历史失败', 'error');
    }
}

// 创建新对话
function createNewConversation() {
    // 保存当前翻译和润色模型设置
    const currentTranslateService = document.querySelector('input[name="translate-service"]:checked')?.value || 'gpt';
    const currentPolishService = document.querySelector('input[name="polish-service"]:checked')?.value || 'gpt';
    
    // 生成唯一ID
    const newId = 'conv-' + Date.now().toString();
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
    
    // 确保新对话时保留选定的翻译和润色模型
    document.querySelector(`input[name="translate-service"][value="${currentTranslateService}"]`)?.checked = true;
    document.querySelector(`input[name="polish-service"][value="${currentPolishService}"]`)?.checked = true;
    
    // 保存设置到localStorage
    localStorage.setItem('lastTranslateService', currentTranslateService);
    localStorage.setItem('lastPolishService', currentPolishService);
    
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
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    // 如果是空对话，显示欢迎消息
    if (conversation.messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="message system">
                <div class="message-content">
                    <p>👋 欢迎使用 TranOptim 智能翻译与润色工具！</p>
                    <p>您可以直接输入文本进行翻译，或者上传图片进行图像文本翻译。</p>
                </div>
            </div>
        `;
    } else {
        // 加载对话消息
        conversation.messages.forEach(msg => {
            if (msg.type === 'user') {
                // 用户消息
                chatMessages.innerHTML += `
                    <div class="message user">
                        <div class="message-content">
                            <p>${msg.content}</p>
                        </div>
                    </div>
                `;
            } else if (msg.type === 'ai') {
                // AI回复消息
                if (msg.translationResult) {
                    // 翻译结果
                    const result = msg.translationResult;
                    chatMessages.innerHTML += `
                        <div class="message ai">
                            <div class="message-content">
                                <div class="service-info">
                                    <span>🤖 由 ${result.service || 'ChatGPT'} 提供的翻译</span>
                                </div>
                                <div class="translated-text">
                                    ${result.translatedText}
                                </div>
                                <div class="message-actions">
                                    <button class="action-btn copy-btn" onclick="copyTextToClipboard('${encodeURIComponent(result.translatedText)}')">
                                        <i class="fas fa-clipboard"></i> 复制
                                    </button>
                                    <button class="action-btn copy-to-input-btn" onclick="copyToInput('${encodeURIComponent(result.translatedText)}')">
                                        <i class="fas fa-arrow-right"></i> 复制到对话框
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (msg.polishResult) {
                    // 润色结果
                    const result = msg.polishResult;
                    chatMessages.innerHTML += `
                        <div class="message ai">
                            <div class="message-content">
                                <div class="service-info">
                                    <span>🤖 由 ${result.service || 'ChatGPT'} 提供的润色</span>
                                </div>
                                <div class="polish-results">
                                    <div class="result-group">
                                        <div class="content-header">常规优化</div>
                                        <div class="content-body">${result.normalStyle}</div>
                                    </div>
                                    <div class="result-group">
                                        <div class="content-header">转换语言风格</div>
                                        <div class="content-body">${result.rephraseStyle}</div>
                                    </div>
                                </div>
                                <div class="message-actions">
                                    <button class="action-btn copy-btn" onclick="copyTextToClipboard('${encodeURIComponent(result.normalStyle)}')">
                                        <i class="fas fa-clipboard"></i> 复制常规风格
                                    </button>
                                    <button class="action-btn copy-btn" onclick="copyTextToClipboard('${encodeURIComponent(result.rephraseStyle)}')">
                                        <i class="fas fa-clipboard"></i> 复制转换风格
                                    </button>
                                    <button class="action-btn copy-to-input-btn" onclick="copyToInput('${encodeURIComponent(result.normalStyle)}')">
                                        <i class="fas fa-arrow-right"></i> 复制到对话框
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        });
    }
    
    // 滚动到底部
    scrollToBottom();
}

// 清空所有对话记录
function clearAllConversations() {
    // 清空数组
    conversations = [];
    
    // 清空本地存储
    localStorage.removeItem('tranoptim-conversations');
    
    // 创建新的对话
    createNewConversation();
}

// 渲染对话列表
function renderConversationList() {
    const conversationList = document.getElementById('conversationList');
    if (!conversationList) return;
    
    conversationList.innerHTML = '';
    
    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        if (conv.id === currentConversationId) {
            item.classList.add('active');
        }
        
        item.innerHTML = `
            <div class="conversation-icon">
                <i class="fas fa-comments"></i>
            </div>
            <div class="conversation-title">${conv.title}</div>
        `;
        
        // 点击加载对话
        item.addEventListener('click', function() {
            loadConversation(conv.id);
            // 更新活动状态
            document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
        
        conversationList.appendChild(item);
    });
}

// 保存消息到当前对话
function saveMessageToCurrentConversation(message) {
    if (!currentConversationId) return;
    
    // 查找当前对话
    const conversationIndex = conversations.findIndex(conv => conv.id === currentConversationId);
    if (conversationIndex === -1) return;
    
    // 添加消息
    conversations[conversationIndex].messages.push(message);
    
    // 更新时间戳
    conversations[conversationIndex].updatedAt = new Date().toISOString();
    
    // 更新对话标题（如果是用户消息）
    if (message.type === 'user' && message.content) {
        const title = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '');
        conversations[conversationIndex].title = title;
    }
    
    // 保存到本地存储
    saveConversationsToStorage();
    
    // 更新UI
    renderConversationList();
}

// 确保在页面卸载前保存所有状态
window.addEventListener('beforeunload', function() {
    // 保存当前会话数据
    saveConversationsToStorage();
});

console.log('[按钮修复] 增强版脚本已加载'); 