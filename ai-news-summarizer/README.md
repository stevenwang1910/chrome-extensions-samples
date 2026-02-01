# AI新闻总结小助手

一个基于Chrome扩展的AI新闻总结小助手，可以使用大模型API对新闻内容进行智能摘要。

## 功能特点

- 自动提取网页新闻内容
- 使用AI大模型API生成100字以内的新闻摘要
- 支持配置多个OpenAI兼容的API渠道
- 支持自定义API URL、模型名称和API Key

## 安装步骤

1. 打开Chrome浏览器
2. 进入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `ai-news-summarizer` 文件夹

## 配置API

1. 点击扩展图标，打开弹出窗口
2. 点击右上角的⚙️设置按钮
3. 添加API渠道配置：
   - API名称：自定义名称（如"OpenAI"、"DeepSeek"等）
   - API URL：API接口地址（如 `https://api.openai.com/v1/chat/completions`）
   - 模型名称：模型名称（如 `gpt-3.5-turbo`）
   - API Key：你的API密钥
4. 启用要使用的API渠道（一次只能启用一个）
5. 点击"保存配置"

## 使用方法

1. 打开网易新闻的任意新闻页面
2. 点击扩展图标
3. 点击"总结新闻"按钮
4. 等待AI生成摘要

## 支持的API格式

本扩展支持OpenAI Chat Completions API格式的接口，包括但不限于：

- OpenAI
- DeepSeek
- Moonshot（月之暗面）
- 通义千问
- 其他兼容OpenAI格式的API

## 注意事项

- 需要有效的API Key才能使用
- API需要支持Chat Completions接口格式
- 建议在配置页面测试API是否可用

## 图标说明

扩展需要三个尺寸的PNG图标：
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

请自行准备图标文件并放入 `icons` 文件夹中。

## 开发说明

### 文件结构

```
ai-news-summarizer/
├── manifest.json      # 扩展配置文件
├── popup.html         # 弹出窗口HTML
├── popup.css          # 弹出窗口样式
├── popup.js           # 弹出窗口逻辑
├── options.html       # 配置页面HTML
├── options.css        # 配置页面样式
├── options.js         # 配置页面逻辑
├── background.js      # 后台服务脚本
├── content.js         # 内容提取脚本
├── icons/             # 图标文件夹
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # 说明文档
```

### 核心功能

- `content.js`: 从网页提取新闻正文内容
- `background.js`: 调用AI API生成摘要
- `options.js`: 管理API配置，存储在Chrome Storage中
- `popup.js`: 用户交互界面，调用后台脚本生成摘要