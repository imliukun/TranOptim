// TranOptim - 图片处理模块

// 使用IIFE隔离作用域
(function() {
    'use strict';
    
    console.log('[图片处理] 初始化图片处理模块');
    
    // 全局状态 - 导出到window对象，便于其他模块访问
    window.currentImageFile = null;
    
    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        initImageHandler();
    });
    
    function initImageHandler() {
        console.log('[图片处理] 初始化图片处理功能');
        
        // 获取DOM元素
        const uploadBtn = document.getElementById('uploadBtn');
        const imageUpload = document.getElementById('imageUpload');
        const chatInput = document.getElementById('chatInput');
        
        // 创建图片预览容器
        createImagePreviewContainer();
        
        // 绑定上传按钮点击事件
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[图片处理] 上传按钮点击');
                if (imageUpload) {
                    imageUpload.click();
                }
            });
        }
        
        // 绑定文件选择事件
        if (imageUpload) {
            imageUpload.addEventListener('change', function(e) {
                console.log('[图片处理] 文件选择变更');
                if (e.target.files.length) {
                    handleImageUpload(e.target.files[0]);
                }
            });
        }
        
        // 绑定剪贴板粘贴事件
        if (chatInput) {
            chatInput.addEventListener('paste', function(e) {
                // 获取剪贴板数据
                const clipboardData = e.clipboardData || window.clipboardData;
                if (!clipboardData) return;
                
                const items = clipboardData.items;
                if (!items) return;
                
                // 检查是否粘贴了图片
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        // 阻止默认粘贴行为
                        e.preventDefault();
                        
                        // 获取图片文件
                        const file = items[i].getAsFile();
                        if (file) {
                            console.log('[图片处理] 从剪贴板粘贴图片');
                            handleImageUpload(file);
                        }
                        break;
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
                
                // 检查是否有拖放的文件
                if (e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.indexOf('image') !== -1) {
                        console.log('[图片处理] 拖放上传图片');
                        handleImageUpload(file);
                    }
                }
            });
        }
        
        console.log('[图片处理] 图片处理功能初始化完成');
    }
    
    // 创建图片预览容器
    function createImagePreviewContainer() {
        // 检查是否已存在
        let container = document.querySelector('.image-preview-container');
        if (container) {
            console.log('[图片处理] 图片预览容器已存在');
            return container;
        }
        
        // 创建容器
        container = document.createElement('div');
        container.className = 'image-preview-container';
        container.style.display = 'none';
        container.innerHTML = `
            <div class="preview-wrapper">
                <img src="" alt="图片预览" class="preview-image">
                <button class="remove-image-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // 在输入框上方插入
        const inputWrapper = document.querySelector('.textarea-wrapper');
        if (inputWrapper) {
            inputWrapper.parentNode.insertBefore(container, inputWrapper);
            
            // 绑定移除图片按钮
            const removeBtn = container.querySelector('.remove-image-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    removeUploadedImage();
                });
            }
        } else {
            console.error('[图片处理] 未找到合适的位置插入图片预览容器');
        }
        
        return container;
    }
    
    // 处理图片上传
    function handleImageUpload(file) {
        if (!file) {
            console.error('[图片处理] 没有提供文件');
            return;
        }
        
        if (!file.type.match('image.*')) {
            showNotification('请上传图片文件');
            return;
        }
        
        console.log('[图片处理] 处理图片上传:', file.name, file.type, file.size);
        
        // 保存到全局变量
        window.currentImageFile = file;
        
        // 显示图片预览
        const container = document.querySelector('.image-preview-container');
        if (container) {
            const reader = new FileReader();
            reader.onload = function(e) {
                container.style.display = 'block';
                const previewImage = container.querySelector('.preview-image');
                if (previewImage) {
                    previewImage.src = e.target.result;
                }
                
                // 清空输入框中可能存在的"[图片已上传]"文本
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    chatInput.value = chatInput.value.replace(/\[图片已上传\]\s*/g, '');
                }
                
                showNotification('图片已上传，可以点击翻译按钮进行处理');
            };
            
            reader.readAsDataURL(file);
        }
        
        // 重置文件输入控件
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.value = '';
        }
    }
    
    // 移除上传的图片
    function removeUploadedImage() {
        console.log('[图片处理] 移除上传的图片');
        
        // 重置全局变量
        window.currentImageFile = null;
        
        // 隐藏预览容器
        const container = document.querySelector('.image-preview-container');
        if (container) {
            container.style.display = 'none';
            const previewImage = container.querySelector('.preview-image');
            if (previewImage) {
                previewImage.src = '';
            }
        }
        
        // 重置文件输入控件
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.value = '';
        }
        
        showNotification('已移除图片');
    }
    
    // 显示通知
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.className = 'notification';
        notification.classList.add(`notification-${type}`);
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(function() {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // 导出公共函数
    window.ImageHandler = {
        handleImageUpload: handleImageUpload,
        removeUploadedImage: removeUploadedImage
    };
})(); 