# AI Gemini 扩展案例分析

本文档分析了 `chrome-extensions-samples/01/functional-samples/` 目录下以 `ai.gemini` 开头的6个案例，详细介绍了它们使用AI的方式以及切换到其他AI服务（特别是OpenAI API和Ollama本地模型）的方法。

## 1. ai.gemini-in-the-cloud

### AI功能
- **云API调用**：使用Gemini Cloud API提供聊天界面
- **模型**：使用`gemini-2.5-flash`云模型
- **功能**：文本生成、对话交互
- **配置**：支持temperature参数调整生成随机性

### 核心实现
```javascript
// 使用GoogleGenAI库调用云API
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

### 切换到其他AI
1. **替换客户端库**：将`@google/genai`替换为目标AI服务的客户端库（如OpenAI、Anthropic等）
2. **更新API调用**：修改模型调用方法和参数结构以匹配新API
3. **调整认证方式**：替换API密钥认证为新服务的认证机制
4. **修改模型配置**：调整temperature等参数，可能需要添加/删除特定配置项

#### 使用OpenAI API替换示例
```javascript
// 1. 安装OpenAI客户端库：npm install openai
// 2. 替换导入和API调用

// 使用OpenAI客户端库
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 调用Chat Completions API
const response = await openai.chat.completions.create({
  model: 'gpt-4o', // 或 gpt-3.5-turbo
  messages: [
    { role: 'user', content: prompt }
  ],
  temperature: config.temperature,
  // OpenAI没有直接对应的safetySettings，但可以使用content_filter参数
});

// 获取响应文本
const text = response.choices[0].message.content;
```

**主要变化：**
- 使用`openai`库替代`@google/genai`
- 调用`chat.completions.create`方法替代`models.generateContent`
- 参数结构从`contents`改为`messages`数组
- 模型名称从`gemini-2.5-flash`改为`gpt-4o`或`gpt-3.5-turbo`
- 安全设置机制不同，OpenAI使用内置的内容过滤
- 响应处理方式不同，需要从`response.choices[0].message.content`获取结果

#### 使用Ollama本地模型替换示例
```javascript
// 1. 确保已安装Ollama并运行服务：https://ollama.com/download
// 2. 拉取所需模型：ollama pull llama3
// 3. 直接使用fetch调用Ollama API

async function callOllamaAPI(prompt, config) {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3', // 可替换为其他Ollama支持的模型
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        stream: false, // 关闭流式响应
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Ollama API调用失败:', error);
    throw error;
  }
}

// 使用示例
const text = await callOllamaAPI(prompt, config);
```

**主要变化：**
- 无需安装客户端库，直接使用`fetch`调用Ollama REST API
- 调用`/api/chat`端点替代`models.generateContent`
- 参数结构与OpenAI类似，使用`messages`数组
- 模型名称从`gemini-2.5-flash`改为Ollama支持的模型（如`llama3`、`mistral`等）
- 安全设置需要在Ollama服务端配置
- 响应处理：从`data.message.content`获取结果

## 2. ai.gemini-on-device

### AI功能
- **本地AI推理**：使用Chrome内置的Gemini Nano本地模型
- **功能**：文本生成、对话交互
- **配置**：支持temperature和topK参数
- **特点**：无需网络连接，保护隐私

### 核心实现
```javascript
// 使用Chrome内置的LanguageModel API
const session = await LanguageModel.create(params);
const response = session.prompt(prompt);
```

### 切换到其他AI
1. **替换API调用**：将`LanguageModel` API调用替换为其他本地AI库或API
2. **调整模型参数**：修改temperature、topK等参数以匹配新模型
3. **处理会话管理**：可能需要重新实现会话创建、销毁等逻辑
4. **添加依赖**：如果使用外部库，需要添加相应的依赖包

#### 使用OpenAI API替换示例
由于OpenAI目前没有像Gemini Nano这样的浏览器本地模型，我们需要改为使用OpenAI云API：

```javascript
// 1. 安装OpenAI客户端库：npm install openai
// 2. 替换本地API调用为云API调用

// 使用OpenAI客户端库
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 管理对话历史（模拟会话）
let conversationHistory = [];

async function runPrompt(prompt, params) {
  try {
    // 添加系统提示（如果有）
    if (params.initialPrompts) {
      conversationHistory = [...params.initialPrompts];
    }
    
    // 添加用户提示
    conversationHistory.push({ role: 'user', content: prompt });
    
    // 调用OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // 或 gpt-3.5-turbo
      messages: conversationHistory,
      temperature: parseFloat(params.temperature),
      top_p: params.topK, // OpenAI使用top_p替代topK
    });
    
    // 获取响应并添加到对话历史
    const assistantMessage = response.choices[0].message;
    conversationHistory.push(assistantMessage);
    
    return assistantMessage.content;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// 重置会话（清空对话历史）
async function reset() {
  conversationHistory = [];
}
```

**主要变化：**
- 从本地模型改为云API调用
- 使用`openai`库替代内置的`LanguageModel`
- 手动管理对话历史以模拟会话功能
- 将`topK`参数映射到OpenAI的`top_p`
- 不再需要会话创建和销毁API调用

#### 使用Ollama本地模型替换示例
```javascript
// 1. 确保已安装Ollama并运行服务：https://ollama.com/download
// 2. 拉取所需模型：ollama pull llama3
// 3. 替换本地API调用为Ollama API调用

// 会话管理
let sessions = new Map();
let currentSessionId = null;

async function createSession(params) {
  // Ollama不需要显式创建会话，使用对话历史模拟
  const sessionId = Date.now().toString();
  const session = {
    id: sessionId,
    messages: [],
    params: {
      temperature: parseFloat(params.temperature || 0.7),
      top_k: parseInt(params.topK || 40),
      // 添加其他Ollama支持的参数
    }
  };
  
  // 添加系统提示（如果有）
  if (params.initialPrompts) {
    session.messages = [...params.initialPrompts];
  }
  
  sessions.set(sessionId, session);
  currentSessionId = sessionId;
  return sessionId;
}

async function runPrompt(prompt, params) {
  try {
    // 如果没有当前会话，创建一个
    if (!currentSessionId) {
      await createSession(params);
    }
    
    const session = sessions.get(currentSessionId);
    
    // 添加用户提示
    session.messages.push({ role: 'user', content: prompt });
    
    // 调用Ollama API
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3', // 可替换为其他Ollama支持的模型
        messages: session.messages,
        temperature: session.params.temperature,
        top_k: session.params.top_k,
        stream: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    const assistantMessage = { role: 'assistant', content: data.message.content };
    
    // 添加到对话历史
    session.messages.push(assistantMessage);
    
    return data.message.content;
  } catch (error) {
    console.error('Ollama调用失败:', error);
    reset();
    throw error;
  }
}

async function reset() {
  // 销毁当前会话
  if (currentSessionId) {
    sessions.delete(currentSessionId);
    currentSessionId = null;
  }
}

// 初始化默认参数
async function initDefaults() {
  // Ollama没有直接的默认参数API，但可以设置合理的默认值
  const defaults = {
    defaultTemperature: 0.7,
    defaultTopK: 40,
    maxTopK: 100,
  };
  
  sliderTemperature.value = defaults.defaultTemperature;
  sliderTopK.value = defaults.defaultTopK;
  sliderTopK.max = defaults.maxTopK;
  labelTemperature.textContent = defaults.defaultTemperature;
  labelTopK.textContent = defaults.defaultTopK;
}
```

**主要变化：**
- 保持本地推理优势，使用Ollama本地模型
- 使用`fetch`调用Ollama REST API替代`LanguageModel` API
- 手动实现会话管理（Ollama不支持显式会话）
- 参数映射：将`topK`转换为Ollama的`top_k`
- 保持与原代码相似的接口和功能

## 3. ai.gemini-on-device-alt-texter

### AI功能
- **多模态图像分析**：使用Gemini Nano分析图像内容
- **alt文本生成**：生成符合可访问性最佳实践的图像描述
- **语言翻译**：使用Translator API将描述翻译成多种语言
- **触发方式**：右键菜单选择图像时触发

### 核心实现
```javascript
// 创建支持图像输入的模型会话
const session = await self.LanguageModel.create({
  temperature: 0.0,
  topK: 1.0,
  expectedInputs: [{ type: 'image' }]
});

// 传递图像和提示
const prompt = [
  {
    role: 'user',
    content: [
      { type: 'text', value: promptText },
      { type: 'image', value: imageBitmap }
    ]
  }
];
const response = await session.prompt(prompt);
```

### 切换到其他AI
1. **替换多模态处理**：调整图像输入处理方式以适应新模型
2. **替换翻译API**：将`Translator` API调用替换为其他翻译服务
3. **修改提示模板**：调整prompt内容以确保生成符合可访问性标准的描述
4. **处理图像格式**：可能需要调整图像预处理逻辑

#### 使用OpenAI API替换示例
```javascript
// 1. 安装OpenAI客户端库：npm install openai
// 2. 替换多模态API调用

// 使用OpenAI客户端库
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateAltText(imgSrc) {
  // 1. 下载图像并转换为base64（OpenAI要求的格式）
  const response = await fetch(imgSrc);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = blob.type;

  // 2. 调用OpenAI多模态API
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', // 支持图像输入的模型
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Please provide a functional, objective description of the provided image in no more than around 30 words so that someone who could not see it would be able to imagine it. If possible, follow an "object-action-context" framework. The object is the main focus. The action describes what's happening, usually what the object is doing. The context describes the surrounding environment. If there is text found in the image, do your best to transcribe the important bits, even if it extends the word count beyond 30 words. It should not contain quotation marks, as those tend to cause issues when rendered on the web. If there is no text found in the image, then there is no need to mention it. You should not begin the description with any variation of "The image".`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    temperature: 0.0,
    max_tokens: 100
  });

  // 3. 返回生成的alt文本
  return completion.choices[0].message.content;
}

// 翻译功能替换示例
async function translate(text, targetLang) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLang}. Keep the translation concise and maintain the same meaning.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.0
  });

  return completion.choices[0].message.content;
}
```

**主要变化：**
- 使用OpenAI的`gpt-4o`模型替代Gemini Nano的多模态功能
- 将图像转换为base64格式并使用`image_url`对象传递
- 保持相同的提示工程以确保生成符合可访问性标准的描述
- 使用OpenAI API实现翻译功能，替代Chrome的Translator API

#### 使用Ollama本地模型替换示例
```javascript
// 1. 确保已安装Ollama并运行服务：https://ollama.com/download
// 2. 拉取支持图像的模型：ollama pull llava
// 3. 替换多模态API调用

async function generateAltText(imgSrc) {
  try {
    // 1. 下载图像并转换为base64（Ollama要求的格式）
    const response = await fetch(imgSrc);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = blob.type;

    // 2. 调用Ollama多模态API
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llava', // 支持图像的Ollama模型
        prompt: `Please provide a functional, objective description of the provided image in no more than around 30 words so that someone who could not see it would be able to imagine it. If possible, follow an "object-action-context" framework. The object is the main focus. The action describes what's happening, usually what the object is doing. The context describes the surrounding environment. If there is text found in the image, do your best to transcribe the important bits, even if it extends the word count beyond 30 words. It should not contain quotation marks, as those tend to cause issues when rendered on the web. If there is no text found in the image, then there is no need to mention it. You should not begin the description with any variation of "The image".`,
        images: [base64Image], // Ollama的图像参数
        temperature: 0.0,
        max_tokens: 100,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }

    // 3. 处理Ollama的流式响应
    const reader = ollamaResponse.body.getReader();
    let result = '';
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                result += data.response;
              }
            } catch (e) {
              console.error('解析Ollama响应失败:', e);
            }
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('生成alt文本失败:', error);
    throw error;
  }
}

// 翻译功能替换示例
async function translate(text, targetLang) {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3', // 可替换为其他Ollama支持的模型
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLang}. Keep the translation concise and maintain the same meaning.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.0,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('翻译失败:', error);
    throw error;
  }
}
```

**主要变化：**
- 使用支持图像的Ollama模型（如`llava`）替代Gemini Nano的多模态功能
- 图像转换为base64格式并使用`images`数组参数
- 调用`/api/generate`端点处理图像输入
- 需要处理Ollama的流式响应格式
- 翻译功能使用Ollama的文本模型实现

**注意事项：**
- Ollama的多模态支持相对较新，可能需要更新到最新版本
- 不同模型的图像处理能力可能有所差异
- 大图像可能需要调整大小以避免API限制

## 4. ai.gemini-on-device-audio-scribe

### AI功能
- **多模态音频处理**：使用Gemini Nano的音频输入能力
- **实时转录**：将音频消息实时转录为文本
- **自动检测**：监控页面音频blobs并自动处理
- **实时显示**：在sidepanel中实时更新转录结果

### 核心实现
- 监控`URL.createObjectURL`调用以捕获音频blob
- 使用Gemini Nano的音频输入能力进行转录
- 在sidepanel中实时显示转录文本

### 切换到其他AI
1. **替换音频处理**：调整音频输入处理以适应新模型
2. **修改实时转录逻辑**：可能需要重新实现实时流处理
3. **处理音频格式**：确保新模型支持当前的音频格式
4. **调整界面更新**：根据新模型的输出格式更新UI

#### 使用OpenAI API替换示例
```javascript
// 1. 安装OpenAI客户端库：npm install openai
// 2. 替换音频转录API调用

// 使用OpenAI客户端库
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 监控音频blob并进行转录
async function transcribeAudio(blobUrl) {
  try {
    // 1. 下载音频blob
    const response = await fetch(blobUrl);
    const audioBlob = await response.blob();
    
    // 2. 调用OpenAI Whisper API进行转录
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1', // OpenAI的音频转录模型
      file: audioBlob,
      language: 'en', // 可选，指定语言
      response_format: 'text', // 直接返回文本格式
    });
    
    // 3. 返回转录结果
    return transcription;
  } catch (error) {
    console.error('转录失败:', error);
    throw error;
  }
}

// 如果需要支持实时流式转录（更复杂）
async function transcribeAudioStream(audioStream) {
  // OpenAI目前不支持实时流式音频转录，但可以实现分段转录
  // 1. 将音频流分段
  // 2. 对每个分段调用transcribeAudio
  // 3. 合并结果
  // 注意：这会有延迟，不如真正的实时流式处理流畅
}

// 替换页面监控逻辑（保持不变，只需修改转录调用）
// 原代码中监控URL.createObjectURL的部分可以保留
// 当检测到音频blob时，调用transcribeAudio替代原有的Gemini调用
```

**主要变化：**
- 使用OpenAI的Whisper API (`audio.transcriptions.create`)替代Gemini Nano的音频输入功能
- 使用`whisper-1`模型专门处理音频转录
- 音频格式处理更简单，直接传递Blob对象
- 目前不支持真正的实时流式转录，但可以实现分段转录
- 需要处理API调用的异步性质和可能的延迟

#### 使用Ollama本地模型替换示例
**注意：** Ollama目前没有专门的音频转录模型，但可以结合本地Whisper模型或使用支持多模态的模型。以下示例使用本地Whisper.cpp与Ollama结合：

```javascript
// 1. 确保已安装Ollama并运行服务：https://ollama.com/download
// 2. 安装Whisper.cpp并运行服务：https://github.com/ggerganov/whisper.cpp
// 3. 拉取Ollama模型：ollama pull llama3

// 监控音频blob并进行转录
async function transcribeAudio(blobUrl) {
  try {
    // 1. 下载音频blob
    const response = await fetch(blobUrl);
    const audioBlob = await response.blob();
    
    // 2. 调用本地Whisper.cpp API进行转录
    // 注意：需要先启动Whisper.cpp服务，默认端口为8080
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    
    const whisperResponse = await fetch('http://localhost:8080/inference', {
      method: 'POST',
      body: formData,
    });
    
    if (!whisperResponse.ok) {
      throw new Error(`Whisper API error: ${whisperResponse.status}`);
    }
    
    const whisperData = await whisperResponse.json();
    let transcription = whisperData.text;
    
    // 3. 可选：使用Ollama优化转录结果（如标点、格式等）
    if (transcription) {
      const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3',
          messages: [
            {
              role: 'system',
              content: 'You are a text formatter. Fix punctuation, capitalization, and formatting of the following transcription without changing its meaning.'
            },
            {
              role: 'user',
              content: transcription
            }
          ],
          temperature: 0.1,
          stream: false,
        }),
      });
      
      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        transcription = ollamaData.message.content;
      }
    }
    
    return transcription;
  } catch (error) {
    console.error('转录失败:', error);
    throw error;
  }
}

// 替换页面监控逻辑（保持不变，只需修改转录调用）
// 原代码中监控URL.createObjectURL的部分可以保留
// 当检测到音频blob时，调用transcribeAudio替代原有的Gemini调用
```

**主要变化：**
- 使用本地Whisper.cpp替代Gemini Nano的音频转录功能
- 通过HTTP API调用Whisper.cpp服务
- 可选使用Ollama优化转录结果的格式和标点
- 需要额外安装和配置Whisper.cpp

**注意事项：**
- 必须单独安装和运行Whisper.cpp服务
- Whisper.cpp需要下载模型文件（如base、small、medium等）
- 转录质量取决于选择的Whisper模型大小
- 可以根据需要调整Whisper.cpp的参数（如语言、温度等）

## 5. ai.gemini-on-device-calendar-mate

### AI功能
- **自然语言处理**：从选中的文本中提取事件详情
- **结构化数据提取**：解析事件标题、日期时间、地点等信息
- **触发方式**：右键菜单选择文本时触发
- **日历集成**：生成Google Calendar链接

### 核心实现
```javascript
// 从选中文本提取事件详情
const session = await self.LanguageModel.create({
  temperature: 0.0,
  topK: 1.0
});

const response = await session.prompt([
  {
    role: 'user',
    content: `Extract calendar event details from: ${selectedText}`
  }
]);
```

### 切换到其他AI
1. **替换文本处理**：调整文本输入处理以适应新模型
2. **修改结构化提取**：可能需要调整prompt以确保正确提取事件信息
3. **更新解析逻辑**：如果输出格式变化，需要修改JSON解析
4. **调整日期处理**：可能需要修改日期时间解析方式

#### 使用OpenAI API替换示例
```javascript
// 1. 安装OpenAI客户端库：npm install openai
// 2. 替换事件提取API调用

// 使用OpenAI客户端库
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractCalendarEvent(selectedText) {
  try {
    // 调用OpenAI Chat Completions API进行事件提取
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a calendar event extraction expert. Extract event details from the following text and return them as JSON with the following fields:
          - title: The event title
          - startDate: The start date and time in ISO 8601 format
          - endDate: The end date and time in ISO 8601 format (infer if not specified)
          - location: The event location
          - description: A brief description
          - timezone: The timezone (use UTC if not specified)
          
          Return only the JSON object, no other text.`
        },
        {
          role: 'user',
          content: `Extract calendar event details from: ${selectedText}`
        }
      ],
      temperature: 0.0, // 保持确定性输出
      response_format: { type: 'json_object' }, // 确保返回JSON格式
    });

    // 解析JSON响应
    const eventData = JSON.parse(completion.choices[0].message.content);
    return eventData;
  } catch (e) {
    console.error('事件提取失败:', e);
    throw e;
  }
}

// 后续的日历链接生成逻辑保持不变
// 使用提取的eventData创建Google Calendar链接
```

**主要变化：**
- 使用OpenAI的`gpt-4o`模型替代Gemini Nano的文本处理能力
- 使用system prompt指导模型以特定JSON格式返回事件信息
- 利用`response_format: { type: 'json_object' }`确保返回有效的JSON
- 保持相同的低temperature设置以获得确定性结果
- 解析逻辑基本保持不变，因为都是JSON格式

#### 使用Ollama本地模型替换示例
```javascript
// 1. 确保已安装Ollama并运行服务：https://ollama.com/download
// 2. 拉取所需模型：ollama pull llama3
// 3. 替换事件提取API调用

async function extractCalendarEvent(selectedText) {
  try {
    // 调用Ollama API进行事件提取
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3',
        messages: [
          {
            role: 'system',
            content: `You are a calendar event extraction expert. Extract event details from the following text and return them as JSON with the following fields:
            - title: The event title
            - startDate: The start date and time in ISO 8601 format
            - endDate: The end date and time in ISO 8601 format (infer if not specified, default to 1 hour after start)
            - location: The event location
            - description: A brief description
            - timezone: The timezone (use UTC if not specified)
            
            Return only the JSON object, no other text. Ensure the JSON is valid and properly formatted.`
          },
          {
            role: 'user',
            content: `Extract calendar event details from: ${selectedText}`
          }
        ],
        temperature: 0.0,
        stream: false,
        // Ollama目前没有response_format参数，需要通过prompt确保输出格式
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.message.content;
    
    // 提取JSON部分（如果有额外文本）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('未能从响应中提取有效的JSON');
    }
    
    // 解析JSON响应
    const eventData = JSON.parse(jsonMatch[0]);
    return eventData;
  } catch (error) {
    console.error('事件提取失败:', error);
    throw error;
  }
}

// 后续的日历链接生成逻辑保持不变
// 使用提取的eventData创建Google Calendar链接
```

**主要变化：**
- 使用Ollama的`llama3`模型替代Gemini Nano的文本处理能力
- 使用详细的system prompt指导模型以特定JSON格式返回事件信息
- 由于Ollama目前没有`response_format`参数，需要通过prompt确保输出格式
- 需要额外处理响应，提取并验证JSON格式
- 保持相同的低temperature设置以获得确定性结果

**注意事项：**
- 确保prompt中明确要求只返回JSON格式
- 可能需要添加错误处理来处理格式不正确的响应
- 对于复杂的日期解析，可能需要额外的库或逻辑来验证结果

## 6. ai.gemini-on-device-summarization

### AI功能
- **网页内容提取**：使用Mozilla的Readability库提取主要内容
- **自动摘要生成**：使用Chrome内置的Summarizer API生成摘要
- **自动触发**：打开网页时自动生成摘要
- **侧边栏显示**：在sidepanel中显示生成的摘要

### 核心实现
```javascript
// 使用Summarizer API生成摘要
const summary = await Summarizer.summarize({
  text: pageContent,
  length: 'medium',
  format: 'paragraph'
});
```

### 切换到其他AI
1. **替换摘要API**：将`Summarizer` API调用替换为其他摘要服务
2. **调整内容提取**：可能需要修改Readability库的使用或替换
3. **修改摘要参数**：调整length、format等参数以匹配新模型
4. **更新界面**：根据新模型的输出格式更新UI

#### 使用OpenAI API替换示例
```javascript
// 1. 安装OpenAI客户端库：npm install openai
// 2. 替换摘要API调用

// 使用OpenAI客户端库
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateSummary(pageContent, options = {}) {
  try {
    // 调用OpenAI Chat Completions API进行摘要生成
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional summarizer. Create a concise summary of the following web page content. Follow these guidelines:
          - Length: ${options.length || 'medium'} (short: ~100 words, medium: ~200 words, long: ~300 words)
          - Format: ${options.format || 'paragraph'} (paragraph, bullet points, etc.)
          - Focus on the main ideas, key points, and important information
          - Avoid redundant details and tangents
          - Maintain the original meaning and context`
        },
        {
          role: 'user',
          content: `Please summarize the following web page content:

${pageContent}`
        }
      ],
      temperature: 0.3, // 低温度确保摘要准确
    });

    // 返回摘要文本
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('摘要生成失败:', error);
    throw error;
  }
}

// 使用示例（保持与原代码相同的接口）
const pageContent = extractPageContent(); // 保持原有的内容提取逻辑
const summary = await generateSummary(pageContent, {
  length: 'medium',
  format: 'paragraph'
});
```

**主要变化：**
- 使用openai库替代Chrome内置的Summarizer API
- 调用chat.completions.create方法替代Summarizer.summarize
- 使用system prompt指导摘要生成的格式和长度
- 保持与原代码相似的参数结构（length, format）
- 内容提取部分（使用Readability库）可以保持不变

**注意事项：**
- 如果网页内容很长，可能需要进行内容截断以符合API的token限制
- 可以添加分块处理逻辑来处理超长内容
- 可能需要调整提示词以获得更符合预期的摘要格式

#### 使用Ollama本地模型替换示例
```javascript
// 1. 确保已安装Ollama并运行服务：https://ollama.com/download
// 2. 拉取所需模型：ollama pull llama3
// 3. 替换摘要API调用

async function generateSummary(pageContent, options = {}) {
  try {
    // 处理长文本：Ollama模型有token限制，需要截断长内容
    // 这里简单截断，实际应用中可以实现更智能的分块和合并策略
    const MAX_CONTENT_LENGTH = 8000; // 根据使用的模型调整
    let processedContent = pageContent;
    
    if (processedContent.length > MAX_CONTENT_LENGTH) {
      processedContent = processedContent.substring(0, MAX_CONTENT_LENGTH) + '\n\n[内容被截断]';
    }

    // 调用Ollama API进行摘要生成
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3', // 可替换为其他Ollama支持的模型
        messages: [
          {
            role: 'system',
            content: `You are a professional summarizer. Create a concise summary of the following web page content. Follow these guidelines:
            - Length: ${options.length || 'medium'} (short: ~100 words, medium: ~200 words, long: ~300 words)
            - Format: ${options.format || 'paragraph'} (paragraph, bullet points, etc.)
            - Focus on the main ideas, key points, and important information
            - Avoid redundant details and tangents
            - Maintain the original meaning and context`
          },
          {
            role: 'user',
            content: `Please summarize the following web page content:

${processedContent}`
          }
        ],
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('摘要生成失败:', error);
    throw error;
  }
}

// 使用示例（保持与原代码相同的接口）
const pageContent = extractPageContent(); // 保持原有的内容提取逻辑
const summary = await generateSummary(pageContent, {
  length: 'medium',
  format: 'paragraph'
});
```

**主要变化：**
- 使用Ollama的`llama3`模型替代Chrome内置的Summarizer API
- 调用`/api/chat`端点替代`Summarizer.summarize`
- 使用system prompt指导摘要生成的格式和长度
- 保持与原代码相似的参数结构（length, format）
- 添加长文本处理逻辑，避免超过Ollama的token限制
- 内容提取部分（使用Readability库）可以保持不变

**注意事项：**
- Ollama模型的token限制相对较低，需要处理长文本
- 可以实现更智能的分块和合并策略来处理超长内容
- 可能需要调整提示词以获得更符合预期的摘要格式
- 不同Ollama模型的摘要质量和速度可能有所差异

## 通用切换策略

无论切换到哪种AI服务，以下是一些通用的策略：

1. **API替换**：识别并替换所有AI相关的API调用
2. **依赖管理**：更新package.json以添加新的依赖库
3. **模型配置**：调整模型参数和配置以匹配新服务
4. **提示工程**：修改prompt内容和格式以适应新模型的要求
5. **错误处理**：更新错误处理逻辑以适应新API的错误格式
6. **认证管理**：调整认证方式以匹配新服务的要求
7. **性能优化**：根据新模型的性能特点调整应用逻辑
8. **测试验证**：确保所有功能在切换后正常工作

### OpenAI API特定注意事项

1. **模型选择**：
   - 文本生成：`gpt-4o`（最新模型，支持多模态）、`gpt-3.5-turbo`（成本更低）
   - 音频转录：`whisper-1`（专门的语音识别模型）
   - 图像分析：`gpt-4o`（支持图像输入）、`gpt-4-vision-preview`

2. **API端点差异**：
   - 文本生成：`/v1/chat/completions`
   - 音频转录：`/v1/audio/transcriptions`
   - 图像生成：`/v1/images/generations`（DALL-E）

3. **输入格式**：
   - 图像：需要转换为base64格式并使用`image_url`对象
   - 音频：直接传递Blob对象
   - 长文本：注意token限制，可能需要分块处理

4. **输出格式**：
   - 使用`response_format: { type: 'json_object' }`确保结构化输出
   - 从`response.choices[0].message.content`获取文本响应

5. **成本考虑**：
   - OpenAI按token计费，监控API使用情况
   - 考虑使用更经济的模型（如`gpt-3.5-turbo`）处理简单任务
   - 实现请求缓存以减少重复调用

6. **隐私和安全**：
   - 不要在客户端代码中硬编码API密钥
   - 考虑使用代理服务器处理API请求
   - 了解OpenAI的数据使用政策

### Ollama本地模型特定注意事项

1. **模型选择**：
   - 通用文本：`llama3`、`mistral`、`gemma`
   - 多模态（图像）：`llava`、`bakllava`
   - 代码生成：`codellama`、`deepseek-coder`
   - 小型轻量：`phi3`、`tinyllama`

2. **API端点**：
   - 聊天：`/api/chat`（支持对话历史）
   - 生成：`/api/generate`（简单生成，支持图像）
   - 模型列表：`/api/tags`
   - 模型信息：`/api/show`

3. **安装与配置**：
   - 安装Ollama：从官方网站下载安装程序
   - 拉取模型：`ollama pull <model-name>`
   - 启动服务：Ollama安装后自动运行服务，默认端口11434
   - 自定义模型：可以通过Modelfile创建自定义模型

4. **输入输出处理**：
   - 文本：直接传递字符串
   - 图像：转换为base64格式，使用`images`数组参数
   - 音频：需要结合外部工具（如Whisper.cpp）处理
   - 流式响应：默认流式返回，需要逐行解析JSON

5. **性能优化**：
   - 选择合适大小的模型（平衡质量和速度）
   - 调整参数：`temperature`、`top_k`、`top_p`
   - 限制输入长度，避免超过模型的上下文窗口
   - 对于长文本实现分块处理

6. **隐私和安全**：
   - 数据完全在本地处理，无需发送到外部服务器
   - 适合处理敏感数据
   - 可以离线使用
   - 注意模型许可证限制

7. **限制**：
   - 多模态支持有限（主要是图像，音频支持需要外部工具）
   - 模型大小受本地硬件限制
   - 没有内置的内容过滤机制
   - 大型模型可能需要较高的系统资源

## 结论

本文档详细分析了Chrome扩展中使用Gemini AI的6个案例，并提供了完整的OpenAI API和Ollama本地模型替换方案。这些案例展示了从云API到本地模型，从文本处理到多模态分析的多种AI应用方式。

### 切换AI服务的核心要点：

#### OpenAI API替换方案
1. **API调用转换**：将Gemini的API调用转换为对应的OpenAI API端点（如`chat.completions.create`、`audio.transcriptions.create`）

2. **模型选择**：根据功能需求选择合适的OpenAI模型：
   - 通用文本处理：`gpt-4o`或`gpt-3.5-turbo`
   - 音频转录：`whisper-1`
   - 图像分析：`gpt-4o`

3. **输入输出格式调整**：
   - 图像需要转换为base64格式
   - 使用`response_format`参数确保结构化输出
   - 正确处理API响应格式差异

4. **成本考量**：
   - 监控token使用情况
   - 选择合适的模型平衡性能和成本
   - 实现必要的缓存机制

#### Ollama本地模型替换方案
1. **API调用转换**：将Gemini的API调用转换为Ollama API端点（如`/api/chat`、`/api/generate`）

2. **模型选择**：根据功能需求和本地硬件选择合适的Ollama模型：
   - 通用文本处理：`llama3`、`mistral`
   - 多模态（图像）：`llava`、`bakllava`
   - 小型轻量：`phi3`、`tinyllama`

3. **输入输出处理**：
   - 图像转换为base64格式，使用`images`数组参数
   - 音频需要结合外部工具（如Whisper.cpp）处理
   - 处理流式响应格式
   - 添加长文本分块处理逻辑

4. **性能优化**：
   - 选择合适大小的模型（平衡质量和速度）
   - 调整参数：`temperature`、`top_k`、`top_p`
   - 限制输入长度，避免超过模型的上下文窗口

### 方案对比与选择建议

| 特性 | OpenAI API | Ollama本地模型 |
|------|------------|----------------|
| **部署方式** | 云服务 | 本地部署 |
| **数据隐私** | 数据发送到OpenAI服务器 | 数据完全在本地处理 |
| **多模态支持** | 完善（文本、图像、音频） | 有限（主要支持文本和图像） |
| **性能** | 快速，受网络影响 | 取决于本地硬件 |
| **成本** | 按token计费 | 一次性硬件成本，无使用成本 |
| **离线使用** | 不支持 | 支持 |
| **内容安全** | 内置内容过滤 | 无内置过滤，需自行实现 |
| **模型更新** | 自动更新 | 需手动拉取更新 |

**选择建议：**
- 若优先考虑**易用性和完善功能**，选择OpenAI API
- 若优先考虑**隐私安全和离线使用**，选择Ollama本地模型
- 若需要**处理敏感数据**，选择Ollama本地模型
- 若需要**完善的多模态支持**，选择OpenAI API
- 若**预算有限**，选择Ollama本地模型

通过本文档提供的示例代码和详细说明，开发者可以轻松将Chrome扩展中的Gemini AI功能迁移到OpenAI API或Ollama本地模型，同时保持原有功能的完整性和用户体验。