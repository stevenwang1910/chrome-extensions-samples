# 网易新闻纯净阅读模式

一个Chrome浏览器扩展程序，为网易新闻详情页面提供纯净阅读模式，隐藏广告、侧边栏、评论区等干扰元素，专注于阅读内容。

## 功能特点

- **纯净阅读**：精准识别并保留页面中的标题和正文内容
- **多媒体支持**：完整保留正文中的图片、视频、图表等多媒体内容
- **智能隐藏**：自动隐藏广告、侧边栏、评论区、导航栏、推荐内容等干扰元素
- **通用适配**：不仅适用于网易新闻，也支持其他类似新闻页面结构
- **快捷键支持**：使用 `Ctrl+Shift+R` (Mac: `Command+Shift+R`) 快速切换阅读模式
- **字体调节**：支持切换字体大小，适应不同阅读需求
- **深色模式**：自动适配系统深色模式偏好
- **一键退出**：按 `ESC` 键或点击关闭按钮快速退出阅读模式

## 安装方法

### 开发者模式安装

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `netease-reader-mode` 文件夹

## 使用方法

### 方式一：点击扩展图标
- 点击浏览器工具栏中的扩展图标，切换阅读模式

### 方式二：快捷键
- 按 `Ctrl+Shift+R` (Mac: `Command+Shift+R`) 快速切换

### 方式三：ESC键退出
- 在阅读模式下按 `ESC` 键退出

### 阅读模式下的操作
- **Aa按钮**：切换字体大小（4档可调）
- **✕按钮**：退出阅读模式

## 技术实现

### 内容识别策略

扩展通过多种CSS选择器精准定位页面元素：

- **标题识别**：`h1.post_title`, `h1.title`, `.article-title` 等
- **正文识别**：`.post_body`, `.post-content`, `.article-content`, `#content` 等
- **作者信息**：`.post_info`, `.author`, `.source` 等
- **多媒体内容**：`img`, `video`, `figure`, `iframe`, `table`, `blockquote` 等

### 隐藏元素策略

自动隐藏以下类型的元素：
- 导航栏 (`.ntes_nav_wrap`, `.ntes-nav`)
- 广告区域 (`[class*="ad_"]`, `[id*="ad_"]`)
- 评论区 (`.post_comment`, `#post_comment_area`)
- 推荐内容 (`.post_recommends`, `.related-news`)
- 分享按钮 (`.post_top_share`)
- 面包屑导航 (`.post_crumb`)

### 支持的页面

- 网易新闻详情页 (`*.163.com`)
- 本地测试页面 (`localhost`, `127.0.0.1`)

## 文件结构

```
netease-reader-mode/
├── manifest.json      # 扩展配置文件
├── background.js      # 后台服务脚本
├── content.js         # 内容脚本
├── reader-mode.css    # 阅读模式样式
├── README.md          # 说明文档
└── images/
    ├── icon-16.png    # 16x16图标
    ├── icon-32.png    # 32x32图标
    ├── icon-48.png    # 48x48图标
    └── icon-128.png   # 128x128图标
```

## 权限说明

- `scripting`: 用于注入CSS和脚本
- `activeTab`: 用于获取当前活动标签页
- `storage`: 用于保存用户偏好设置

## 浏览器兼容性

- Chrome 88+
- Edge 88+
- 其他基于Chromium的浏览器

## 更新日志

### v1.0
- 初始版本发布
- 实现基础阅读模式功能
- 支持字体大小调节
- 支持深色模式
- 支持图片、视频、图表等多媒体内容显示

## 许可证

MIT License
