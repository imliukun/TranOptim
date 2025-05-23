// TranOptim - 设置按钮和面板处理脚本

// 立即执行函数，避免污染全局命名空间
(function() {
    'use strict';
    
    console.log('[设置按钮] 初始化设置按钮和面板处理脚本');
    
    // 等待DOM加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 获取设置按钮和面板
        const translateSettingsBtn = document.getElementById('translateSettingsBtn');
        const polishSettingsBtn = document.getElementById('polishSettingsBtn');
        const translateSettingsPanel = document.getElementById('translateSettings');
        const polishSettingsPanel = document.getElementById('polishSettings');
        const closeTranslateSettings = document.getElementById('closeTranslateSettings');
        const closePolishSettings = document.getElementById('closePolishSettings');
        
        // 检查元素是否存在
        console.log('[设置按钮] 检查设置按钮和面板:', {
            translateSettingsBtn: !!translateSettingsBtn,
            polishSettingsBtn: !!polishSettingsBtn,
            translateSettingsPanel: !!translateSettingsPanel,
            polishSettingsPanel: !!polishSettingsPanel
        });
        
        // 切换面板显示状态的函数
        function toggleSettingsPanel(panel) {
            if (!panel) {
                console.error('[设置按钮] 找不到面板元素');
                return;
            }
            
            // 关闭所有其他打开的面板
            const allPanels = document.querySelectorAll('.settings-panel');
            allPanels.forEach(p => {
                if (p !== panel && p.classList.contains('active')) {
                    p.classList.remove('active');
                }
            });
            
            // 切换当前面板
            panel.classList.toggle('active');
            console.log('[设置按钮] 面板状态已切换:', panel.id, panel.classList.contains('active'));
        }
        
        // 为翻译设置按钮添加事件处理
        if (translateSettingsBtn) {
            translateSettingsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[设置按钮] 翻译设置按钮点击');
                toggleSettingsPanel(translateSettingsPanel);
            });
        }
        
        // 为润色设置按钮添加事件处理
        if (polishSettingsBtn) {
            polishSettingsBtn.addEventListener('click', function(e) {
                e.preventDefault(); 
                e.stopPropagation();
                console.log('[设置按钮] 润色设置按钮点击');
                toggleSettingsPanel(polishSettingsPanel);
            });
        }
        
        // 为关闭按钮添加事件处理
        if (closeTranslateSettings) {
            closeTranslateSettings.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[设置按钮] 关闭翻译设置面板');
                translateSettingsPanel.classList.remove('active');
            });
        }
        
        if (closePolishSettings) {
            closePolishSettings.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[设置按钮] 关闭润色设置面板');
                polishSettingsPanel.classList.remove('active');
            });
        }
        
        // 点击面板外部关闭面板
        document.addEventListener('click', function(e) {
            // 如果点击的不是面板内部元素，且不是设置按钮
            if (!e.target.closest('.settings-panel') && 
                !e.target.closest('#translateSettingsBtn') && 
                !e.target.closest('#polishSettingsBtn')) {
                
                // 关闭所有面板
                const activePanels = document.querySelectorAll('.settings-panel.active');
                if (activePanels.length > 0) {
                    console.log('[设置按钮] 点击外部，关闭面板');
                    activePanels.forEach(panel => panel.classList.remove('active'));
                }
            }
        });
        
        // 导出到全局，便于调试和其他模块使用
        window.SettingsPanel = {
            toggle: toggleSettingsPanel,
            closeAll: function() {
                const activePanels = document.querySelectorAll('.settings-panel.active');
                activePanels.forEach(panel => panel.classList.remove('active'));
            }
        };
        
        console.log('[设置按钮] 设置按钮和面板处理脚本初始化完成');
    });
})(); 