// ==UserScript==
// @name         繁體中文介面（Claude + GitHub）
// @name:zh-TW   繁體中文介面（Claude + GitHub）
// @namespace    https://github.com/b010203044-code/zh-tw-webui
// @version      3.5.0
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
                 'Tokens', 'Project', 'Select', 'Thread', 'Mode', 'Move', 'Prompt', 'High', 'Low'],

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
    'Artifacts': 'Artifacts',
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
    'New': '新',
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
    'Actions for Artifacts': 'Artifacts 的操作',
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
    'Ask for docs, files, artifacts, or folders in any thread. Claude can organize them in this panel.': '在任何討論串中要求 Claude 產生文件、檔案、Artifact 或資料夾，Claude 可以在這個面板中整理它們。',
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
    'New Slides and Design projects are created as artifacts.': '新的「投影片」與「設計」專案會以 Artifact 形式建立。',
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
    'Show message actions': '顯示訊息操作',
    'Unread response': '未讀回覆',
    'New from a template': '從範本建立',
    'Customize': '自訂',

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
    'Resets at': '重設時間',

    /* ---- 其他 ---- */
    '(opens in new tab)': '（在新分頁開啟）',
    'Get apps and extensions': '取得應用程式與擴充功能',
    'Repository and pull request controls': '儲存庫與合併請求控制項',
    'Arrow keys move the tile. Perpendicular arrows preview a split; press Enter to commit or Escape to cancel.': '方向鍵可移動磚塊。垂直方向的方向鍵會預覽分割；按 Enter 確認，按 Escape 取消。'
      },

      patterns: [
    [/^(\d+)\s+minutes?\s+ago$/i, (m) => m[1] + ' 分鐘前'],
    [/^(\d+)\s+hours?\s+ago$/i, (m) => m[1] + ' 小時前'],
    [/^(\d+)\s+days?\s+ago$/i, (m) => m[1] + ' 天前'],
    [/^(\d+)\s+weeks?\s+ago$/i, (m) => m[1] + ' 週前'],
    [/^(\d+)\s+months?\s+ago$/i, (m) => m[1] + ' 個月前'],
    [/^(\d+)\s+years?\s+ago$/i, (m) => m[1] + ' 年前'],
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
        [/^(\d+)\s+artifacts?$/i, (m) => m[1] + ' 個 Artifact'],
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
        [/^Added (.+) to this thread$/, (m) => '已將 ' + m[1] + ' 加入此討論串'],
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

  function normalize(s) {
    return s
      .replace(/ /g, ' ')
      .replace(/…/g, '…')
      .replace(/\.\.\./g, '…')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 至少要有一個英文字母才值得查，純數字或已經是中文的直接跳過
  function looksTranslatable(s) {
    return s.length > 0 && s.length < 200 && /[A-Za-z]/.test(s) && !/[一-鿿]/.test(s);
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
      if (m) return fn(m);
    }
    return null;
  }

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
    if (!translated) return;

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
      if (translated && translated !== raw) el.setAttribute(attr, translated);
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
      alreadyChinese: 0,   // 已經是中文（多數是翻好的）
      looksLikeData: 0     // 數字、日期、時間、檔案大小、單字元標籤
    };

    const hasChinese = (s) => /[一-鿿]/.test(s);

    /* 判斷「這看起來是資料，不是介面文字」。
       9:55 AM、363.5k、21.3 kB、3m、Jul 11 這些都含有英文字母，
       光看「有沒有字母」會把它們算成漏翻，那正是雜訊的來源。
       規則：帶數字而字母很少（單位、AM/PM、月份縮寫），或整串只有一個字母。 */
    function looksLikeData(s) {
      const letters = s.replace(/[^A-Za-z]/g, '');
      if (letters.length === 0) return true;             // 純數字、日期、符號
      if (letters.length <= 1) return true;              // 單字元標籤：x、+、v
      if (/\d/.test(s) && letters.length <= 3) return true; // 9:55 AM、363.5k、Jul 11
      return false;
    }

    function classify(raw, isAttr, inProtected) {
      if (!raw || !raw.trim()) return;
      if (hasChinese(raw)) { stats.alreadyChinese++; return; }
      if (looksLikeData(raw)) { stats.looksLikeData++; return; }
      const key = normalize(raw);
      if (!key) { stats.looksLikeData++; return; }
      if (!isAttr && inProtected) { stats.protectedZone++; return; }
      if (!isAttr && ATTR_ONLY.has(key)) { stats.attrOnlySkipped++; return; }
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
      '# 站台：' + site.label + '　字典：' + LOOKUP.size + ' 條　規則：' + PATTERNS.length + ' 條\n\n' +
      list.join('\n');

    console.log(
      '%c[zh-tw-webui] 盤點結果',
      'font-weight:bold',
      '\n  還沒翻到（去重複後）：' + list.length + ' 條　← 只有這些需要回報' +
      '\n  （出現次數：' + stats.missing + ' 處）' +
      '\n  ──────────────────────' +
      '\n  保護區，規定不能翻：  ' + stats.protectedZone + ' 處（你的訊息、Claude 回覆、程式碼、檔名…）' +
      '\n  已經是中文：          ' + stats.alreadyChinese + ' 處' +
      '\n  看起來是資料：        ' + stats.looksLikeData + ' 處（數字、日期、時間、檔案大小）' +
      '\n  泛用單字只翻屬性：    ' + stats.attrOnlySkipped + ' 處' +
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

  // 也掛到 window，方便直接在主控台叫：zhTwWebui.diagnose()
  try { window.zhTwWebui = { diagnose: diagnose, version: '3.5.0', site: site.label }; } catch (e) { /* ignore */ }

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
  }, true);

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
  }

  start();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialPass, { once: true });
  } else {
    initialPass();
  }
  window.addEventListener('load', initialPass, { once: true });
})();
