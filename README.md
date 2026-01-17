# AI新闻总结小助手 - Chrome扩展

一个基于Chrome Extension Manifest V3的智能新闻总结工具，使用大模型API自动总结网易新闻内容。

## 功能特性

- 📰 **智能新闻总结**: 自动提取新闻页面内容，使用大模型API生成100字以内的摘要
- 🔧 **多API支持**: 支持配置多个OpenAI兼容的大模型API（OpenAI、Claude、Gemini等）
- 🎨 **美观界面**: 采用渐变紫色主题，简洁现代的UI设计
- ⚙️ **灵活配置**: 支持添加、编辑、删除API配置，可设置默认API
- 🔍 **智能识别**: 自动识别网易新闻页面，支持多种页面结构

## 项目结构

```
.
├── manifest.json          # Chrome扩展配置文件
├── popup.html            # 弹出窗口界面
├── popup.js              # 弹出窗口逻辑
├── content.js            # 内容脚本（注入到新闻页面）
├── options.html          # API配置页面
├── options.js            # 配置页面逻辑
└── README.md             # 说明文档
```

## 安装步骤

1. **下载代码**: 克隆或下载本项目到本地

2. **安装到Chrome**:
   - 打开Chrome浏览器，访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择项目目录 `c:\Users\lyxs\project\0115\chrome-extensions-samples\03`

3. **配置API**:
   - 点击扩展图标，选择「配置」按钮
   - 点击「+ 添加API」按钮
   - 填写API配置信息：
     - **配置名称**: 自定义名称（如：OpenAI）
     - **API类型**: 选择对应的类型
     - **API地址**: 如 `https://api.openai.com/v1/chat/completions`
     - **API Key**: 您的API密钥
     - **模型名称**: 如 `gpt-4o-mini`
   - 点击「保存配置」

4. **使用扩展**:
   - 打开任意网易新闻详情页（如：https://news.163.com/...）
   - 点击扩展图标
   - 点击「📊 生成摘要」按钮
   - 等待几秒即可看到新闻摘要

## API配置示例

### OpenAI
- **API地址**: `https://api.openai.com/v1/chat/completions`
- **模型名称**: `gpt-4o-mini`, `gpt-4`, `gpt-3.5-turbo`

### Claude (Anthropic)
- **API地址**: `https://api.anthropic.com/v1/messages`
- **模型名称**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`

### Gemini (Google)
- **API地址**: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent`
- **模型名称**: `gemini-1.5-flash-latest`

### 其他兼容API
- 支持任何OpenAI格式的兼容API（如：Claude 3 API、本地部署的模型等）

## 技术栈

- **Chrome Extension Manifest V3**: 最新扩展规范
- **原生JavaScript**: 无第三方依赖，性能优异
- **CSS3**: 现代样式和动画
- **Chrome Storage API**: 本地存储配置
- **Chrome Scripting API**: 动态执行脚本

## 支持的网站

- 网易新闻: https://news.163.com/
- 网易订阅: https://dy.163.com/
- 其他网易新闻子域名

## 注意事项

1. **API费用**: 使用大模型API会产生费用，请合理使用
2. **API密钥安全**: 请妥善保管您的API密钥，不要泄露给他人
3. **网络环境**: 确保能够正常访问配置的API地址
4. **页面限制**: 只能在网易新闻详情页使用，列表页不支持

## 开发说明

### 调试模式

1. 在 `chrome://extensions/` 页面点击扩展的「详细信息」
2. 开启「允许访问文件网址」（如果需要本地测试）
3. 点击「检查视图」>「弹出视图」打开开发者工具

### 修改代码

修改代码后，在 `chrome://extensions/` 页面点击「重新加载」按钮即可生效。

## 常见问题

### Q: 点击「生成摘要」无反应？
A: 请检查：
- 是否已正确配置API
- 当前页面是否为新闻详情页
- 浏览器控制台是否有错误信息

### Q: 提示"无法提取新闻内容"？
A: 可能是页面结构不支持，请尝试其他新闻详情页。

### Q: API请求失败？
A: 请检查：
- API地址是否正确
- API密钥是否有效
- 网络连接是否正常
- 是否有防火墙或代理限制

## 许可证

MIT License

## 更新日志

### v1.0.0 (2025-01-15)
- 初始版本发布
- 支持多API配置
- 实现新闻内容自动提取
- 集成大模型API生成摘要
- 美观的UI设计

---

**享受智能阅读的乐趣！** 📚✨
