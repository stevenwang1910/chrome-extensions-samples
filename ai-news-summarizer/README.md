# AI新闻总结助手

一个基于Chrome扩展的AI新闻总结工具，使用大模型API自动提取并总结当前网页的新闻内容，生成100字以内的简洁摘要。

## 功能特性

- **智能内容提取**：自动识别新闻页面的标题、正文、来源和发布时间
- **AI摘要生成**：使用大模型API生成100字以内的精炼摘要
- **多API支持**：支持配置多个OpenAI兼容格式的API渠道（OpenAI、Azure、第三方代理等）
- **侧边栏展示**：通过Chrome侧边栏直观展示摘要结果
- **一键复制**：支持一键复制摘要内容到剪贴板

## 安装方法

### 开发者模式安装

1. 下载或克隆本项目到本地
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `ai-news-summarizer` 文件夹

## 使用方法

### 1. 配置API

1. 点击扩展图标，选择"打开设置"
2. 在配置页面添加您的API信息：
   - **配置名称**：便于识别的名称（如"OpenAI官方"）
   - **API URL**：OpenAI兼容格式的API端点
     - OpenAI官方：`https://api.openai.com/v1/chat/completions`
     - Azure OpenAI：`https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15`
   - **模型**：选择或输入模型名称（如gpt-3.5-turbo、gpt-4等）
   - **API Key**：您的API密钥
3. 点击"设为默认"启用该API配置

### 2. 使用扩展

1. 打开任意新闻网站页面（如网易新闻、新浪新闻等）
2. 点击Chrome工具栏上的扩展图标，或点击"打开AI新闻总结助手"
3. 在侧边栏中点击"总结当前页面"按钮
4. 等待AI生成摘要
5. 查看摘要结果，可点击"复制摘要"按钮复制内容

## 支持的新闻网站

- 网易新闻 (163.com)
- 新浪新闻 (sina.com)
- 搜狐新闻 (sohu.com)
- 腾讯新闻 (qq.com)
- 凤凰新闻 (ifeng.com)
- 人民网 (people.com.cn)
- 新华网 (xinhuanet.com)
- 澎湃新闻 (thepaper.cn)
- 界面新闻 (jiemian.com)
- 虎嗅网 (huxiu.com)
- 36氪 (36kr.com)
- 以及其他符合新闻页面结构的网站

## API配置示例

### OpenAI官方
```
API URL: https://api.openai.com/v1/chat/completions
模型: gpt-3.5-turbo
API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Azure OpenAI
```
API URL: https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15
模型: gpt-35-turbo
API Key: xxxxxxxxxxxxxxxxxxxxxxxx
```

### 第三方代理（如API2D等）
```
API URL: https://openai.api2d.net/v1/chat/completions
模型: gpt-3.5-turbo
API Key: fk-xxxxxxxxxxxxxxxxxxxxxxxx
```

## 文件结构

```
ai-news-summarizer/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台服务脚本
├── options.html           # 设置页面
├── options.js             # 设置页面脚本
├── content_scripts/
│   └── content.js         # 内容脚本
├── sidepanel/
│   ├── index.html         # 侧边栏主页面
│   ├── index.css          # 侧边栏样式
│   └── index.js           # 侧边栏脚本
├── images/
│   ├── icon16.png         # 图标(16x16)
│   ├── icon32.png         # 图标(32x32)
│   ├── icon48.png         # 图标(48x48)
│   └── icon128.png        # 图标(128x128)
└── README.md              # 说明文档
```

## 技术说明

- 使用Chrome Extension Manifest V3
- 采用Service Worker作为后台脚本
- 使用Chrome Side Panel API实现侧边栏
- 支持OpenAI兼容的API格式
- 内容提取针对中文新闻网站优化

## 注意事项

1. **API密钥安全**：API密钥存储在Chrome的同步存储中，请妥善保管
2. **内容长度限制**：为避免超出API限制，正文内容会被截断至约3000字符
3. **网络要求**：需要能够访问配置的API服务器
4. **隐私说明**：扩展仅在用户主动点击时提取页面内容，不会自动收集数据

## 许可证

MIT License
