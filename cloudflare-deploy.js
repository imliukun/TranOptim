// TranOptim Cloudflare部署脚本
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 要复制到部署目录的文件和文件夹
const filesToCopy = [
    'index.html',
    'login.html',
    'css',
    'js',
    'functions',
    'cloudflare-config.js',
    'auth-config.js',
    '_headers',
    '_redirects'
];

// 源目录和目标目录
const sourceDir = __dirname;
const targetDir = path.join(sourceDir, 'public');

// 清理和创建部署目录
if (fs.existsSync(targetDir)) {
    console.log('清理已存在的部署目录...');
    fs.rmSync(targetDir, { recursive: true, force: true });
}

// 创建部署目录
fs.mkdirSync(targetDir, { recursive: true });
console.log('创建部署目录: ' + targetDir);

// 复制文件和文件夹
filesToCopy.forEach(item => {
    const sourcePath = path.join(sourceDir, item);
    const targetPath = path.join(targetDir, item);
    
    if (fs.existsSync(sourcePath)) {
        if (fs.lstatSync(sourcePath).isDirectory()) {
            // 复制整个目录
            console.log(`复制目录: ${item} -> public/${item}`);
            
            // 递归复制目录
            function copyFolderRecursive(src, dest) {
                // 确保目标目录存在
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                
                const items = fs.readdirSync(src);
                
                items.forEach(item => {
                    const srcPath = path.join(src, item);
                    const destPath = path.join(dest, item);
                    
                    if (fs.lstatSync(srcPath).isDirectory()) {
                        // 递归复制子目录
                        copyFolderRecursive(srcPath, destPath);
                    } else {
                        // 复制文件
                        fs.copyFileSync(srcPath, destPath);
                    }
                });
            }
            
            copyFolderRecursive(sourcePath, targetPath);
        } else {
            // 复制单个文件
            console.log(`复制文件: ${item} -> public/${item}`);
            fs.copyFileSync(sourcePath, targetPath);
        }
    } else {
        console.log(`警告: ${item} 不存在，跳过`);
    }
});

console.log('部署文件准备完成');

// 指导用户进行Cloudflare Pages部署
console.log('\n========== Cloudflare Pages 部署指南 ==========');
console.log('1. 访问 https://dash.cloudflare.com/ 并登录您的账号');
console.log('2. 在左侧菜单中选择 "Pages"');
console.log('3. 点击 "创建应用程序" 按钮');
console.log('4. 选择 "直接上传" 选项');
console.log('5. 将 public 文件夹中的内容拖放到上传区域或点击选择文件');
console.log('6. 输入项目名称 "tranoptim" (或您喜欢的名称)');
console.log('7. 点击 "部署站点" 按钮');
console.log('8. 等待部署完成，Cloudflare会显示您的站点URL');
console.log('9. 部署完成后，进入您的站点设置并配置以下环境变量:');
console.log('   - OPENAI_API_KEY: 您的OpenAI API密钥');
console.log('   - GEMINI_API_KEY: 您的Google Gemini API密钥');
console.log('   - DEEPSEEK_API_KEY: 您的DeepSeek API密钥');
console.log('   - QWEN_API_KEY: 您的阿里云通义千问API密钥');
console.log('   - DOUBAO_API_KEY: 您的豆包API密钥');
console.log('10. 在Cloudflare Pages设置中启用"Functions"功能');
console.log('==========================================\n');

// 询问是否安装Wrangler并进行部署
console.log('是否要使用Cloudflare Wrangler进行部署？(推荐高级用户)');
console.log('如需使用，请在命令行中运行以下命令:');
console.log('1. 安装Wrangler: npm install -g wrangler');
console.log('2. 登录Cloudflare: wrangler login');
console.log('3. 部署应用: wrangler pages publish public'); 