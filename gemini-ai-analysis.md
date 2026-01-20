# Gemini AI 案例分析报告

## 1. 案例概述

本报告分析了 `c:\Users\lyxs\project\0115\chrome-extensions-samples\01\functional-samples\` 目录下所有以 `ai.gemini` 开头的 Chrome 扩展案例，共 6 个案例。这些案例展示了如何在 Chrome 扩展中集成 Gemini AI 技术，包括云端 API 和本地模型。

## 2. 各案例分析

### 2.1 ai.gemini-in-the-cloud

#### 功能描述
- 提供 Gemini API 的聊天界面
- 允许用户输入提示词并获取 AI 响应
- 支持调整生成温度参数

#### 使用的 AI 技术
- **Gemini 云端 API**：通过 `@google/genai` 客户端库调用
- **模型**：`gemini-2.5-flash`
- **API 方式**：同步请求响应

#### 核心实现
```javascript
import { GoogleGenAI } from '../node_modules/@google/genai/dist/index.mjs';

const genAI = new GoogleGenAI({ apiKey });
const response = await genAI.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: {
    safetySettings: [...],
    temperature: config.temperature
  }
});
```

### 2.2 ai.gemini-on-device

#### 功能描述
- 提供基于 Chrome 内置 Gemini Nano 模型的聊天界面
- 支持调整温度和 topK 参数
- 提供会话重置功能

#### 使用的 AI 技术
- **Chrome 内置 Gemini Nano 模型**：通过 `LanguageModel` API 调用
- **本地运行**：所有 AI 处理都在用户设备上完成，无需网络连接

#### 核心实现
```javascript
/* global LanguageModel */

if (!session) {
  session = await LanguageModel.create(params);
}
return session.prompt(prompt);
```

### 2.3 ai.gemini-on-device-alt-texter

#### 功能描述
- 为网页图像生成可访问的 alt 文本
- 支持将描述翻译成多种语言
- 提供上下文菜单集成和复制功能

#### 使用的 AI 技术
- **Gemini Nano 多模态能力**：分析图像内容
- **Translator API**：翻译生成的描述
- **本地运行**：所有 AI 处理都在用户设备上完成

#### 核心实现
```javascript
const session = await self.LanguageModel.create({
  temperature: 0.0,
  topK: 1.0,
  expectedInputs: [{ type: 'image' }]
});

const prompt = [{
  role: 'user',
  content: [
    { type: 'text', value: 'Please provide a functional, objective description...' },
    { type: 'image', value: imageBitmap }
  ]
}];
return await session.prompt(prompt);
```

### 2.4 ai.gemini-on-device-audio-scribe

#### 功能描述
- 实时转录聊天应用中的音频消息
- 自动检测并处理页面上的音频 blob
- 提供流式响应展示

#### 使用的 AI 技术
- **Gemini Nano 音频转录能力**：将音频转换为文本
- **流式处理**：实时展示转录结果
- **本地运行**：所有 AI 处理都在用户设备上完成

#### 核心实现
```javascript
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'audio' }]
});

const stream = session.promptStreaming([{
  role: 'user',
  content: [
    { type: 'text', value: 'transcribe this audio' },
    { type: 'audio', value: content }
  ]
}]);

for await (const chunk of stream) {
  li.append(chunk);
}
```

### 2.5 ai.gemini-on-device-calendar-mate

#### 功能描述
- 从自然语言文本中提取日历事件详情
- 自动填充 Google Calendar 事件
- 支持上下文菜单集成

#### 使用的 AI 技术
- **Gemini Nano 文本分析能力**：提取结构化信息
- **本地运行**：所有 AI 处理都在用户设备上完成

#### 核心实现
- 通过 `LanguageModel` API 调用本地模型
- 从选中的文本中提取事件标题、日期/时间、地点、描述和时区
- 生成 Google Calendar URL 并在新标签页中打开

### 2.6 ai.gemini-on-device-summarization

#### 功能描述
- 自动生成网页内容的摘要
- 去除导航、广告等无关内容
- 提供侧边栏展示摘要

#### 使用的 AI 技术
- **Chrome 内置 Summarizer API**：基于 Gemini Nano
- **Readability 库**：提取网页主要内容
- **本地运行**：所有 AI 处理都在用户设备上完成

#### 核心实现
- 使用 Mozilla 的 Readability 库提取网页主要内容
- 通过 Summarizer API 生成摘要
- 在侧边栏中展示摘要结果

## 3. AI 技术总结

### 3.1 使用的 AI 服务

| 案例名称 | AI 服务类型 | 模型 | 运行方式 |
|---------|------------|------|---------|
| ai.gemini-in-the-cloud | Gemini 云 API | gemini-2.5-flash | 云端 |
| ai.gemini-on-device | Chrome 内置 AI | Gemini Nano | 本地 |
| ai.gemini-on-device-alt-texter | Chrome 内置 AI + Translator | Gemini Nano | 本地 |
| ai.gemini-on-device-audio-scribe | Chrome 内置 AI | Gemini Nano | 本地 |
| ai.gemini-on-device-calendar-mate | Chrome 内置 AI | Gemini Nano | 本地 |
| ai.gemini-on-device-summarization | Chrome 内置 AI | Gemini Nano | 本地 |

### 3.2 AI 能力分析

这些案例展示了 Gemini AI 的多种能力：

1. **文本生成**：聊天回复、摘要生成
2. **多模态处理**：
   - 图像分析（生成 alt 文本）
   - 音频转录（语音转文本）
3. **结构化信息提取**：从自然语言中提取日历事件详情
4. **语言翻译**：将生成的文本翻译成多种语言
5. **流式处理**：实时展示音频转录结果

## 4. 切换到 OpenAI API 的方法

### 4.1 云端 API 案例（ai.gemini-in-the-cloud）

#### 修改示例

**步骤 1：安装 OpenAI 客户端库**
```bash
npm install openai
```

**步骤 2：修改核心代码（sidepanel/index.js）**
```javascript
// 替换 Gemini 客户端导入
// import { GoogleGenAI } from '../node_modules/@google/genai/dist/index.mjs';
import OpenAI from '../node_modules/openai/index.mjs';

// 保持 API 密钥管理方式不变
const apiKey = '...';

let openai = null;
let generationConfig = {
  temperature: 1
};

// 保持 UI 元素引用不变
const inputPrompt = document.body.querySelector('#input-prompt');
const buttonPrompt = document.body.querySelector('#button-prompt');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const sliderTemperature = document.body.querySelector('#temperature');
const labelTemperature = document.body.querySelector('#label-temperature');

// 修改 runPrompt 函数以使用 OpenAI API
async function runPrompt(prompt, config) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 替换为 OpenAI 模型
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature
      // OpenAI API 不直接支持 Gemini 的 safetySettings
      // 可以通过系统提示词实现类似功能
    });
    return response.choices[0].message.content;
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    throw e;
  }
}

// 保持事件监听器不变
sliderTemperature.addEventListener('input', (event) => {
  labelTemperature.textContent = event.target.value;
  generationConfig.temperature = event.target.value;
});

inputPrompt.addEventListener('input', () => {
  if (inputPrompt.value.trim()) {
    buttonPrompt.removeAttribute('disabled');
  } else {
    buttonPrompt.setAttribute('disabled', '');
  }
});

// 修改按钮点击事件以初始化 OpenAI 客户端
buttonPrompt.addEventListener('click', async () => {
  const prompt = inputPrompt.value.trim();
  showLoading();
  try {
    const config = {
      temperature: parseFloat(sliderTemperature.value)
    };
    // 初始化 OpenAI 客户端
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // 仅用于测试，生产环境应使用后端代理
    });
    const response = await runPrompt(prompt, config);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

// 保持 UI 辅助函数不变
function showLoading() {
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  // Make sure to preserve line breaks in the response
  elementResponse.textContent = '';
  const paragraphs = response.split(/\r?\n/);
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if (paragraph) {
      elementResponse.appendChild(document.createTextNode(paragraph));
    }
    // Don't add a new line after the final paragraph
    if (i < paragraphs.length - 1) {
      elementResponse.appendChild(document.createElement('BR'));
    }
  }
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute('hidden');
}

function hide(element) {
  element.setAttribute('hidden', '');
}
```

### 4.2 本地 AI 案例（其他 5 个案例）

对于使用 Chrome 内置 `LanguageModel` API 的本地 AI 案例，切换到 OpenAI API 需要将本地模型调用替换为云端 API 调用。

#### 4.2.1 ai.gemini-on-device（聊天界面）

**修改核心代码示例**
```javascript
// 移除 LanguageModel 引用
// /* global LanguageModel */

import DOMPurify from 'dompurify';
import { marked } from 'marked';
import OpenAI from '../node_modules/openai/index.mjs';

// 添加 OpenAI 客户端配置
const apiKey = '...';
let openai = null;

// 保持 UI 元素引用不变
const inputPrompt = document.body.querySelector('#input-prompt');
const buttonPrompt = document.body.querySelector('#button-prompt');
const buttonReset = document.body.querySelector('#button-reset');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const sliderTemperature = document.body.querySelector('#temperature');
const sliderTopK = document.body.querySelector('#top-k');
const labelTemperature = document.body.querySelector('#label-temperature');
const labelTopK = document.body.querySelector('#label-top-k');

// 修改 runPrompt 函数
async function runPrompt(prompt, params) {
  try {
    // 初始化 OpenAI 客户端
    if (!openai) {
      openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    
    // 构建消息数组
    const messages = [];
    
    // 添加系统提示词（如果有）
    if (params.initialPrompts) {
      messages.push(...params.initialPrompts);
    }
    
    // 添加用户提示
    messages.push({ role: 'user', content: prompt });
    
    // 调用 OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: parseFloat(params.temperature),
      // OpenAI 不直接支持 topK，可使用 top_p 替代
      top_p: 0.9
    });
    
    return response.choices[0].message.content;
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    throw e;
  }
}

// 修改 initDefaults 函数，移除 LanguageModel 相关代码
async function initDefaults() {
  // 移除 LanguageModel 相关代码
  // 使用 OpenAI 默认参数
  sliderTemperature.value = 0.7;
  labelTemperature.textContent = 0.7;
  
  // OpenAI 不直接支持 topK，隐藏或禁用相关 UI
  sliderTopK.style.display = 'none';
  document.querySelector('label[for="top-k"]').style.display = 'none';
}

// 保持其他事件监听器不变
// ...
```

#### 4.2.2 ai.gemini-on-device-alt-texter（图像分析）

**修改核心代码示例（background.js）**
```javascript
// 移除 LanguageModel 引用
// /* global LanguageModel */

import OpenAI from './node_modules/openai/index.mjs';

const apiKey = '...';

// 修改 generateAltText 函数
async function generateAltText(imgSrc) {
  // 初始化 OpenAI 客户端
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
  
  try {
    // 获取图像数据
    const response = await fetch(imgSrc);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const mimeType = blob.type;
    
    // 调用 OpenAI 多模态 API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              value: `Please provide a functional, objective description of the provided image in no more than around 30 words so that someone who could not see it would be able to imagine it. If possible, follow an "object-action-context" framework. The object is the main focus. The action describes what's happening, usually what the object is doing. The context describes the surrounding environment. If there is text found in the image, do your best to transcribe the important bits, even if it extends the word count beyond 30 words. It should not contain quotation marks, as those tend to cause issues when rendered on the web. If there is no text found in the image, then there is no need to mention it. You should not begin the description with any variation of "The image".`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ]
    });
    
    return completion.choices[0].message.content;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// 保持其他代码不变
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateAltText',
    title: 'Generate alt text',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  if (info.menuItemId === 'generateAltText' && info.srcUrl) {
    // Start opening the popup
    const [result] = await Promise.allSettled([
      generateAltText(info.srcUrl),
      chrome.action.openPopup()
    ]);
    chrome.runtime.sendMessage({
      action: 'alt-text',
      text: result.status === 'fulfilled' ? result.value : result.reason.message
    });
  }
});
```

#### 4.2.3 ai.gemini-on-device-audio-scribe（音频转录）

**修改核心代码示例（sidepanel.js）**
```javascript
// 移除 LanguageModel 引用
// /* global LanguageModel */

import OpenAI from '../node_modules/openai/index.mjs';

const apiKey = '...';

chrome.runtime.onMessage.addListener(async ({ data }) => {
  let content;
  try {
    if (data.type != 'audio-scribe' || !data || !isValidUrl(data.objectUrl)) {
      return;
    }
    // Check if it's an audio file
    const audio = await fetch(data.objectUrl);
    content = await audio.blob();
    if (!content.type || !content.type.startsWith('audio/')) {
      return;
    }
  } catch (e) {
    console.log(e);
  }

  // Setup message UI
  const messages = document.getElementById('messages');
  const li = document.createElement('li');
  li.append('...');
  messages.append(li);

  try {
    // 初始化 OpenAI 客户端
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    // 调用 OpenAI 音频转录 API
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: content,
      response_format: 'text'
    });
    
    // 更新 UI
    li.textContent = transcription;
  } catch (error) {
    console.log(error);
    li.textContent = error.message;
  }
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
```

#### 4.2.4 ai.gemini-on-device-calendar-mate（日历事件提取）

**修改核心代码示例**
```javascript
// 移除 LanguageModel 引用
// /* global LanguageModel */

import OpenAI from '../node_modules/openai/index.mjs';

const apiKey = '...';

// 修改事件提取函数
async function extractEventDetails(text) {
  // 初始化 OpenAI 客户端
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
  
  try {
    // 调用 OpenAI API 提取结构化数据
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that extracts calendar event details from text. Return the result as a JSON object with the following fields: title, startDateTime, endDateTime, location, description, timezone.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    // 解析 JSON 响应
    const eventDetails = JSON.parse(completion.choices[0].message.content);
    return eventDetails;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// 保持其他代码不变
// ...
```

#### 4.2.5 ai.gemini-on-device-summarization（网页摘要）

**修改核心代码示例**
```javascript
// 移除 Summarizer API 引用

import OpenAI from '../node_modules/openai/index.mjs';
import { Readability } from '../node_modules/@mozilla/readability/Readability.js';

const apiKey = '...';

// 修改摘要生成函数
async function generateSummary(content) {
  // 初始化 OpenAI 客户端
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
  
  try {
    // 调用 OpenAI API 生成摘要
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that summarizes web page content. Provide a concise and informative summary of the following text.'
        },
        {
          role: 'user',
          content: content
        }
      ]
    });
    
    return completion.choices[0].message.content;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// 保持其他代码不变
// 使用 Readability 提取网页内容后调用 generateSummary
// ...
```

### 4.3 OpenAI API 集成最佳实践

1. **API 密钥管理**：
   - 不要在扩展代码中硬编码 API 密钥
   - 考虑使用后端代理服务器处理 API 请求
   - 允许用户提供自己的 API 密钥

2. **模型选择**：
   - 根据功能需求选择合适的模型
   - 对于文本生成：`gpt-4o-mini`（平衡性能和成本）或 `gpt-4o`（更高质量）
   - 对于音频转录：`whisper-1`
   - 对于多模态任务：`gpt-4o` 或 `gpt-4o-mini`

3. **参数映射**：
   - Gemini 的 `temperature` → OpenAI 的 `temperature`
   - Gemini 的 `topK` → OpenAI 建议使用 `top_p` 替代
   - Gemini 的 `safetySettings` → 使用系统提示词或内容过滤

4. **错误处理**：
   - 处理网络错误和 API 错误
   - 为用户提供清晰的错误信息
   - 考虑实现重试机制

5. **性能优化**：
   - 使用流式响应（stream）提升用户体验
   - 限制请求内容长度以避免超时
   - 实现缓存机制减少重复请求

### 4.4 注意事项

- **成本**：OpenAI API 按使用量计费，需要考虑成本控制
- **隐私**：将用户数据发送到云端需要符合隐私法规
- **延迟**：云端 API 可能比本地模型有更高的延迟
- **功能限制**：某些本地功能（如离线使用）可能无法在云端 API 中实现
- **内容政策**：需要遵守 OpenAI 的内容政策

## 5. 使用 Ollama 的离线方案

### 5.1 Ollama 简介

[Ollama](https://ollama.com/) 是一个开源的本地 AI 模型运行框架，允许用户在自己的设备上运行各种大语言模型，如 Llama 3、Mistral、Gemma 等。它提供了简单的 API 接口，可以轻松集成到各种应用中，包括 Chrome 扩展。

#### 优势
- **完全离线**：所有计算都在本地设备上完成，无需网络连接
- **隐私保护**：数据不会离开用户设备
- **免费使用**：基于开源模型，无需支付 API 费用
- **灵活配置**：可以根据设备性能选择不同大小的模型
- **多模型支持**：支持多种开源大语言模型

### 5.2 环境设置

1. **安装 Ollama**：从 [Ollama 官网](https://ollama.com/) 下载并安装适合您操作系统的版本
2. **拉取模型**：使用命令行拉取所需模型，例如：
   ```bash
   ollama pull llama3
   ollama pull mistral
   ollama pull gemma
   ```
3. **启动 Ollama 服务**：安装完成后，Ollama 会自动在本地启动一个 API 服务，默认地址为 `http://localhost:11434`

### 5.3 案例修改示例

#### 5.3.1 ai.gemini-in-the-cloud 和 ai.gemini-on-device（聊天界面）

**修改核心代码示例**
```javascript
// 移除云端或本地 AI 引用
// import { GoogleGenAI } from '../node_modules/@google/genai/dist/index.mjs';
// /* global LanguageModel */

// 保持 UI 元素引用不变
const inputPrompt = document.body.querySelector('#input-prompt');
const buttonPrompt = document.body.querySelector('#button-prompt');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const sliderTemperature = document.body.querySelector('#temperature');
const labelTemperature = document.body.querySelector('#label-temperature');

let generationConfig = {
  temperature: 1
};

// 修改 runPrompt 函数以使用 Ollama API
async function runPrompt(prompt, config) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3', // 替换为您安装的模型
        prompt: prompt,
        temperature: parseFloat(config.temperature),
        stream: false
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.response;
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    throw e;
  }
}

// 保持其他事件监听器和 UI 函数不变
// ...
```

#### 5.3.2 ai.gemini-on-device-alt-texter（图像分析）

**修改核心代码示例（background.js）**
```javascript
// 修改 generateAltText 函数
async function generateAltText(imgSrc) {
  try {
    // 获取图像数据
    const response = await fetch(imgSrc);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const mimeType = blob.type;
    
    // 调用 Ollama API（需要支持多模态的模型）
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llava', // 需要安装支持图像的模型，如 llava
        prompt: `Please provide a functional, objective description of the provided image in no more than around 30 words so that someone who could not see it would be able to imagine it. If possible, follow an "object-action-context" framework. The object is the main focus. The action describes what's happening, usually what the object is doing. The context describes the surrounding environment. If there is text found in the image, do your best to transcribe the important bits, even if it extends the word count beyond 30 words. It should not contain quotation marks, as those tend to cause issues when rendered on the web. If there is no text found in the image, then there is no need to mention it. You should not begin the description with any variation of "The image".`,
        images: [base64Image], // Ollama 支持直接传递 base64 编码的图像
        temperature: 0.0
      })
    });
    
    const data = await ollamaResponse.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.response;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// 保持其他代码不变
// ...
```

#### 5.3.3 ai.gemini-on-device-audio-scribe（音频转录）

**修改核心代码示例（sidepanel.js）**
```javascript
chrome.runtime.onMessage.addListener(async ({ data }) => {
  let content;
  try {
    if (data.type != 'audio-scribe' || !data || !isValidUrl(data.objectUrl)) {
      return;
    }
    // Check if it's an audio file
    const audio = await fetch(data.objectUrl);
    content = await audio.blob();
    if (!content.type || !content.type.startsWith('audio/')) {
      return;
    }
  } catch (e) {
    console.log(e);
  }

  // Setup message UI
  const messages = document.getElementById('messages');
  const li = document.createElement('li');
  li.append('...');
  messages.append(li);

  try {
    // 将音频转换为 base64
    const arrayBuffer = await content.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // 调用 Ollama API（需要支持音频的模型）
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'whisper', // 需要安装支持音频的模型
        prompt: 'transcribe this audio',
        audio: base64Audio,
        stream: false
      })
    });
    
    const data = await ollamaResponse.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    // 更新 UI
    li.textContent = data.response;
  } catch (error) {
    console.log(error);
    li.textContent = error.message;
  }
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
```

#### 5.3.4 ai.gemini-on-device-calendar-mate（日历事件提取）

**修改核心代码示例**
```javascript
// 修改事件提取函数
async function extractEventDetails(text) {
  try {
    // 调用 Ollama API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `You are an AI assistant that extracts calendar event details from text. Return the result as a JSON object with the following fields: title, startDateTime, endDateTime, location, description, timezone.\n\nText: ${text}`,
        format: 'json',
        stream: false
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    // 解析 JSON 响应
    const eventDetails = JSON.parse(data.response);
    return eventDetails;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// 保持其他代码不变
// ...
```

#### 5.3.5 ai.gemini-on-device-summarization（网页摘要）

**修改核心代码示例**
```javascript
// 移除 Summarizer API 引用

import { Readability } from '../node_modules/@mozilla/readability/Readability.js';

// 修改摘要生成函数
async function generateSummary(content) {
  try {
    // 调用 Ollama API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `You are an AI assistant that summarizes web page content. Provide a concise and informative summary of the following text.\n\nText: ${content}`,
        stream: false
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.response;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// 保持其他代码不变
// 使用 Readability 提取网页内容后调用 generateSummary
// ...
```

### 5.4 注意事项

1. **跨域问题**：
   - Chrome 扩展的内容脚本无法直接访问本地 Ollama API（存在跨域限制）
   - 解决方案：
     - 在扩展的 `manifest.json` 中添加权限：
       ```json
       "host_permissions": [
         "http://localhost:11434/*"
       ]
       ```
     - 使用扩展的后台脚本作为中间层，内容脚本通过消息传递与后台脚本通信，后台脚本再调用 Ollama API

2. **模型性能**：
   - 较大的模型需要更多的系统资源（内存、CPU/GPU）
   - 建议根据设备性能选择合适大小的模型
   - 可以通过调整 `num_threads`、`num_gpu` 等参数优化性能

3. **功能限制**：
   - 并非所有模型都支持多模态功能（图像、音频）
   - 需要选择专门支持相应功能的模型
   - 某些高级功能可能不如云端 API 完善

4. **API 差异**：
   - Ollama API 与 Gemini/OpenAI API 存在差异
   - 需要根据 Ollama API 文档调整请求参数和响应处理

### 5.5 最佳实践

1. **模型选择**：
   - 文本生成：llama3、mistral、gemma
   - 图像分析：llava、bakllava
   - 音频转录：whisper
   - 代码生成：deepseek-coder、starcoder2

2. **性能优化**：
   - 对于资源受限的设备，使用较小的模型（如 llama3:8b、mistral:7b）
   - 启用流式响应（`stream: true`）提升用户体验
   - 实现请求缓存减少重复计算

3. **错误处理**：
   - 处理网络连接错误（Ollama 服务未运行）
   - 处理模型不存在或加载失败的情况
   - 为用户提供清晰的错误信息

4. **用户体验**：
   - 显示模型加载状态
   - 提供模型选择选项
   - 允许用户调整生成参数

## 6. 总结

这些以 `ai.gemini` 开头的案例展示了 Gemini AI 在 Chrome 扩展中的多种应用方式，从简单的聊天界面到复杂的多模态处理。它们充分利用了 Gemini AI 的文本生成、图像分析、音频转录和结构化信息提取能力。

切换到其他 AI 服务需要根据具体案例和目标 AI 服务的特点进行相应修改，主要涉及客户端库替换、API 调用方式调整和参数适配。对于本地运行的案例，切换到其他 AI 服务会更复杂，可能需要重新设计实现方案。

本文提供了两种替代方案：
1. **OpenAI API**：云端解决方案，提供强大的 AI 能力和多模态支持
2. **Ollama**：本地离线解决方案，提供更好的隐私保护和零成本使用

开发者可以根据项目需求、用户隐私要求和资源限制选择合适的方案。这些案例为开发者提供了很好的参考，展示了如何将 AI 技术集成到 Chrome 扩展中，以增强用户体验和提供创新功能。