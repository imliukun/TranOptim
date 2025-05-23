(function() {
    console.log('[EMERGENCY FIX] 紧急按钮修复脚本加载');
    
    // 强制事件绑定函数
    function forceBindButtons() {
        console.log('[EMERGENCY FIX] 尝试强制绑定按钮事件');
        
        // 确保DOM已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initButtons);
        } else {
            initButtons();
        }
        
        // 防止其他脚本干扰，每秒检查一次
        setInterval(checkButtons, 1000);
    }
    
    // 初始化按钮
    function initButtons() {
        console.log('[EMERGENCY FIX] DOM已加载，初始化按钮');
        
        // 获取主要功能按钮元素
        const translateBtn = document.getElementById('translateBtn');
        const polishBtn = document.getElementById('polishBtn');
        
        // 获取其他按钮元素
        const newChatBtn = document.getElementById('newChatBtn');
        const uploadBtn = document.getElementById('uploadBtn');
        const translateSettingsBtn = document.getElementById('translateSettingsBtn');
        const polishSettingsBtn = document.getElementById('polishSettingsBtn');
        const clearChatsBtn = document.getElementById('clearChatsBtn');
        
        // 绑定主要功能按钮
        if (translateBtn) {
            translateBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[EMERGENCY FIX] 翻译按钮被点击');
                
                try {
                    if (typeof window.handleTranslate === 'function') {
                        window.handleTranslate();
                    } else {
                        customTranslate();
                    }
                } catch(error) {
                    console.error('[EMERGENCY FIX] 调用翻译函数出错:', error);
                    alert('翻译处理失败: ' + error.message);
                }
            };
        } else {
            console.error('[EMERGENCY FIX] 未找到翻译按钮');
        }
        
        if (polishBtn) {
            polishBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[EMERGENCY FIX] 润色按钮被点击');
                
                try {
                    if (typeof window.handlePolish === 'function') {
                        window.handlePolish();
                    } else {
                        customPolish();
                    }
                } catch(error) {
                    console.error('[EMERGENCY FIX] 调用润色函数出错:', error);
                    alert('润色处理失败: ' + error.message);
                }
            };
        } else {
            console.error('[EMERGENCY FIX] 未找到润色按钮');
        }
        
        // 绑定新会话按钮
        if (newChatBtn) {
            newChatBtn.onclick = function(e) {
                console.log('[EMERGENCY FIX] 新对话按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    // 尝试使用已有的函数
                    if (typeof window.createNewConversation === 'function') {
                        window.createNewConversation();
                    } else {
                        // 备用实现：清空聊天区域
                        const chatMessages = document.getElementById('chatMessages');
                        if (chatMessages) {
                            chatMessages.innerHTML = `
                                <div class="message system">
                                    <div class="message-content">
                                        <p>👋 新对话已创建！</p>
                                        <p>您可以直接输入文本进行翻译，或者上传图片进行图像文本翻译。</p>
                                    </div>
                                </div>
                            `;
                        }
                        
                        // 清空输入框
                        const chatInput = document.getElementById('chatInput');
                        if (chatInput) {
                            chatInput.value = '';
                        }
                    }
                } catch(error) {
                    console.error('[EMERGENCY FIX] 创建新对话出错:', error);
                }
            };
        } else {
            console.error('[EMERGENCY FIX] 未找到新对话按钮');
        }
        
        // 绑定图片上传按钮
        if (uploadBtn) {
            uploadBtn.onclick = function(e) {
                console.log('[EMERGENCY FIX] 图片上传按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                // 触发文件选择
                const imageUpload = document.getElementById('imageUpload');
                if (imageUpload) {
                    imageUpload.click();
                } else {
                    alert('未找到图片上传控件');
                }
            };
        } else {
            console.error('[EMERGENCY FIX] 未找到图片上传按钮');
        }
        
        // 为图片上传控件添加事件
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.onchange = function(e) {
                if (e.target.files.length) {
                    console.log('[EMERGENCY FIX] 已选择图片:', e.target.files[0].name);
                    
                    try {
                        // 使用已有函数处理上传
                        if (typeof window.handleImageUpload === 'function') {
                            window.handleImageUpload(e.target.files[0]);
                        } else {
                            // 简单的预览实现
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                // 找图片预览容器或创建一个
                                let previewContainer = document.querySelector('.image-preview-container');
                                if (!previewContainer) {
                                    previewContainer = document.createElement('div');
                                    previewContainer.className = 'image-preview-container';
                                    
                                    // 找位置插入
                                    const inputWrapper = document.querySelector('.textarea-wrapper');
                                    if (inputWrapper) {
                                        inputWrapper.parentNode.insertBefore(previewContainer, inputWrapper);
                                    } else {
                                        // 找不到正确位置，就在输入框前插入
                                        const chatInput = document.getElementById('chatInput');
                                        if (chatInput && chatInput.parentNode) {
                                            chatInput.parentNode.insertBefore(previewContainer, chatInput);
                                        }
                                    }
                                }
                                
                                previewContainer.innerHTML = `
                                    <div style="margin-bottom:10px;position:relative;display:inline-block;">
                                        <img src="${e.target.result}" alt="预览图片" style="max-width:200px;max-height:150px;border-radius:5px;">
                                        <button onclick="this.parentNode.parentNode.style.display='none';document.getElementById('imageUpload').value='';" 
                                                style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;background:#f44336;color:white;border:none;cursor:pointer;">
                                            ×
                                        </button>
                                    </div>
                                    <p style="font-size:12px;color:#666;">图片已上传，点击翻译按钮开始处理</p>
                                `;
                                previewContainer.style.display = 'block';
                            };
                            reader.readAsDataURL(e.target.files[0]);
                        }
                    } catch(error) {
                        console.error('[EMERGENCY FIX] 处理图片上传出错:', error);
                    }
                }
            };
        }
        
        // 绑定翻译设置按钮
        if (translateSettingsBtn) {
            translateSettingsBtn.onclick = function(e) {
                console.log('[EMERGENCY FIX] 翻译设置按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                // 切换设置面板显示
                const settingsPanel = document.getElementById('translateSettings');
                if (settingsPanel) {
                    // 强制确保设置面板可见
                    settingsPanel.style.display = 'block';
                    settingsPanel.classList.toggle('active');
                    
                    // 打印调试信息
                    console.log('[EMERGENCY FIX] 翻译设置面板状态:', 
                        settingsPanel.classList.contains('active') ? '已显示' : '已隐藏',
                        '样式:', window.getComputedStyle(settingsPanel).display);
                    
                    // 关闭其他设置面板
                    const otherPanel = document.getElementById('polishSettings');
                    if (otherPanel) {
                        otherPanel.classList.remove('active');
                    }
                } else {
                    console.error('[EMERGENCY FIX] 未找到翻译设置面板');
                }
            };
        } else {
            console.error('[EMERGENCY FIX] 未找到翻译设置按钮');
        }
        
        // 绑定润色设置按钮
        if (polishSettingsBtn) {
            polishSettingsBtn.onclick = function(e) {
                console.log('[EMERGENCY FIX] 润色设置按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                // 切换设置面板显示
                const settingsPanel = document.getElementById('polishSettings');
                if (settingsPanel) {
                    // 强制确保设置面板可见
                    settingsPanel.style.display = 'block';
                    settingsPanel.classList.toggle('active');
                    
                    // 打印调试信息
                    console.log('[EMERGENCY FIX] 润色设置面板状态:', 
                        settingsPanel.classList.contains('active') ? '已显示' : '已隐藏',
                        '样式:', window.getComputedStyle(settingsPanel).display);
                    
                    // 关闭其他设置面板
                    const otherPanel = document.getElementById('translateSettings');
                    if (otherPanel) {
                        otherPanel.classList.remove('active');
                    }
                } else {
                    console.error('[EMERGENCY FIX] 未找到润色设置面板');
                }
            };
        } else {
            console.error('[EMERGENCY FIX] 未找到润色设置按钮');
        }
        
        // 绑定清空对话按钮
        if (clearChatsBtn) {
            clearChatsBtn.onclick = function(e) {
                console.log('[EMERGENCY FIX] 清空对话按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                if (confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
                    try {
                        // 使用已有函数
                        if (typeof window.clearAllConversations === 'function') {
                            window.clearAllConversations();
                        } else {
                            // 备用实现：清空对话列表和当前会话
                            const conversationList = document.getElementById('conversationList');
                            if (conversationList) {
                                conversationList.innerHTML = '';
                            }
                            
                            // 清空聊天区域，创建欢迎消息
                            const chatMessages = document.getElementById('chatMessages');
                            if (chatMessages) {
                                chatMessages.innerHTML = `
                                    <div class="message system">
                                        <div class="message-content">
                                            <p>👋 所有对话已清空！</p>
                                            <p>您可以直接输入文本进行翻译，或者上传图片进行图像文本翻译。</p>
                                        </div>
                                    </div>
                                `;
                            }
                            
                            // 清空输入框
                            const chatInput = document.getElementById('chatInput');
                            if (chatInput) {
                                chatInput.value = '';
                            }
                            
                            // 尝试清除本地存储
                            try {
                                localStorage.removeItem('tranoptim-conversations');
                            } catch(e) {
                                console.error('[EMERGENCY FIX] 清除本地存储失败:', e);
                            }
                        }
                    } catch(error) {
                        console.error('[EMERGENCY FIX] 清空对话出错:', error);
                    }
                }
            };
        } else {
            console.error('[EMERGENCY FIX] 未找到清空对话按钮');
        }
        
        // 绑定关闭设置面板按钮
        const closeSettingsBtns = document.querySelectorAll('.close-settings-btn');
        closeSettingsBtns.forEach(btn => {
            btn.onclick = function(e) {
                console.log('[EMERGENCY FIX] 关闭设置按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                // 找到最近的设置面板并关闭
                const panel = this.closest('.settings-panel');
                if (panel) {
                    panel.classList.remove('active');
                }
            };
        });
        
        // 点击页面其他地方关闭设置面板
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.settings-panel') && !e.target.closest('.settings-btn')) {
                const panels = document.querySelectorAll('.settings-panel');
                panels.forEach(panel => {
                    panel.classList.remove('active');
                });
            }
        });
        
        console.log('[EMERGENCY FIX] 所有按钮事件绑定完成');
    }
    
    // 定期检查按钮是否仍然绑定了事件
    function checkButtons() {
        const criticalButtons = [
            'translateBtn',
            'polishBtn',
            'newChatBtn',
            'uploadBtn',
            'translateSettingsBtn',
            'polishSettingsBtn',
            'clearChatsBtn'
        ];
        
        let needsRebind = false;
        
        criticalButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn && !btn.onclick) {
                console.log(`[EMERGENCY FIX] 检测到 ${btnId} 按钮事件丢失，将重新绑定`);
                needsRebind = true;
            }
        });
        
        if (needsRebind) {
            initButtons();
        }
    }
    
    // 自定义简单的翻译实现（备用方案）
    function customTranslate() {
        console.log('[EMERGENCY FIX] 使用自定义翻译函数');
        
        // 获取输入文本
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            alert('无法找到输入框元素');
            return;
        }
        
        const text = chatInput.value.trim();
        if (!text) {
            alert('请输入要翻译的文本');
            return;
        }
        
        // 创建一个简单的消息显示
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            // 添加用户消息
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.innerHTML = `<div class="message-content"><p>${text}</p></div>`;
            chatMessages.appendChild(userMsg);
            
            // 添加翻译结果消息
            const aiMsg = document.createElement('div');
            aiMsg.className = 'message ai';
            aiMsg.innerHTML = `
                <div class="message-content">
                    <div class="service-info">
                        <span>🤖 模拟翻译结果</span>
                    </div>
                    <div class="translation-result">
                        <div class="result-title">
                            <i class="fas fa-language"></i> 翻译结果
                        </div>
                        <div class="translated-text">
                            ${text} (这是一个模拟翻译结果，实际翻译功能未能正常工作)
                        </div>
                    </div>
                    <div class="message-actions">
                        <button class="message-action-btn">
                            <i class="fas fa-clipboard"></i> 复制
                        </button>
                    </div>
                </div>
            `;
            chatMessages.appendChild(aiMsg);
            
            // 清空输入框
            chatInput.value = '';
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            alert('无法找到消息显示区域');
        }
    }
    
    // 自定义简单的润色实现（备用方案）
    function customPolish() {
        console.log('[EMERGENCY FIX] 使用自定义润色函数');
        
        // 获取输入文本
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            alert('无法找到输入框元素');
            return;
        }
        
        const text = chatInput.value.trim();
        if (!text) {
            alert('请输入要润色的文本');
            return;
        }
        
        // 创建一个简单的消息显示
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            // 添加用户消息
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.innerHTML = `<div class="message-content"><p>${text}</p></div>`;
            chatMessages.appendChild(userMsg);
            
            // 添加润色结果消息
            const aiMsg = document.createElement('div');
            aiMsg.className = 'message ai';
            aiMsg.innerHTML = `
                <div class="message-content">
                    <div class="service-info">
                        <span>✨ 模拟润色结果</span>
                    </div>
                    <div class="polish-results">
                        <div class="result-group">
                            <div class="content-header">模拟润色</div>
                            <div class="content-body">${text} (这是一个模拟润色结果，实际润色功能未能正常工作)</div>
                        </div>
                    </div>
                    <div class="message-actions">
                        <button class="message-action-btn">
                            <i class="fas fa-clipboard"></i> 复制
                        </button>
                    </div>
                </div>
            `;
            chatMessages.appendChild(aiMsg);
            
            // 清空输入框
            chatInput.value = '';
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            alert('无法找到消息显示区域');
        }
    }
    
    // 立即执行，不等待
    forceBindButtons();
    
    // 导出到全局
    window.emergencyButtonFix = {
        rebind: initButtons,
        translate: customTranslate,
        polish: customPolish
    };
    
    console.log('[EMERGENCY FIX] 紧急修复脚本已完成加载');
})(); 