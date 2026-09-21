# 繁體中文介面（Claude + GitHub）

腳本檔：`zh-tw-webui.user.js`（v3.3.0）
安裝連結：[zh-tw-webui.user.js](https://raw.githubusercontent.com/b010203044-code/zh-tw-webui/main/zh-tw-webui.user.js)（Tampermonkey 裝好後點這個連結會直接跳出安裝畫面）
用途：把 **claude.ai** 和 **github.com** 的介面文字換成繁體中文（台灣用語），不動你的對話內容、程式碼、檔名、議題內文等使用者資料。

字典規模：claude.ai 529 條 + 39 條規則；github.com 360 條 + 30 條規則。
未採用的字串與原因整理在 [未採用字串.md](未採用字串.md)。

> GitHub 網頁介面目前沒有官方的中文選項（使用者社群還在許願階段），所以只能靠腳本翻。claude.ai 也沒有。

---

## 一、安裝步驟

### 1. 安裝 Tampermonkey

| 瀏覽器 | 安裝位置 |
|---|---|
| Chrome / Edge | Chrome 線上應用程式商店搜尋 Tampermonkey |
| Firefox | Firefox 附加元件搜尋 Tampermonkey |
| Safari | App Store 搜尋 Tampermonkey（付費） |

Chrome 系列要多做一步：到 `chrome://extensions`，把右上角的**開發人員模式**打開。Chrome 從 Manifest V3 之後，沒開這個開關的話使用者腳本不會執行。

### 2. 新增腳本

1. 點 Tampermonkey 圖示 → **新增腳本**。
2. 把編輯器裡的預設範本**全部刪掉**。
3. 貼上 `zh-tw-webui.user.js` 的完整內容。
4. `Ctrl + S`（macOS 是 `Cmd + S`）儲存。

### 3. 驗證

- 開 https://claude.ai → 側邊欄應該顯示「新交談」「最近」「專案」「設定」。
- 開 https://github.com → 上方導覽應該顯示「合併請求」「議題」，儲存庫分頁顯示「程式碼」「安全性」「洞察」。

沒變的話，確認 Tampermonkey 圖示上有顯示數字 `1`（代表這頁有一支腳本生效）。

---

## 二、日常使用

- **開關**：在頁面上按 `Ctrl + Alt + T` 切換。關閉時會重新載入還原成英文。
- **狀態記憶**：存在瀏覽器 `localStorage`，key 是 `zh-tw-webui-enabled`。兩個站台共用同一個開關。
- **不會被翻譯的地方**（刻意設計）：
  - claude.ai：你的訊息、Claude 的回應、程式碼區塊、輸入框、Artifact 內容
  - github.com：程式碼與 diff、議題與留言內文、檔名與路徑、分支名、commit 訊息、儲存庫名稱與說明、使用者名稱、標籤名稱

---

## 三、術語取捨

有些開發術語在台灣就是講英文，硬翻反而難讀。目前的原則是：

| 保留英文 | 翻成中文 |
|---|---|
| Fork、commit、Actions、Wiki、Gist、Raw、Blame、Clone、Squash、Rebase、Codespaces、Artifacts | 合併請求（Pull requests）、議題（Issues）、程式碼（Code）、洞察（Insights）、安全性（Security）、儲存庫（Repositories）、分支（Branches）、標籤（Tags） |

這只是預設，每一條都是字典裡的一行，想改哪個就改哪個。例如你想讓 `Pull requests` 維持英文，把那一行的值改成 `'Pull requests'` 就好。

---

## 四、腳本各部分說明

腳本分成 7 段，每段開頭有編號註解，直接搜尋 `* 1.`、`* 2.` 就能跳過去。

### 第 1 段：共用保護區 `BASE_PROTECTED`

所有站台都不動的地方：`code`、`pre`、`textarea`、`svg`、`iframe`、`contenteditable`、`.ProseMirror`。
下面的 `ATTRS` 則是會翻譯的屬性：`aria-label`、`title`、`placeholder`、`aria-placeholder`、`alt`、`data-tooltip`。

### 第 2 段：站台設定 `SITES`（搜尋 `const SITES`）

這是 v3 的核心改動。每個站台一組設定：

```js
{
  id: 'github',
  label: 'github.com',
  match: /(^|\.)github\.com$/,   // 用 location.hostname 比對
  protect: [ ... ],              // 這個站台額外的保護區
  dict: { ... },                 // 英文 -> 繁中
  patterns: [ ... ]              // 含數字的規則
}
```

**要加第三個站台**（例如 `stackoverflow.com`），照這個格式再加一組，然後在腳本標頭加一行 `// @match https://stackoverflow.com/*`。引擎不用動。

兩個站台的差別在保護區的保守程度：

- **claude.ai** 的使用者資料集中在對話訊息和 Artifact，範圍明確。
- **github.com** 整頁都混著使用者資料，所以 `protect` 清單長很多：`.markdown-body`（README 和留言內文）、`.blob-code`（程式碼）、`bdi`（GitHub 用它包使用者名稱和標題）、`.react-directory-filename-column`（檔名）、`.commit-message`、`.branch-name` 等等。

**最重要的安全機制是「整段完全相同才替換」**：
一個叫 `Add file support to Code viewer` 的 PR 標題不會被動到，因為它整段不等於 `Add file` 或 `Code`。保護區是第二層防線。

### 比對的兩道安全閘（v3.2.0 新增）

翻譯是「整段字串完全相同才替換」，但光這樣還不夠，因為 claude.ai 上到處都是你自己取的名字——
檔名、資料夾名、討論串名、專案名。所以多了兩道閘：

**1. 大小寫必須完全相符。** v3.1.0 以前會同時註冊小寫鍵，結果一個叫 `docs`、`other`、`size`
的資料夾會被當成介面字串改掉。現在只比對原始大小寫。

**2. `attrOnly` 清單：泛用單字只在屬性裡翻譯。**

```js
attrOnly: ['App', 'Other', 'Kind', 'Size', 'Goal', 'Grid', 'List', 'Extra', 'Input', 'Output',
           'Read', 'Personal', 'Folder', 'Check', 'Environment', 'Developer',
           'Organization', 'Models', 'Tokens', 'Project', 'Select', 'Thread'],
```

這些字會出現在 `aria-label` / `title` 裡（那必定是介面），但畫面上的文字節點不碰——因為那裡
很可能是你的檔名。想讓某個字在畫面上也翻，把它從這個清單移掉就好。

數字規則的第三個元素也可以設 `true` 表示「只在屬性裡套用」，例如 `/^(.+) icon$/` 就是這樣，
免得一個叫 `something icon` 的檔案被改掉。

### 第 3 段：查表核心（搜尋 `* 3.`）

- `normalize()`：把不斷行空白換成一般空白、`...` 統一成 `…`、壓掉多餘空白、去頭尾空白。避免看不見的字元差異造成比對失敗。
- `looksTranslatable()`：長度 200 以內、至少含一個英文字母、且**不含中日韓字元**才值得查。最後這條同時防止已翻好的字被重複處理。
- `translateString()`：先查字典（含小寫備援），再跑數字規則，都沒中就回傳 `null` 保持原樣。

### 第 4 段：DOM 走訪（搜尋 `* 4.`）

- `written`（`WeakMap`）：記下我們寫進去的值。React 重繪時內容沒變就不重做，避免和框架互相打架。
- `translateTextNode()`：替換時**保留原本的前後空白**，不然版面間距會跑掉。
- `translateSubtree()`：用 `TreeWalker` 走整棵樹，碰到保護區的元素直接 `FILTER_REJECT`，整段剪掉不進去看。屬性則是整棵樹都掃——因為 `aria-label` / `title` 一定是介面字串，不可能是使用者寫的內容。

### 第 5 段：監看 DOM 變動（搜尋 `* 5.`）

兩個站台都是 SPA，換頁只改 DOM 不重新載入，所以用 `MutationObserver` 持續監看。變動先丟進 `pending` 集合，用 `requestAnimationFrame` 合併成一批處理，避免串流回應時每個字都觸發一次翻譯。

### 第 6 段：開關（搜尋 `* 6.`）

`Ctrl + Alt + T`。keydown 用 capture 模式（第三個參數 `true`），確保在網站自己的快捷鍵之前攔到。

### 第 7 段：啟動（搜尋 `* 7.`）

`@run-at document-start` 表示腳本在 HTML 還沒解析完就執行，所以：

1. 先掛上 `MutationObserver`，之後所有新出現的元素都會被處理。
2. 再依 `document.readyState` 決定要等 `DOMContentLoaded` 還是直接掃描。
3. `load` 事件再掃一次，補上晚到的內容。

這樣安排的好處是**不會看到英文閃一下才變中文**。

---

## 五、怎麼自己加翻譯

1. 在網頁上找到沒翻到的英文字串，**一字不差**地複製下來（含大小寫）。
2. 打開 Tampermonkey 編輯器，找到 `const SITES`，確認要加在 `id: 'claude'` 還是 `id: 'github'` 那一組的 `dict` 裡。
3. 依主題找到對應的分類註解，在下面加一行：

```js
'Your English String': '你的繁中翻譯',
```

4. 注意結尾的逗號。每組字典的最後一筆沒有逗號，要接在它後面的話記得先補上。
5. 儲存，重新整理頁面。

**判斷要不要用數字規則**：字串裡有會變動的數字（例如 `5 files`），加到同一組的 `patterns`，不要加進 `dict`。

**遇到只翻一半**：通常是該字串被拆成多個 DOM 節點，或它落在保護區裡。按 F12 看它的父層有沒有命中 `protect` 清單。

**如果你是整批蒐集頁面上的英文字串**：那份清單一定會混進不該翻的東西——日期時間、檔名、
人名、Claude 做事時的即時狀態文字、被 DOM 切斷的殘缺片段。**不要整包倒進字典**，
先逐條分成「固定介面字串」「不可翻的內容」「含變動數字該用規則處理」三類。
實際被剔除的例子和理由在 [未採用字串.md](未採用字串.md)。

**測試建議**：改完之後除了肉眼看，最好確認保護區沒被破壞——尤其 GitHub，隨便開一個有 README 和程式碼的儲存庫，確認內文和檔名都沒變。

---

## 六、三種長期更新方式

claude.ai 和 GitHub 都會改介面文字，字典一定會慢慢失準。以下三種可以疊加。

### 方式 A：`@updateURL` / `@downloadURL` 自動更新

**要先有一個公開的 raw 連結**（GitHub repo 或 Gist 都可以）。

1. 把腳本放上 GitHub 或建一個 Gist。
2. 取得 raw 連結，例如
   `https://raw.githubusercontent.com/<帳號>/<repo>/main/zh-tw-webui.user.js`
   Gist 的話要**把網址中間那段 commit 雜湊刪掉**，變成
   `https://gist.githubusercontent.com/<帳號>/<gist_id>/raw/zh-tw-webui.user.js`
   這個形式才會永遠指向最新版。
3. 在腳本標頭加兩行（**本 repo 已經設好了**）：

```js
// @updateURL    https://raw.githubusercontent.com/b010203044-code/zh-tw-webui/main/zh-tw-webui.user.js
// @downloadURL  https://raw.githubusercontent.com/b010203044-code/zh-tw-webui/main/zh-tw-webui.user.js
```

4. Tampermonkey 設定 → 一般 → **腳本更新**，檢查間隔設成每天或每週。
5. 之後每次更新，**一定要把 `@version` 往上加**（例如 `3.0.0` → `3.0.1`）。Tampermonkey 只認版本號，內容改了但版本沒動它不會更新。

### 方式 B：GitHub repo 版本管理

前提是 Claude GitHub App 要裝在**你擁有的帳號**底下（組織 repo 需要組織 owner 才能裝）。裝好之後：

1. 腳本和這份說明推上 repo，之後每次擴充走 PR，有 diff 可看、可回退。
2. 搭配方式 A，合併進 main 就自動推送給所有安裝者。

### 方式 C：定期排程檢查

設一個週期性任務（例如每月一號），自動比對字典和站台常見介面字串，列出還沒翻譯的項目回報。要的話說一聲。注意這會定期消耗額度。

### 三種方式的差異

| | 方式 A 自動更新 | 方式 B GitHub repo | 方式 C 定期排程 |
|---|---|---|---|
| 前置作業 | 要有公開 raw 連結 | 要裝 Claude GitHub App | 無 |
| 解決什麼問題 | 改好的版本自動送到瀏覽器 | 保留修改歷史、可回退 | 主動發現漏翻的字串 |
| 誰要動手 | 你改完記得升版本號 | 走 PR 流程 | 自動跑，你看結果 |
| 額度成本 | 0 | 0 | 每次執行都會消耗 |

**建議順序**：先做 A，能裝 App 之後補 B，覺得手動找漏翻太累再開 C。

---

## 七、用量差異

### 專案 vs 一般交談

| | 一般交談 | 在專案裡 |
|---|---|---|
| 背景脈絡 | 每次都要重貼 | 放進專案知識，有快取 |
| 重複內容是否計入額度 | 計入 | **重複使用時不計入**，只算新增或未快取的部分 |
| 是否記得上次的決定 | 不記得 | 記得（專案記憶 + 討論紀錄） |
| 內容變大時 | 脈絡塞不下 | 自動切成 RAG 檢索，約可放 10 倍內容 |

### 真正吃額度的因素

- 訊息長度、附件大小
- **目前這串交談累積的長度**（愈聊愈久，每則就愈貴）
- 工具使用：深入研究、網頁搜尋
- 模型選擇與思考強度
- Artifact 產生、多步驟任務

### 實務建議

- 相關問題**一次問完**，比拆成五則訊息省。
- 討論串聊很久之後，開新的討論串會比繼續接下去便宜。
- 會反覆用到的參考資料放進專案知識，不要每次貼。
- 在 claude.ai 的**設定 > 用量**可以看實際消耗。

**一個反向提醒**：像這個討論串會實際跑指令、開瀏覽器做測試，比單純聊天吃更多額度。專案省的是「重複的脈絡」，不是省掉工作本身。

參考：
- [Usage limit best practices](https://support.claude.com/en/articles/9797557-usage-limit-best-practices)
- [RAG for projects](https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects)

---

## 八、疑難排解

| 症狀 | 可能原因與處理 |
|---|---|
| 完全沒翻譯 | Chrome 沒開開發人員模式；或 Tampermonkey 圖示沒顯示 `1`；或網址不在 `@match` 範圍內 |
| 只翻了一部分 | 該字串不在字典裡，或整段字串有細微差異（多空格、`...` vs `…`） |
| GitHub 上某些字沒翻 | 多半是被 `protect` 清單蓋到了。這是刻意保守，寧可少翻也不要改到使用者資料 |
| 翻譯閃一下又變回英文 | 框架重繪蓋掉了。正常情況 `MutationObserver` 會再翻回來；持續發生就回報該字串 |
| 使用者資料被改到 | 不該發生。請把該段內容和它的 DOM 結構回報，會補進對應站台的 `protect` |
| 按 `Ctrl + Alt + T` 沒反應 | 焦點可能在輸入框被吃掉，先點頁面空白處再按 |
