/**
 * 设置面板特殊修复脚本 - 解决设置按钮点击无反应问题
 */
(function() {
    console.log('[设置修复] 开始加载设置面板修复脚本');
    
    // 确保DOM加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettingsFix);
    } else {
        initSettingsFix();
    }
    
    // 主要初始化函数
    function initSettingsFix() {
        console.log('[设置修复] DOM已加载，初始化设置面板修复');
        
        // 获取设置按钮和面板
        const translateSettingsBtn = document.getElementById('translateSettingsBtn');
        const polishSettingsBtn = document.getElementById('polishSettingsBtn');
        const translateSettings = document.getElementById('translateSettings');
        const polishSettings = document.getElementById('polishSettings');
        
        // 检查元素是否存在
        if (!translateSettingsBtn || !polishSettingsBtn || !translateSettings || !polishSettings) {
            console.error('[设置修复] 未找到所有必要的设置元素，修复无法继续');
            reportMissingElements({
                translateSettingsBtn: !!translateSettingsBtn,
                polishSettingsBtn: !!polishSettingsBtn,
                translateSettings: !!translateSettings,
                polishSettings: !!polishSettings
            });
            return;
        }
        
        // 移除可能阻碍点击的内联样式
        translateSettings.style.removeProperty('display');
        polishSettings.style.removeProperty('display');
        
        // 移除可能阻碍点击的类
        translateSettings.classList.remove('hidden');
        polishSettings.classList.remove('hidden');
        
        // 强制更改z-index
        applyFixedStyles();
        
        // 添加核心点击事件 - 直接使用函数引用，不通过内联
        translateSettingsBtn.addEventListener('click', function() {
            togglePanel(translateSettings, polishSettings);
        });
        
        polishSettingsBtn.addEventListener('click', function() {
            togglePanel(polishSettings, translateSettings);
        });
        
        // 为关闭按钮添加事件
        const closeButtons = document.querySelectorAll('.close-settings-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const panel = this.closest('.settings-panel');
                if (panel) {
                    console.log('[设置修复] 关闭按钮被点击，隐藏面板:', panel.id);
                    panel.classList.remove('active');
                }
            });
        });
        
        // 点击面板外部时关闭面板
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.settings-panel') && 
                !e.target.closest('.settings-btn') && 
                !e.target.matches('.settings-btn')) {
                hideAllPanels();
            }
        });
        
        // 定期检查设置
        setInterval(checkSettingsFunctionality, 2000);
        
        console.log('[设置修复] 设置面板修复初始化完成');
    }
    
    // 切换面板显示状态
    function togglePanel(showPanel, hidePanel) {
        console.log('[设置修复] 切换面板:', showPanel.id);
        
        // 确保面板存在
        if (!showPanel || !hidePanel) {
            console.error('[设置修复] 面板对象无效:', {showPanel, hidePanel});
            return;
        }
        
        // 如果当前面板已经激活，则隐藏它
        if (showPanel.classList.contains('active')) {
            showPanel.classList.remove('active');
            console.log('[设置修复] 隐藏面板:', showPanel.id);
        } 
        // 否则，显示当前面板并隐藏其他面板
        else {
            hidePanel.classList.remove('active');
            showPanel.classList.add('active');
            
            // 强制设置CSS-block样式
            showPanel.style.display = 'block';
            
            console.log('[设置修复] 显示面板:', showPanel.id, 
                '当前样式:', window.getComputedStyle(showPanel).display);
        }
    }
    
    // 隐藏所有设置面板
    function hideAllPanels() {
        const panels = document.querySelectorAll('.settings-panel');
        panels.forEach(panel => {
            panel.classList.remove('active');
        });
    }
    
    // 应用固定样式修复
    function applyFixedStyles() {
        // 创建样式元素
        const styleEl = document.createElement('style');
        styleEl.id = 'settings-fix-styles';
        
        // 添加修复样式
        styleEl.textContent = `
            /* 设置面板修复样式 */
            .settings-btn {
                z-index: 1000 !important;
                position: relative !important;
                cursor: pointer !important;
            }
            
            .settings-btn i {
                pointer-events: none !important;
            }
            
            .settings-panel {
                z-index: 999 !important;
                position: absolute !important;
                display: none !important;
            }
            
            .settings-panel.active {
                display: block !important;
            }
        `;
        
        // 添加到文档头部
        document.head.appendChild(styleEl);
        console.log('[设置修复] 已应用修复样式');
    }
    
    // 检查设置功能是否仍然可用
    function checkSettingsFunctionality() {
        // 获取设置按钮和面板
        const translateSettingsBtn = document.getElementById('translateSettingsBtn');
        const polishSettingsBtn = document.getElementById('polishSettingsBtn');
        const translateSettings = document.getElementById('translateSettings');
        const polishSettings = document.getElementById('polishSettings');
        
        // 检查是否需要重新应用样式和事件
        if (translateSettingsBtn && polishSettingsBtn && translateSettings && polishSettings) {
            // 检查样式元素是否仍然存在
            if (!document.getElementById('settings-fix-styles')) {
                console.log('[设置修复] 修复样式丢失，重新应用');
                applyFixedStyles();
            }
            
            // 检查事件是否丢失（无法确定，但可以重新绑定）
            translateSettingsBtn.onclick = function(e) {
                console.log('[设置修复-备份] 翻译设置按钮点击（备份处理）');
                e.preventDefault();
                e.stopPropagation();
                togglePanel(translateSettings, polishSettings);
            };
            
            polishSettingsBtn.onclick = function(e) {
                console.log('[设置修复-备份] 润色设置按钮点击（备份处理）');
                e.preventDefault();
                e.stopPropagation();
                togglePanel(polishSettings, translateSettings);
            };
        }
    }
    
    // 报告缺失元素
    function reportMissingElements(elements) {
        console.table(elements);
        
        // 创建错误消息
        let errorMsg = '设置按钮修复失败: 缺少以下元素:\n';
        for (const [key, exists] of Object.entries(elements)) {
            if (!exists) {
                errorMsg += `- ${key}\n`;
            }
        }
        
        // 添加调试消息到控制台
        console.error(errorMsg);
    }
    
    // 导出全局函数
    window.settingsPanelFix = {
        togglePanel: togglePanel,
        hideAllPanels: hideAllPanels,
        reapplyFix: initSettingsFix
    };
    
    console.log('[设置修复] 设置面板修复脚本加载完成');
})(); 