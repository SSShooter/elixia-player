# Elixia Player

[English](./README.md) | 简体中文

一个基于 Next.js 构建的现代音乐播放器 Web 应用，集成 AI 驱动的歌词分析和语言学习工具。它整合了多个音乐平台，提供无缝的播放和学习体验。

## 功能特性

- **多平台支持**：统一访问网易云音乐、QQ音乐、酷狗音乐等多个平台的音乐。
- **AI 歌词赏析**：深入了解歌曲的含义、主题和艺术表达。
- **AI 语言学习**：基于歌词的专业 AI 词汇和语法分析。
- **动态歌曲卡片**：生成并分享精美的卡片，或将其嵌入到您的网站中。
- **播放列表管理**：轻松导入和浏览外部播放列表链接中的曲目。

## 歌曲卡片

![花海](https://img.ssshooter.com/img/elixia-player/花海.png)

![欧若拉](https://img.ssshooter.com/img/elixia-player/欧若拉.png)

![Pretender](https://img.ssshooter.com/img/elixia-player/Pretender-card.png)

[![昔涟](https://img.ssshooter.com/img/elixia-player/昔涟-card.png)](https://y.qq.com/n/ryqq_v2/songDetail/002rhFKO3EjKAg)

```html
<iframe
  height="83px"
  width="100%"
  src="https://elixia-player.koyeb.app/embed/tencent/001ATfEL0kn2NA"
></iframe>
<iframe
  height="83px"
  width="100%"
  src="https://elixia-player.koyeb.app/card?url=https://music.163.com/song?id=610149"
></iframe>
<iframe
  height="83px"
  width="100%"
  src="https://elixia-player.koyeb.app/card/netease/610149"
></iframe>
```

更多信息请阅读 [博客音乐播放器 + 1](https://ssshooter.com/blog-music-player/)

### 图片

```html
<img src="https://elixia-player.koyeb.app/card/tencent/001ATfEL0kn2NA/image" />
```

## 快速开始

首先，运行开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 页面说明

- **首页 (`/`)**：主播放器界面。功能包括播放控制、歌词显示和 AI 分析标签页。支持通过查询参数自动加载：`/?id=歌曲ID&provider=平台名称`。
- **搜索 (`/search`)**：使用关键词在不同平台搜索曲目。
- **播放列表 (`/playlist`)**：从播放列表 URL 或 ID 导入曲目，快速构建播放队列。
- **分享 (`/share`)**：为当前歌曲创建可自定义的高质量图片，非常适合在社交媒体上分享。
- **AI 配置 (`/ai-config`)**：配置您首选的 AI 模型和 API 密钥以使用分析功能。
- **卡片 (`/card`)**：预览和交互特定歌曲的落地页。
- **嵌入 (`/embed`)**：专为在外部网站的 iframe 中嵌入播放器或卡片而优化的紧凑视图。

## API 参考

### 音乐数据

#### `POST /api/lyrics`

获取特定曲目的歌词和元数据。

- **请求体**：`{ provider: string, source: "url" | "id", value: string, cookie?: string }`
- **响应**：歌词（LRC）、翻译和歌曲元数据（名称、艺术家、专辑、封面）。

#### `POST /api/search`

搜索歌曲。

- **请求体**：`{ provider: string, keyword: string, page?: number, limit?: number }`
- **响应**：搜索结果数组。

#### `POST /api/playlist`

从播放列表获取曲目。

- **请求体**：`{ provider: string, value: string }`
- **响应**：播放列表中的歌曲数组。

#### `POST /api/url`

获取直接音频流 URL。

- **请求体**：`{ provider: string, id: string }`
- **响应**：播放 URL 和质量信息。

### 工具接口

#### `GET /api/proxy-image?url=...`

代理端点，用于绕过外部专辑封面的 CORS 限制。

#### `GET /card/image?url=...&width=...`

工具端点，解析音乐平台 URL 并重定向到相应的动态卡片图片。

#### `GET /app/card/[provider]/[id]/image?width=...`

为特定歌曲生成动态 Open Graph (OG) 图片，针对分享进行了优化。

## 技术栈

- **框架**：[Next.js](https://nextjs.org/)（App Router）
- **样式**：Tailwind CSS & Lucide Icons
- **音乐 API**：MetingJS 集成
- **AI 集成**：支持 OpenAI 兼容 API
- **字体**：Geist & Noto Sans CJK SC

## 致谢

- [MetingJS](https://github.com/metowolf/MetingJS)
