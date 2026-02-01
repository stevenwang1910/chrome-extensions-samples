# AI新闻总结助手 Chrome扩展

这是一个Chrome扩展，可以使用大模型API总结当前页面的新闻内容，生成100字以内的摘要。

## 功能特点

1. **智能新闻总结**：使用大模型API将新闻内容总结为100字以内的摘要
2. **多API支持**：支持配置多个OpenAI兼容的API渠道
3. **网易新闻优化**：专门针对网易新闻页面进行了优化
4. **简单易用**：在新闻页面点击按钮即可生成摘要

## 安装方法

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择`ai-news-summarizer`文件夹
6. 扩展安装完成

## 使用方法

### 1. 配置API

首次使用需要配置API：

1. 点击浏览器工具栏中的扩展图标
2. 点击"管理API"或"高级设置"
3. 点击"添加新API"
4. 填写API信息：
   - 配置名称：例如"OpenAI API"
   - API地址：例如`https://api.openai.com/v1/chat/completions`
   - 模型名称：例如`gpt-3.5-turbo`
   - API密钥：你的API密钥
5. 保存配置

### 2. 使用扩展

1. 打开网易新闻的文章页面
2. 页面上会显示"AI总结新闻"和"API配置"按钮
3. 点击"AI总结新闻"按钮
4. 等待几秒钟，会弹出AI生成的摘要

或者：

1. 点击浏览器工具栏中的扩展图标
2. 点击"总结当前新闻"按钮
3. 等待几秒钟，会显示AI生成的摘要

## 文件结构

```
ai-news-summarizer/
├── manifest.json          # 扩展清单文件
├── background.js          # 后台脚本
├── content.js             # 内容脚本
├── popup.html             # 弹窗页面
├── popup.js               # 弹窗脚本
├── options.html           # 选项页面
├── options.js             # 选项脚本
└── icons/                 # 图标文件
    ├── icon.svg           # SVG图标源文件
    ├── converter.html     # SVG转PNG工具
    └── README.md          # 图标说明
```

## 注意事项

1. **API密钥安全**：API密钥会保存在浏览器的同步存储中，请确保不要泄露
2. **网络请求**：扩展需要向配置的API地址发送请求，请确保网络连接正常
3. **新闻网站**：目前主要支持网易新闻，其他网站可能需要调整内容提取逻辑
4. **图标文件**：需要自行将SVG图标转换为PNG格式，详见icons/README.md

## 开发说明

如果你想修改或扩展此项目：

1. **内容提取**：修改`content.js`中的`extractNewsContent`函数来适配不同网站
2. **API调用**：修改`background.js`中的`callAIAPI`函数来支持不同的API格式
3. **UI界面**：修改`popup.html`和`options.html`来调整用户界面

## 许可证

MIT License