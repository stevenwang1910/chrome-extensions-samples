# 网易新闻纯净阅读模式 Chrome 扩展

## 简介

这是一个Chrome浏览器扩展，为网易新闻详情页面提供纯净阅读模式功能。该扩展能够精准识别并保留页面中的标题和正文内容，隐藏所有其他非必要元素，包括广告、侧边栏、评论区、导航栏、推荐内容及其他干扰阅读的元素。

## 功能特点

- **精准内容识别**：智能识别并保留文章标题和正文内容
- **干扰元素隐藏**：隐藏广告、侧边栏、评论区、导航栏等非必要元素
- **阅读模式切换**：用户可以手动切换阅读模式
- **自动启用选项**：支持设置自动启用阅读模式
- **通用适用性**：不仅适用于网易新闻，也可用于其他类似的新闻网站
- **阅读体验优化**：优化字体大小、行间距和排版，提供更好的阅读体验

## 安装方法

### 方法一：使用安装脚本（Windows用户，推荐）

1. 双击运行`install.bat`文件
2. 按照脚本提示完成安装

### 方法二：手动安装

1. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择`netease-reading-mode`文件夹
5. 扩展安装完成，可以在浏览器工具栏看到扩展图标

详细安装说明请参考`INSTALL.md`文件。

## 更新日志

### v1.1 (2025-01-31)
- 修复了"Unchecked runtime.lastError: Could not establish connection"错误
- 解决了正文被悬浮跟帖图标遮挡的问题
- 扩展了页面匹配范围，支持更多网易新闻页面类型
- 优化了内容识别算法，能够更准确地找到标题和正文内容
- 增强了样式表，确保阅读模式在各种页面结构下都能正常工作
- 添加了更多悬浮元素的隐藏规则

### v1.0 (初始版本)
- 基本的纯净阅读模式功能
- 支持网易新闻文章页面
- 提供弹出界面控制

## 使用方法

1. 访问网易新闻详情页面
2. 点击浏览器工具栏中的扩展图标
3. 在弹出界面中点击"切换阅读模式"按钮
4. 页面将切换到纯净阅读模式，只显示标题和正文内容

### 自动启用阅读模式

1. 点击浏览器工具栏中的扩展图标
2. 在弹出界面中开启"自动启用阅读模式"选项
3. 之后访问网易新闻详情页面时，将自动启用阅读模式

### 页面内切换

在阅读模式下，页面右上角会显示一个"退出阅读"按钮，点击即可退出阅读模式。

## 文件结构

```
netease-reading-mode/
├── manifest.json          # 扩展配置文件
├── content.js             # 内容脚本，负责页面元素处理
├── styles.css             # 阅读模式样式
├── popup.html             # 扩展弹出界面
├── popup.js               # 弹出界面交互逻辑
├── background.js          # 后台脚本
├── icons/                 # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
├── test.html              # 测试页面
├── test_page.html         # 备用测试页面
├── install.bat            # Windows安装脚本
├── create_icons.js        # 图标生成脚本
├── INSTALL.md             # 详细安装说明
└── README.md              # 说明文档
```

## 技术实现

### 内容识别

扩展通过以下选择器识别页面中的标题和正文内容：

- 标题选择器：`.article_title`, `.post_title`, `.post_text_title`, `h1`
- 正文选择器：`.post_body`, `.post_content`, `#content`, `.article_content`, `.content`

### 干扰元素隐藏

扩展隐藏以下类型的元素：

- 导航栏：`.ntes_nav_wrap`, `.header`, `.nav`, `.navigation`
- 侧边栏：`.post_side`, `.sidebar`, `.side`, `.aside`
- 广告：`.ad_module`, `.ad`, `.advertisement`, `.gg300`, `[data-adid]`, `.right_ad_item`
- 推荐内容：`.post_recommend`, `.recommend`, `.related`, `.hot-news`
- 评论区：`.comment`, `.comments`, `.post_comment`
- 分享按钮：`.share`, `.post_share`
- 页脚：`.footer`, `.post_footer`
- 其他干扰元素：`.blank20`, `.blank25`, `.post_wemedia`, `.post_source`, `.post_time`, `.post_tag`, `.ep-source`, `.ep-time`

### 阅读模式样式

阅读模式下，正文内容采用以下样式：

- 字体大小：18px
- 行高：1.8
- 颜色：#333333
- 对齐方式：两端对齐
- 段落缩进：2em
- 段落间距：18px

## 测试方法

1. 打开项目中的`test_page.html`文件，这是一个模拟网易新闻页面的测试页面
2. 在Chrome中加载扩展后访问该测试页面
3. 测试扩展的各项功能是否正常工作

## 自定义配置

如果需要将扩展应用于其他新闻网站，可以修改`manifest.json`文件中的`matches`字段，添加相应的URL匹配规则：

```json
"content_scripts": [
  {
    "matches": [
      "*://*.163.com/dy/article/*",
      "*://*.163.com/article/*",
      "*://news.163.com/*",
      "*://*.example.com/news/*"  // 添加新的网站URL
    ],
    "js": ["content.js"],
    "css": ["styles.css"],
    "run_at": "document_end"
  }
]
```

同时，可能需要根据目标网站的HTML结构，调整`content.js`中的元素选择器。

## 注意事项

1. 本扩展仅用于改善阅读体验，不会修改文章内容本身
2. 扩展仅在网易新闻详情页面及类似结构的新闻网站上生效
3. 如果页面结构发生重大变化，可能需要更新扩展中的选择器

## 版本历史

- v1.0：初始版本，实现基本的阅读模式功能

## 许可证

本项目采用MIT许可证。