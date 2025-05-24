// TranOptim - 输入框高度自动调整脚本

// 使用IIFE隔离作用域
(function() {
    'use strict';
    
    console.log('[输入框自动调整] 初始化输入框高度自动调整模块');
    
    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        initInputAutoResize();
    });
    
    // 初始化输入框自动调整高度功能
    function initInputAutoResize() {
        console.log('[输入框自动调整] 正在初始化输入框高度自动调整功能');
        
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            console.error('[输入框自动调整] 找不到chatInput元素');
            return;
        }
        
        // 设置初始高度
        autoResizeInput(chatInput);
        
        // 监听输入事件
        chatInput.addEventListener('input', function() {
            autoResizeInput(this);
        });
        
        // 监听键盘事件
        chatInput.addEventListener('keydown', function(e) {
            // 如果是Enter键并且没有按下Shift键，则阻止默认行为（换行）
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // 这里不做任何操作，因为发送逻辑在其他地方处理
            } else if (e.key === 'Enter' && e.shiftKey) {
                // 如果是Shift+Enter，则允许换行并等待内容更新后调整高度
                setTimeout(() => autoResizeInput(chatInput), 0);
            }
        });
        
        // 监听粘贴事件
        chatInput.addEventListener('paste', function() {
            // 等待粘贴完成后再调整高度
            setTimeout(() => autoResizeInput(this), 0);
        });
        
        // 窗口大小变化时重新调整
        window.addEventListener('resize', function() {
            autoResizeInput(chatInput);
        });
        
        // 检查是否有多行文本溢出情况
        checkOverflow(chatInput);
        
        console.log('[输入框自动调整] 初始化完成');
    }
    
    // 自动调整输入框高度函数
    function autoResizeInput(element) {
        if (!element) return;
        
        // 保存当前滚动条位置
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
        
        // 重置高度，以便准确计算新高度
        element.style.height = 'auto';
        
        // 计算新的高度（内容高度+padding）
        const newHeight = element.scrollHeight;
        
        // 设置最小和最大高度限制
        const minHeight = 40; // 最小高度
        const maxHeight = 200; // 最大高度
        
        // 应用高度限制
        if (newHeight < minHeight) {
            element.style.height = minHeight + 'px';
        } else if (newHeight > maxHeight) {
            element.style.height = maxHeight + 'px';
            element.style.overflowY = 'auto';
        } else {
            element.style.height = newHeight + 'px';
            element.style.overflowY = 'hidden';
        }
        
        // 恢复滚动位置
        window.scrollTo(0, scrollPos);
    }
    
    // 检查是否有多行文本溢出
    function checkOverflow(element) {
        if (!element) return;
        
        // 如果有文本，检查是否需要调整高度
        if (element.value.trim().length > 0) {
            autoResizeInput(element);
        }
    }
    
    // 导出公共函数
    window.InputAutoResize = {
        autoResize: autoResizeInput,
        init: initInputAutoResize
    };
})(); 