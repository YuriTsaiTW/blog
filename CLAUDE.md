# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

「Yuri 學習隨筆」個人部落格，使用 Hexo 靜態網站產生器搭配 Icarus 主題，部署於 GitHub Pages。語系為 zh-TW。

## 常用指令

```bash
npm run server     # 啟動本機開發伺服器 (http://localhost:4000)
npm run build      # 產生靜態檔案至 public/
npm run clean      # 清除快取與已產生的靜態檔案
npm run post --title=<標題>  # 建立新文章
```

Node.js 版本：CI 使用 16.x。

## 部署流程

推送至 `main` 分支時，GitHub Actions (`.github/workflows/pages.yml`) 自動執行 `npm install` → `npm run build`，透過 `peaceiris/actions-gh-pages` 部署 `public/` 目錄至 GitHub Pages。

網站網址：`https://YuriTsaiTW.github.io/blog`

## 設定檔架構

- `_config.yml` — Hexo 主設定，同時包含 Icarus 主題的完整設定（navbar、sidebar、widgets、plugins 等）
- `_config.icarus.yml` — Icarus 主題獨立設定（舊版，目前主要設定已合併至 `_config.yml`）
- `_config.post.yml` — 文章頁面專用覆蓋設定（右側 sidebar sticky、僅顯示 TOC 和 recent_posts widget）
- `.prettierrc` — 僅設定 JSON parser

## 文章撰寫規範

### 檔案命名與位置

文章放在 `source/_posts/`，命名格式為 `YYYY-MM-DD-<英文標題>.md`。

### Post Asset Folder

`post_asset_folder: true` 已啟用。每篇文章的圖片放在與文章同名的資料夾中：

```
source/_posts/2021-08-14-MSW.md
source/_posts/2021-08-14-MSW/cover.jpg
source/_posts/2021-08-14-MSW/example-1.png
```

在文章中引用圖片使用 `{% asset_img filename.png alt %}` 或相對路徑。

### Front Matter

```yaml
---
title: 文章標題
date: YYYY-MM-DD HH:mm:ss
categories: 分類名稱
cover: /分類名稱/permalink路徑/cover.png
thumbnail: /分類名稱/permalink路徑/cover.png
keywords: 關鍵字1, 關鍵字2
comments: false
toc: true
tags:
  - 標籤1
  - 標籤2
---
```

Permalink 格式為 `:category/:year:month:day:hour/`，cover/thumbnail 路徑需對應此格式。

### 摘要截斷

使用 `<!-- more -->` 標記分隔首頁摘要與完整內容。

## 整合服務

- **留言系統**：Utterances（repo: `showwell0120/utterances-for-blog`）
- **分享按鈕**：ShareThis
- **分析追蹤**：Google Analytics
- **Sitemap**：hexo-generator-sitemap（`sitemap.xml`）
- **CDN**：jsDelivr / Google Fonts / FontAwesome
