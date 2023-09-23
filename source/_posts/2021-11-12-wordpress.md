---
title: WordPress | 架在 IIS 的踩雷紀錄 | Give Me Pretty Permalinks!
date: 2021-11-12 10:11:03
categories: 軟體開發
cover: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2021111210/cover.png
thumbnail: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2021111210/cover.png
tags: [WordPress]
keywords: WordPress, IIS, Permalinks, web.config, URL Rewrite Module
comments: false
toc: true
---

## 前言

最近公司的工作上收到一個需求，希望把目前放在 S3 上的 WordPress 站台搬回來，並且改用 Windows Server 來 host。雖然不是第一次碰 WordPress，但是距離上一次看到他也應該也是 7、8 年以上了😅 <!-- more -->加上我對站台建置相關的經驗很少，所以每個操作環節都還蠻小心的，很怕一個改動機器就爆了XD

之前有用過 XAMPP 等套裝軟體，一次就可以 ready 好所有環境。不過因為彈性上的考量，所以就手動從零開始建置相關的環境。雖然過程中有遇到一些小問題，不過大約不到半天的時間就可以找到相關資源解決了。步驟大概是這樣－

1. 啟用 IIS FastCGI 來 host php 應用程式
2. 下載最新版的 php
3. 修改 php.ini 設定檔
4. 在 IIS 上新增 php 的應用程式集區
5. 安裝 MySQL 與設定帳號
6. 下載最新版的 WordPress
7. 在 `wp-config.php` 新增 DB 相關設定
8. 在 IIS 上設定 WordPress 站台，新增 web.config
9. 使用 UpdraftPlus 還原備份的 WordPress 跟 DB
10. 從 DB 修正相關的路徑連結

## 問題

還原完成後，原本覺得弄得差不多了，但是發現幾乎所有文章和選單點進去後，都會出現內部 404 的頁面。奇怪的是如果永久連結為預設，就能連到正確的頁面。不過因為 SEO 的關係，連結格式需要是文章名稱組成。所以大概花了一個禮拜的時間找有關 permalinks(永久連結) 的相關文章。

![404](/%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2021111210/404.jpg)

雖然已經照大部分的文章提供的解法實作，不過還是沒辦法解決。情急之下，差一點就要開啟另外一個坑踏入nginx。就在差點放棄時，剛好看到一篇 stackoverflow 的文章，終於解決這個難題。

不過這篇文章如果只是單純下「pretty permalinks」、「IIS」、「not found」等關鍵字，其實很難找到。也因此在這裡記錄下來，分享給有需要的人。

## 解決

### 安裝 URL Rewrite Module

Windows Server 預設沒有這個模組，必須從官網或是透過 Web Platform Installer 來下載安裝。有了 URL Rewrite Module，才可以在 `web.config` 加入相關的 rewrite 設定

### 後台設定永久連結

在管理後台頁，點選「設定」，然後再點選「永久連結」，就可以選擇偏好的連結格式。確定後點選「儲存設定」。

### 檢查 web.config

通常設定完永久連結後，wordpress 會自動更新 `web.config`，將rewrite 設定加進去。相關程式應該會長這樣－

```xml
<rewrite>
    <rules>
        <rule name="WordPress rule" patternSyntax="Wildcard">
            <match url="*"/>
                <conditions>
                    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true"/>
                    <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true"/>
                </conditions>
            <action type="Rewrite" url="index.php"/>
        </rule></rules>
</rewrite>
```

### 擴充 `wp-config.php`

這裡是重點!! 因為其實前面幾個步驟還蠻快就可以完成。不過這個步驟是參考到[這篇文章](https://stackoverflow.com/questions/41571675/arabic-url-is-not-working-in-WordPress-on-windows-iis-server?answertab=active#tab-top)才能知道怎麼做。原文標題是<i>Arabic url is not working in WordPress on Windows IIS Server</i>。完全沒提到 permalink，所以這篇在搜尋結果上被埋在超級隱密的XD

最主要的問題原因是，IIS的 URL Rewrite 並沒有辦法認識多國語言的連結。所以需要在`wp-config.php`的最後面加上一段－

```php
if ( isset($_SERVER['UNENCODED_URL']) ) {
    $_SERVER['REQUEST_URI'] = $_SERVER['UNENCODED_URL'];
}
```

## 小結

從這個經驗來看，我學到了幾件事－

1. 在搜尋引擎上找問題，試著先想出所有可能的關鍵字，然後用不同的排列組合下去找。
2. 在搜尋結果頁面，像是 stackoverflow 這種網站，通常一個搜尋結果底下還有相關的文章連結，請不要放過他們，一個一個點進去看。
3. 尋找問題要有耐心。如果開始覺得不耐煩了，就先全部關掉，明天再來。

## 參考資源

- [Enabling Pretty Permalinks in WordPress](https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/enabling-pretty-permalinks-in-WordPress)
- [Arabic url is not working in WordPress on Windows IIS Server](https://stackoverflow.com/questions/41571675/arabic-url-is-not-working-in-WordPress-on-windows-iis-server?answertab=active#tab-top)