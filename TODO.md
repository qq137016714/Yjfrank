# 信息流平台 开发进度追踪

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

## v1.0 — 数据分析页完整版（开发中）

### 后端开发
- [ ] 完善 Prisma schema（ScriptChannelStat 按渠道分组统计表）
- [ ] 数据库迁移（v1.0）
- [ ] 扩展 lib/stats.ts（按渠道分组聚合，写入 ScriptChannelStat）
- [ ] 实现 GET /api/stats/channel（全平台按渠道分组 KPI）
- [ ] 实现 GET /api/scripts/[id]/channel-stats（单脚本按渠道数据）

### 前端开发
- [ ] 实现 ROI TOP10 条形图
- [ ] 实现获客数 TOP10 条形图
- [ ] 实现广告渠道占比饼图（Recharts PieChart）
- [ ] 实现渠道 ROI 折线图（Recharts LineChart）
- [ ] 实现全渠道汇总 ↔ 按渠道查看切换 Tab
- [ ] 完善单脚本弹窗（渠道切换 Tab、各渠道数据对比）
- [ ] 完善智能摘要（补充更多维度 TOP3）

### 验收标准
- [ ] ROI TOP10 / 获客数 TOP10 图表数据正确
- [ ] 渠道占比饼图展示各渠道消耗占比
- [ ] 渠道 ROI 折线图展示各渠道 ROI 对比
- [ ] 全渠道 ↔ 按渠道切换功能正常
- [ ] 单脚本弹窗可按渠道查看分渠道数据
- [ ] 所有图表响应式，移动端可用
- [ ] 测试报告无 P0/P1 级 Bug

---

## v1.1 — 脚本管理基础版（待开始）
## v2.0 — 脚本管理完整版 + 数据关联（待开始）
## v3.0 — AI二创页完整版（待开始）
