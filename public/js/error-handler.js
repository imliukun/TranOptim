// TranOptim 错误处理模块
class ErrorHandler {
    constructor() {
        this.errorMessages = {
            // API密钥相关错误
            'INVALID_API_KEY': {
                title: 'API密钥无效',
                message: '您的API密钥已过期或无效，请检查密钥配置',
                solutions: [
                    '检查API密钥是否正确复制',
                    '确认API密钥是否已过期',
                    '联系服务提供商重新获取密钥'
                ],
                icon: '🔑'
            },
            'API_QUOTA_EXCEEDED': {
                title: 'API使用量已达上限',
                message: '当前API服务的使用量已达到限制',
                solutions: [
                    '等待使用量重置（通常每月重置）',
                    '升级API服务套餐',
                    '尝试使用其他翻译服务'
                ],
                icon: '📊'
            },
            'NETWORK_ERROR': {
                title: '网络连接错误',
                message: '无法连接到翻译服务，请检查网络设置',
                solutions: [
                    '检查网络连接是否正常',
                    '尝试配置代理服务器',
                    '稍后重试或更换翻译服务'
                ],
                icon: '🌐'
            },
            'IMAGE_PROCESSING_ERROR': {
                title: '图片处理失败',
                message: '无法处理上传的图片，请检查图片格式',
                solutions: [
                    '确保图片格式为PNG、JPG或WebP',
                    '检查图片大小不超过10MB',
                    '尝试重新上传图片'
                ],
                icon: '🖼️'
            },
            'TEXT_TOO_LONG': {
                title: '文本长度超限',
                message: '输入的文本太长，请分段处理',
                solutions: [
                    '将长文本分成较短的段落',
                    '使用批量处理功能',
                    '删除不必要的内容'
                ],
                icon: '📝'
            },
            'SERVICE_UNAVAILABLE': {
                title: '服务暂时不可用',
                message: '翻译服务暂时无法使用',
                solutions: [
                    '稍后重试',
                    '尝试使用其他翻译服务',
                    '检查服务状态页面'
                ],
                icon: '⚠️'
            }
        };
    }

    // 分析错误并返回用户友好的信息
    analyzeError(error, context = {}) {
        let errorType = 'UNKNOWN_ERROR';
        let errorDetails = {
            title: '未知错误',
            message: error.message || '发生了未知错误',
            solutions: ['请稍后重试', '如果问题持续存在，请联系技术支持'],
            icon: '❌'
        };

        // 根据错误信息判断错误类型
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('invalid') && errorMessage.includes('api')) {
            errorType = 'INVALID_API_KEY';
        } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
            errorType = 'API_QUOTA_EXCEEDED';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection') || 
                   errorMessage.includes('econnreset') || errorMessage.includes('timeout')) {
            errorType = 'NETWORK_ERROR';
        } else if (errorMessage.includes('image') || context.type === 'image') {
            errorType = 'IMAGE_PROCESSING_ERROR';
        } else if (errorMessage.includes('too long') || errorMessage.includes('length')) {
            errorType = 'TEXT_TOO_LONG';
        } else if (errorMessage.includes('unavailable') || errorMessage.includes('503') || 
                   errorMessage.includes('502')) {
            errorType = 'SERVICE_UNAVAILABLE';
        }

        // 获取对应的错误信息
        if (this.errorMessages[errorType]) {
            errorDetails = this.errorMessages[errorType];
        }

        return {
            type: errorType,
            details: errorDetails,
            originalError: error,
            context: context,
            timestamp: new Date().toISOString()
        };
    }

    // 显示友好的错误提示
    showUserFriendlyError(error, context = {}) {
        const analysis = this.analyzeError(error, context);
        
        // 创建错误提示HTML
        const errorHtml = this.createErrorHTML(analysis);
        
        // 显示错误对话框
        this.showErrorDialog(errorHtml);
        
        // 记录错误日志
        this.logError(analysis);
        
        return analysis;
    }

    // 创建错误提示HTML
    createErrorHTML(analysis) {
        const { details } = analysis;
        
        const solutionsHtml = details.solutions.map(solution => 
            `<li>${solution}</li>`
        ).join('');

        return `
            <div class="error-dialog">
                <div class="error-header">
                    <span class="error-icon">${details.icon}</span>
                    <h3 class="error-title">${details.title}</h3>
                </div>
                <div class="error-content">
                    <p class="error-message">${details.message}</p>
                    <div class="error-solutions">
                        <h4>建议解决方案：</h4>
                        <ul>${solutionsHtml}</ul>
                    </div>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary retry-btn">重试</button>
                    <button class="btn btn-secondary close-btn">关闭</button>
                    <button class="btn btn-info help-btn">获取帮助</button>
                </div>
            </div>
        `;
    }

    // 显示错误对话框
    showErrorDialog(errorHtml) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'error-modal';
        modal.innerHTML = `
            <div class="error-modal-overlay">
                <div class="error-modal-content">
                    ${errorHtml}
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 绑定事件
        this.bindErrorDialogEvents(modal);

        // 显示动画
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        return modal;
    }

    // 绑定错误对话框事件
    bindErrorDialogEvents(modal) {
        const retryBtn = modal.querySelector('.retry-btn');
        const closeBtn = modal.querySelector('.close-btn');
        const helpBtn = modal.querySelector('.help-btn');

        // 重试按钮
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.closeErrorDialog(modal);
                // 触发重试事件
                document.dispatchEvent(new CustomEvent('errorRetry'));
            });
        }

        // 关闭按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeErrorDialog(modal);
            });
        }

        // 帮助按钮
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelpDialog();
            });
        }

        // 点击遮罩关闭
        const overlay = modal.querySelector('.error-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeErrorDialog(modal);
                }
            });
        }
    }

    // 关闭错误对话框
    closeErrorDialog(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    // 显示帮助对话框
    showHelpDialog() {
        const helpContent = `
            <div class="help-dialog">
                <h3>常见问题解决指南</h3>
                <div class="help-sections">
                    <div class="help-section">
                        <h4>API密钥问题</h4>
                        <p>如果您遇到API密钥相关错误，请：</p>
                        <ul>
                            <li>前往对应服务商官网重新获取密钥</li>
                            <li>确保密钥具有所需权限</li>
                            <li>检查密钥是否有使用限制</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h4>网络连接问题</h4>
                        <p>如果无法连接到翻译服务：</p>
                        <ul>
                            <li>检查网络连接状态</li>
                            <li>尝试配置代理服务器</li>
                            <li>确认防火墙设置</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h4>联系支持</h4>
                        <p>如果问题仍未解决，请联系技术支持团队获取帮助。</p>
                    </div>
                </div>
            </div>
        `;

        // 创建帮助模态框
        const helpModal = document.createElement('div');
        helpModal.className = 'help-modal';
        helpModal.innerHTML = `
            <div class="help-modal-overlay">
                <div class="help-modal-content">
                    ${helpContent}
                    <div class="help-actions">
                        <button class="btn btn-primary close-help-btn">关闭</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // 绑定关闭事件
        const closeHelpBtn = helpModal.querySelector('.close-help-btn');
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => {
                this.closeErrorDialog(helpModal);
            });
        }

        setTimeout(() => {
            helpModal.classList.add('show');
        }, 10);
    }

    // 记录错误日志
    logError(analysis) {
        const logData = {
            timestamp: analysis.timestamp,
            type: analysis.type,
            message: analysis.details.message,
            originalError: analysis.originalError.message,
            context: analysis.context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // 发送到服务器（如果需要）
        try {
            fetch('/api/log-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            }).catch(err => {
                console.warn('无法发送错误日志到服务器:', err);
            });
        } catch (err) {
            console.warn('错误日志发送失败:', err);
        }

        // 本地日志记录
        console.error('[TranOptim Error]', logData);
    }

    // 获取网络状态
    getNetworkStatus() {
        return {
            online: navigator.onLine,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
            timestamp: new Date().toISOString()
        };
    }

    // 检测API服务状态
    async checkServiceStatus(service) {
        const endpoints = {
            'gpt': 'https://api.openai.com/v1/models',
            'gemini': 'https://generativelanguage.googleapis.com/v1beta/models',
            'deepseek': 'https://api.siliconflow.cn/v1/models',
            'qwen': 'https://api.siliconflow.cn/v1/models',
            'doubao': 'https://ark.cn-beijing.volces.com/api/v3/models'
        };

        const endpoint = endpoints[service];
        if (!endpoint) return { status: 'unknown', service };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(endpoint, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            return {
                status: 'online',
                service,
                responseTime: Date.now()
            };
        } catch (error) {
            return {
                status: 'offline',
                service,
                error: error.message
            };
        }
    }
}

// 创建全局错误处理器实例
window.TranOptimErrorHandler = new ErrorHandler();

// 导出错误处理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} 