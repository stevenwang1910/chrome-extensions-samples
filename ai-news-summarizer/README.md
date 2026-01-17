# AI新闻总结小助手

一个基于大模型API的Chrome扩展，可以自动总结新闻页面的内容为简洁的摘要。

## 功能特点

- 🤖 **智能摘要**：使用大模型API自动生成新闻摘要
- 📰 **多网站支持**：支持网易新闻、新浪新闻、腾讯新闻、搜狐新闻等主流新闻网站
- ⚙️ **灵活配置**：支持配置多个OpenAI兼容的API接口
- ✏️ **配置编辑**：支持编辑和更新已配置的API
- 🚀 **自动处理**：打开插件时自动提取内容并生成摘要
- 📄 **完整显示**：摘要内容完整显示，不截断
- 🔒 **本地存储**：API配置保存在本地，安全可靠
- 🎨 **美观界面**：现代化的UI设计，操作简单直观

## 安装方法

### 开发者模式安装

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `ai-news-summarizer` 文件夹
6. 扩展安装完成！

## 使用方法

### 1. 配置API

首次使用需要配置API：

1. 点击浏览器工具栏中的扩展图标
2. 切换到"API配置"标签页
3. 填写以下信息：
   - **API名称**：例如：OpenAI、DeepSeek等
   - **API地址**：例如：`https://api.openai.com/v1/chat/completions`
   - **模型名称**：例如：`gpt-3.5-turbo`
   - **API密钥**：你的API密钥
4. 点击"添加API配置"

### 2. 使用扩展

1. 访问支持的新闻网站（如网易新闻）
2. 点击扩展图标打开popup
3. 插件会自动提取新闻内容并生成摘要
4. 如果需要手动操作，可以点击"提取新闻内容"和"生成AI摘要"按钮
5. 在"API配置"标签页可以编辑或删除已配置的API

## 支持的新闻网站

- 网易新闻 (163.com)
- 新浪新闻 (sina.com.cn)
- 腾讯新闻 (qq.com)
- 搜狐新闻 (sohu.com)

## API配置示例

### OpenAI
```
API名称: OpenAI
API地址: https://api.openai.com/v1/chat/completions
模型名称: gpt-3.5-turbo
API密钥: sk-xxxxxxxxxxxx
```

### DeepSeek
```
API名称: DeepSeek
API地址: https://api.deepseek.com/v1/chat/completions
模型名称: deepseek-chat
API密钥: sk-xxxxxxxxxxxx
```

### 其他兼容OpenAI格式的API
只要API接口兼容OpenAI的格式，都可以使用此扩展。

## 项目结构

```
ai-news-summarizer/
├── manifest.json      # 扩展配置文件
├── popup.html         # Popup界面HTML
├── popup.js           # Popup界面逻辑
├── content.js         # 内容脚本（提取新闻内容）
├── background.js      # 后台脚本
├── icon.svg           # 图标SVG文件
├── icon16.png         # 16x16图标
├── icon48.png         # 48x48图标
├── icon128.png        # 128x128图标
└── README.md          # 项目说明文档
```

## 技术栈

- **Manifest V3**：最新的Chrome扩展规范
- **Vanilla JavaScript**：纯原生JavaScript，无依赖
- **Chrome Storage API**：本地存储配置
- **Chrome Tabs API**：获取当前标签页信息
- **Chrome Messaging API**：组件间通信

## 开发说明

### 修改内容提取逻辑

编辑 `content.js` 文件中的 `extractNewsContent()` 函数，可以添加对更多新闻网站的支持。

### 修改API调用逻辑

编辑 `popup.js` 文件中的 `callApi()` 函数，可以调整API请求参数或处理不同的响应格式。

### 自定义UI样式

编辑 `popup.html` 文件中的 `<style>` 标签，可以修改扩展的界面样式。

## 注意事项

1. **API密钥安全**：API密钥保存在本地浏览器中，不会上传到任何服务器
2. **网络连接**：使用扩展需要网络连接，以便调用API
3. **API费用**：使用第三方API可能会产生费用，请注意控制使用量
4. **内容限制**：某些新闻网站可能有反爬虫机制，可能影响内容提取

## 常见问题

### Q: 为什么无法提取新闻内容？
A: 请确保：
- 当前页面是支持的新闻网站
- 页面已完全加载
- 刷新页面后重试

### Q: API调用失败怎么办？
A: 请检查：
- API地址是否正确
- API密钥是否有效
- 网络连接是否正常
- API服务是否可用

### Q: 如何添加更多新闻网站支持？
A: 编辑 `content.js` 文件，在 `extractNewsContent()` 函数中添加对应网站的提取逻辑。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.1.0 (2026-01-17)
- ✨ 新增API配置编辑功能，可以修改已配置的API
- 🚀 打开插件时自动提取新闻内容并生成摘要
- 📄 摘要内容完整显示，不再限制字数
- 🎯 优化用户体验，自动选择第一个API配置
- 🐛 修复各种已知问题

### v1.0.0 (2026-01-17)
- 初始版本发布
- 支持网易新闻、新浪新闻、腾讯新闻、搜狐新闻
- 支持配置多个API接口
- 自动生成新闻摘要