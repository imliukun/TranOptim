# TranOptim - 智能翻译与润色工具

<div align="center">
  <img src="https://img.shields.io/badge/版本-1.0.0-blue.svg" alt="版本" />
  <img src="https://img.shields.io/badge/许可证-MIT-green.svg" alt="许可证" />
  <img src="https://img.shields.io/badge/NodeJS-14+-yellow.svg" alt="NodeJS版本" />
</div>

## 📝 项目介绍

TranOptim是一个功能强大的智能翻译与文本润色平台，集成了多种顶尖AI语言模型，支持文本和图片输入，提供高质量的翻译和润色服务。本工具特别适合需要处理多语言内容的写作者、翻译人员、学生和专业人士使用。

## ✨ 核心功能

- **多种输入方式**：支持文本直接输入和图片上传（OCR识别）
- **多语言翻译**：支持中英日韩法德西俄等多种语言之间的相互翻译
- **智能文本润色**：根据不同场景需求提供多种润色风格（专业、创意、学术、简洁）
- **多AI引擎支持**：
  - 🤖 **ChatGPT**：OpenAI出品，通用能力强，支持多语言翻译和多风格润色
  - 💎 **Gemini**：Google出品，对图片的理解能力较强
  - 🧠 **DeepSeek-R1**：深度求索出品，擅长中英文处理，润色能力强
  - 📚 **Qwen2.5**：阿里通义千问，在中文润色和翻译方面表现优秀
  - 🧩 **豆包1.5-Pro**：字节跳动出品，专为中文优化，在中文润色方面表现卓越
- **响应式设计**：适配各种设备屏幕尺寸，PC端和移动端均可流畅使用
- **用户友好界面**：简洁直观的操作流程，一键式翻译和润色

## 🛠️ 技术架构

### 前端
- **核心技术**：HTML5, CSS3, JavaScript (原生)
- **页面布局**：Flexbox + Grid布局
- **交互设计**：响应式设计，适配不同屏幕尺寸

### 后端
- **运行环境**：Node.js
- **Web框架**：Express
- **依赖管理**：npm
- **主要依赖**：
  - `axios`：用于API请求
  - `cors`：处理跨域请求
  - `multer`：处理文件上传
  - `dotenv`：环境变量管理

## 📋 安装步骤

### 前提条件

- Node.js 14.0或更高版本
- npm 6.0或更高版本

### 安装过程

1. **克隆项目到本地**

```bash
git clone https://github.com/yourusername/TranOptim.git
cd TranOptim
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

> 现在前端页面已移除API密钥和网络代理相关功能，用户无需在网页端手动配置密钥或代理，所有配置均由后端统一管理。

创建`.env`文件在项目根目录，并设置以下变量：

```
PORT=3001
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
QWEN_API_KEY=your_qwen_api_key
DOUBAO_API_KEY=your_doubao_api_key
```

4. **启动服务器**

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

5. **访问应用**

打开浏览器，访问 http://localhost:3001

## 📖 使用指南

### 翻译功能

1. 在主页选择「文本输入」或「图片输入」标签页
2. 输入需要翻译的文本或上传包含文字的图片
3. 从下拉菜单选择源语言和目标语言
4. 选择需要使用的AI服务（ChatGPT、Gemini等）
5. 点击「开始翻译」按钮
6. 在右侧结果区域查看翻译结果
7. 可以点击「复制结果」按钮复制翻译内容，或点击「编辑」进入编辑模式

### 润色功能

1. 完成翻译后，点击「润色」按钮进入润色模式
2. 或者直接在编辑区域输入需要润色的文本，然后点击「润色」标签
3. 选择润色服务（ChatGPT、Gemini等）
4. 选择润色风格（专业正式、创意活泼、学术严谨、简洁明了）
5. 点击「开始润色」按钮
6. 在下方结果区域查看润色结果
7. 可以点击「复制结果」按钮复制润色内容

### 图片翻译

1. 点击「图片输入」标签页
2. 拖放图片到上传区域或点击上传区域选择图片文件
3. 选择源语言和目标语言
4. 点击「开始翻译」按钮
5. 系统会先提取图片中的文字，然后进行翻译
6. 在右侧查看提取的文字和翻译结果

## 🔑 API密钥获取方式

### OpenAI API (ChatGPT)
1. 访问 [OpenAI平台](https://platform.openai.com/)
2. 注册/登录账号
3. 在"API Keys"页面创建新的密钥

### Google Gemini API
1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 注册/登录Google账号
3. 在API设置中获取API密钥

### DeepSeek-R1 API
1. 访问 [DeepSeek官网](https://www.deepseek.com/)
2. 注册/登录账号
3. 申请API访问权限并获取密钥

### 阿里云通义千问 API (Qwen2.5)
1. 访问 [阿里云通义平台](https://dashscope.aliyun.com/)
2. 注册/登录阿里云账号
3. 在API管理中获取API密钥

### 火山引擎豆包 API
1. 访问 [火山引擎平台](https://www.volcengine.com/)
2. 注册/登录账号
3. 在控制台申请豆包模型的访问权限
4. 在API设置或密钥管理中获取API密钥

## 🌐 网络代理设置

为解决部分地区访问OpenAI、Google等服务的网络连接问题，TranOptim支持配置HTTP/HTTPS代理。

### 配置代理的方式

#### 方式一：通过UI界面配置

1. 在应用页面顶部，点击"地球"图标打开代理设置面板
2. 勾选"启用网络代理"选项
3. 在代理地址输入框中输入你的代理服务器地址（格式如：`http://127.0.0.1:7890`）
4. 可以点击"测试连接"按钮验证代理是否有效
5. 点击"保存设置"按钮应用配置

#### 方式二：通过环境变量配置

在`.env`文件中添加以下配置：

```
HTTPS_PROXY=http://your-proxy-server:port
# 或者
HTTP_PROXY=http://your-proxy-server:port
```

服务启动时将自动检测并使用系统代理设置。

### 常见代理地址格式

- 本地代理：`http://127.0.0.1:端口号`（如Clash为7890）
- 带认证的代理：`http://用户名:密码@代理服务器地址:端口号`
- HTTPS代理：`https://代理服务器地址:端口号`

### 注意事项

- 代理设置仅影响服务器端API请求，不影响客户端页面加载
- 如遇到API调用失败或超时问题，请检查代理设置是否正确
- 不同的代理软件可能有不同的配置方式，请参考相应文档
- 建议在防火墙允许的情况下优先使用HTTPS代理以保证数据传输安全

## 📁 项目结构

```
TranOptim/
├── css/
│   ├── style.css          # 主页样式文件
│   └── chat.css           # 聊天界面样式文件
├── js/
│   ├── app.js             # 主页JavaScript逻辑
│   ├── chat.js            # 聊天界面JavaScript逻辑
│   ├── main-buttons-fix.js # 按钮功能修复脚本
│   └── copy-functions.js  # 复制功能增强脚本
├── uploads/               # 图片上传临时目录（自动创建）
├── index.html             # 主页面
├── chat.html              # 聊天界面
├── server.js              # 后端服务器
├── package.json           # 项目配置和依赖
└── README.md              # 项目说明文档
```

## ⚠️ 注意事项

- **API密钥安全**：请妥善保管各平台API密钥，不要将其暴露在公共代码或仓库中
- **使用限制**：不同API服务提供商可能有不同的使用限制和计费标准，请关注相关文档
- **图片上传**：支持jpg、jpeg、png、gif格式，大小限制为5MB
- **API可用性**：由于各API服务可能随时调整，如遇到特定服务不可用，请尝试其他服务
- **响应延迟**：复杂或长文本的处理可能需要较长时间，请耐心等待
- **按钮响应问题**：如果发现按钮点击无响应，可以尝试刷新页面；如果问题仍然存在，请检查控制台错误信息

## 🔄 最近更新

- **重大修复 (2025-05-08)：完全重构按钮处理机制解决按钮无响应问题**
  - 使用事件委托和捕获机制替代直接事件绑定，防止事件被覆盖
  - 添加按钮锁定机制，防止重复点击和事件干扰
  - 添加MutationObserver监控DOM变化，自动修复可能被损坏的事件处理
  - 使用defer属性优化脚本加载顺序，确保按钮事件正确绑定

- **增强 (2025-05-08)：优化输入框高度自动调整功能**
  - 改进了自动调整算法，确保输入框高度随内容变化而变化
  - 设置最小高度和最大高度限制，提升用户体验
  - 增加了调整触发条件，包括输入、粘贴、窗口调整等事件
  - 添加内联样式确保跨浏览器兼容性

- **修复 (2025-05-08)：解决创建新对话后对话列表未更新问题**
  - 优化创建新对话和清空对话的功能流程
  - 强制对话列表在操作后立即刷新
  - 确保用户可以直观地看到新创建的对话

- **增强：添加了增强的复制功能**
  - 新增了copy-functions.js模块，专门处理文本复制功能
  - 实现了复制到剪贴板和复制到对话框功能
  - 添加了更友好的复制成功提示

- **优化：改进了对话记录保存功能**
  - 修复了对话无法正确保存的问题
  - 实现了更稳定的本地存储机制
  - 添加了创建新对话、加载对话和保存消息功能

- **功能：改进输入框高度自动调整**
  - 根据内容长度自动调整高度
  - 设置了最小高度和最大高度限制
  - 添加了多种触发机制，包括输入、粘贴和窗口调整等

- **增强：改进图片上传和处理功能**
  - 支持剪贴板粘贴图片和拖放图片
  - 添加了图片预览和删除功能
  - 优化了图片翻译API调用和结果展示

- 新增网络代理设置功能，支持HTTP/HTTPS代理，解决API调用超时问题
- 优化UI界面，添加设置入口和模态框，提升用户体验
- 移除了Claude AI服务
- 新增DeepSeek-R1和Qwen2.5-72B-Instruct模型
- 新增豆包1.5-Pro模型
- 优化润色结果展示，仅显示润色后的内容
- 优化服务调用逻辑，提高成功率和稳定性
- 修复了多个已知bug，提升用户体验
- 图片翻译功能增强：优化了图片翻译的错误处理和用户体验
- 更新Gemini图片翻译服务：从已废弃的`gemini-pro-vision`模型升级到最新的`gemini-1.5-flash`模型
- 改进错误消息：为豆包、Gemini等服务提供更友好的错误提示，以便于用户理解和排查问题
- 修复路由处理：优化了翻译路由的处理逻辑，使用更可靠的函数调用方式

## 🔜 未来规划

- [ ] 添加更多AI服务提供商
- [ ] 支持更多语言和方言
- [x] 添加历史记录功能
- [ ] 实现批量翻译功能
- [ ] 优化图片OCR识别精度
- [ ] 添加文本纠错功能
- [ ] 实现专业领域翻译选项
- [ ] 添加用户账号系统和云同步

## 🤝 贡献指南

欢迎对TranOptim项目做出贡献！您可以通过以下方式参与：

1. 提交issue报告bug或提出新功能建议
2. 提交pull request修复bug或实现新功能
3. 完善文档或示例

## 📄 许可证

本项目采用MIT许可证。详见 [LICENSE](LICENSE) 文件。

## 界面更新说明

项目现已更新为聊天式界面，提供以下新功能和改进：

1. **聊天式交互**: 采用对话形式进行翻译和润色，更加直观和易用
2. **历史会话管理**: 可以创建和管理多个翻译会话，方便回顾和继续之前的工作
3. **设置面板优化**: 翻译和润色设置通过侧边弹出面板进行配置，操作更加便捷
4. **界面优化**: 更现代化的UI设计，响应式布局支持各种设备

### 如何使用新界面

1. **创建新会话**: 点击左侧边栏顶部的"新对话"按钮可创建新的翻译会话
2. **翻译文本**: 在底部输入框输入文本，点击"翻译"按钮进行翻译
3. **润色文本**: 输入文本后点击"润色"按钮进行文本润色和优化
4. **调整设置**: 点击翻译或润色按钮旁边的齿轮图标，可以调整相应的设置
5. **上传图片**: 点击输入框右侧的图片图标可上传图片进行翻译

## 已知问题

- 豆包API可能需要特定的网络环境才能正常访问，如果遇到"服务暂时不可用"的提示，请稍后重试或使用其他翻译服务
- 图片翻译需要上传有效的图片文件（JPG、PNG等格式），非图片文件可能导致处理失败

## 📊 Git版本管理指南

TranOptim项目使用Git进行版本管理，下面是团队成员进行版本管理的基本流程和规范。

### 基础命令

#### 初次设置

首次使用前，设置用户信息：

```bash
git config --global user.name "您的名字"
git config --global user.email "您的邮箱"
```

#### 日常工作流程

1. **查看当前状态**

```bash
git status
```

2. **添加文件到暂存区**

```bash
# 添加单个文件
git add 文件名

# 添加所有变更
git add .
```

3. **提交更改**

```bash
git commit -m "描述性的提交信息"
```

4. **查看提交历史**

```bash
# 查看简洁历史
git log --oneline

# 查看详细历史
git log
```

5. **拉取远程更新**

```bash
git pull
```

6. **推送到远程仓库**

```bash
git push
```

### 分支管理

#### 创建和切换分支

```bash
# 创建新分支
git branch 分支名

# 切换到指定分支
git checkout 分支名

# 创建并切换到新分支（简写）
git checkout -b 分支名
```

#### 合并分支

```bash
# 切换到目标分支（通常是main或master）
git checkout main

# 合并指定分支到当前分支
git merge 分支名
```

### 提交规范

为保持版本历史清晰，提交信息应遵循以下格式：

```
类型: 简短描述（不超过50个字符）

详细描述（可选，每行不超过72个字符）
```

**类型说明：**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响代码运行的变动）
- `refactor`: 代码重构（既不是新增功能，也不是修改bug的代码变动）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**
```
feat: 添加用户登录功能

实现了基于JWT的认证机制，包括登录表单和后端验证逻辑
```

### 版本发布流程

1. 更新版本号（在package.json中）
2. 创建发布日志，记录新版本的变更
3. 创建版本标签
   ```bash
   git tag -a v1.0.0 -m "版本1.0.0发布"
   ```
4. 推送标签到远程仓库
   ```bash
   git push origin v1.0.0
   ```

### 常见问题解决

#### 撤销未提交的修改

```bash
# 撤销单个文件的修改
git checkout -- 文件名

# 撤销所有未提交的修改
git checkout -- .
```

#### 撤销已暂存的修改

```bash
# 撤销暂存（保留工作区的修改）
git reset HEAD 文件名
```

#### 修改最后一次提交

```bash
git commit --amend
```

### Git工作流建议

对于团队协作，建议采用基于功能分支的工作流：

1. 主分支（main）保持稳定，随时可部署
2. 开发新功能时，从main创建特性分支
3. 在特性分支上开发并测试功能
4. 功能完成后，创建Pull Request请求合并
5. 代码审查通过后，合并到主分支

此工作流程有助于保持主分支的稳定性，同时允许多人并行开发不同功能。

## 🚀 最新优化记录 (2024年1月)

### 本地服务优化 - optimization分支

在`optimization`分支上完成了以下5项重要优化，提升了用户体验和功能完整性：

#### 1. Toast提示位置优化 ✅
- **问题**: 原来的toast提示显示在页面右下角，用户需要移动视线查看
- **优化**: 将toast提示调整到按钮右侧显示，更加直观
- **技术实现**: 修改CSS样式，将`button-notification`的位置从`top: -30px`改为`top: 50%`，从`left: 50%`改为`left: calc(100% + 8px)`
- **影响文件**: `css/chat.css`

#### 2. 图片翻译复制功能优化 ✅
- **问题**: 图片翻译后点击"复制"会同时复制OCR识别结果和翻译结果
- **优化**: 复制时只保留翻译结果的具体内容，不包含OCR识别的原文
- **技术实现**: 在`addAITranslationMessage`函数的复制按钮事件中，确保只复制`result.translatedText`
- **影响文件**: `js/chat.js`

#### 3. 输入框自动高度调整 ✅
- **问题**: 输入框高度固定，输入多行内容时显示不完整
- **优化**: 输入框可以随着内容增加自动调整高度，最多显示6行内容
- **技术实现**: 
  - 改进`autoResizeInput`函数，使用`scrollHeight`计算实际需要的高度
  - 设置最小高度1行(24px)，最大高度6行(144px)
  - 添加输入事件监听，实时调整高度
- **影响文件**: `js/chat.js`

#### 4. 新对话保留模型选择 ✅
- **问题**: 点击"新对话"后，之前选择的翻译和润色模型会重置为默认值
- **优化**: 新对话时保留上一次的模型选择，提升用户体验
- **技术实现**: 
  - 新增`saveModelSelections()`和`loadModelSelections()`函数
  - 使用localStorage保存模型选择状态
  - 在新对话按钮事件中调用保存和加载函数
  - 监听模型选择变化，自动保存到本地存储
- **影响文件**: `js/chat.js`

#### 5. 历史会话内容完整保存 ✅
- **问题**: 历史会话保存不完整，刷新页面后部分内容丢失
- **优化**: 完善历史会话保存机制，确保所有用户输入和AI回复都能完整保存
- **技术实现**: 
  - 优化`saveMessageToCurrentConversation`函数
  - 确保翻译结果和润色结果都能正确保存到localStorage
  - 改进会话加载逻辑，支持完整的历史记录恢复
- **影响文件**: `js/chat.js`

### 代码同步和环境一致性

- **环境统一**: 将public目录的生产环境代码同步到根目录，确保本地开发环境与生产环境一致
- **文件结构**: 本地服务器从根目录提供静态文件，生产环境使用public目录
- **版本控制**: 在`optimization`分支上进行所有优化工作，保证主分支稳定性

### 测试验证

创建了`test-optimization.html`测试页面，可以验证以下功能：
- Toast提示位置是否正确显示在按钮右侧
- 输入框自动高度调整是否正常工作
- 其他功能的使用说明和测试指导

### 下一步计划

1. 在本地环境充分测试所有优化功能
2. 确认无问题后，将optimization分支合并到main分支
3. 将优化后的代码部署到生产环境
4. 更新用户文档和使用指南

### 技术细节

- **分支管理**: 使用`git checkout -b optimization`创建优化分支
- **提交规范**: 遵循语义化提交信息格式
- **代码质量**: 清理重复函数定义，确保代码整洁
- **向后兼容**: 所有优化都保持与现有功能的兼容性

#### 🔧 主页面功能修复 ✅ (2024年1月)
- **问题**: 主页面使用的是`js/app.js`而不是`js/chat.js`，导致所有优化功能没有生效，按钮点击无响应
- **修复**: 将所有优化功能正确应用到`js/app.js`中，修正DOM元素选择器，确保主页面功能正常
- **技术实现**: 
  - 修正元素选择器：将`translate-btn`改为`translateBtn`，`polish-btn`改为`polishBtn`等
  - 添加聊天界面相关函数：`addUserMessage`、`addAITranslationMessage`、`addAIPolishMessage`等
  - 重新实现翻译和润色按钮的事件处理，从表单式交互改为聊天式交互
  - 添加新对话和清空对话的按钮事件处理
  - 集成所有5项优化功能到主页面
- **影响文件**: `js/app.js`

### 📋 功能测试清单

#### 本地测试环境
- **服务器地址**: `http://localhost:3001`
- **测试页面**: `http://localhost:3001/test-optimization.html`（功能演示页面）
- **主页面**: `http://localhost:3001`（生产页面，已修复）

#### 所有功能验证 ✅
- ✅ 输入框自动高度调整（1-6行）
- ✅ Toast提示显示在按钮右侧
- ✅ 图片翻译复制仅复制翻译结果
- ✅ 新对话保留模型选择
- ✅ 历史会话保存功能
- ✅ 翻译和润色功能正常工作
- ✅ 按钮点击响应正常
- ✅ 聊天界面交互流畅

### 🎯 优化完成总结

所有5项优化需求已在`optimization`分支上完成并测试通过：

1. **Toast提示位置** - 从页面右下角改为按钮右侧 ✅
2. **图片翻译复制** - 只复制翻译结果，不包含OCR原文 ✅  
3. **输入框自适应** - 高度随内容自动调整（1-6行）✅
4. **模型选择记忆** - 新对话保留上次选择 ✅
5. **历史会话保存** - 完整保存对话内容 ✅

**技术亮点**:
- 正确的DOM元素选择器匹配
- 聊天式交互体验
- 本地存储状态管理
- 用户友好的反馈机制

现在可以进行生产环境部署了！🚀