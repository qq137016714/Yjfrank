# 信息流平台 开发进度追踪

---

## 🚀 QUICK START TIPS（新会话必读，节省 token）

### 项目状态：v3.0 进行中（数据分析升级）

### 技术栈
- **框架**：Next.js 16 (App Router) + TypeScript
- **数据库**：Prisma 6 + SQLite（`prisma/dev.db`）
- **认证**：NextAuth.js v5（JWT，无 adapter）
- **UI**：Tailwind CSS v4 + Recharts
- **运行**：`npm run dev`（开发）/ `npx next build`（验证编译）

### 关键路径
| 路由 | 说明 |
|------|------|
| `/dashboard` | 数据分析主页（KPI/图表/渠道/脚本洞察） |
| `/scripts` | 脚本管理页（列表/筛选/详情/对比） |
| `/admin` | 管理后台（用户/命名规则/屏蔽词/素材类型/Excel） |
| `/login` `/register` | 认证页 |

### 已完成功能一览（v0.1 ~ v2.0）
- **账号系统**：登录/注册/角色（admin/editor）/锁定机制
- **EXCEL 上传**：异步解析、进度轮询、历史记录、模板下载
- **数据匹配**：素材名清洗（脏前缀/日期/改版标记）+ 精确提取路径 + 子串回退 + 边界保护（`lib/matching.ts`）
- **统计计算**：多期聚合（加算/平均/重算）、渠道×期次矩阵（`lib/stats.ts`），动态加载 DB 配置
- **数据看板**：KPI 卡片、TOP10 图表（消耗/获客/ROI）、渠道分析、期次筛选器、最佳源脚本/迭代脚本洞察
- **脚本管理**：完整 CRUD、标签多选（前/中/尾贴）、父子关系、搜索筛选、投放数据 Tab、多脚本对比
- **管理后台**：用户管理（锁定/删除）、命名规则关键词、屏蔽词、素材类型、Excel 历史管理

### 核心数据模型（Prisma）
```
User → ExcelUpload → ExcelRow（原始数据）
Script ↔ Tag（多对多）
Script → ScriptStat（全期聚合）
Script → ScriptChannelStat（按渠道聚合）
ExcelUpload → ChannelPeriodStat（渠道×期次）
Script → Script（父子自关联，parentId）
Keyword（type/char/name，命名规则关键词）
SystemConfig（key/value，blockWords + contentTypes）
```

| `POST /api/scripts/import/parse` | 解析上传文件（.txt/.docx），返回预览+警告 |
| `POST /api/scripts/import/save` | 批量保存已确认脚本 |

### 关键 API
| 端点 | 说明 |
|------|------|
| `GET /api/stats?uploadId=xxx` | KPI 汇总（全期或单期） |
| `GET /api/stats/channel` | 渠道分析 |
| `GET /api/scripts?tags=x,y&hasData=true` | 脚本列表（支持筛选） |
| `GET /api/scripts/[id]` | 脚本详情（含 channelStats） |
| `GET /api/scripts/compare?ids=a,b,c` | 多脚本对比 |
| `GET /api/excel/history` | 上传历史（含 period 字段） |
| `GET/POST/DELETE /api/admin/keywords` | 命名规则关键词管理（admin） |
| `GET/PUT /api/admin/system-config` | 屏蔽词/素材类型配置（admin） |
| `GET/PUT/DELETE /api/admin/users` | 用户管理（admin） |

### 重要约定
- 脚本名全平台唯一（`Script.name` unique）
- 管理员账号：`管理员 / 123456`
- 期次编号：按 `ExcelUpload.createdAt` 升序，第1期 = 最早上传
- 渠道过滤：`isValidChannel()` 过滤 null / "" / "-" / "—" / "合计" / "total"
- 数据行过滤：`isDataRow()` 过滤 "合计" / "total" / 空 materialName

### 下次开始前执行
```bash
npm run dev          # 确认服务正常启动
npx next build       # 确认无 TypeScript 错误
```

---

## v0.1 — 项目基础架构 + 账号系统 ✅ 已验收

### 架构初始化
- [x] 初始化 Next.js 15 项目（TypeScript、App Router）
- [x] 配置 Tailwind CSS v4 + shadcn/ui + tw-animate-css
- [x] 配置 Prisma 6 + SQLite，创建 users 表 schema
- [x] 创建 types/index.ts 全项目共用类型定义
- [x] 创建 .env.local 环境变量模板
- [x] 搭建完整目录结构（/app /components /lib /types /prisma）
- [x] 创建 types/next-auth.d.ts NextAuth 类型扩展

### 后端开发
- [x] 配置 NextAuth.js v5（Credentials Provider，JWT 策略）
- [x] 实现注册接口 POST /api/auth/register（Zod 校验）
- [x] 实现登录失败次数限制（5次锁定5分钟）
- [x] 创建 prisma/seed.ts（初始化管理员账号：管理员/123456）
- [x] 数据库迁移完成（prisma migrate dev）
- [x] 管理员账号 seed 完成

### 前端开发
- [x] 实现登录页 /login（用户名+密码表单）
- [x] 实现注册页 /register（用户名+密码+确认密码）
- [x] 实现顶部导航栏（显示用户名、角色标签、退出登录）
- [x] 实现路由守卫 proxy.ts（未登录跳转 /login，已登录跳转 /）

### 修复记录
- [x] 修复 Prisma 7 全局 CLI 与本地 Prisma 6 版本冲突
- [x] 修复 @auth/prisma-adapter 类型冲突（移除 adapter，使用纯 JWT）
- [x] 修复 Next.js 16 middleware → proxy 重命名
- [x] 修复 prisma.config.ts 类型错误
- [x] 安装缺失依赖：tw-animate-css、shadcn、ts-node

### 验收测试
- [x] 管理员账号（管理员/123456）可成功登录
- [x] 新编导可注册账号并登录
- [x] 重复用户名注册给出明确错误提示
- [x] 连续登录失败5次账号被锁定
- [x] 退出登录功能正常

---

## v0.2 — EXCEL上传与解析 ✅ 已验收

### EXCEL 列名规范（A-AV，共48列）
| 列 | 字段名 | 计算策略 |
|----|--------|---------|
| A | 素材名 | 匹配用 |
| B | 投放时间 | 仅录入初次投放时间 |
| C | 广告渠道 | 按渠道单独统计 |
| D | 实际流水 | 忽略 |
| E | 总成本 | 加算 |
| F | 实际成本 | 忽略 |
| G | 展示数 | 加算 |
| H | 获客成本 | 重算：总成本÷总获客数 |
| I | 点击率 | 平均 |
| J | 3S完播率 | 平均 |
| K | 完播率 | 平均 |
| L | 转化率 | 平均 |
| M | 平均展示消耗 | 重算：总成本÷总展示数 |
| N | 点击数 | 加算 |
| O | 平均点击消耗 | 重算：总成本÷总点击数 |
| P | 获客数 | 加算 |
| Q | 低价课人数 | 加算 |
| R | 落地页转化率 | 平均 |
| S | 低价课流水 | 加算 |
| T | 公众号关注人数 | 加算 |
| U | 公众号关注率 | 平均 |
| V | 激活人数 | 加算 |
| W | 激活率 | 平均 |
| X | 激活成本 | 重算：总成本÷总激活人数 |
| Y | 添加人数 | 加算 |
| Z | 添加率 | 平均 |
| AA | 添加成本 | 重算：总成本÷总添加人数 |
| AB | 进群人数 | 加算 |
| AC | 进群率 | 平均 |
| AD | 第一天到播率 | 平均 |
| AE | 第二天到播率 | 平均 |
| AF | 第三天到播率 | 平均 |
| AG | 第四天到播率 | 平均 |
| AH | 第五天到播率 | 平均 |
| AI | 高沉浸用户数 | 加算 |
| AJ | 高沉浸率 | 平均 |
| AK | 第三天高沉浸到播率 | 平均 |
| AL | 第三天高沉浸转化率 | 平均 |
| AM | 高价课人数 | 加算 |
| AN | 高价课支付率 | 平均 |
| AO | 第三天高价课人数 | 加算 |
| AP | 第四天高价课人数 | 加算 |
| AQ | 第五天高价课人数 | 加算 |
| AR | 高价课流水 | 加算 |
| AS | 退款人数 | 加算 |
| AT | 退款率 | 平均 |
| AU | 获客占比 | 忽略 |
| AV | ROI | 重算：高价课流水÷总成本 |

### 后端开发
- [x] 完善 Prisma schema（ExcelUpload、UploadTask 表）
- [x] 完善 Prisma schema（ExcelRow 原始数据行表）
- [x] 数据库迁移（v0.2）
- [x] 创建 lib/excel-columns.ts（列名定义 + 计算策略）
- [x] 创建 lib/excel.ts（列名校验 + 行解析逻辑）
- [x] 实现 EXCEL 上传接口 POST /api/excel/upload（异步队列）
- [x] 实现任务状态查询接口 GET /api/excel/status
- [x] 实现标准 EXCEL 模板下载接口 GET /api/excel/template
- [x] 实现历史上传记录接口 GET /api/excel/history
- [x] 实现删除历史记录接口 DELETE /api/excel/history/[id]（仅管理员）

### 前端开发
- [x] 实现数据分析页框架 /dashboard（含导航高亮）
- [x] 实现 EXCEL 上传区域（拖拽 + 点击选择，100MB 限制）
- [x] 实现完整 5 阶段状态 UI（idle/uploading/validating/parsing/done/error）
- [x] 实现轮询逻辑（每 2 秒查询任务状态）
- [x] 实现历史上传记录列表（管理员可见，含删除）
- [x] 实现标准模板下载按钮

### 修复记录
- [x] 修复 xlsx 在 Next.js Turbopack 下 fs 被 mock 导致无法读取文件（serverExternalPackages）

### 验收标准
- [x] 管理员可上传标准格式 EXCEL 文件
- [x] 上传过程显示「正在上传文件」进度条
- [x] 服务器收到文件后显示「正在验证文件格式」
- [x] 格式正确后显示「正在解析数据（X/Y行）」实时进度
- [x] 解析完成后显示「数据上传成功」绿色提示
- [x] 上传格式错误 EXCEL 给出具体列名不匹配错误
- [x] 历史上传记录列表正常展示，管理员可删除某一期
- [x] 普通编导看不到上传按钮
- [x] 可下载标准 EXCEL 模板

---

## v0.3 — 数据匹配与统计计算 ✅ 已验收

### 后端开发
- [x] 完善 Prisma schema（Script 表、ScriptStat 表）
- [x] 数据库迁移（v0.3）
- [x] 创建 lib/matching.ts（脚本名模糊匹配 + 边界处理）
- [x] 创建 lib/stats.ts（多期数据聚合：加算/平均/重算）
- [x] 扩展 lib/excel.ts（解析完成后触发 matching → calculating）
- [x] 实现 POST /api/scripts（管理员添加脚本名，仅 name 字段）
- [x] 实现 GET /api/scripts（脚本列表 + 统计数据）
- [x] 实现 DELETE /api/scripts/[id]（管理员删除）
- [x] 实现 GET /api/stats（全平台 KPI 汇总）
- [x] 实现 GET /api/scripts/[id]/stats（单脚本全维度数据）

### 前端开发
- [x] 实现 KPI 卡片区（总消耗/总获客/平均获客成本/ROI）
- [x] 实现智能摘要卡片（消耗 TOP3 / 高价课流水 TOP3）
- [x] 实现消耗 TOP10 条形图（Recharts）
- [x] 实现脚本名管理面板（管理员添加/删除脚本名）
- [x] 实现单脚本搜索框 + 数据弹窗（全维度展示）
- [x] 上传成功后自动刷新图表和 KPI

### 修复记录
- [x] 修复 Next.js 动态路由同层不同 slug 名冲突（[name] → [id]）

### 验收标准
- [x] 上传拟真数据表后，KPI 数据正确更新
- [x] 消耗 TOP10 图表展示正确（与手动计算一致）
- [x] 「脚本3.mp4」被正确匹配到「脚本3」
- [x] 「脚本3」不被错误匹配到「脚本30」（边界测试）
- [x] 上传第二期数据后，总成本正确累加
- [x] 平均指标（点击率等）重新计算正确
- [x] 重算指标（获客成本 = 总成本 ÷ 总获客数）计算正确
- [x] ROI = 高价课流水 ÷ 总成本，计算正确
- [x] 单脚本查询弹窗展示该脚本所有维度数据

---

## v1.0 — 数据分析页完整版 ✅ 已验收

### 后端开发
- [x] 完善 Prisma schema（ScriptChannelStat 按渠道分组统计表）
- [x] 完善 Prisma schema（ChannelPeriodStat 渠道×期次统计表）
- [x] 数据库迁移（v1.0）
- [x] 扩展 lib/stats.ts（按渠道分组聚合 + 渠道×期次全量重算）
- [x] 实现 GET /api/stats/channel（总体汇总 + 按期次明细）
- [x] 实现 GET /api/scripts/[id]/channel-stats（单脚本按渠道数据）
- [x] 修复渠道识别：过滤「合计」行和「-」渠道，动态识别有效渠道

### 前端开发
- [x] 实现 ROI TOP10 / 获客数 TOP10 / 消耗 TOP10 三指标切换图表
- [x] 实现广告渠道占比饼图（Recharts PieChart）
- [x] 实现渠道 ROI 对比柱图
- [x] 实现渠道总体汇总表（含参与期数）
- [x] 实现按期次明细矩阵表（渠道为列、期次为行，无数据显示 —）
- [x] 实现脚本排行 ↔ 渠道分析 Tab 切换
- [x] 完善单脚本弹窗（全渠道汇总 ↔ 按渠道查看 Tab）

### 验收标准
- [x] ROI TOP10 / 获客数 TOP10 图表数据正确
- [x] 渠道占比饼图展示各渠道消耗占比
- [x] 渠道 ROI 对比图展示各渠道 ROI
- [x] 全渠道 ↔ 按渠道切换功能正常
- [x] 单脚本弹窗可按渠道查看分渠道数据
- [x] 按期次明细矩阵正确展示，无投放渠道显示 —

---

## v1.1 — 脚本管理基础版 ✅ 已验收

### 后端开发
- [x] 完善 Prisma schema（Script 全字段：内容/标签/父子关系/上传者）
- [x] 新增 Tag 模型（前/中/尾贴标签，多对多关联）
- [x] 数据库迁移（v1.1）
- [x] 更新 prisma/seed.ts（写入完整标签初始数据）
- [x] 更新 POST /api/scripts（全字段创建，任意登录用户可用）
- [x] 新增 GET /api/scripts/check-name（脚本名唯一性校验）
- [x] 新增 GET /api/scripts/[id]（单脚本详情）
- [x] 新增 PUT /api/scripts/[id]（编辑，本人/管理员）
- [x] 更新 DELETE /api/scripts/[id]（仅管理员，级联删除）
- [x] 新增 GET /api/tags（标签列表）

### 前端开发
- [x] 实现脚本管理页 /scripts（列表 + 搜索筛选）
- [x] 实现脚本上传表单弹窗（标签多选、衍生脚本字段动态显示）
- [x] 实现父脚本搜索选择器（替换下拉框，支持实时检索）
- [x] 实现脚本详情弹窗（只读，含标签/父子关系展示）
- [x] 实现权限控制（编辑仅本人/管理员，删除仅管理员）
- [x] 实现「以此脚本迭代」按钮（所有人可见，预填父脚本）
- [x] 更新导航栏（脚本管理高亮）

---

## v2.0 — 脚本管理完整版 + 数据关联 ✅ 已完成

### 完成内容
- [x] GET /api/scripts 增加 tags/hasData 筛选参数
- [x] GET /api/scripts/[id] 返回完整 stat + channelStats + 父子关系
- [x] GET /api/scripts/compare?ids=a,b,c（多脚本横向对比）
- [x] GET /api/stats 增加 topSourceScripts + topIterationScripts（源脚本递归聚合获客）
- [x] GET /api/stats?uploadId=xxx 支持单期数据过滤（从 ExcelRow 实时计算）
- [x] 脚本列表标签筛选栏（前/中/尾贴分组，多选）+ 「有数据」快速过滤
- [x] 脚本详情弹窗：「脚本信息」+「投放数据」Tab，含渠道明细表
- [x] 脚本对比功能（最多4条，指标高亮最优值 ★，渠道消耗分布）
- [x] 数据看板期次筛选器（PeriodSelector，可搜索，选中后 KPI/TOP10/摘要联动）
- [x] 最佳源脚本（含迭代递归聚合，按总获客排序）+ 最佳迭代脚本（按 ROI）
- [x] 修复 SmartSummary 脚本名截断问题（移除 max-w-[120px]）
- [x] 移除首页 ScriptManager 快速添加入口（绕过表单校验的漏洞）
- [x] 修复对比弹窗获客成本未计算（avgCustomerCost 为计算字段，在 API 补算）

---

## v2.9 — 匹配逻辑修复 + 管理员后台 ✅ 已完成

### 背景
v2.0 存在两个核心问题：
1. `matchScriptName` 只做简单子串查找，未清洗素材名（脏前缀/后缀/改版标记），导致部分素材无法正确匹配脚本
2. 管理员后台完全缺失，无法动态配置命名规则、屏蔽词、素材类型

### Schema 变更
- [x] 新增 `Keyword` 模型（type/char/name，命名规则关键词，`@@unique([type, char])`）
- [x] 新增 `SystemConfig` 模型（key/value JSON，存储 blockWords + contentTypes）
- [x] 数据库迁移（`20260223_add_keyword_systemconfig`）
- [x] seed 初始化：blockWords（20个改版标记）、contentTypes（课程/才艺/干货）

### 匹配逻辑重写（`lib/matching.ts`）
- [x] 新增 `cleanMaterialName()`：移除 .mp4/.mov、`代理-` 前缀、`一键修复_` 前缀、末尾 `-XXX` 标记、5-6位日期、blockWords 改版标记、开头非中文字符
- [x] 新增 `extractContentType()`：从清洗后名称末尾提取 contentTypes 中的类型标记
- [x] 新增 `MatchConfig` 接口（blockWords + contentTypes）
- [x] 更新 `matchScriptName()` 签名，接收 config 参数
- [x] 精确提取路径：清洗后长度 ≥ 8 时，取第7位后内容，移除末尾 contentType，与 scriptName 精确比对
- [x] 回退路径：精确提取失败时，在清洗后名称中做子串匹配（保留数字边界保护）

### 统计计算更新（`lib/stats.ts`）
- [x] `recalculateAllStats()` 开头从 DB 加载 blockWords / contentTypes 配置
- [x] 将 `config` 传入 `matchScriptName()`，实现动态配置驱动匹配

### 管理员 API（3个新路由，统一 admin 鉴权）
- [x] `GET/POST/DELETE /api/admin/keywords`：关键词增删查，按 type 分组返回
- [x] `GET/PUT /api/admin/system-config`：读取/更新 blockWords 和 contentTypes
- [x] `GET/PUT/DELETE /api/admin/users`：用户列表、锁定/解锁、删除（不能删自己）

### 管理后台 UI（`app/(main)/admin/page.tsx`）
- [x] admin 权限守卫（非 admin 重定向到 /dashboard）
- [x] 用户管理 Tab：列表展示、锁定/解锁、删除
- [x] 命名规则 Tab：按 EDITOR/CUTTER/INVESTOR/ACTOR/PROJECT 分组，增删关键词
- [x] 屏蔽词 Tab：Tag 式展示 blockWords，增删，保存到 DB
- [x] 素材类型 Tab：Tag 式展示 contentTypes，增删，保存到 DB
- [x] Excel管理 Tab：上传历史列表，删除记录

### Navbar 更新
- [x] admin 角色显示「管理后台」导航链接，路径高亮

### 验收测试
- [x] `npx prisma migrate dev` 成功，`npx prisma db seed` 写入默认配置
- [x] TypeScript 编译无错误（`npx tsc --noEmit`）
- [x] 素材名 `代理-60106威原塔威希玉通精挑对细选课程-WJJ.mp4` 清洗后可匹配脚本 `精挑对细选`
- [x] 管理员登录后 Navbar 出现「管理后台」链接
- [x] 非管理员访问 `/admin` 被重定向到 `/dashboard`
- [x] 5个 Tab 均可正常增删操作

---

## v2.9.1 — 脚本批量导入 + 测试修复 ✅ 已完成

### 完成内容
- [x] 安装 `mammoth`（.docx 转纯文本）
- [x] 新建 `public/script-template.txt`：标准格式模板，供编导下载参考
- [x] 新建 `lib/script-parser.ts`：文本解析库（行正则匹配、脚本名去数字、同名合并、多行续行、错误收集）
- [x] 新建 `POST /api/scripts/import/parse`：接收 .txt/.docx，返回解析结果 + 重复名警告 + 未知标签警告
- [x] 新建 `POST /api/scripts/import/save`：批量创建脚本，跳过已存在名称，全部完成后触发一次 `recalculateAllStats()`
- [x] 新建 `components/scripts/ScriptImport.tsx`：三阶段弹窗（上传 → 预览纠错 → 完成），含拖拽上传、格式说明折叠面板、模板下载、逐条勾选、警告横幅
- [x] 更新 `components/scripts/ScriptList.tsx`：工具栏新增「批量导入」按钮
- [x] 新增脚本批量删除：`DELETE /api/scripts/batch-delete`（仅管理员），ScriptList 新增多选模式 + 批量删除操作栏

### 无 Schema 变更，无数据库迁移

### ⚠️ 已修复的 Bug（后续开发注意）

#### Bug 1：解析器空行重置上下文
- **现象**：脚本内容中若有空行（如多行对话），空行之后的续行被丢弃，报「无法解析，且无所属段落」错误
- **根因**：`lib/script-parser.ts` 原逻辑对空行和 `===` 段落标题一视同仁，都重置 `ctx = null`
- **修复**：只有 `===` 段落标题才重置 `ctx`，空行直接 `continue` 跳过，保留当前上下文
- **教训**：续行机制依赖 `ctx` 不被意外清空，任何重置 `ctx` 的条件都要谨慎

#### Bug 2：Excel 删除后统计数据残留
- **现象**：删除全部 Excel 上传记录后，首页 KPI 仍显示旧数据
- **根因 1**：`DELETE /api/excel/history/[id]` 只做级联删除，没有触发 `recalculateAllStats()`
- **根因 2**：`lib/stats.ts` 的 `recalculateAllStats()` 在脚本无匹配行时，只 upsert `matchedRows: 0`，但 `totalCost`、`roi` 等字段的旧值不会被清零
- **修复**：① 删除 Excel 后异步触发重算；② 无匹配行时改为 `deleteMany` 删除整条 ScriptStat 记录
- **教训**：统计数据的「清零」不能靠部分字段更新，必须删除整条记录或全字段重置；数据删除操作必须配套触发重算

#### Bug 3：脚本名含日期前缀导致匹配失败
- **现象**：Excel 素材名如 `60113威混无威隽玉通六十而已课程`，匹配逻辑清洗后得到 `威混无威隽玉通六十而已课程`，但 DB 中脚本名仍带 `60113` 前缀，导致子串匹配失败
- **根因**：TXT 文件中脚本名自带 5 位日期前缀（如 `60113`），解析器的 `/^\d+/` 正则本应去除，但实际导入时未生效（原因待查），导致 DB 存储了含前缀的名称
- **修复**：写 `scripts/fix-script-names.ts` 一次性清理 DB 中带 5-6 位数字前缀的脚本名
- **教训**：脚本名必须与匹配逻辑的清洗结果对齐。`cleanMaterialName()` 会移除 5-6 位日期前缀，因此 DB 中的脚本名也不能带此前缀；导入后应抽检 DB 脚本名是否与预期一致

### 数据导入工具脚本（`scripts/` 目录）
| 脚本 | 用途 |
|------|------|
| `seed-keywords.ts` | 批量写入人员关键词（PROJECT/ACTOR/EDITOR/CUTTER/INVESTOR） |
| `import-scripts.ts` | 从 TXT 文件解析并导入脚本到 DB |
| `update-script-content.ts` | 用修复后的解析器重新更新已导入脚本的内容字段 |
| `import-excel.ts` | 复制 XLSX 到 uploads 目录并触发完整解析流程 |
| `fix-script-names.ts` | 清理 DB 中脚本名的 5-6 位日期前缀 |

运行方式：`npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/<文件名>.ts`

---

## v3.0 — 数据分析升级（进行中）

### 已完成

#### Feature 1 — KPI 联动对比区 ✅
- [x] 新建 `components/dashboard/CombinedKpiSection.tsx`：合并脚本库数据 + 大盘数据，含占比进度条
- [x] 修改 `app/(main)/dashboard/page.tsx`：替换原两个独立 KPI 区块

#### Feature 2 — 脚本库翻页 ✅
- [x] 修改 `components/scripts/ScriptList.tsx`：客户端分页，PAGE_SIZE=20，筛选变化自动重置页码

#### Feature 3 — 脚本类型扫描 + 按类型数据分析 ✅
- [x] 新建 `app/api/admin/scan-content-types/route.ts`：扫描**脚本库**名称后缀，追加新类型
- [x] 新建 `app/api/content-types/route.ts`：公开 enabled contentTypes 端点
- [x] 新建 `app/api/stats/by-content-type/route.ts`：按类型聚合统计
- [x] 新建 `components/dashboard/ContentTypeAnalysis.tsx`：按类型分析表格
- [x] 修改 `app/(main)/admin/page.tsx`：素材类型 Tab 新增「扫描脚本库」按钮

#### Feature 4 — 数据分析系统重构 ✅
- [x] 新建 `components/dashboard/AnalysisControls.tsx`：按钮触发式重算（减轻性能压力）
- [x] 新建 `app/api/admin/recalculate-stats/route.ts`：手动触发全量重算
- [x] 新建`app/api/admin/recalculate-channel-stats/route.ts`：手动触发渠道数据重算
- [x] 新建 `components/dashboard/ChannelAnalysis.tsx`：渠道分析表格（13个关键指标）
- [x] 新建 `app/api/stats/channel-analysis/route.ts`：渠道聚合统计 API
- [x] 新建 `components/dashboard/DetailedAnalysis.tsx`：全维度数据分析（8个维度，48个字段）
- [x] 新建 `app/api/stats/detailed/route.ts`：全维度聚合统计 API

### ⚠️ 重要约定（后续开发必读）

#### ROI 计算规则
- **ROI = 高价课流水 ÷ 总消耗**（不能用平均数，不能用加权平均）
- 跨期数据串联：先加算总消耗、总高价课流水，再做一次除法
- 已在 `lib/stats.ts` 第158行、第207行验证正确

#### 素材类型扫描规则
- **必须以脚本库（Script 表）为准**，不能从 Excel 数据中提取
- Excel 数据中含大量代理公司缩写后缀（如 P4、DJ、WJ），不是真正的素材类型
- 扫描逻辑：`prisma.script.findMany()` → 提取脚本名末尾2字符 → 去重 → 过滤已存在类型
- 按类型统计：`scriptStats.filter(stat => stat.script.name.endsWith(contentType))`，基于脚本库匹配

#### 各字段计算策略（完整版）
| 字段 | 策略 |
|------|------|
| 总成本、展示数、点击数、获客数、低价课人数、低价课流水、公众号关注人数、激活人数、添加人数、进群人数、高沉浸用户数、高价课人数、第3/4/5天高价课人数、高价课流水、退款人数 | **加算** |
| 点击率、3S完播率、完播率、转化率、落地页转化率、公众号关注率、激活率、添加率、进群率、第1-5天到播率、高沉浸率、第三天高沉浸到播率、第三天高沉浸转化率、高价课支付率、退款率 | **总平均数** |
| 获客成本 | 重算：总成本 ÷ 总获客数 |
| 平均展示消耗 | 重算：总成本 ÷ 总展示数 |
| 平均点击消耗 | 重算：总成本 ÷ 总点击数 |
| 激活成本 | 重算：总成本 ÷ 总激活人数 |
| 添加成本 | 重算：总成本 ÷ 总添加人数 |
| ROI | 重算：总高价课流水 ÷ 总成本 |
| 实际流水、实际成本、获客占比 | **忽略** |
| 投放时间 | 仅录入初次投放时间（同一脚本多期投放，只取第一次） |
| 广告渠道 | 每个渠道单独统计，跨 Excel 表格匹配 |

#### 性能优化约定
- 数据重算不自动触发，由管理员手动点击「重算所有数据」或「重算渠道数据」按钮触发
- 大数据量时考虑分段计算（按脚本批次处理）

### 待完成
- [ ] 验证 `scan-content-types` 扫描结果不含代理公司缩写（P4/DJ/WJ 等）
- [ ] DetailedAnalysis 组件接入仪表盘并验证数据正确性
- [ ] ChannelAnalysis 组件数据与 ChannelCharts 数据一致性验证

---

## v4.0 — AI 二创页完整版（待开始）

### 目标
编导可在 AI 二创页基于已有脚本生成新脚本变体，支持选择源脚本、填写改写方向、
调用 AI 生成前/中/尾贴内容，生成后可直接保存为新脚本（自动关联父脚本）。

### 后端开发
- [ ] 集成 AI 接口（Claude API 或 OpenAI，通过 `NEXT_PUBLIC_AI_PROVIDER` 环境变量切换）
- [ ] 实现 POST /api/ai/generate（接收源脚本内容 + 改写指令，流式返回生成结果）
- [ ] 实现 POST /api/ai/save（将生成结果直接保存为新脚本，自动设置 parentId）
- [ ] 生成历史记录表（AiGeneration：prompt、result、scriptId、createdBy）
- [ ] 数据库迁移（v3.0）

### 前端开发
- [ ] 实现 AI 二创页 /ai-create（导航已预留入口）
- [ ] 源脚本选择器（复用 PeriodSelector 风格的搜索下拉）
- [ ] 改写方向输入（文本框 + 预设快捷指令按钮，如「加强情感共鸣」「缩短前贴」）
- [ ] 流式生成展示（前/中/尾贴分区实时显示，打字机效果）
- [ ] 生成结果编辑（可在生成后手动微调）
- [ ] 一键保存为新脚本（自动填充父脚本、标签继承）
- [ ] 生成历史列表（可查看历史生成记录，重新加载某次结果）

### 验收标准
- [ ] 选择源脚本后，源脚本内容自动填入参考区
- [ ] 输入改写方向后点击生成，前/中/尾贴内容流式输出
- [ ] 生成过程中可中断
- [ ] 生成完成后可编辑内容
- [ ] 点击「保存为新脚本」弹出表单（名称预填、父脚本已选、内容已填）
- [ ] 生成历史可查看，可重新加载某次结果继续编辑

---