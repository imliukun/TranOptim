// TranOptim - 复制功能模块

console.log('[复制功能] 初始化复制功能模块');

// 定义全局复制功能对象
window.CopyFunctions = {
    // 复制文本到剪贴板
    copyToClipboard: function(text, sourceElement = null) {
        // 如果传入的是编码文本，先解码
        if (typeof text === 'string' && text.indexOf('%') !== -1) {
            try {
                text = decodeURIComponent(text);
            } catch (error) {
                console.error('[复制功能] 解码文本失败:', error);
                // 继续使用原始文本
            }
        }
        
        console.log('[复制功能] 复制到剪贴板:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        
        // 尝试使用现代API复制
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    console.log('[复制功能] 使用Clipboard API复制成功');
                    this.showCopyNotification('已复制到剪贴板', sourceElement);
                })
                .catch(err => {
                    console.error('[复制功能] Clipboard API复制失败:', err);
                    // 回退到传统方法
                    this.fallbackCopy(text, sourceElement);
                });
        } else {
            // 使用传统方法
            this.fallbackCopy(text, sourceElement);
        }
    },
    
    // 传统复制方法 - 使用临时textarea
    fallbackCopy: function(text, sourceElement = null) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('[复制功能] 传统方法复制成功');
                this.showCopyNotification('已复制到剪贴板', sourceElement);
            } else {
                console.error('[复制功能] execCommand复制失败');
                this.showCopyNotification('复制失败，请手动复制', sourceElement, 'error');
            }
        } catch (err) {
            console.error('[复制功能] 传统复制方法错误:', err);
            this.showCopyNotification('复制失败，请手动复制', sourceElement, 'error');
        }
        
        document.body.removeChild(textArea);
    },
    
    // 复制到输入框函数
    copyToInput: function(text, sourceElement = null) {
        // 如果传入的是编码文本，先解码
        if (typeof text === 'string' && text.indexOf('%') !== -1) {
            try {
                text = decodeURIComponent(text);
            } catch (error) {
                console.error('[复制功能] 解码文本失败:', error);
                // 继续使用原始文本
            }
        }
        
        console.log('[复制功能] 复制到输入框:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            this.showCopyNotification('无法获取输入框元素', sourceElement, 'error');
            return;
        }
        
        chatInput.value = text;
        chatInput.focus();
        
        // 触发输入事件，以便调整高度
        const event = new Event('input', { bubbles: true });
        chatInput.dispatchEvent(event);
        
        this.showCopyNotification('已复制到对话框', sourceElement);
    },
    
    // 显示复制通知
    showCopyNotification: function(message, sourceElement = null, type = 'success') {
        // 如果提供了源元素，显示在元素附近的通知
        if (sourceElement instanceof HTMLElement) {
            // 首先检查是否已有通知元素，有则移除
            const existingNotification = sourceElement.querySelector('.copy-notification');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            // 创建通知元素
            const notification = document.createElement('div');
            notification.className = `copy-notification ${type}`;
            notification.textContent = message;
            
            // 将通知添加到源元素内
            sourceElement.appendChild(notification);
            
            // 延迟显示，添加淡入效果
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            // 设置自动消失
            setTimeout(() => {
                notification.classList.remove('show');
                // 动画完成后移除元素
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 2000);
        } else {
            // 使用全局通知
            const globalNotification = document.getElementById('notification');
            if (globalNotification) {
                // 设置类型样式
                globalNotification.className = 'notification';
                globalNotification.classList.add(`notification-${type}`);
                
                // 设置消息
                globalNotification.textContent = message;
                
                // 显示通知
                globalNotification.classList.add('show');
                
                // 3秒后自动隐藏
                setTimeout(() => {
                    globalNotification.classList.remove('show');
                }, 3000);
            } else {
                console.error('[复制功能] 未找到通知元素');
                alert(message); // 退化到alert作为最后的备选
            }
        }
    },
    
    // 初始化复制按钮
    initCopyButtons: function() {
        // 为已有的复制按钮绑定事件
        document.querySelectorAll('.copy-btn').forEach(btn => {
            if (!btn.hasAttribute('data-copy-init')) {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    const messageElement = target.closest('.message');
                    const textElement = messageElement.querySelector('.translated-text') || 
                                        messageElement.querySelector('.content-body');
                    
                    if (textElement) {
                        this.copyToClipboard(textElement.textContent, target);
                    }
                });
                btn.setAttribute('data-copy-init', 'true');
            }
        });
        
        // 为润色复制按钮绑定事件
        document.querySelectorAll('.copy-btn-normal, .copy-btn-rephrase').forEach(btn => {
            if (!btn.hasAttribute('data-copy-init')) {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    const messageElement = target.closest('.message');
                    
                    let textElement;
                    if (target.classList.contains('copy-btn-normal')) {
                        textElement = messageElement.querySelector('.result-group:nth-child(1) .content-body');
                    } else {
                        textElement = messageElement.querySelector('.result-group:nth-child(2) .content-body');
                    }
                    
                    if (textElement) {
                        this.copyToClipboard(textElement.textContent, target);
                    }
                });
                btn.setAttribute('data-copy-init', 'true');
            }
        });
        
        // 为复制到输入框按钮绑定事件
        document.querySelectorAll('.copy-to-input-btn').forEach(btn => {
            if (!btn.hasAttribute('data-copy-init')) {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    const messageElement = target.closest('.message');
                    const textElement = messageElement.querySelector('.translated-text') || 
                                        messageElement.querySelector('.result-group:nth-child(1) .content-body');
                    
                    if (textElement) {
                        this.copyToInput(textElement.textContent, target);
                    }
                });
                btn.setAttribute('data-copy-init', 'true');
            }
        });
    },
    
    // 定期检查并初始化新添加的复制按钮
    startCopyButtonsMonitor: function() {
        // 初始化时先执行一次
        this.initCopyButtons();
        
        // 设置定期监控定时器
        setInterval(() => {
            this.initCopyButtons();
        }, 2000);
    }
};

// 页面加载完成后初始化复制功能
document.addEventListener('DOMContentLoaded', function() {
    // 设置全局复制函数，使其能从其他脚本调用
    window.copyTextToClipboard = function(text) {
        window.CopyFunctions.copyToClipboard(text);
    };
    
    window.copyToInput = function(text) {
        window.CopyFunctions.copyToInput(text);
    };
    
    // 在页面加载完成后稍微延迟，确保DOM已完全准备好
    setTimeout(() => {
        window.CopyFunctions.startCopyButtonsMonitor();
    }, 1000);
});

// 添加样式
(function addCopyNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .copy-notification {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background-color: rgba(0, 128, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
            z-index: 1000;
            white-space: nowrap;
        }
        
        .copy-notification.error {
            background-color: rgba(220, 53, 69, 0.8);
        }
        
        .copy-notification.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        
        .message-actions {
            position: relative;
        }
        
        .action-btn {
            position: relative;
        }
    `;
    document.head.appendChild(style);
})(); 