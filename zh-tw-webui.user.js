// ==UserScript==
// @name         繁體中文介面（Claude + GitHub） v3.16.0
// @name:zh-TW   繁體中文介面（Claude + GitHub） v3.16.0
// @namespace    https://github.com/b010203044-code/zh-tw-webui
// @version      3.16.0
// @description  把 claude.ai 與 github.com 的「介面文字」換成繁體中文（台灣用語）。只翻譯介面，絕不更動對話內容、程式碼、檔名、議題內文等使用者資料。
// @author       Harry
// @match        https://claude.ai/*
// @match        https://github.com/*
// @icon         https://claude.ai/favicon.ico
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/b010203044-code/zh-tw-webui/main/zh-tw-webui.user.js
// @downloadURL  https://raw.githubusercontent.com/b010203044-code/zh-tw-webui/main/zh-tw-webui.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /* 版本號。改版時四個地方要一起改：@name、@name:zh-TW、@version、這裡。
     @name 帶版本號是為了在油猴控制台與動作選單上一眼看得出跑的是哪一版。 */
  const VERSION = '3.16.0';

  /* ------------------------------------------------------------------ *
   * 1. 共用保護區：所有站台都不動這些地方的文字
   * ------------------------------------------------------------------ */
  const BASE_PROTECTED = [
    'script', 'style', 'noscript', 'template', 'code', 'pre', 'textarea',
    'svg', 'canvas', 'iframe', 'input', 'option',
    '[contenteditable="true"]', '[contenteditable=""]', '.ProseMirror',
    '[data-no-translate]'
  ];

  const ATTRS = ['aria-label', 'title', 'placeholder', 'aria-placeholder', 'alt', 'data-tooltip'];

  /* ------------------------------------------------------------------ *
   * 2. 站台設定
   *    每個站台有自己的字典、樣式規則、以及額外的保護區。
   *    要加新站台，照這個格式再加一組就好。
   * ------------------------------------------------------------------ */
  /* 星期與上下午的中譯。單獨的日期標籤（Jul 16、July）照既定政策維持英文，
     這裡只用在「Resets Sun 5:00 PM」「Every Monday at 9:00 AM」這種整句介面文字裡。 */
  const WEEKDAY_ZH = {
    Sun: '週日', Mon: '週一', Tue: '週二', Wed: '週三', Thu: '週四', Fri: '週五', Sat: '週六',
    Sunday: '週日', Monday: '週一', Tuesday: '週二', Wednesday: '週三',
    Thursday: '週四', Friday: '週五', Saturday: '週六'
  };
  const clockZh = (hhmm, ampm) => (/^am$/i.test(ampm) ? '上午 ' : '下午 ') + hhmm;

  const SITES = [
    {
      id: 'claude',
      label: 'claude.ai',
      match: /(^|\.)claude\.ai$/,

      /* 額外保護區：對話內容與 Artifact，絕對不動 */
      protect: [
        '[data-testid="user-message"]',
        '.font-user-message',
        '.font-claude-message',
        '.font-claude-response',
        '[data-testid="message-content"]',
        '[data-testid="artifact-content"]',
        '[data-testid="file-thumbnail"]',
        '.katex'
      ],

      /* 這些泛用單字只在 aria-label / title 等屬性裡翻譯。畫面上的文字節點不碰，
         因為使用者的檔名、資料夾名、討論串名或專案名很可能剛好就叫這些字。 */
      attrOnly: ['App', 'Other', 'Kind', 'Size', 'Goal', 'Grid', 'List', 'Extra', 'Input', 'Output', 'Read',
                 'Personal', 'Folder', 'Check', 'Environment', 'Developer', 'Organization', 'Models',
                 'Tokens', 'Project', 'Select', 'Thread', 'Mode', 'Move', 'Prompt', 'High', 'Low',
                 'All', 'Active', 'Idle', 'Name', 'Type', 'Status',
                 /* v3.15.0：表格欄位與中繼資料值，跟上面同一類，使用者很可能拿來當名字 */
                 'Date', 'State', 'Medium', 'None', 'Updated'],

      /* 刻意不翻、也不要再回報的字串（v3.10.0 新增）。
         產品名、品牌名、方案名、按鍵名這類本來就該保留英文，
         但它們每次瀏覽都會再出現在盤點清單裡，變成固定雜訊。
         列在這裡只影響「要不要回報」，不影響翻譯行為。
         理由逐條記在 repo 的 未採用字串.md。 */
      never: ['Anthropic', 'Anthropic PBC', 'PBC', 'Claude', 'Claude Code', 'Claude Pro', 'Claude Max',
              'Opus', 'Sonnet', 'Haiku', 'Opus 5', 'Opus 4.8', 'Sonnet 5', 'Haiku 4.5',
              'Pro', 'Max', 'MCP', 'API',
              'CDN', 'Chromium', 'GitHub', 'Tampermonkey', 'Ctrl', 'Shift', 'Alt', 'Enter', 'Esc',
              'Escape', 'Tab', 'Backspace', 'Cmd', 'Option', 'README', 'LICENSE',
              /* 作品清單的副檔名標籤，以及交談裡被 DOM 切碎的程式碼片段。
                 這些是識別碼不是介面文字，翻了反而看不懂。 */
              'js', 'ts', 'jsx', 'tsx', 'md', 'html', 'css', 'json', 'svg', 'txt', 'csv',
              'yml', 'yaml', 'sh', 'py', 'commit', 'aria-label', 'outerHTML',
              /* v3.15.0：連接器目錄與外掛市集的產品名。全是第三方品牌，一律保留英文，
                 列在這裡只是不要每次逛目錄都塞滿盤點清單。 */
              'AI', 'APIs', 'AllTrails', 'Apollo.io', 'Asana', 'Atlassian MCP',
              'Black Diamond', 'BlackRock Advisor Center', 'Canva', 'Chronograph',
              'Chronograph GP', 'Chronograph LP', 'CMS Coverage', 'Datadog', 'Dropbox',
              'Figma', 'Gamma', 'Gmail', 'Google Ads', 'Google Calendar', 'Google Drive',
              'HubSpot', 'HyperFrames by HeyGen', 'ICD-10 Codes', 'incident.io',
              'Interactive Brokers (IBKR)', 'Intuit QuickBooks', 'Leadfeeder', 'LINE',
              'Linear', 'Links Connect', 'Maryland Community Compass', 'Microsoft 365',
              'Microsoft Learn', 'Miro', 'monday.com', 'Notion', 'NPI Registry',
              'Paxton Legal Research', 'PDF Viewer', 'PitchBook Premium', 'Postiz',
              'PubMed', 'Rome2Rio', 'Salesforce', 'Sentry', 'Shopify', 'Slack', 'Sonos',
              'Strava', 'Stripe', 'Supabase', 'Vanguard Advisor Tools', 'Vercel',
              'Vibe Prospecting', 'vidIQ', 'Windsor.ai', 'Wingspan', 'Zapier', 'ZoomInfo',
              'Sonnet 4.6', 'Opus 4.6', 'Claude Code', 'Cowork',
              /* 載入動畫的趣味動詞。刻意保留英文，見 未採用字串.md 第一批。 */
              'Forming', 'Kneading', 'Molding', 'Turning over',
              /* Anthropic 的角色組合名，是品牌名不是敘述，保留英文 */
              'Claude for design', 'Claude for legal', 'Claude for science'],

      dict: {
    /* ---- 側邊欄與導覽 ---- */
    'New chat': '新交談',
    'Start new chat': '開始新交談',
    'Chats': '交談',
    'All chats': '所有交談',
    'Recents': '最近',
    'Recent chats': '最近的交談',
    'Starred': '已加星號',
    'Projects': '專案',
    'All projects': '所有專案',
    'Artifact': '作品',
    'Artifacts': '作品',
    'Library': '資料庫',
    'Connectors': '連接器',
    'Settings': '設定',
    'Help': '說明',
    'Help & support': '說明與支援',
    'Learn more': '瞭解更多',
    'View all': '查看全部',
    'See all': '查看全部',
    'Show all': '顯示全部',
    'Collapse sidebar': '收合側邊欄',
    'Expand sidebar': '展開側邊欄',
    'Open sidebar': '開啟側邊欄',
    'Close sidebar': '關閉側邊欄',
    'Toggle sidebar': '切換側邊欄',
    'Menu': '選單',
    'Back': '返回',
    'Go back': '返回',
    'Home': '首頁',
    'Log out': '登出',
    'Sign out': '登出',
    'Log in': '登入',
    'Sign in': '登入',
    'Sign up': '註冊',
    'Continue with Google': '使用 Google 繼續',
    'Continue with email': '使用電子郵件繼續',

    /* ---- 搜尋 ---- */
    'Search': '搜尋',
    'Search chats': '搜尋交談',
    'Search chats...': '搜尋交談…',
    'Search projects': '搜尋專案',
    'Search or start new chat': '搜尋或開始新交談',
    'No results': '沒有結果',
    'No results found': '找不到結果',
    'No chats found': '找不到交談',
    'Clear search': '清除搜尋',
    'Recent searches': '最近的搜尋',

    /* ---- 輸入區（composer） ---- */
    'How can I help you today?': '今天我能幫你什麼忙？',
    'How can I help you?': '我能幫你什麼忙？',
    'What can I help you with?': '需要我幫什麼忙？',
    'Good morning': '早安',
    'Good afternoon': '午安',
    'Good evening': '晚安',
    'Reply to Claude…': '回覆 Claude…',
    'Message Claude…': '傳訊息給 Claude…',
    'How can Claude help you today?': '今天 Claude 能幫你什麼忙？',
    'Write your prompt to Claude': '輸入你要給 Claude 的提示',
    'Send': '傳送',
    'Send message': '傳送訊息',
    'Stop': '停止',
    'Stop response': '停止回應',
    'Stop generating': '停止產生',
    'Attach files': '附加檔案',
    'Attach file': '附加檔案',
    'Upload file': '上傳檔案',
    'Upload files': '上傳檔案',
    'Add attachment': '新增附件',
    'Add content': '新增內容',
    'Add from Google Drive': '從 Google 雲端硬碟新增',
    'Add photos': '新增相片',
    'Take screenshot': '擷取螢幕畫面',
    'Screenshot': '螢幕截圖',
    'Drop files to add to conversation': '拖放檔案以加入此交談',
    'Drop files here': '把檔案拖放到這裡',
    'Voice input': '語音輸入',
    'Dictate': '語音輸入',
    'Tools': '工具',
    'Search and tools': '搜尋與工具',
    'Extended thinking': '延伸思考',
    'Enable extended thinking': '啟用延伸思考',
    'Web search': '網頁搜尋',
    'Research': '深入研究',
    'Deep research': '深入研究',
    'Drive search': '雲端硬碟搜尋',
    'Analysis tool': '分析工具',

    /* ---- 寫作風格 ---- */
    'Style': '風格',
    'Choose style': '選擇風格',
    'Use style': '使用風格',
    'Writing style': '寫作風格',
    'Normal': '一般',
    'Concise': '簡潔',
    'Explanatory': '說明',
    'Formal': '正式',
    'Default': '預設',
    'Create style': '建立風格',
    'Create & edit styles': '建立與編輯風格',
    'Edit style': '編輯風格',
    'Custom style': '自訂風格',

    /* ---- 模型選擇 ---- */
    'Choose model': '選擇模型',
    'Select model': '選擇模型',
    'More models': '更多模型',
    'Other models': '其他模型',
    'Legacy models': '舊版模型',
    'Most capable model': '能力最強的模型',
    'Smart model for everyday use': '適合日常使用的聰明模型',
    'Balance of speed and intelligence': '兼顧速度與智慧',
    'Fastest model for daily tasks': '日常任務最快的模型',
    'Fastest model': '最快的模型',
    'Powerful model for complex challenges': '處理複雜任務的強大模型',

    /* ---- 訊息操作 ---- */
    'Copy': '複製',
    'Copied': '已複製',
    'Copied!': '已複製！',
    'Copy to clipboard': '複製到剪貼簿',
    'Copy message': '複製訊息',
    'Copy code': '複製程式碼',
    'Copy link': '複製連結',
    'Retry': '重試',
    'Try again': '再試一次',
    'Regenerate': '重新產生',
    'Regenerate response': '重新產生回應',
    'Edit': '編輯',
    'Edit message': '編輯訊息',
    'Save & submit': '儲存並送出',
    'Good response': '回應不錯',
    'Bad response': '回應不佳',
    'Report issue': '回報問題',
    'Give feedback': '提供意見回饋',
    'Feedback': '意見回饋',
    'Branch': '分支',
    'Previous': '上一則',
    'Next': '下一則',
    'Scroll to bottom': '捲到最下方',
    'Claude is thinking…': 'Claude 思考中…',
    'Thinking': '思考中',
    'Thinking…': '思考中…',
    'Thought process': '思考過程',
    'Show thinking': '顯示思考過程',
    'Hide thinking': '隱藏思考過程',
    'Searching the web': '搜尋網路中',
    'Searching': '搜尋中',
    'Reading': '讀取中',
    'Analyzing': '分析中',
    'Running': '執行中',
    'Results': '結果',
    'View result': '查看結果',
    'Sources': '來源',
    'Show more': '顯示更多',
    'Show less': '顯示較少',
    'Expand': '展開',
    'Collapse': '收合',
    'Claude can make mistakes. Please double-check responses.': 'Claude 可能會出錯，請自行確認回應內容。',
    'Claude can make mistakes. Please double-check cited sources.': 'Claude 可能會出錯，請自行確認引用來源。',

    /* ---- Artifact / 程式碼 ---- */
    'Preview': '預覽',
    'Code': '程式碼',
    'Publish': '發布',
    'Unpublish': '取消發布',
    'Published': '已發布',
    'Download': '下載',
    'Open in new tab': '在新分頁開啟',
    'Version history': '版本紀錄',
    'Latest version': '最新版本',
    'Refresh': '重新整理',
    'Reload': '重新載入',
    'Full screen': '全螢幕',
    'Exit full screen': '離開全螢幕',
    'Line wrap': '自動換行',

    /* ---- 專案 ---- */
    'New project': '新專案',
    'Create project': '建立專案',
    'Project knowledge': '專案知識',
    'Project instructions': '專案指示',
    'Set project instructions': '設定專案指示',
    'Edit instructions': '編輯指示',
    'What are you working on?': '你正在做什麼？',
    'Describe your project': '描述你的專案',
    'Name your project': '為你的專案命名',
    'Add files': '新增檔案',
    'Add text': '新增文字',
    'Add text content': '新增文字內容',
    'No files yet': '尚未有檔案',
    'Private': '私人',
    'Shared': '共用',
    'Shared with you': '與你共用',
    'Shared with your organization': '與你的組織共用',
    'Only you can see this': '只有你看得到',
    'Members': '成員',
    'Invite': '邀請',
    'Invite members': '邀請成員',
    'Owner': '擁有者',
    'Admin': '管理員',
    'Member': '成員',
    'Viewer': '檢視者',

    /* ---- 設定 ---- */
    'Profile': '個人檔案',
    'Account': '帳戶',
    'Appearance': '外觀',
    'Billing': '帳務',
    'Plans': '方案',
    'Privacy': '隱私',
    'Data controls': '資料控制',
    'Integrations': '整合',
    'Capabilities': '功能',
    'Features': '功能',
    'Beta features': 'Beta 功能',
    'Experimental': '實驗性功能',
    'Theme': '主題',
    'Light': '淺色',
    'Dark': '深色',
    'System': '跟隨系統',
    'Language': '語言',
    'Full name': '全名',
    'Display name': '顯示名稱',
    'Email': '電子郵件',
    'Email address': '電子郵件地址',
    'Password': '密碼',
    'What should we call you?': '我們該怎麼稱呼你？',
    'Tell Claude about yourself': '讓 Claude 認識你',
    'Personal preferences': '個人偏好',
    'Notifications': '通知',
    'Security': '安全性',
    'Two-factor authentication': '雙重驗證',
    'Export data': '匯出資料',
    'Delete account': '刪除帳戶',
    'Enable': '啟用',
    'Disable': '停用',
    'Enabled': '已啟用',
    'Disabled': '已停用',
    'On': '開啟',
    'Off': '關閉',
    'Connect': '連接',
    'Disconnect': '中斷連接',
    'Connected': '已連接',
    'Manage': '管理',

    /* ---- 方案與額度 ---- */
    'Upgrade': '升級',
    'Upgrade plan': '升級方案',
    'Your plan': '你的方案',
    'Free plan': '免費方案',
    'Current plan': '目前方案',
    'Manage subscription': '管理訂閱',
    'Message limit reached': '已達訊息上限',
    'You are out of free messages': '免費訊息已用完',
    'Usage limit reached': '已達使用上限',
    'Please try again later': '請稍後再試',
    'Unable to send message': '無法傳送訊息',
    'Something went wrong': '發生錯誤',
    'Network error': '網路錯誤',
    'Connection lost': '連線中斷',
    'Reconnecting…': '重新連線中…',

    /* ---- 通用按鈕與狀態 ---- */
    'OK': '確定',
    'Yes': '是',
    'No': '否',
    'Cancel': '取消',
    'Confirm': '確認',
    'Done': '完成',
    'Close': '關閉',
    'Dismiss': '關閉',
    'Got it': '知道了',
    'Skip': '略過',
    'Save': '儲存',
    'Save changes': '儲存變更',
    'Submit': '送出',
    'Apply': '套用',
    'Reset': '重設',
    'Continue': '繼續',
    'Create': '建立',
    'Add': '新增',
    'Remove': '移除',
    'Delete': '刪除',
    'Delete chat': '刪除交談',
    'Delete project': '刪除專案',
    'Rename': '重新命名',
    'Rename chat': '重新命名交談',
    'Duplicate': '建立複本',
    'Archive': '封存',
    'Unarchive': '取消封存',
    'Star': '加星號',
    'Unstar': '取消星號',
    'Pin': '釘選',
    'Unpin': '取消釘選',
    'Share': '分享',
    'Share chat': '分享交談',
    'Export': '匯出',
    'Import': '匯入',
    'Select all': '全選',
    'Deselect all': '取消全選',
    'Clear': '清除',
    'Clear all': '全部清除',
    'Filter': '篩選',
    'Sort': '排序',
    'Loading': '載入中',
    'Loading…': '載入中…',
    'Saving…': '儲存中…',
    'Saved': '已儲存',
    'More': '更多',
    'More options': '更多選項',
    'Options': '選項',
    'Actions': '動作',
    'Required': '必填',
    'Optional': '選填',
    'Beta': 'Beta',
    /* 側邊欄左上角那顆按鈕的文字節點就是 New。
       注意：claude.ai 的「新功能」小標籤用的也是同一個字，
       引擎只比對字串、無法分辨位置，所以兩邊會一起變。 */
    'New': '新的對話',
    'Coming soon': '即將推出',
    'This action cannot be undone.': '此動作無法復原。',
    'Are you sure?': '確定嗎？',

    /* ---- 時間分組 ---- */
    'Today': '今天',
    'Yesterday': '昨天',
    'This week': '本週',
    'Previous 7 days': '前 7 天',
    'Previous 30 days': '前 30 天',
    'Last 7 days': '過去 7 天',
    'Last 30 days': '過去 30 天',
    'This month': '本月',
    'Last month': '上個月',
    'Older': '更早',
    'Just now': '剛剛',
    'a minute ago': '1 分鐘前',
    'an hour ago': '1 小時前',
    'a day ago': '1 天前',

    /* ---- Projects 介面（討論串、資料庫、專案設定、用量）---- */
    '(edited)': '（已編輯）',
    'A button for each file that opens it — press Tab until focus enters the card, Escape to return.': '每個檔案都有一個可開啟它的按鈕 — 按 Tab 直到焦點進入卡片，按 Escape 返回。',
    'A card with a "Start with a prompt" link is available — press Tab until focus enters the card, Escape to return.': '有一張含「從提示詞開始」連結的卡片 — 按 Tab 直到焦點進入卡片，按 Escape 返回。',
    'A to Z': 'A 到 Z',
    'Actions for Artifacts': '作品的操作',
    'Add a README': '新增 README',
    'Add a file': '新增檔案',
    'Add a folder': '新增資料夾',
    'Add a repository': '新增儲存庫',
    'Add reaction': '新增反應',
    'Add scheduled task': '新增排程任務',
    'All of your claude.ai connectors are available in every thread.': '你所有的 claude.ai 連接器在每個討論串中都能使用。',
    'All repositories': '所有儲存庫',
    'All types': '所有類型',
    'And more — Power repository selection across code review, admin settings, and other GitHub-backed features.': '還有更多 — 在程式碼審查、管理員設定及其他以 GitHub 為基礎的功能中提供儲存庫選擇。',
    'App': '應用程式',
    'Archive project': '封存專案',
    'Ask Claude a question or start a task…': '向 Claude 提問或開始一項任務…',
    'Ask Claude in a thread to put recurring work on a schedule, like a morning digest or a weekly report.': '在討論串中請 Claude 把重複性工作排入排程，例如每日晨間摘要或每週報告。',
    'Ask for docs, files, artifacts, or folders in any thread. Claude can organize them in this panel.': '在任何討論串中要求 Claude 產生文件、檔案、作品或資料夾，Claude 可以在這個面板中整理它們。',
    'Authorize': '授權',
    'Auto memory': '自動記憶',
    'Auto-continue when usage limits reset': '用量上限重設後自動繼續',
    'Blocked': '受阻',
    'Breakdown': '明細',
    'Buttons that scroll the chat to where Claude used each one — press Tab until focus enters the card, Escape to return.': '這些按鈕會把交談捲動到 Claude 使用各項目的位置 — 按 Tab 直到焦點進入卡片，按 Escape 返回。',
    'Cache hit': '快取命中',
    'Cache read': '快取讀取',
    'Cache write': '快取寫入',
    'Check': '檢查',
    'Check repository status': '檢查儲存庫狀態',
    'Choose a repository to see if cloud sessions have access.': '選擇一個儲存庫，查看雲端工作階段是否有存取權。',
    'Claude Code — Select repositories, browse branches, and track pull requests in remote sessions.': 'Claude Code — 在遠端工作階段中選擇儲存庫、瀏覽分支並追蹤合併請求。',
    'Claude Design lives here now': 'Claude Design 現在移到這裡了',
    'Claude Tag is set up from a Claude Team or Enterprise workspace. You may be signed in to a personal account. Try switching workspaces, or ask an organization owner to follow the setup guide.': 'Claude Tag 需從 Claude Team 或 Enterprise 工作區設定。你目前可能登入的是個人帳號。請嘗試切換工作區，或請組織擁有者依照設定指南操作。',
    'Claude can create files': 'Claude 可以建立檔案',
    'Claude is working': 'Claude 執行中',
    'Claude sets up your project automatically': 'Claude 會自動設定你的專案',
    'Claude will track your threads here as they start: what’s working, what’s waiting on you, and what’s done.': '討論串開始後，Claude 會在這裡追蹤：進行中、等待你處理，以及已完成的項目。',
    'Cloud sessions only': '僅限雲端工作階段',
    'Code changes': '程式碼變更',
    'Completed threads file here.': '已完成的討論串會收錄在這裡。',
    'Continue on GitHub': '在 GitHub 上繼續',
    'Coordinated': '已協調',
    'Coordinator': '協調者',
    'Coordinator effort': '協調者投入程度',
    'Coordinator model': '協調者模型',
    'Copy ID': '複製 ID',
    'Copy report': '複製報告',
    'Created by you': '由你建立',
    'Customize project icon and color': '自訂專案圖示與顏色',
    'Danger zone': '危險區域',
    'Date modified': '修改日期',
    'Decisions, reviews, and permissions only you can give.': '只有你能給予的決定、審查與權限。',
    'Default (High)': '預設（高）',
    'Default (Low)': '預設（低）',
    'Default effort for new threads.': '新討論串的預設投入程度。',
    'Default model for new threads.': '新討論串的預設模型。',
    'Design System': '設計系統',
    'Design, Beta': '設計，Beta',
    'Developer': '開發者',
    'Dictation settings': '聽寫設定',
    'Docs': '文件',
    'Docs, Beta': '文件，Beta',
    'Drag or move sessions here': '將工作階段拖曳或移動到這裡',
    'Edit details': '編輯詳細資料',
    'Edited': '已編輯',
    'Effort': '投入程度',
    'Effort for managing and creating threads.': '管理與建立討論串時的投入程度。',
    'Environment': '環境',
    'Extra': '額外',
    'Filter by': '篩選依據',
    'Folder': '資料夾',
    'Folders and files live in the Library': '資料夾與檔案都放在資料庫中',
    'GitHub account connected': 'GitHub 帳號已連接',
    'GitHub repo': 'GitHub 儲存庫',
    'Go to chat': '前往交談',
    'Goal': '目標',
    'Grid': '格狀',
    'Grid view': '格狀檢視',
    'Hide this project from the sidebar and archive its threads. This can be undone at any time.': '將此專案從側邊欄隱藏並封存其討論串。此操作隨時可以復原。',
    'Included in the report': '已包含在報告中',
    'Includes a document': '包含文件',
    'Input': '輸入',
    'Install': '安裝',
    'Install & Authorize': '安裝並授權',
    'Kind': '類型',
    'Layout': '版面配置',
    'Like a CLAUDE.md: instructions and rules you write that every new thread reads and follows.': '就像 CLAUDE.md：由你撰寫、每個新討論串都會讀取並遵循的指示與規則。',
    'Make something new': '建立新內容',
    'Manage connectors': '管理連接器',
    'Memory files': '記憶檔案',
    'Model for managing and creating threads.': '用於管理與建立討論串的模型。',
    'Models': '模型',
    'Move down': '下移',
    'Name and icon': '名稱與圖示',
    'Name this thread': '為此討論串命名',
    'Needs attention': '需要處理',
    'New Slides and Design projects are created as artifacts.': '新的「投影片」與「設計」專案會以作品形式建立。',
    'New session': '新工作階段',
    'Newest document available to open — press Tab until focus enters the card, Escape to return.': '有最新的文件可開啟 — 請按 Tab 直到焦點進入卡片，按 Escape 返回。',
    'No other files yet.': '尚無其他檔案。',
    'No repositories yet — use Add to connect one.': '尚無儲存庫 — 請使用「新增」連接一個。',
    'Notes Claude writes itself as it works in this project.': 'Claude 在此專案中工作時自行寫下的筆記。',
    'Nothing is waiting on you.': '沒有待你處理的事項。',
    'Only select repositories': '僅限選取的儲存庫',
    'Open Library': '開啟資料庫',
    'Open MEMORY.md': '開啟 MEMORY.md',
    'Organization': '組織',
    'Other': '其他',
    'Output': '輸出',
    'Output list available — press Tab until focus enters the card, Escape to return.': '有輸出清單可檢視 — 請按 Tab 直到焦點進入卡片，按 Escape 返回。',
    'Overview': '總覽',
    'Pause': '暫停',
    'Pause project': '暫停專案',
    'Pause the coordinator and new thread creation. This can be undone at any time.': '暫停協調者與新討論串的建立。此操作隨時可以復原。',
    'Permanently delete this project and all of its threads. This cannot be undone.': '永久刪除此專案及其所有討論串。此操作無法復原。',
    'Personal': '個人',
    'Press and hold to record': '按住以錄音',
    'Problem description': '問題描述',
    'Project ID': '專案 ID',
    'Project content': '專案內容',
    'Project options': '專案選項',
    'Project repositories': '專案儲存庫',
    'Project settings': '專案設定',
    'Project status page': '專案狀態頁面',
    'Project storage': '專案儲存空間',
    'Projects can run several threads at once and draw down your usage faster.': '專案可同時執行多個討論串，會更快消耗你的用量。',
    'Read': '讀取',
    'Read access to commit statuses and metadata': '讀取 commit 狀態與中繼資料的權限',
    'Read every thread': '讀取所有討論串',
    'Reconnect the Claude GitHub App': '重新連接 Claude GitHub App',
    'Recycle the worker running this project’s coordinator. Any in-flight turn will be interrupted.': '回收重啟執行此專案協調者的工作處理程序（worker）。任何進行中的回合都會被中斷。',
    /* 拖放釘選的四句是一組，只收其中一句會變成拖到一半中英夾雜。 */
    'Drag to pin': '拖曳以釘選',
    'Drag to unpin': '拖曳以取消釘選',
    'Release to pin': '放開以釘選',
    'Release to unpin': '放開以取消釘選',
    'Reorder Idle': '重新排序「閒置」',
    'Reorder Resolved': '重新排序「已解決」',
    'Reorder Waiting on you': '重新排序「等待你處理」',
    'Reorder Working': '重新排序「執行中」',
    'Report a problem': '回報問題',
    'Repositories': '儲存庫',
    'Repository': '儲存庫',
    'Repository access': '儲存庫存取權',
    'Reset to defaults': '重設為預設值',
    'Resize': '調整大小',
    'Resolve': '解決',
    'Resolved': '已解決',
    'Restart': '重新啟動',
    'Restart Claude': '重新啟動 Claude',
    'Search library': '搜尋資料庫',
    'Search models…': '搜尋模型…',
    'Search projects...': '搜尋專案…',
    'Search recents...': '搜尋最近項目…',
    'Search this project': '搜尋此專案',
    'Search threads': '搜尋討論串',
    'Search your activity': '搜尋你的活動',
    'Select a cloud environment': '選擇雲端環境',
    'Select repositories you want in every thread. Claude adds others as needed.': '選擇你希望每個討論串都納入的儲存庫。Claude 會視需要新增其他儲存庫。',
    'Send a message to get started.': '傳送訊息以開始。',
    'Sending': '傳送中',
    'Set up Claude Tag': '設定 Claude Tag',
    'Settings sections': '設定區段',
    'Setup recommendations': '設定建議',
    'Show empty groups': '顯示空的群組',
    'Size': '大小',
    'Slides': '投影片',
    'Slides, Beta': '投影片，Beta',
    'Sort applies to search results': '排序會套用至搜尋結果',
    'Sort tasks': '排序任務',
    'Sources:': '來源：',
    'Start thread': '開始討論串',
    'Steer this thread…': '引導此討論串…',
    'Suggest a name': '建議名稱',
    'Suggested threads': '建議的討論串',
    'Suggestions': '建議',
    'The Claude GitHub App needs to be reconnected so Claude can work with your repositories.': '需要重新連接 Claude GitHub App，Claude 才能操作你的儲存庫。',
    'The outcome you want the coordinator to work toward.': '你希望協調者達成的結果。',
    'This applies to all current and future repositories owned by the resource owner. Also includes public repositories (read-only).': '這適用於資源擁有者所擁有的所有現有與未來的儲存庫，也包含公開儲存庫（唯讀）。',
    'This project': '本專案',
    'Thread actions': '討論串操作',
    'Thread effort': '討論串投入程度',
    'Thread model': '討論串模型',
    'Thread name': '討論串名稱',
    'Threads': '討論串',
    'Threads that stop on a usage limit pick up where they left off when the limit resets. Applies to every thread in this project.': '因達到用量上限而停止的討論串，會在上限重設後從中斷處繼續。此設定套用於本專案的所有討論串。',
    'To pick up a section, press Space or Enter. While it is picked up, press the up or down arrow key to move it, Space or Enter to drop it, or Escape to cancel.': '要抓取某個區段，請按空白鍵或 Enter。抓取後，按上或下方向鍵移動，按空白鍵或 Enter 放下，或按 Escape 取消。',
    'Tokens': 'Token 數',
    'Try asking Claude to work on several things in parallel': '試試看讓 Claude 同時處理多件事情',
    'Ungrouped': '未分組',
    'Unpin project': '取消釘選專案',
    'Update setup': '重新執行設定',
    'Updating thread': '正在更新討論串',
    'Uploads': '上傳的檔案',
    'Usage limit': '用量上限',
    'Used in this session': '本工作階段已使用',
    'Viewed': '已檢視',
    'Visit the standalone homepage': '前往獨立首頁',
    'Waiting on you': '等待你處理',
    'What happened, and what did you expect?': '發生了什麼事？你原本預期的結果是什麼？',
    'Working': '執行中',
    'Working…': '執行中…',
    'Your projects': '你的專案',
    'Yours': '你的',
    'Your threads show up here as Claude works.': '當 Claude 執行工作時，你的討論串會顯示在這裡。',

    /* ---- 泛用標示。單獨的泛用單字都列在上面的 attrOnly，只在屬性裡生效 ---- */
    '(optional)': '（選填）',
    'List': '清單',
    'Project': '專案',
    'Select': '選取',
    'Thread': '討論串',

    /* ---- 檔案與圖片 ---- */
    'Add a Google Drive folder': '新增 Google Drive 資料夾',
    'Drop in files or folders, or add manually': '拖入檔案或資料夾，或手動新增',
    'Close image preview': '關閉圖片預覽',
    'Uploading image': '正在上傳圖片',

    /* ---- 用量與說明連結 ---- */
    'How do usage and length limits work?': '用量與長度上限如何運作？',
    'Usage limit best practices': '用量上限最佳做法',
    'What are projects?': '什麼是專案？',

    /* ---- GitHub App 授權頁（從 claude.ai 導過去，兩邊字典都要有） ---- */
    'Select at least one repository. Also includes public repositories (read-only).': '請至少選取一個儲存庫，也包含公開儲存庫（唯讀）。',
    'Read and write access to code, issues, pull requests, workflows': '對程式碼、議題、合併請求與 workflow 的讀寫權限',
    'Read and write access to actions, checks, code, discussions, issues, pull requests, repository hooks, and workflows': '對 Actions、檢查、程式碼、討論、議題、合併請求、儲存庫 Webhook 與 workflow 的讀寫權限',

    /* ---- 側邊欄與導覽 ---- */
    'Hide sidebar': '隱藏側邊欄',
    'Resize sidebar': '調整側邊欄大小',
    'Sidebar': '側邊欄',
    'More navigation items': '更多導覽項目',
    'Filter and group recents': '篩選並分組最近項目',
    'Pinned': '已釘選',
    'Scheduled': '已排程',

    /* ---- 訊息與交談 ---- */
    'Chat messages': '交談訊息',
    'Message actions': '訊息操作',
    'Show message actions': '顯示訊息操作',
    'Claude finished the response': 'Claude 已完成回覆',
    'Reply': '回覆',
    'Unread response': '未讀回覆',
    'New from a template': '從範本建立',
    'Customize': '自訂',

    /* ---- 專案與討論串列表 ---- */
    'Sort by': '排序依據',
    'Group by': '分組依據',
    'Custom groups': '自訂群組',
    'Date created': '建立日期',
    'Last activity': '最後活動',
    'Routines': '例行任務',

    /* 下面六個是泛用單字，同時列進 attrOnly：只有 aria-label / title 會翻，
       畫面上剛好叫這幾個字的討論串、專案或檔案不會被動到。 */
    'All': '全部',
    'Active': '使用中',
    'Idle': '閒置',
    'Name': '名稱',
    'Type': '類型',
    'Status': '狀態',

    /* ---- 模式與投入程度。High / Low / Mode / Prompt / Move 是泛用字，走 attrOnly ---- */
    'High': '高',
    'Low': '低',
    'Mode': '模式',
    'Move': '移動',
    'Prompt': '提示詞',
    'Fast mode off': '快速模式已關閉',
    'Fast mode on': '快速模式已開啟',

    /* ---- 用量 ---- */
    'Approaching session usage limit': '接近工作階段用量上限',
    'Approaching weekly usage limit': '接近每週用量上限',
    'Plan usage, Compacts automatically': '方案用量，自動壓縮',
    'Resets at': '重設時間',

    /* ---- 其他 ---- */
    '(opens in new tab)': '（在新分頁開啟）',
    /* 這兩條是同一句被 DOM 切成三個文字節點的兩端：Added ｜ <儲存庫名> ｜ to this thread。
       下面 patterns 的 ^Added (.+) to this thread$ 只在整句同一個節點時才會命中，實際頁面不會。 */
    'Added': '已新增',
    'to this thread': '至此討論串',
    'Get apps and extensions': '取得應用程式與擴充功能',
    'Repository and pull request controls': '儲存庫與合併請求控制項',
    'Arrow keys move the tile. Perpendicular arrows preview a split; press Enter to commit or Escape to cancel.': '方向鍵可移動磚塊。垂直方向的方向鍵會預覽分割；按 Enter 確認，按 Escape 取消。',

    /* ---- 表情符號面板（v3.13.0）。shortcode 本身（:smile:）是識別碼，絕對不翻，
           已在 looksLikeData 過濾掉，連盤點清單都不會再出現。 ---- */
    'Search emoji': '搜尋表情符號',
    'Emoji search results': '表情符號搜尋結果',
    'Smileys & People': '表情與人物',
    'Animals & Nature': '動物與自然',
    'Food & Drink': '食物與飲料',
    'Activity': '活動',
    'Travel & Places': '旅遊與地點',
    'Objects': '物品',
    'Symbols': '符號',
    'Flags': '旗幟',

    /* ---- 排程任務（v3.13.0）---- */
    'Scheduled tasks': '排程任務',
    'Search scheduled tasks': '搜尋排程任務',
    'No scheduled tasks yet.': '還沒有排程任務。',
    'New task': '新增任務',
    'Run tasks on a schedule or whenever you need them.': '依排程執行任務，或在你需要時隨時執行。',
    'Today\u2019s brief': '今日簡報',
    "Today's brief": '今日簡報',
    /* 這六個是官方範本的名稱，配著下面六句說明一起出現。 */
    'Daily briefing': '每日簡報',
    'Inbox triage': '收件匣分類',
    'Weekly review': '每週回顧',
    'Content ideas': '內容靈感',
    'Meeting prep': '會議準備',
    'Monitor a topic': '追蹤主題',
    'What needs your attention today across calendar, email, and messages.': '今天行事曆、電子郵件與訊息裡需要你注意的事。',
    'Categorize your inbox and draft replies to anything urgent.': '把收件匣分類，並為緊急的郵件擬好回覆。',
    'A Friday summary of what happened this week.': '週五彙整這星期發生的事。',
    'Draft a few post ideas each week from the latest news in your industry.': '每週從你產業的最新消息擬幾則貼文靈感。',
    'A short brief before each meeting on your calendar, covering attendees, context, and agenda.': '在行事曆上每場會議前給一份簡短摘要，涵蓋與會者、背景與議程。',
    'Watch for news or mentions of a topic, competitor, or keyword.': '追蹤某個主題、競爭對手或關鍵字的新聞與提及。',
    'Manual': '手動',

    /* ---- 用量面板（v3.13.0 補齊）---- */
    'Usage': '用量',
    'Plan usage limits': '方案用量上限',
    'See full project usage': '查看完整專案用量',
    'View usage in Settings': '在設定中查看用量',
    'Get more usage': '取得更多用量',
    'Approaching weekly limit': '接近每週上限',
    'That is your tightest limit right now.': '這是你目前最吃緊的上限。',
    'Weekly · all models': '每週 · 所有模型',
    'Resets': '重設時間',
    'share of project': '佔專案比例',
    'Context': '上下文',
    'Context window': '上下文視窗',
    'This thread': '這條討論串',
    'This thread compacts automatically as it grows.': '這條討論串會隨著變長自動壓縮。',
    'Projects compact automatically, carrying over all of your context safely.': '專案會自動壓縮，安全地帶著你所有的上下文。',

    /* ---- 作品頁（v3.13.0 補齊）---- */
    'Search your artifacts': '搜尋你的作品',
    'No shared artifacts yet': '還沒有共用的作品',
    'When someone shares an artifact with you, it appears here.': '有人與你共用作品時會出現在這裡。',
    'Creates a blank artifact with Claude on the side.': '建立空白作品，旁邊開著 Claude。',
    'Public': '公開',
    /* 作品型別的篩選標籤。使用者的作品剛好叫 Document 或 Design 時也會被改到，
       但篩選列固定是介面，留英文會整排半中半英。要退掉就把這兩條搬到 attrOnly。 */
    'Document': '文件',
    'Design': '設計',
    'Sort projects': '排序專案',

    /* ---- 其他介面（v3.13.0）---- */
    'Add files, connectors, and more': '新增檔案、連接器等',
    'New messages': '新訊息',
    'View thread': '查看討論串',
    'Cancel edit': '取消編輯',
    'Editing message': '編輯訊息中',
    'High priority': '高優先',
    'Excerpt': '摘錄',
    'Microphone': '麥克風',
    'Use voice mode': '使用語音模式',
    'Use incognito': '使用無痕模式',
    'just now': '剛剛',

    /* ---- 連接器目錄與外掛市集（v3.15.0）---- */
    'Add connector': '新增連接器',
    'Search connectors': '搜尋連接器',
    'Top connectors': '熱門連接器',
    'Trending connectors': '熱門趨勢連接器',
    'New connectors': '新的連接器',
    'Discover': '探索',
    'Explore': '瀏覽',
    'For you': '為你推薦',
    'From Anthropic': '來自 Anthropic',
    'Curated by Anthropic': 'Anthropic 精選',
    'Featured bundles': '精選組合',
    'Next bundle': '下一個組合',
    'Previous bundle': '上一個組合',
    'Verified': '已驗證',
    'Trending': '熱門趨勢',
    'Categories': '分類',
    'Category': '分類',
    'Submit to the directory': '提交到目錄',
    'Build for the Claude Directory': '為 Claude 目錄開發',
    'Software Directory Terms': '軟體目錄條款',
    'Developer docs': '開發者文件',
    'Desktop extensions': '桌面擴充功能',
    'Desktop': '桌面',
    'List your connector or plugin and reach everyone using Claude.': '上架你的連接器或外掛，讓所有 Claude 使用者都能找到。',
    'Plugins': '外掛',
    'Plugin Management': '外掛管理',
    'Skills': '技能',
    'Add plugin': '新增外掛',
    'Add plugins': '新增外掛',
    'Add skill': '新增技能',
    'Add marketplace': '新增市集',
    'Add repository': '新增儲存庫',
    'Discover plugins': '探索外掛',
    'Most installed plugins': '最多人安裝的外掛',
    'Most installed skills': '最多人安裝的技能',
    'New plugins': '新的外掛',
    'New skills': '新的技能',
    'Search skills and plugins': '搜尋技能與外掛',
    'Your marketplaces': '你的市集',
    'No personal marketplaces yet.': '還沒有個人市集。',
    'No plugins added to this project yet.': '這個專案還沒有加入外掛。',
    'Add your first plugins': '加入第一個外掛',
    'Changes apply to new threads.': '變更只會套用到新的討論串。',
    'Plugins Claude can use in this project. They load into each new thread.': 'Claude 在這個專案可以使用的外掛。每一條新討論串都會載入。',
    'Give Claude role-level expertise with plugins. Add them from Discover, or create your own.': '用外掛讓 Claude 具備特定角色的專業能力。可以從「探索」加入，也可以自己做一個。',
    'Add a Git repository of plugins. Marketplaces you add here are personal. Enabled plugins load in your own threads in this and every project.': '加入一個放著外掛的 Git 儲存庫。在這裡加入的市集屬於你個人。啟用的外掛會載入你在本專案以及所有專案的討論串。',


    /* ---- 連接器與外掛的說明文案（v3.16.0，Harry 指定要翻）。
         這是各家廠商自己填的簡介，他們改一個字條目就失效。只收目錄上實際看過的。 ---- */
    'Accelerate design workflows — critique, design system management, UX writing, accessibility audits, research synthesis, and dev handoff. From exploration to pixel-perfect specs.': '加速設計流程——設計評論、設計系統管理、UX 文案、無障礙稽核、研究整合與交付開發。從發想到精準到像素的規格。',
    'Access and create new content on Miro boards': '在 Miro 白板上讀取與建立內容',
    'Access ICD-10-CM and ICD-10-PCS code sets': '查詢 ICD-10-CM 與 ICD-10-PCS 代碼集',
    'Access the CMS Coverage Database': '查詢 CMS 給付資料庫',
    'Access US National Provider Identifier (NPI) Registry': '查詢美國全國醫療提供者識別碼（NPI）登錄庫',
    'Access Vanguard models data and content from Claude': '在 Claude 裡取用 Vanguard 的模型資料與內容',
    'Access your company’s SharePoint, OneDrive, Outlook, and Teams directly in Claude': '在 Claude 裡直接存取公司的 SharePoint、OneDrive、Outlook 與 Teams',
    'Analyze, debug, and manage projects and deployments': '分析、除錯並管理專案與部署',
    'Analyze, summarize, and explore your Strava data': '分析、摘要並探索你的 Strava 資料',
    'Automate workflows across thousands of apps via conversation': '用對話把上千種應用程式的工作流程自動化',
    'Build animated slides and motion graphics with HTML': '用 HTML 做動畫投影片與動態圖像',
    'Build, analyze, and compare portfolios for advisors': '為理財顧問建立、分析並比較投資組合',
    'Build, manage, and analyze your Shopify store': '建立、管理並分析你的 Shopify 商店',
    'Business Finances made simple': '把企業財務變簡單',
    'Client, portfolio, and performance data for advisors': '給理財顧問的客戶、投資組合與績效資料',
    'Connect Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads + 320 more': '連接 Meta Ads、Google Ads、TikTok Ads、LinkedIn Ads 等 320 種以上服務',
    'Connect to Asana to coordinate tasks, projects, and goals': '連接 Asana，統整任務、專案與目標',
    'Connect your Notion workspace to search, update, and power workflows across tools': '連接你的 Notion 工作區，跨工具搜尋、更新並驅動工作流程',
    'Control your Sonos system': '控制你的 Sonos 音響系統',
    'Create content, plan campaigns, and analyze performance across marketing channels. Maintain brand voice consistency, track competitors, and report on what’s working.': '跨行銷管道製作內容、規劃活動並分析成效。維持品牌口吻一致、追蹤競爭對手，並回報哪些做法有效。',
    'Create presentations, docs, socials, and sites with AI': '用 AI 製作簡報、文件、社群貼文與網站',
    'Create, customize, and manage plugins tailored to your organization’s tools and workflows. Configure MCP servers, adjust plugin behavior, and adapt templates to match how your team works.': '依照組織的工具與流程建立、自訂並管理外掛。設定 MCP 伺服器、調整外掛行為，並把範本改成符合團隊的做法。',
    'CRM context for every answer, insight, and action': '每一則回答、洞察與行動都帶著 CRM 脈絡',
    'Debug and resolve issues using Datadog telemetry': '用 Datadog 的遙測資料除錯並解決問題',
    'Deterministic access to S&P Global data': '以確定性的方式取用 S&P Global 資料',
    'Discover how to get anywhere': '找出去任何地方的方法',
    'Draft replies, summarize threads, & search your inbox': '擬回覆、摘要郵件串，並搜尋收件匣',
    'Draft, review, and research with the tools legal teams use.': '用法務團隊慣用的工具擬稿、審閱與研究。',
    'Find and enrich company and contact data in Claude for prospecting, lead generation, recruiting, and CRM enrichment across 150M+ companies and 800M+ contacts': '在 Claude 裡從 1.5 億家以上公司與 8 億筆以上聯絡人中尋找並補全公司與聯絡人資料，用於開發客戶、名單開發、招募與 CRM 補全',
    'Find prospects. Research accounts. Enrich buyers with verified B2B data. Act on intent signals.': '找出潛在客戶、研究客戶名單、用經過驗證的 B2B 資料補全買方輪廓，並依購買意向訊號採取行動。',
    'Find your next hike': '找到你的下一條步道',
    'Find, enrich, and reach ideal prospects, on Claude': '在 Claude 裡尋找、補全並接觸理想的潛在客戶',
    'Generate diagrams and better code from Figma context': '從 Figma 的內容產出圖表與更好的程式碼',
    'Ideate, create, and deliver with Adobe pro tools': '用 Adobe 專業工具發想、製作並交付',
    'Live financial data. Let Claude do the rest.': '即時金融資料，其餘交給 Claude。',
    'Manage databases, authentication, and storage': '管理資料庫、身分驗證與儲存空間',
    'Manage issues, projects & team workflows in Linear': '在 Linear 管理議題、專案與團隊工作流程',
    'Manage tasks, plan your day, and build up memory of important context about your work. Syncs with your calendar, email, and chat to keep everything organized and on track.': '管理任務、規劃一天，並累積工作上重要脈絡的記憶。會與你的行事曆、電子郵件和聊天同步，讓一切井然有序、如期進行。',
    'Manage your schedule and coordinate meetings effortlessly': '輕鬆管理行程並安排會議',
    'Maryland’s neighborhood development data platform.': '馬里蘭州的社區發展資料平台。',
    'monday.com project management & CRM for projects, tasks, portfolios, boards, workflows, milestones, dependencies, forms, dashboards, cross-project portfolio status, and critical paths.': 'monday.com 的專案管理與 CRM，涵蓋專案、任務、專案組合、看板、工作流程、里程碑、相依關係、表單、儀表板、跨專案的組合狀態與要徑。',
    'Optimize business operations — vendor management, process documentation, change management, capacity planning, and compliance tracking. Keep your organization running efficiently.': '最佳化企業營運——供應商管理、流程文件、變更管理、產能規劃與法遵追蹤。讓組織持續高效運作。',
    'Payment processing and financial infrastructure tools': '金流處理與財務基礎建設工具',
    'PitchBook data, embedded in the way you work.': '把 PitchBook 的資料嵌進你的工作方式。',
    'Query, chart and explain your data — SQL, spreadsheets and dashboards in one place.': '查詢資料、畫成圖表並加以解釋——SQL、試算表與儀表板集中在一處。',
    'Read, annotate, and interact with PDF files — interactive viewer with search, navigation, annotations, form filling, and text extraction': '閱讀 PDF、加註解並操作內容——互動式檢視器，支援搜尋、導覽、註解、填表與文字擷取',
    'Research and create for YouTube, Instagram & TikTok': '為 YouTube、Instagram 與 TikTok 做研究與創作',
    'Research U.S. law in Claude—with citations you can open and verify.': '在 Claude 裡研究美國法律，附上可開啟查證的出處。',
    'Search biomedical literature from PubMed': '搜尋 PubMed 的生物醫學文獻',
    'Search literature, plan experiments, and analyze results.': '搜尋文獻、規劃實驗並分析結果。',
    'Search trusted Microsoft docs to power your development': '搜尋可信的 Microsoft 文件輔助開發',
    'Search, create, autofill, and export Canva designs': '搜尋、建立、自動填入並匯出 Canva 設計',
    'Search, organize, and take action on your Dropbox content': '搜尋、整理並處理你的 Dropbox 內容',
    'Search, query, and debug errors intelligently': '聰明地搜尋、查詢並除錯',
    'Search, read and update Jira, Confluence, Bitbucket, Loom and other Atlassian apps with your existing Atlassian permissions.': '用你現有的 Atlassian 權限搜尋、讀取並更新 Jira、Confluence、Bitbucket、Loom 等 Atlassian 應用程式。',
    'Search, read, and upload files instantly': '即時搜尋、讀取並上傳檔案',
    'Sell, serve, and operate at scale with Salesforce.': '用 Salesforce 大規模銷售、服務與營運。',
    'Send messages, create canvases, and fetch Slack data': '傳送訊息、建立畫布並取得 Slack 資料',
    'Sketch, diagram, and iterate with your creative tools.': '用你的創意工具打草稿、畫圖並反覆修改。',
    'Speed up contract review, NDA triage, and compliance workflows for in-house legal teams. Draft legal briefs, organize precedent research, and manage institutional knowledge.': '加快企業法務團隊的合約審閱、NDA 分流與法遵流程。擬法律摘要、整理判例研究並管理機構知識。',
    'Streamline engineering workflows — standups, code review, architecture decisions, incident response, and technical documentation. Works with your existing tools or standalone.': '精簡工程流程——站立會議、程式碼審查、架構決策、事故應變與技術文件。可搭配你現有的工具，也可單獨使用。',
    'Streamline finance and accounting workflows, from journal entries and reconciliation to financial statements and variance analysis. Speed up audit prep, month-end close, and keeping your books clean.': '精簡財會流程，從分錄與對帳到財務報表與差異分析。加快查核準備、月結與帳務整理。',
    'Trade, invest, analyze, and manage global markets': '在全球市場交易、投資、分析與管理',
    'View, annotate, and sign PDFs in a live interactive viewer. Mark up contracts, fill forms with visual feedback, stamp approvals, and place signatures — then download the annotated copy.': '在即時互動檢視器裡閱讀、註解並簽署 PDF。標註合約、邊填表邊看結果、蓋核准章、簽名，然後下載加註後的檔案。',
    'Write feature specs, plan roadmaps, and synthesize user research faster. Keep stakeholders updated and stay ahead of the competitive landscape.': '更快寫出功能規格、規劃藍圖並整合使用者研究。隨時讓利害關係人掌握進度，並保持競爭優勢。',
    /* ---- 目錄分類（v3.15.0）。單字風險見 README：使用者的專案剛好同名時會被改到。 ---- */
    'Commerce and shopping': '電子商務與購物',
    'Communication': '通訊',
    'Community': '社群',
    'Contacts & leads': '聯絡人與潛在客戶',
    'Data': '資料',
    'Databases': '資料庫',
    'Education': '教育',
    'Engineering': '工程',
    'Files & documents': '檔案與文件',
    'Finance': '財務',
    'Financial services': '金融服務',
    'General': '一般',
    'Health': '健康',
    'Legal': '法務',
    'Life sciences': '生命科學',
    'Marketing': '行銷',
    'Media and entertainment': '媒體與娛樂',
    'Nonprofit': '非營利',
    'Operations': '營運',
    'Pipelines & jobs': '管線與工作',
    'Product Management': '產品管理',
    'Productivity': '生產力',
    'Sales': '銷售',
    'Sales and marketing': '銷售與行銷',
    'Tickets & tasks': '票務與任務',
    'Travel': '旅遊',

    /* ---- 專案與討論串介面（v3.15.0）---- */
    'Activity panel': '活動面板',
    'Session activity panel': '工作階段活動面板',
    'Archived': '已封存',
    'Unread': '未讀',
    'Mark as read': '標示為已讀',
    'Mark as unread': '標示為未讀',
    'Move to': '移動到',
    'Move to group': '移動到群組',
    'New group…': '新增群組…',
    'Customize sections': '自訂區塊',
    'Edit sidebar…': '編輯側邊欄…',
    'Show sidebar': '顯示側邊欄',
    'Pin project': '釘選專案',
    'Add to project': '加入專案',
    'In this project': '在這個專案裡',
    'Instructions': '指示',
    'Memory': '記憶',
    'View memory': '查看記憶',
    'Files': '檔案',
    'Message': '訊息',
    'Open thread': '開啟討論串',
    'Copy session ID': '複製工作階段 ID',
    'Open as quick task': '以快速任務開啟',
    'Bulk actions for older sessions': '較舊工作階段的批次操作',
    'Load earlier messages': '載入較早的訊息',
    'Not running': '未執行',
    'yesterday': '昨天',
    'now': '剛剛',
    'File view mode': '檔案檢視模式',
    'Resize file viewer': '調整檔案檢視器大小',
    'Image preview': '圖片預覽',
    'Attached image': '附加的圖片',
    'Read aloud': '朗讀',
    'Link copied to clipboard.': '已複製連結到剪貼簿。',
    'Currently streaming message': '正在串流的訊息',
    'Claude is booting up': 'Claude 正在啟動',
    'Claude is responding': 'Claude 正在回覆',
    'Claude is AI and can make mistakes.': 'Claude 是 AI，可能會出錯。',
    'Use the up and down arrow keys to move between messages.': '用上下方向鍵在訊息之間移動。',
    'Sent to one thread': '已送到一條討論串',
    'Set up manually': '手動設定',
    'Set up this project from my recent work': '用我最近的工作設定這個專案',
    'Let Claude coordinate this project': '讓 Claude 協調這個專案',
    'Cowork setup': 'Cowork 設定',
    'Get started': '開始使用',
    'Create with Claude': '用 Claude 創作',
    'Help me set up my code connection': '協助我設定程式碼連線',
    'Cloud environment': '雲端環境',
    'cloud environment': '雲端環境',
    'In-chat UI': '交談內介面',
    'Tell Claude what to change or remove': '告訴 Claude 要改什麼或移除什麼',
    'Claude breaks work into threads, gets them done, and reports back as it goes.': 'Claude 會把工作拆成討論串各自完成，過程中隨時回報。',
    'Threads to look at in the Overview': '總覽裡值得看一下的討論串',
    /* 活動面板上固定的工具狀態字。旁邊那句一句一樣的說明是 Claude 當下生成的，
       每次都不同，字典收不到，見 未採用字串.md。 */
    'Running a command': '執行指令中',
    'Adding repository': '新增儲存庫中',
    'Posting a message': '張貼訊息中',
    'Editing a file': '編輯檔案中',
    'Creating a file': '建立檔案中',
    /* 下面五個同時列在 attrOnly：只有 aria-label / title 會翻，畫面文字不碰 */
    'Date': '日期',
    'State': '狀態',
    'Medium': '中',
    'None': '無',
    'Updated': '已更新'
      },

      patterns: [
    /* 用 ` — ` 串起來的複合 aria-label：Thread — View thread — Idle、
       Open thread — 3 replies — New messages。每一段都查得到才翻，
       有一段查不到就整串不動，免得拼出半中半英。 */
    [/^[^—]+(?: — [^—]+)+$/, (m) => {
      const parts = m[0].split(' — ');
      const out = [];
      for (const part of parts) {
        const t = translateString(part, true);
        if (!t) return null;
        out.push(t);
      }
      return out.join(' — ');
    }],

    /* 連接器目錄與外掛市集 */
    [/^Connect (.+) to Claude$/, (m) => '將 ' + m[1] + ' 連接到 Claude'],
    [/^(.+) is connected$/, (m) => m[1] + ' 已連接'],
    [/^([\d,]+) installs across all of Claude$/, (m) => '全 Claude 共 ' + m[1] + ' 次安裝'],
    [/^([\d.]+[KMB]) installs$/, (m) => m[1] + ' 次安裝'],
    [/^Show all (\d+)$/, (m) => '顯示全部 ' + m[1] + ' 個'],
    /* 「<分類>, 43 items」與「Show all: <區塊>」：前半查得到字典才翻 */
    [/^(.+), (\d+) items?$/, (m) => {
      const t = known(m[1]);
      return t ? t + '，' + m[2] + ' 個項目' : null;
    }],
    [/^Show all: (.+)$/, (m) => {
      const t = known(m[1]);
      return t ? '顯示全部：' + t : null;
    }],

    /* 訊息與活動面板 */
    [/^Message (\d+) of (\d+)$/, (m) => '第 ' + m[1] + ' 則訊息，共 ' + m[2] + ' 則'],
    [/^(\d+) repl(?:y|ies)$/, (m) => m[1] + ' 則回覆'],
    [/^Web search: (\d+) searches?$/, (m) => '網頁搜尋：' + m[1] + ' 次'],
    [/^Web search: (\d+) searches?, (\d+) sites? read$/,
      (m) => '網頁搜尋：' + m[1] + ' 次，讀取 ' + m[2] + ' 個網站'],
    [/^Memory: (Read|Updated) · (.+)$/,
      (m) => '記憶：' + (m[1] === 'Read' ? '讀取' : '已更新') + ' · ' + m[2]],
    [/^(Read|Updated) · (.+)$/,
      (m) => (m[1] === 'Read' ? '讀取' : '已更新') + ' · ' + m[2]],
    /* 後面接的是檔名，原樣帶過去 */
    [/^Uploads: (.+)$/, (m) => '上傳：' + m[1]],
    [/^Zoom image: (.+)$/, (m) => '放大圖片：' + (known(m[1]) || m[1])],
    [/^Open (.+\.(?:md|txt|json|js|html|css|png|jpe?g|gif|svg|pdf))$/i, (m) => '開啟 ' + m[1]],
    /* 活動面板的「Reading <檔名>」。限定副檔名，免得把「Reading list」這種名字改掉。 */
    [/^Reading (.+\.(?:md|txt|json|js|ts|html|css|csv|png|jpe?g|gif|svg|pdf))$/i, (m) => '讀取 ' + m[1] + ' 中'],

    /* 用量的 5 小時上限 */
    [/^(\d+)% of 5-hour limit used\.$/, (m) => '已使用 5 小時上限的 ' + m[1] + '%。'],
    [/^Usage: (\d+)% of 5-hour limit, Compacts automatically$/,
      (m) => '用量：5 小時上限的 ' + m[1] + '%，自動壓縮', true],

    /* 「Add / View <已知介面字>」。查得到字典才翻，查不到（連接器名、使用者專案名）就不動。 */
    [/^Add (.+)$/, (m) => { const t = known(m[1]); return t ? joinZh('新增', t) : null; }],
    [/^View (.+)$/, (m) => { const t = known(m[1]); return t ? joinZh('查看', t) : null; }],
    [/^Show (.+)$/, (m) => { const t = known(m[1]); return t ? joinZh('顯示', t) : null; }],
    [/^Remove (.+)$/, (m) => { const t = known(m[1]); return t ? joinZh('移除', t) : null; }],

    /* 總覽的討論串計數 */
    [/^(\d+) still open$/, (m) => m[1] + ' 條仍未結'],
    [/^(\d+) completed$/, (m) => m[1] + ' 條已完成'],
    [/^(\d+) needs? attention$/, (m) => m[1] + ' 條需要處理'],

    /* 附件上的移除鈕，括號裡是檔名。只在屬性裡翻，免得改到畫面上的檔名。
       排在上面那條查表版後面，查不到字典時才輪到它。 */
    [/^Remove (.+)$/, (m) => '移除 ' + m[1], true],

    /* 分頁標題「<介面字> - Claude」。前半查得到字典才翻；查不到就整串不動，
       因為那八成是使用者自己的交談或專案名稱。 */
    [/^(.+) - Claude$/, (m) => {
      const t = LOOKUP.get(normalize(m[1]));
      return t ? t + ' - Claude' : null;
    }],

    /* 用量面板。長的要排在短的前面，patterns 是由上往下比對。 */
    [/^Resets (Sun|Mon|Tue|Wed|Thu|Fri|Sat) (\d{1,2}:\d{2})\s*(AM|PM) · Compacts automatically$/,
      (m) => WEEKDAY_ZH[m[1]] + ' ' + clockZh(m[2], m[3]) + ' 重設 · 自動壓縮'],
    [/^Resets (Sun|Mon|Tue|Wed|Thu|Fri|Sat) (\d{1,2}:\d{2})\s*(AM|PM)$/,
      (m) => WEEKDAY_ZH[m[1]] + ' ' + clockZh(m[2], m[3]) + ' 重設'],
    [/^Weekly · all models: (\d+)%$/, (m) => '每週 · 所有模型：' + m[1] + '%'],
    [/^(\d+)% of Weekly · all models used\.$/, (m) => '已使用每週 · 所有模型的 ' + m[1] + '%。'],
    [/^(\d+)-hour limit$/, (m) => m[1] + ' 小時上限'],

    /* 排程任務的執行時間 */
    [/^Every (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) at (\d{1,2}:\d{2})\s*(AM|PM)$/,
      (m) => '每' + WEEKDAY_ZH[m[1]] + ' ' + clockZh(m[2], m[3])],
    [/^Weekdays at (\d{1,2}:\d{2})\s*(AM|PM)$/, (m) => '平日 ' + clockZh(m[1], m[2])],
    [/^Every day at (\d{1,2}:\d{2})\s*(AM|PM)$/, (m) => '每天 ' + clockZh(m[1], m[2])],
    [/^in (\d+) min$/i, (m) => m[1] + ' 分鐘後'],
    [/^in (\d+) hr$/i, (m) => m[1] + ' 小時後'],

    /* 逗號後面是使用者自己的名字，原樣帶過去 */
    [/^(Morning|Afternoon|Evening|Night), (.+)$/,
      (m) => ({ Morning: '早安', Afternoon: '午安', Evening: '晚安', Night: '晚安' })[m[1]] + '，' + m[2]],
    /* 表情符號名稱維持英文（就是上面那些 shortcode） */
    [/^Claude reacted with (.+)$/, (m) => 'Claude 用 ' + m[1] + ' 回應'],

    /* 側邊欄用量的 aria-label。百分比與重設時間會變動，所以用規則；
       時間本身照原樣帶入，不翻（日期時間一律不動）。 */
    [/^Usage: Weekly · all models: (\d+)%, Resets (Sun|Mon|Tue|Wed|Thu|Fri|Sat) (\d{1,2}:\d{2})\s*(AM|PM), Compacts automatically$/,
      (m) => '用量：每週 · 所有模型：' + m[1] + '%，' + WEEKDAY_ZH[m[2]] + ' ' + clockZh(m[3], m[4]) +
             ' 重設，自動壓縮', true],
    /* 重設時間格式不同時的後備，時間照原樣帶入 */
    [/^Usage: Weekly · all models: (\d+)%, Resets (.+), Compacts automatically$/,
      (m) => '用量：每週 · 所有模型：' + m[1] + '%，' + m[2] + ' 重設，自動壓縮', true],
    [/^(\d+)\s+minutes?\s+ago$/i, (m) => m[1] + ' 分鐘前'],
    [/^(\d+)\s+hours?\s+ago$/i, (m) => m[1] + ' 小時前'],
    [/^(\d+)\s+days?\s+ago$/i, (m) => m[1] + ' 天前'],
    [/^(\d+)\s+weeks?\s+ago$/i, (m) => m[1] + ' 週前'],
    [/^(\d+)\s+months?\s+ago$/i, (m) => m[1] + ' 個月前'],
    [/^(\d+)\s+years?\s+ago$/i, (m) => m[1] + ' 年前'],
    /* Artifacts 與資料庫清單用的是縮寫相對時間（2h ago、5m ago）。
       上面那組只吃完整寫法，所以這一頁的時間整片都沒翻到。
       每條都有 ^$ 錨點，`2mo ago` 不會被 `m` 那條吃掉。日期本身（Jul 16）維持不動。 */
    [/^(\d+)\s*s\s+ago$/i, (m) => m[1] + ' 秒前'],
    [/^(\d+)\s*mo\s+ago$/i, (m) => m[1] + ' 個月前'],
    [/^(\d+)\s*m\s+ago$/i, (m) => m[1] + ' 分鐘前'],
    [/^(\d+)\s*h\s+ago$/i, (m) => m[1] + ' 小時前'],
    [/^(\d+)\s*d\s+ago$/i, (m) => m[1] + ' 天前'],
    [/^(\d+)\s*w\s+ago$/i, (m) => m[1] + ' 週前'],
    [/^(\d+)\s*y\s+ago$/i, (m) => m[1] + ' 年前'],
    [/^Last\s+(\d+)\s+days$/i, (m) => '過去 ' + m[1] + ' 天'],
    [/^(\d+)\s+messages?\s+(?:left|remaining)$/i, (m) => '剩餘 ' + m[1] + ' 則訊息'],
    [/^(\d+)\s+files?$/i, (m) => m[1] + ' 個檔案'],
    [/^(\d+)\s+items?$/i, (m) => m[1] + ' 個項目'],
    [/^(\d+)\s+chats?$/i, (m) => m[1] + ' 個交談'],
    [/^(\d+)\s+projects?$/i, (m) => m[1] + ' 個專案'],
    [/^(\d+)\s+sources?$/i, (m) => m[1] + ' 個來源'],
    [/^(\d+)\s+results?$/i, (m) => m[1] + ' 筆結果'],
    [/^Version\s+(\d+)$/i, (m) => '版本 ' + m[1]],
    [/^Showing\s+(\d+)\s+of\s+(\d+)$/i, (m) => '顯示 ' + m[1] + ' / ' + m[2]],
        /* ---- Projects 介面的數字與組合字串 ---- */
        [/^(\d+)\s+repl(?:y|ies)$/i, (m) => m[1] + ' 則回覆'],
        [/^Open thread — (\d+)\s+repl(?:y|ies)$/i, (m) => '開啟討論串 — ' + m[1] + ' 則回覆'],
        [/^(\d+)\s+artifacts?$/i, (m) => m[1] + ' 個作品'],
        [/^(\d+)\s+outputs?$/i, (m) => m[1] + ' 項輸出'],
        [/^(\d+)\s+more\s+outputs?$/i, (m) => '還有 ' + m[1] + ' 項輸出'],
        [/^(\d+)\s+more\s+outputs?\s+in\s+this\s+session$/i, (m) => '此工作階段還有 ' + m[1] + ' 項輸出'],
        [/^(\d+)\s+more\s+outputs?\s+—\s+press Tab until focus enters the card, Escape to return\.$/i,
          (m) => '還有 ' + m[1] + ' 項輸出 — 按 Tab 直到焦點進入卡片，按 Escape 返回。'],
        [/^(\d+)\s+searches?$/i, (m) => m[1] + ' 次搜尋'],
        [/^(\d+)\s+threads?\s+(?:is|are)\s+waiting on you\.$/i, (m) => '有 ' + m[1] + ' 個討論串正在等待你處理。'],
        [/^(\d+)\s+threads?\s+waiting on you$/i, (m) => m[1] + ' 個討論串等待你處理'],
        [/^(\d+)%\s+of\s+(\d+)-hour limit$/i, (m) => m[2] + ' 小時上限的 ' + m[1] + '%'],
        [/^(\d+)\s+of\s+([\d,]+)\s+files$/i, (m) => m[1] + ' / ' + m[2] + ' 個檔案'],
        [/^Selected (\d+) repositor(?:y|ies)\.$/i, (m) => '已選取 ' + m[1] + ' 個儲存庫。'],
        [/^Filter by type: (.+)$/, (m) => '依類型篩選：' + (translateString(m[1], true) || m[1])],
        [/^Default \((.+)\)$/, (m) => '預設（' + (translateString(m[1], true) || m[1]) + '）'],
        [/^Up to \$([\d,]+) of initial usage$/i, (m) => '最多 $' + m[1] + ' 的初始用量'],
        /* 第三個元素 true 代表「只在屬性裡套用」——這條太寬鬆，
           畫面上剛好叫「something icon」的檔案不該被改掉。 */
        [/^(.+) icon$/, (m) => m[1] + ' 圖示', true],
        /* aria-label 專用：畫面上叫「Actions for 某某」的文字節點不該被動到 */
        [/^Actions for (.+)$/, (m) => m[1] + ' 的操作', true],
        [/^Connectors: (.+)$/, (m) => '連接器：' + m[1]],
        [/^Added (.+) to this thread$/, (m) => '已新增 ' + m[1] + ' 至此討論串'],
        [/^Daily at (.+)$/, (m) => '每天 ' + m[1]],
        [/^Sort by: (.+)$/, (m) => '排序：' + (translateString(m[1], true) || m[1])],
        [/^Good (morning|afternoon|evening), (.+)$/,
          (m) => ({ morning: '早安', afternoon: '午安', evening: '晚安' })[m[1].toLowerCase()] + '，' + m[2]],
        /* 後面接的是使用者的檔名或討論串名，照原樣帶入不翻 */
        [/^Download (.+)$/, (m) => '下載 ' + m[1]],
        [/^More options for (.+)$/, (m) => m[1] + ' 的更多選項', true],
        [/^Effort: (.+)$/, (m) => '投入程度：' + (translateString(m[1], true) || m[1])],
        [/^Model: (.+)$/, (m) => '模型：' + m[1]],
        [/^Resize (\d+) and (\d+)$/, (m) => '調整 ' + m[1] + ' 與 ' + m[2] + ' 的大小'],
        /* 側邊欄常駐的用量列。百分比、時數、剩餘時間全部照原樣帶入 */
        [/^Usage: (\d+)% of (\d+)-hour limit, Resets in (.+), Compacts automatically$/,
          (m) => '用量：' + m[2] + ' 小時上限的 ' + m[1] + '%，' +
                 (translateString(m[3], true) || m[3]) + '後重設，自動壓縮'],
        [/^Resets in (.+)$/, (m) => (translateString(m[1], true) || m[1]) + '後重設'],
        [/^(\d+)\s+hrs?\s+(\d+)\s+min$/i, (m) => m[1] + ' 小時 ' + m[2] + ' 分'],
        [/^(\d+)\s+min$/i, (m) => m[1] + ' 分']
      ]
    },

    {
      id: 'github',
      label: 'github.com',
      match: /(^|\.)github\.com$/,

      /* 額外保護區：GitHub 頁面上大半都是使用者資料，這裡要保守。
         程式碼、diff、議題與留言內文、檔名、分支名、commit 訊息、
         儲存庫名稱與說明、使用者名稱，一律不碰。 */
      protect: [
        '.markdown-body', '.comment-body', '.js-comment-body',
        '.blob-code', '.blob-num', '.react-code-text', '.react-code-lines',
        '.highlight', '.CodeMirror', '.cm-editor', '.diff-table',
        '.js-issue-title', '[data-testid="issue-title"]',
        'bdi',
        '.js-navigation-open', '.react-directory-filename-column',
        '.react-directory-truncate', '.js-path-segment', '.final-path',
        '[data-testid="commit-row-item"]', '.commit-message', '.markdown-title',
        '.branch-name', '[data-testid="branch-name"]', '.css-truncate-target',
        '.user-mention', '.author', '.commit-author', '.opened-by',
        '[itemprop="name"]', '[itemprop="description"]',
        '.topic-tag', '#readme', '.repo-list',
        '.IssueLabel', '.gist-content'
      ],

      dict: {
    /* ---- 全站導覽 ---- */
    'Search or jump to…': '搜尋或跳至…',
    'Search or jump to...': '搜尋或跳至…',
    'Type / to search': '按 / 開始搜尋',
    'Dashboard': '儀表板',
    'Pull requests': '合併請求',
    'Pull Requests': '合併請求',
    'Issues': '議題',
    'Marketplace': '市集',
    'Explore': '探索',
    'Notifications': '通知',
    'Your profile': '你的個人檔案',
    'Your repositories': '你的儲存庫',
    'Your organizations': '你的組織',
    'Your enterprises': '你的企業',
    'Your projects': '你的專案',
    'Your stars': '你加星號的項目',
    'Your gists': '你的 Gist',
    'Your sponsors': '你的贊助者',
    'Upgrade': '升級',
    'Feature preview': '功能預覽',
    'Try Enterprise': '試用 Enterprise',
    'Sign out': '登出',
    'Sign in': '登入',
    'Sign up': '註冊',
    'Open global navigation menu': '開啟全域導覽選單',
    'Homepage': '首頁',
    'Skip to content': '跳到主要內容',
    'Recent': '最近',
    'Repositories': '儲存庫',
    'Organizations': '組織',
    'Teams': '團隊',
    'Top repositories': '常用儲存庫',
    'Find a repository…': '尋找儲存庫…',
    'Show more': '顯示更多',

    /* ---- 儲存庫分頁 ---- */
    'Code': '程式碼',
    'Actions': 'Actions',
    'Wiki': 'Wiki',
    'Security': '安全性',
    'Insights': '洞察',
    'Discussions': '討論',
    'Pulse': '動態摘要',
    'Contributors': '貢獻者',
    'Community': '社群',
    'Traffic': '流量',
    'Commits': 'Commits',
    'Code frequency': '程式碼頻率',
    'Dependency graph': '相依關係圖',
    'Network': '網路圖',
    'Forks': 'Fork',

    /* ---- 儲存庫首頁 ---- */
    'About': '關於',
    'Watch': '關注',
    'Unwatch': '取消關注',
    'Star': '加星號',
    'Starred': '已加星號',
    'Unstar': '取消星號',
    'Fork': 'Fork',
    'Sponsor': '贊助',
    'Use this template': '使用這個範本',
    'Go to file': '前往檔案',
    'Add file': '新增檔案',
    'Create new file': '建立新檔案',
    'Upload files': '上傳檔案',
    'Download ZIP': '下載 ZIP',
    'Open with GitHub Desktop': '用 GitHub Desktop 開啟',
    'Clone': 'Clone',
    'Local': '本機',
    'Codespaces': 'Codespaces',
    'Latest commit': '最新 commit',
    'History': '歷史紀錄',
    'Branches': '分支',
    'Tags': '標籤',
    'Switch branches or tags': '切換分支或標籤',
    'Find or create a branch…': '尋找或建立分支…',
    'Branch': '分支',
    'Releases': '發行版本',
    'Packages': '套件',
    'Environments': '環境',
    'Deployments': '部署',
    'Languages': '語言',
    'Activity': '動態',
    'Stars': '星號',
    'Watchers': '關注者',
    'License': '授權條款',
    'Readme': 'Readme',
    'Code of conduct': '行為準則',
    'Security policy': '安全性政策',
    'Citation': '引用資訊',
    'No description, website, or topics provided.': '未提供說明、網站或主題。',
    'Edit repository details': '編輯儲存庫詳細資料',
    'Add topics': '新增主題',
    'No releases published': '尚未發布任何版本',
    'No packages published': '尚未發布任何套件',
    'Create a new release': '建立新的發行版本',
    'This repository is empty.': '這個儲存庫是空的。',
    'Quick setup': '快速設定',

    /* ---- 檔案檢視 ---- */
    'Raw': 'Raw',
    'Blame': 'Blame',
    'Preview': '預覽',
    'Edit this file': '編輯這個檔案',
    'Delete this file': '刪除這個檔案',
    'Copy raw file': '複製原始檔案',
    'Download raw file': '下載原始檔案',
    'Open in github.dev': '在 github.dev 開啟',
    'Top': '頂端',
    'Outline': '大綱',
    'Symbols': '符號',
    'Commit changes': '提交變更',
    'Commit directly to the': '直接提交到',
    'Create a new branch for this commit and start a pull request': '為這次提交建立新分支並發起合併請求',
    'Commit message': 'Commit 訊息',
    'Extended description': '詳細說明',
    'Cancel changes': '取消變更',

    /* ---- 議題與合併請求 ---- */
    'New issue': '新增議題',
    'New pull request': '新增合併請求',
    'Open': '開啟中',
    'Closed': '已關閉',
    'Merged': '已合併',
    'Draft': '草稿',
    'Labels': '標籤',
    'Milestones': '里程碑',
    'Assignees': '指派對象',
    'Assignee': '指派對象',
    'Reviewers': '審查者',
    'Development': '開發',
    'Participants': '參與者',
    'Subscribe': '訂閱',
    'Unsubscribe': '取消訂閱',
    'Lock conversation': '鎖定討論',
    'Unlock conversation': '解除鎖定討論',
    'Pin issue': '釘選議題',
    'Transfer issue': '移轉議題',
    'Delete issue': '刪除議題',
    'Author': '作者',
    'Newest': '最新',
    'Oldest': '最舊',
    'Most commented': '留言最多',
    'Least commented': '留言最少',
    'Recently updated': '最近更新',
    'Least recently updated': '最久未更新',
    'Filters': '篩選',
    'Sort': '排序',
    'Clear current search query, filters, and sorts': '清除目前的搜尋、篩選與排序',
    'Leave a comment': '留下留言',
    'Comment': '留言',
    'Write': '撰寫',
    'Close issue': '關閉議題',
    'Close with comment': '留言並關閉',
    'Comment and close': '留言並關閉',
    'Reopen issue': '重新開啟議題',
    'Quote reply': '引用回覆',
    'Copy link': '複製連結',
    'Reference in new issue': '在新議題中引用',
    'Report content': '檢舉內容',
    'Edit comment': '編輯留言',
    'Delete comment': '刪除留言',
    'Hide': '隱藏',
    'Unhide': '取消隱藏',
    'Resolve conversation': '標記討論已解決',
    'Unresolve conversation': '取消已解決標記',
    'Show resolved': '顯示已解決',
    'Hide resolved': '隱藏已解決',
    'Outdated': '已過時',
    'Load more…': '載入更多…',
    'Conversation': '討論',
    'Checks': '檢查',
    'Files changed': '變更的檔案',
    'Review changes': '審查變更',
    'Approve': '核准',
    'Request changes': '要求修改',
    'Submit review': '送出審查',
    'Start a review': '開始審查',
    'Add single comment': '新增單一留言',
    'Add review comment': '新增審查留言',
    'Viewed': '已檢視',
    'Merge pull request': '合併此合併請求',
    'Squash and merge': 'Squash 後合併',
    'Rebase and merge': 'Rebase 後合併',
    'Create a merge commit': '建立合併 commit',
    'Confirm merge': '確認合併',
    'Confirm squash and merge': '確認 Squash 後合併',
    'Delete branch': '刪除分支',
    'Restore branch': '還原分支',
    'Resolve conflicts': '解決衝突',
    'Compare': '比較',
    'Compare & pull request': '比較並建立合併請求',
    'Able to merge.': '可以合併。',
    'This branch has no conflicts with the base branch': '這個分支與基底分支沒有衝突',
    'All checks have passed': '所有檢查都已通過',
    'Some checks were not successful': '部分檢查未通過',
    'All checks have failed': '所有檢查都失敗',
    'Changes requested': '已要求修改',
    'Approved': '已核准',
    'Review required': '需要審查',
    'Changes approved': '變更已核准',
    'Add a description': '新增說明',
    'Enable auto-merge': '啟用自動合併',
    'Disable auto-merge': '停用自動合併',
    'Convert to draft': '轉為草稿',
    'Ready for review': '準備好接受審查',
    'Unified': '統一檢視',
    'Split': '分割檢視',
    'Whitespace': '空白字元',
    'Expand all': '全部展開',
    'Collapse all': '全部收合',
    'Jump to': '跳至',
    'Filter changed files': '篩選變更的檔案',

    /* ---- Actions ---- */
    'Workflows': '工作流程',
    'All workflows': '所有工作流程',
    'Caches': '快取',
    'Runners': 'Runner',
    'Re-run jobs': '重新執行工作',
    'Re-run all jobs': '重新執行所有工作',
    'Re-run failed jobs': '重新執行失敗的工作',
    'Cancel workflow': '取消工作流程',
    'Success': '成功',
    'Failure': '失敗',
    'Queued': '排隊中',
    'In progress': '進行中',
    'Waiting': '等待中',
    'Skipped': '已略過',
    'Cancelled': '已取消',
    'Summary': '摘要',
    'Jobs': '工作',
    'Artifacts': 'Artifacts',
    'Usage': '使用量',
    'Search logs': '搜尋紀錄',
    'View workflow file': '檢視工作流程檔案',
    'Triggered via push by': '由 push 觸發，來源：',
    'This workflow has a workflow_dispatch event trigger.': '這個工作流程有 workflow_dispatch 觸發器。',
    'Run workflow': '執行工作流程',

    /* ---- 儲存庫設定 ---- */
    'General': '一般',
    'Collaborators': '協作者',
    'Collaborators and teams': '協作者與團隊',
    'Moderation options': '管理選項',
    'Rules': '規則',
    'Rulesets': '規則集',
    'Webhooks': 'Webhooks',
    'Pages': 'Pages',
    'Secrets and variables': '密鑰與變數',
    'Deploy keys': '部署金鑰',
    'Danger Zone': '危險區域',
    'Change repository visibility': '變更儲存庫可見性',
    'Transfer ownership': '移轉擁有權',
    'Archive this repository': '封存這個儲存庫',
    'Delete this repository': '刪除這個儲存庫',
    'Repository name': '儲存庫名稱',
    'Description': '說明',
    'Website': '網站',
    'Topics': '主題',
    'Public': '公開',
    'Private': '私人',
    'Internal': '內部',
    'Default branch': '預設分支',
    'Features': '功能',
    'Social preview': '社群預覽圖',
    'Include in the home page': '顯示在首頁',

    /* ---- 帳戶設定 ---- */
    'Public profile': '公開個人檔案',
    'Account': '帳戶',
    'Appearance': '外觀',
    'Accessibility': '無障礙',
    'Billing and plans': '帳務與方案',
    'Emails': '電子郵件',
    'Password and authentication': '密碼與驗證',
    'Sessions': '工作階段',
    'SSH and GPG keys': 'SSH 與 GPG 金鑰',
    'Moderation': '管理',
    'Copilot': 'Copilot',
    'Applications': '應用程式',
    'Scheduled reminders': '排程提醒',
    'Developer settings': '開發者設定',
    'Personal access tokens': '個人存取權杖',
    'GitHub Apps': 'GitHub Apps',
    'OAuth Apps': 'OAuth Apps',
    'Installed GitHub Apps': '已安裝的 GitHub Apps',
    'Authorized OAuth Apps': '已授權的 OAuth Apps',
    'Authorized GitHub Apps': '已授權的 GitHub Apps',
    'Configure': '設定',
    'Install': '安裝',
    'Uninstall': '解除安裝',
    'Revoke': '撤銷',
    'Revoke access': '撤銷存取權',
    'Grant': '授權',
    'Repository access': '儲存庫存取權',
    'All repositories': '所有儲存庫',
    'Only select repositories': '僅限選取的儲存庫',
    'Select repositories': '選擇儲存庫',
    'Permissions': '權限',
    'Read': '讀取',
    'Read and write': '讀寫',
    'No access': '無存取權',
    'Theme preferences': '主題偏好',
    'Day theme': '日間主題',
    'Night theme': '夜間主題',
    'Sync with system': '跟隨系統',

    /* ---- 建立與通用 ---- */
    'New repository': '新增儲存庫',
    'Create repository': '建立儲存庫',
    'Import repository': '匯入儲存庫',
    'New gist': '新增 Gist',
    'New organization': '新增組織',
    'New project': '新增專案',
    'New codespace': '新增 Codespace',
    'Owner': '擁有者',
    'Repository template': '儲存庫範本',
    'Add a README file': '新增 README 檔案',
    'Add .gitignore': '新增 .gitignore',
    'Choose a license': '選擇授權條款',
    'Initialize this repository with:': '以下列項目初始化這個儲存庫：',
    'Create public gist': '建立公開 Gist',
    'Create secret gist': '建立私密 Gist',
    'Gist description…': 'Gist 說明…',
    'Filename including extension…': '檔名（含副檔名）…',
    'Save': '儲存',
    'Save changes': '儲存變更',
    'Cancel': '取消',
    'Delete': '刪除',
    'Edit': '編輯',
    'Copy': '複製',
    'Copied!': '已複製！',
    'Close': '關閉',
    'Submit': '送出',
    'Search': '搜尋',
    'Filter': '篩選',
    'Add': '新增',
    'Remove': '移除',
    'Update': '更新',
    'Create': '建立',
    'Confirm': '確認',
    'Continue': '繼續',
    'Back': '返回',
    'Next': '下一頁',
    'Previous': '上一頁',
    'Done': '完成',
    'Apply': '套用',
    'Reset': '重設',
    'Learn more': '瞭解更多',
    'Dismiss': '關閉',
    'Got it': '知道了',
    'Loading…': '載入中…',
    'No results found': '找不到結果',
    'Nothing to see here': '這裡沒有東西',
    'Yesterday': '昨天',
    'Today': '今天',
    'now': '剛剛',
    'This action cannot be undone.': '此動作無法復原。',

    /* ---- Claude GitHub App 安裝與授權頁 ---- */
    'And more — Power repository selection across code review, admin settings, and other GitHub-backed features.': '還有更多 — 在程式碼審查、管理員設定及其他以 GitHub 為基礎的功能中提供儲存庫選擇。',
    'Authorize': '授權',
    'Check repository status': '檢查儲存庫狀態',
    'Choose a repository to see if cloud sessions have access.': '選擇一個儲存庫，查看雲端工作階段是否有存取權。',
    'Claude Code — Select repositories, browse branches, and track pull requests in remote sessions.': 'Claude Code — 在遠端工作階段中選擇儲存庫、瀏覽分支並追蹤合併請求。',
    'Cloud sessions only': '僅限雲端工作階段',
    'Continue on GitHub': '在 GitHub 上繼續',
    'GitHub account connected': 'GitHub 帳號已連接',
    'Install & Authorize': '安裝並授權',
    'Read access to commit statuses and metadata': '讀取 commit 狀態與中繼資料的權限',
    'Reconnect the Claude GitHub App': '重新連接 Claude GitHub App',
    'The Claude GitHub App needs to be reconnected so Claude can work with your repositories.': '需要重新連接 Claude GitHub App，Claude 才能操作你的儲存庫。',
    'This applies to all current and future repositories owned by the resource owner. Also includes public repositories (read-only).': '這適用於資源擁有者所擁有的所有現有與未來的儲存庫，也包含公開儲存庫（唯讀）。',
    'Select at least one repository. Also includes public repositories (read-only).': '請至少選取一個儲存庫，也包含公開儲存庫（唯讀）。',
    'Read and write access to code, issues, pull requests, workflows': '對程式碼、議題、合併請求與 workflow 的讀寫權限',
    'Read and write access to actions, checks, code, discussions, issues, pull requests, repository hooks, and workflows': '對 Actions、檢查、程式碼、討論、議題、合併請求、儲存庫 Webhook 與 workflow 的讀寫權限'
      },

      patterns: [
        [/^(\d+)\s+commits?$/i, (m) => m[1] + ' 個 commit'],
        [/^(\d+)\s+branch(?:es)?$/i, (m) => m[1] + ' 個分支'],
        [/^(\d+)\s+tags?$/i, (m) => m[1] + ' 個標籤'],
        [/^(\d+)\s+contributors?$/i, (m) => m[1] + ' 位貢獻者'],
        [/^(\d+)\s+repositories$/i, (m) => m[1] + ' 個儲存庫'],
        [/^(\d+)\s+stars?$/i, (m) => m[1] + ' 個星號'],
        [/^(\d+)\s+forks?$/i, (m) => m[1] + ' 個 fork'],
        [/^(\d+)\s+watching$/i, (m) => m[1] + ' 人關注'],
        [/^(\d+)\s+Open$/, (m) => m[1] + ' 個開啟中'],
        [/^(\d+)\s+Closed$/, (m) => m[1] + ' 個已關閉'],
        [/^(\d+)\s+comments?$/i, (m) => m[1] + ' 則留言'],
        [/^(\d+)\s+files?\s+changed$/i, (m) => '變更 ' + m[1] + ' 個檔案'],
        [/^(\d+)\s+commits?\s+ahead$/i, (m) => '超前 ' + m[1] + ' 個 commit'],
        [/^(\d+)\s+commits?\s+behind$/i, (m) => '落後 ' + m[1] + ' 個 commit'],
        [/^Updated\s+(\d+)\s+minutes?\s+ago$/i, (m) => m[1] + ' 分鐘前更新'],
        [/^Updated\s+(\d+)\s+hours?\s+ago$/i, (m) => m[1] + ' 小時前更新'],
        [/^Updated\s+(\d+)\s+days?\s+ago$/i, (m) => m[1] + ' 天前更新'],
        [/^Updated\s+(\d+)\s+weeks?\s+ago$/i, (m) => m[1] + ' 週前更新'],
        [/^Updated\s+(\d+)\s+months?\s+ago$/i, (m) => m[1] + ' 個月前更新'],
        [/^Updated\s+(\d+)\s+years?\s+ago$/i, (m) => m[1] + ' 年前更新'],
        [/^Updated\s+now$/i, () => '剛剛更新'],
        [/^(\d+)\s+minutes?\s+ago$/i, (m) => m[1] + ' 分鐘前'],
        [/^(\d+)\s+hours?\s+ago$/i, (m) => m[1] + ' 小時前'],
        [/^(\d+)\s+days?\s+ago$/i, (m) => m[1] + ' 天前'],
        [/^(\d+)\s+weeks?\s+ago$/i, (m) => m[1] + ' 週前'],
        [/^(\d+)\s+months?\s+ago$/i, (m) => m[1] + ' 個月前'],
        [/^(\d+)\s+years?\s+ago$/i, (m) => m[1] + ' 年前'],
        [/^last\s+week$/i, () => '上週'],
        [/^last\s+month$/i, () => '上個月'],
        [/^last\s+year$/i, () => '去年']
      ]
    }
  ];

  /* 目前這個頁面屬於哪個站台？不認得就什麼都不做。 */
  const site = SITES.find((s) => s.match.test(location.hostname));
  if (!site) return;

  /* 重複安裝保護（v3.8.0）
     @name 帶了版本號，所以每次改版名稱都會變。自動更新是原地覆蓋沒問題，
     但若手動再從 raw 連結裝一次，油猴會當成新腳本、多出一份，兩份同時跑
     會讓 Ctrl + Alt + T 互相抵銷。先跑到的那份留下，後到的直接退出。 */
  if (window.zhTwWebui && window.zhTwWebui.version) {
    console.warn(
      '[zh-tw-webui] 偵測到重複安裝：v' + window.zhTwWebui.version + ' 已經在跑，這一份 v' +
      VERSION + ' 不啟動。請到油猴控制台把多餘的那一份刪掉。'
    );
    return;
  }

  const DICT = site.dict;
  const PATTERNS = site.patterns;
  const PROTECTED_SELECTOR = BASE_PROTECTED.concat(site.protect).join(',');

  /* ------------------------------------------------------------------ *
   * 3. 核心：字串查表
   * ------------------------------------------------------------------ */
  const LOOKUP = new Map();
  for (const key of Object.keys(DICT)) LOOKUP.set(normalize(key), DICT[key]);

  // 只在屬性裡翻譯的泛用單字。大小寫必須完全相符——以前會連小寫一起比對，
  // 結果像 docs、other、size 這種使用者自己取的檔名也會被改掉。
  const ATTR_ONLY = new Set((site.attrOnly || []).map(normalize));

  // 刻意不翻也不回報的字串（產品名、按鍵名…）。只影響盤點與累積，不影響翻譯。
  const NEVER = new Set((site.never || []).map(normalize));

  function normalize(s) {
    return s
      .replace(/ /g, ' ')
      .replace(/…/g, '…')
      .replace(/\.\.\./g, '…')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 至少要有一個英文字母才值得查，純數字或已經是中文的直接跳過。
  // 上限 v3.16.0 從 200 放寬到 400：連接器說明文案最長的一句本文就有 199 字，
  // 文字節點還會帶前後換行與縮排，200 剛好卡住，整句翻不出來。
  function looksTranslatable(s) {
    return s.length > 0 && s.length < 400 && /[A-Za-z]/.test(s) && !/[一-鿿]/.test(s);
  }

  function hasChinese(s) {
    return /[一-鿿]/.test(s);
  }

  /* 判斷「這看起來是資料，不是介面文字」。
     9:55 AM、363.5k、21.3 kB、3m、Jul 11 這些都含有英文字母，
     光看「有沒有字母」會把它們算成漏翻，那正是雜訊的來源。
     診斷與背景累積共用同一套判斷，兩邊結果才會一致。
     注意：這個函式只影響「要不要回報」，不影響翻不翻——翻譯永遠只認字典與規則。

     v3.10.0 依第一份累積清單的實際內容補了幾類（韓文頁尾、網址、email、
     檔名、儲存庫路徑、日期），那些每次瀏覽都會再出現，不濾掉就是固定雜訊。 */
  const DATE_WORDS = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/;

  function looksLikeData(s) {
    const letters = s.replace(/[^A-Za-z]/g, '');
    if (letters.length === 0) return true;             // 純數字、日期、符號
    if (letters.length <= 1) return true;              // 單字元標籤：x、+、v
    if (/\d/.test(s) && letters.length <= 3) return true; // 9:55 AM、363.5k、Jul 11

    // 諺文或假名：不是英文介面，是別的語言的頁尾或內容（例如韓國法人資訊）
    if (/[\uAC00-\uD7AF\u3040-\u30FF]/.test(s)) return true;

    // 表情符號的 shortcode（:smile:、:point_up_2:）。這是識別碼不是介面文字，
    // 翻了搜尋就壞了。一個 emoji 面板一次就吐出上百條，不濾掉整份清單全是它。
    if (/^:[a-z0-9_+-]+:$/i.test(s)) return true;

    // 單獨的月份名稱。日期標籤照既定政策維持英文，不必每次都回報。
    if (/^(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(s)) return true;

    // 星期全名開頭的長日期：Monday, September 21, 2026 at 8:46:55 PM
    // 下面那條 30 字上限吃不到它。
    if (/^(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day,\s/.test(s)) return true;

    // 逗號分隔的檔名清單：1789418499461_image.png, IMG_7981.jpeg
    if (/^\S+\.[A-Za-z0-9]{2,5}(?:,\s*\S+\.[A-Za-z0-9]{2,5})+$/.test(s)) return true;

    // 網址、email
    if (/:\/\//.test(s) || /^www\./i.test(s)) return true;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return true;

    // 整串沒有空白又帶著 . 或 /：檔名、網域、儲存庫路徑（README.md、github.com、owner/repo）
    if (!/\s/.test(s) && /[./]/.test(s)) return true;

    // 短句型的日期：Monday, September 21, 2026／Sun, Sep 27, 5:00 PM
    // 限定 30 字以內，免得把含日期的完整介面句子也濾掉
    if (s.length <= 30 && /\d/.test(s) && DATE_WORDS.test(s)) return true;

    return false;
  }

  /* 複合字串的零件查表：字典有就回譯文；列在 never 的（產品名、縮寫）回原文，
     這樣「APIs, 43 items」才會變成「APIs，43 個項目」而不是整串不翻；
     其餘回 null，代表那是使用者自己的名字，整條規則就放棄。 */
  function known(part) {
    const k = normalize(part);
    const hit = LOOKUP.get(k);
    if (hit) return hit;
    if (NEVER.has(k)) return part;
    return null;
  }

  /* 中文前綴接英文名字時補一個空格：新增 + incident.io → 「新增 incident.io」 */
  function joinZh(prefix, tail) {
    return prefix + (/^[A-Za-z0-9(]/.test(tail) ? ' ' : '') + tail;
  }

  function translateString(raw, isAttr) {
    if (!looksTranslatable(raw)) return null;
    const key = normalize(raw);
    if (!key) return null;
    if (!isAttr && ATTR_ONLY.has(key)) return null;
    const hit = LOOKUP.get(key);
    if (hit) return hit;
    for (const [re, fn, attrOnly] of PATTERNS) {
      if (attrOnly && !isAttr) continue;
      const m = key.match(re);
      if (!m) continue;
      /* 規則命中但回傳 null，代表「這條規則處理不了」（例如前半查不到字典），
         要繼續往下找，不能就此放棄——否則排在前面的寬鬆規則會擋掉後面的。 */
      const out = fn(m);
      if (out) return out;
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   * 3.5 背景累積：把漏翻的字串記在 localStorage，跨頁、跨重開瀏覽器都留著
   *
   * 為什麼要這個：Ctrl + Alt + D 只看得到「你按下去那一刻、那一頁 DOM 裡
   * 真的存在的文字」。沒展開的選單、沒捲到的列表、還沒去過的頁面都抓不到，
   * 所以每按一次結果都不一樣，也沒辦法確認抓齊了沒。
   *
   * 翻譯引擎本來就會在畫面每次變動時走過所有新出現的節點，這裡只是順手把
   * 「該翻但字典和規則都沒對應」的那些記下來。你正常瀏覽就會累積，不用按鍵，
   * 之後按 Ctrl + Alt + E 一次倒出來。
   *
   * 判斷條件跟 diagnose() 完全一樣：保護區的文字不會進來（走訪時就被剪掉了），
   * 泛用單字、看起來是資料的、已經有對應條目的也都排除。
   * 只存在你自己的瀏覽器裡，不會送到任何地方。
   * ------------------------------------------------------------------ */
  const COLLECT_KEY = 'zh-tw-webui-collected-' + site.id;
  const COLLECT_MAX = 3000;   // 上限，避免 localStorage 無限長大
  const collected = new Set();
  let collectFull = false;

  try {
    const saved = JSON.parse(localStorage.getItem(COLLECT_KEY) || '[]');
    if (Array.isArray(saved)) for (const item of saved) {
      if (typeof item === 'string') collected.add(item);
    }
  } catch (e) { /* 無痕模式、或存檔壞了，就從零開始 */ }

  let saveTimer = null;

  function saveCollected() {
    saveTimer = null;
    try {
      localStorage.setItem(COLLECT_KEY, JSON.stringify(Array.from(collected)));
    } catch (e) { /* 容量滿或無痕模式，記在記憶體裡就好 */ }
  }

  function scheduleSave() {
    if (saveTimer !== null) return;
    saveTimer = setTimeout(saveCollected, 2000);   // 合併連續變動，不要每個字串都寫一次
  }

  /* 翻譯流程走到「查不到對應」時呼叫。這裡不再查字典，因為呼叫端已經查過了。 */
  function recordMiss(raw, isAttr) {
    if (collectFull || !raw) return;
    if (!looksTranslatable(raw)) return;          // 太長、純數字、已經是中文
    const key = normalize(raw);
    if (!key || collected.has(key)) return;
    if (looksLikeData(key)) return;
    if (!isAttr && ATTR_ONLY.has(key)) return;    // 泛用單字，畫面上本來就不翻
    if (NEVER.has(key)) return;                   // 產品名、按鍵名，刻意保留英文
    if (collected.size >= COLLECT_MAX) {
      collectFull = true;
      console.warn('[zh-tw-webui] 累積已達上限 ' + COLLECT_MAX + ' 條，先按 Ctrl + Alt + E 匯出。');
      return;
    }
    collected.add(key);
    scheduleSave();
  }

  /* Ctrl + Alt + E：把累積到現在的全部倒出來，複製到剪貼簿，然後清空重新累積。
     清空前一定先印在主控台，萬一剪貼簿失敗還救得回來。 */
  function exportCollected() {
    const list = Array.from(collected).sort((a, b) => a.localeCompare(b));
    const report =
      '# 累積到現在還沒翻到的介面字串（' + list.length + ' 條，已去重複）\n' +
      '# 站台：' + site.label + '　版本：v' + VERSION + '　字典：' + LOOKUP.size + ' 條　規則：' + PATTERNS.length + ' 條\n' +
      '# 範圍：上次匯出之後，你在這個站台瀏覽過的所有畫面\n\n' +
      list.join('\n');

    console.log('%c[zh-tw-webui v' + VERSION + '] 匯出累積清單：' + list.length + ' 條', 'font-weight:bold');
    console.log(report);

    if (list.length === 0) {
      toast('目前沒有累積到漏翻的字串');
      return { missing: [], count: 0 };
    }

    collected.clear();
    collectFull = false;
    if (saveTimer !== null) { clearTimeout(saveTimer); saveTimer = null; }
    saveCollected();

    try {
      navigator.clipboard.writeText(report).then(
        () => toast('已複製 ' + list.length + ' 條並清空，重新開始累積'),
        () => toast('匯出 ' + list.length + ' 條，剪貼簿失敗，請從主控台複製')
      );
    } catch (e) {
      toast('匯出 ' + list.length + ' 條，請從主控台複製');
    }
    return { missing: list, count: list.length };
  }

  // 離開頁面前把還沒寫入的存起來，免得剛看到的幾條掉了
  window.addEventListener('pagehide', () => { if (saveTimer !== null) saveCollected(); });

  /* ------------------------------------------------------------------ *
   * 4. DOM 走訪
   * ------------------------------------------------------------------ */
  const written = new WeakMap(); // 記住我們寫進去的值，避免和框架互相打架

  function isProtected(el) {
    return !el || (el.closest && el.closest(PROTECTED_SELECTOR) !== null);
  }

  function translateTextNode(node) {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    if (written.get(node) === raw) return;
    const parent = node.parentElement;
    if (!parent || isProtected(parent)) return;

    const translated = translateString(raw, false);
    if (!translated) { recordMiss(raw, false); return; }

    // 保留原本的前後空白，避免破版
    const lead = raw.match(/^\s*/)[0];
    const tail = raw.match(/\s*$/)[0];
    const next = lead + translated + tail;
    if (next === raw) return;
    node.nodeValue = next;
    written.set(node, next);
  }

  function translateAttributes(el) {
    for (const attr of ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      const raw = el.getAttribute(attr);
      const translated = translateString(raw, true);
      if (!translated) { recordMiss(raw, true); continue; }
      if (translated !== raw) el.setAttribute(attr, translated);
    }
  }

  function translateSubtree(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE &&
        root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);

    // 屬性：整棵樹都掃。aria-label / title / placeholder 一定是介面字串，
    // 即使在保護區裡也不會是使用者寫的內容。
    if (root.querySelectorAll) {
      for (const attr of ATTRS) {
        const found = root.querySelectorAll('[' + attr + ']');
        for (let i = 0; i < found.length; i++) translateAttributes(found[i]);
      }
    }

    // 文字：走訪時直接把保護區整段剪掉，不進去看。
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return node.matches(PROTECTED_SELECTOR) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const batch = [];
    let n;
    while ((n = walker.nextNode())) batch.push(n);
    for (let i = 0; i < batch.length; i++) translateTextNode(batch[i]);
  }

  /* ------------------------------------------------------------------ *
   * 5. 監看 DOM 變動（兩個站台都是 SPA，內容會一直重繪）
   * ------------------------------------------------------------------ */
  let queued = false;
  const pending = new Set();

  function flush() {
    queued = false;
    const nodes = Array.from(pending);
    pending.clear();
    for (const node of nodes) {
      if (node.isConnected === false) continue;
      try { translateSubtree(node); } catch (e) { /* 單一節點失敗不影響其他 */ }
    }
  }

  function schedule(node) {
    pending.add(node);
    if (queued) return;
    queued = true;
    requestAnimationFrame(flush);
  }

  const observer = new MutationObserver((mutations) => {
    if (!enabled) return;
    for (const m of mutations) {
      if (m.type === 'characterData' || m.type === 'attributes') {
        schedule(m.target);
      } else {
        for (const added of m.addedNodes) schedule(added);
        if (m.target) schedule(m.target);
      }
    }
  });

  /* ------------------------------------------------------------------ *
   * 6. 開關：Ctrl + Alt + T 可暫時關閉翻譯（設定記在 localStorage）
   * ------------------------------------------------------------------ */
  const STORAGE_KEY = 'zh-tw-webui-enabled';
  let enabled = true;
  try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { /* 無痕模式等 */ }

  function toggle() {
    enabled = !enabled;
    try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (enabled) {
      start();
      translateSubtree(document.body || document.documentElement);
    } else {
      observer.disconnect();
      location.reload(); // 關閉時重新載入，還原成原本的英文介面
    }
  }

  /* ------------------------------------------------------------------ *
   * 6.5 診斷：Ctrl + Alt + D 盤點這一頁還有哪些介面字串沒翻到
   *
   * 為什麼需要這個：直接在頁面上抓「所有非中文字串」得到的數字沒有意義，
   * 而且只會愈滾愈大——你自己打的字、Claude 的回覆、程式碼區塊、貼上來的
   * 清單全都算在裡面，那些本來就規定不能翻。交談愈長，那個數字愈大，
   * 跟字典補了多少完全無關。
   *
   * 這個診斷只回報「照規則應該翻、但字典和規則都沒對應」的字串，
   * 其餘分類只給數量，讓那個數字說得出道理。
   * ------------------------------------------------------------------ */
  function diagnose() {
    const missing = new Map();   // 真的漏翻：normalize 後的鍵 -> 字串
    const stats = {
      missing: 0,          // 該翻但字典和規則都沒對應 —— 唯一需要你回報的（含重複出現）
      hasEntry: 0,         // 有對應條目（翻譯開著時幾乎為 0，因為早就變中文了）
      protectedZone: 0,    // 在保護區裡，規定不能翻
      attrOnlySkipped: 0,  // 泛用單字，只在屬性裡翻
      deliberate: 0,       // 產品名、按鍵名，刻意保留英文
      alreadyChinese: 0,   // 已經是中文（多數是翻好的）
      looksLikeData: 0     // 數字、日期、時間、檔案大小、單字元標籤
    };

    function classify(raw, isAttr, inProtected) {
      if (!raw || !raw.trim()) return;
      if (hasChinese(raw)) { stats.alreadyChinese++; return; }
      /* v3.14.1 修正：以前這裡是 looksLikeData(raw)，拿沒正規化的原字串去比對。
         文字節點常帶著前後換行與縮排，`:smile:\n` 過不了 /^:[a-z0-9_+-]+:$/，
         `README.md ` 也過不了「整串沒有空白」那條，於是整批資料型字串都漏進清單。
         recordMiss()（Ctrl + Alt + E）本來就是用 key 比對，所以兩個鍵結果會對不起來。
         先 normalize 再判斷，兩邊就一致了。 */
      const key = normalize(raw);
      if (!key) { stats.looksLikeData++; return; }
      if (looksLikeData(key)) { stats.looksLikeData++; return; }
      if (!isAttr && inProtected) { stats.protectedZone++; return; }
      if (!isAttr && ATTR_ONLY.has(key)) { stats.attrOnlySkipped++; return; }
      if (NEVER.has(key)) { stats.deliberate++; return; }
      if (translateString(raw, isAttr)) { stats.hasEntry++; return; }
      if (!looksTranslatable(raw)) { stats.looksLikeData++; return; }  // 太長，引擎本來就不看
      stats.missing++;
      if (!missing.has(key)) missing.set(key, key);
    }

    // 文字節點：走整棵樹，但記錄自己在不在保護區裡
    const rootEl = document.body || document.documentElement;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) classify(n.nodeValue, false, isProtected(n.parentElement));

    // 屬性：保護區裡也算，因為 aria-label / title 必定是介面字串
    for (const attr of ATTRS) {
      const found = rootEl.querySelectorAll('[' + attr + ']');
      for (let i = 0; i < found.length; i++) classify(found[i].getAttribute(attr), true, false);
    }

    const list = Array.from(missing.values()).sort((a, b) => a.localeCompare(b));
    const report =
      '# 這一頁還沒翻到的介面字串（' + list.length + ' 條，已去重複）\n' +
      '# 站台：' + site.label + '　版本：v' + VERSION + '　字典：' + LOOKUP.size + ' 條　規則：' + PATTERNS.length + ' 條\n\n' +
      list.join('\n');

    console.log(
      '%c[zh-tw-webui v' + VERSION + '] 盤點結果',
      'font-weight:bold',
      '\n  還沒翻到（去重複後）：' + list.length + ' 條　← 只有這些需要回報' +
      '\n  （出現次數：' + stats.missing + ' 處）' +
      '\n  ──────────────────────' +
      '\n  保護區，規定不能翻：  ' + stats.protectedZone + ' 處（你的訊息、Claude 回覆、程式碼、檔名…）' +
      '\n  已經是中文：          ' + stats.alreadyChinese + ' 處' +
      '\n  看起來是資料：        ' + stats.looksLikeData + ' 處（數字、日期、時間、檔案大小）' +
      '\n  泛用單字只翻屬性：    ' + stats.attrOnlySkipped + ' 處' +
      '\n  刻意保留英文：        ' + stats.deliberate + ' 處（產品名、按鍵名）' +
      '\n  有對應條目：          ' + stats.hasEntry + ' 處'
    );
    console.log(report);

    try {
      navigator.clipboard.writeText(report).then(
        () => toast('已複製 ' + list.length + ' 條沒翻到的字串到剪貼簿'),
        () => toast('盤點完成：' + list.length + ' 條。剪貼簿失敗，請從主控台複製')
      );
    } catch (e) {
      toast('盤點完成：' + list.length + ' 條，請從主控台複製');
    }
    return { missing: list, stats: stats };
  }

  // 也掛到 window，方便直接在主控台叫：zhTwWebui.diagnose() / zhTwWebui.export()
  try {
    window.zhTwWebui = {
      diagnose: diagnose,
      export: exportCollected,
      collected: () => collected.size,   // 現在累積了幾條
      version: VERSION,
      site: site.label
    };
  } catch (e) { /* ignore */ }

  function toast(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText =
      'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:2147483647;' +
      'background:#1f1f1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;' +
      'font-family:system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);pointer-events:none';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      toggle();
    }
    if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      diagnose();
    }
    if (e.ctrlKey && e.altKey && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      exportCollected();
    }
  }, true);

  /* ------------------------------------------------------------------ *
   * 6.9 分頁標題
   *
   * 標題在 <head> 裡，而 translateSubtree 只走 document.body，所以要單獨翻一次。
   * claude.ai 換頁不會重新載入，標題是直接改掉的，因此另外盯著 <title>。
   * 翻譯規則是 patterns 裡的 `^(.+) - Claude$`：前半查得到字典才翻，
   * 查不到就整串不動——那八成是使用者自己的交談或專案名稱。
   * ------------------------------------------------------------------ */
  let lastTitle = '';

  function translateTitle() {
    if (!enabled) return;
    const t = document.title;
    if (!t || t === lastTitle) return;
    const zh = translateString(t, false);
    if (zh && zh !== t) {
      lastTitle = zh;
      document.title = zh;   // 這行會再觸發一次 observer，但上面那個 === 會擋掉
    } else {
      lastTitle = t;
    }
  }

  const titleObserver = new MutationObserver(translateTitle);

  function watchTitle() {
    const el = document.querySelector('title');
    if (el) titleObserver.observe(el, { childList: true, characterData: true, subtree: true });
  }

  /* ------------------------------------------------------------------ *
   * 7. 啟動
   * ------------------------------------------------------------------ */
  let started = false;
  function start() {
    if (started || !enabled) return;
    const root = document.documentElement;
    if (!root) return;
    started = true;
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  function initialPass() {
    if (!enabled) return;
    translateSubtree(document.body || document.documentElement);
    translateTitle();
    watchTitle();
  }

  start();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialPass, { once: true });
  } else {
    initialPass();
  }
  window.addEventListener('load', initialPass, { once: true });
})();
