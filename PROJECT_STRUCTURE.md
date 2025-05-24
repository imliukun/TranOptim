# TranOptim 项目结构说明

## 📁 核心文件结构

```
TranOptim/
├── 🌐 前端文件
│   ├── index.html              # 主页面
│   ├── login.html              # 登录页面
│   ├── css/                    # 样式文件目录
│   │   ├── style.css           # 主样式文件
│   │   ├── chat.css            # 聊天界面样式
│   │   ├── login.css           # 登录页面样式
│   │   └── error-styles.css    # 错误处理样式
│   └── js/                     # JavaScript文件目录
│       ├── app.js              # 主应用逻辑
│       ├── chat.js             # 聊天功能
│       ├── auth.js             # 认证功能
│       ├── login.js            # 登录逻辑
│       ├── cache-manager.js    # 缓存管理
│       ├── error-handler.js    # 错误处理
│       ├── image-handler.js    # 图片处理
│       ├── copy-functions.js   # 复制功能
│       ├── input-auto-resize.js # 输入框自动调整
│       ├── main-buttons-fix.js # 主按钮修复
│       └── settings-buttons.js # 设置按钮
│
├── 🔧 后端文件
│   └── server.js               # Node.js 服务器主文件
│
├── ☁️ 部署文件
│   ├── cloudflare-deploy.js    # Cloudflare部署脚本
│   ├── cloudflare-config.js    # Cloudflare配置文件
│   ├── functions/              # Cloudflare Functions
│   │   └── api/                # API路由
│   ├── public/                 # 部署目标目录
│   ├── _headers                # HTTP头配置
│   ├── _redirects              # 重定向规则
│   └── deploy/                 # 部署工作目录
│
├── 📦 项目配置
│   ├── package.json            # 项目依赖配置
│   ├── package-lock.json       # 依赖版本锁定
│   ├── .env-example            # 环境变量示例
│   ├── auth-config.js          # 认证配置
│   └── .gitignore              # Git忽略文件配置
│
├── 📚 文档文件
│   ├── README.md               # 项目说明文档
│   ├── FEATURE_UPDATES.md      # 功能更新日志
│   ├── OPTIMIZATION_SUGGESTIONS.md # 优化建议
│   ├── DEPLOY_GUIDE.md         # 部署指南
│   └── PROJECT_STRUCTURE.md    # 项目结构说明（本文件）
│
├── 📁 运行时目录
│   ├── uploads/                # 临时文件上传目录
│   ├── node_modules/           # Node.js依赖包
│   └── .git/                   # Git版本控制
```

## 🚀 启动项目

### 本地开发

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   ```bash
   cp .env-example .env
   # 编辑 .env 文件，填入你的API密钥
   ```

3. **启动服务器**
   ```bash
   npm start
   ```

4. **访问应用**
   - 打开浏览器访问：http://localhost:3001

### Cloudflare 部署

1. **运行部署脚本**
   ```bash
   node cloudflare-deploy.js
   ```

2. **部署到 Cloudflare Pages**
   - 详细步骤请参考 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

## 🔑 核心功能模块

### 前端模块
- **翻译界面** (`index.html` + `app.js`)：主要的翻译功能界面
- **聊天功能** (`chat.js`)：AI对话功能
- **图片处理** (`image-handler.js`)：图片上传和OCR翻译
- **缓存管理** (`cache-manager.js`)：智能缓存系统
- **错误处理** (`error-handler.js`)：用户友好的错误提示

### 后端模块
- **API服务** (`server.js`)：处理所有翻译和润色请求
- **多AI服务集成**：支持ChatGPT、DeepSeek、Qwen、Gemini、豆包
- **图片OCR**：支持图片文字识别和翻译
- **文件上传**：临时文件处理和清理

### 部署模块
- **Cloudflare Functions** (`functions/api/`)：serverless API路由
- **静态资源** (`public/`)：前端文件的部署版本
- **配置文件**：HTTP头、重定向、环境配置

## 🛠️ 已清理的文件

以下文件已被删除以保持项目整洁：

### 测试文件
- `test-*.html` - 各种测试页面
- `button-test.html` - 按钮测试文件
- `quick-test-ui.html` - 快速UI测试

### 备份目录
- `backup/` - 旧版本备份
- `backup-js/` - JavaScript备份
- `backup-old/` - 历史备份文件

### 文档文件
- `prompts.md` - 提示词文档
- `GUIDE.md` - 使用指南

**注意**：部署相关文件已恢复，确保 Cloudflare 部署功能正常。

## 📝 维护建议

1. **定期清理**：定期检查并删除不必要的测试文件
2. **备份重要文件**：在进行重大更改前备份核心文件
3. **更新文档**：及时更新README和功能文档
4. **版本控制**：使用Git管理代码版本，避免手动备份
5. **部署测试**：每次更新后在本地测试，然后部署到Cloudflare

## 🔒 安全注意事项

- 确保 `.env` 文件不被提交到版本控制
- 在 Cloudflare Pages 中正确配置环境变量
- 定期更新API密钥
- 监控 `uploads/` 目录，避免敏感文件泄露
- 定期检查依赖包的安全更新
- 使用 Cloudflare 的安全功能保护应用

## 🌐 部署环境对比

| 功能 | 本地开发 | Cloudflare Pages |
|------|----------|------------------|
| 服务器 | Node.js Express | Cloudflare Functions |
| 静态文件 | 直接访问 | CDN分发 |
| 环境变量 | .env文件 | Pages设置 |
| 域名 | localhost:3001 | 自定义域名 |
| HTTPS | 需配置 | 自动启用 |
| 缓存 | 内存缓存 | 边缘缓存 | 