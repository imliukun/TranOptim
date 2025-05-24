# TranOptim Cloudflare 部署指南

## 🚀 快速部署

### 方法一：使用部署脚本（推荐）

1. **运行部署脚本**
   ```bash
   node cloudflare-deploy.js
   ```

2. **将生成的 `public` 文件夹部署到 Cloudflare Pages**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 选择 "Pages" → "创建应用程序" → "直接上传"
   - 拖拽 `public` 文件夹内容到上传区域
   - 输入项目名称并部署

### 方法二：使用 Wrangler CLI

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **运行部署脚本**
   ```bash
   node cloudflare-deploy.js
   ```

4. **发布到 Cloudflare Pages**
   ```bash
   wrangler pages publish public
   ```

## 🔧 环境变量配置

部署完成后，在 Cloudflare Pages 设置中配置以下环境变量：

```bash
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key  
QWEN_API_KEY=your_qwen_api_key
GEMINI_API_KEY=your_gemini_api_key
DOUBAO_API_KEY=your_doubao_api_key
```

## 📁 部署文件结构

部署时会包含以下文件：

```
public/
├── index.html              # 主页面
├── login.html              # 登录页面
├── css/                    # 样式文件
├── js/                     # JavaScript文件
├── functions/              # Cloudflare Functions
├── cloudflare-config.js    # Cloudflare配置
├── auth-config.js          # 认证配置
├── _headers                # HTTP头配置
└── _redirects              # 重定向规则
```

## ⚙️ Cloudflare Pages 设置

1. **启用 Functions**
   - 在项目设置中启用 "Functions" 功能
   - 确保 Functions 兼容性标志设置正确

2. **自定义域名**（可选）
   - 在 "自定义域" 部分添加您的域名
   - 配置DNS记录指向 Cloudflare

3. **构建设置**
   - 构建命令：无需设置（静态部署）
   - 输出目录：`public`
   - 根目录：`/`

## 🔍 故障排除

### 常见问题

1. **API 密钥问题**
   - 确保在 Cloudflare Pages 环境变量中正确设置了所有 API 密钥
   - 检查密钥格式是否正确

2. **函数调用失败**
   - 确认 Functions 功能已启用
   - 检查 `functions/api/[[path]].js` 文件是否正确部署

3. **CORS 错误**
   - 检查 `_headers` 文件是否正确配置了 CORS 策略

### 调试命令

```bash
# 本地测试部署文件
npx wrangler pages dev public

# 查看部署日志
wrangler pages deployment list

# 实时查看函数日志
wrangler pages deployment tail
```

## 📝 更新部署

当代码有更新时：

1. **重新运行部署脚本**
   ```bash
   node cloudflare-deploy.js
   ```

2. **重新部署**
   ```bash
   wrangler pages publish public
   ```

或直接在 Cloudflare Dashboard 中上传新的文件。

## 🔐 安全注意事项

- 确保所有 API 密钥都通过环境变量配置，不要硬编码在代码中
- 定期轮换 API 密钥
- 监控 Cloudflare Analytics 以了解使用情况
- 启用 Cloudflare 的安全功能（如 WAF） 