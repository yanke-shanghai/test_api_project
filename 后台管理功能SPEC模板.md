# 后台管理功能 SPEC 模板（AI 产品通用版）

> 基于 AI 试衣项目实践总结，适用于 Next.js + Prisma + PostgreSQL 技术栈的 AI 产品

---

## 一、使用说明

### 1.1 适用场景

- 已有前台用户功能的 AI 产品（图像生成、文字生成、对话等）
- 需要快速搭建后台管理系统
- 技术栈：Next.js App Router + TypeScript + Prisma + PostgreSQL + JWT

### 1.2 核心原则

| 原则 | 说明 | 本次实践体现 |
|------|------|-------------|
| **优先复用** | 不重造数据库、认证、API，复用现有结构 | 复用 JWT 认证、复用 Prisma schema |
| **最小改动** | 数据库只加必要字段，不做大改 | 仅新增 `isAdmin` 一个字段 |
| **字段映射** | 真实 schema 与模板不一致时，做合理映射 | 订单→任务，name→email，status→isAdmin |
| **鉴权优先** | 所有管理功能必须鉴权 | `/api/admin/*` 全部校验 Token + isAdmin |
| **不做删除** | 管理后台不提供删除功能 | 用户和任务均无删除按钮 |
| **简洁实用** | 偏后台风格，优先可用性 | 纯 Tailwind，表格+筛选+分页 |

---

## 二、SPEC 模板

### 项目名称：[项目名称] - 后台管理功能

---

## 1. Problem Statement（问题陈述）

**一句话描述**：当前 [产品名称] 缺乏管理后台，管理员无法查看用户、管理任务、掌握运营数据。

**详细描述**：
- 当前项目只有前台功能，没有管理后台
- 管理员无法查看用户列表、无法管理 [业务对象] 状态
- 缺乏运营数据总览，无法掌握用户增长和任务处理情况
- User 表没有管理员标识，无法区分普通用户和管理员

---

## 2. Proposed Solution（方案描述）

### 2.1 技术选型（完全复用现有技术栈）

| 组件 | 技术 | 复用情况 |
|------|------|----------|
| 前端框架 | Next.js [版本] (App Router) | ✅ 复用 |
| 样式 | Tailwind CSS | ✅ 复用（不引入新组件库） |
| ORM | Prisma [版本] | ✅ 复用 |
| 数据库 | [数据库平台，如 NEON PostgreSQL] | ✅ 复用 |
| 认证 | JWT + bcrypt | ✅ 复用 |
| UI 组件 | 纯 Tailwind 手写 | ✅ 复用 |

### 2.2 数据库变更（最小改动）

**唯一改动：User 表新增 `isAdmin` 字段**

```prisma
model User {
  // ... 现有字段
  isAdmin      Boolean       @default(false) @map("is_admin")
  // ... 现有关系和索引
  @@map("users")
}
```

### 2.3 字段映射关系

> 模板字段与真实 schema 不一致时的映射表，逐条列出

| 模板要求字段 | 真实字段 | 映射说明 |
|-------------|----------|----------|
| `User.name` | [如：User.email / User.nickname] | 无 name 字段，用 [字段名] 替代搜索和展示 |
| `User.status` | [如：User.isAdmin] | 无 status 字段，用 [字段名] 替代筛选和编辑 |
| `Order` | [如：TryOnRecord / GenerationTask] | 项目无订单概念，用 [业务表名] 替代 |
| `Order.order_no` | [如：id] | 无订单号，用 [字段名] 替代 |
| `Order.amount` | 跳过 | 无金额字段，不硬造 |
| `Order.user` | [业务表].user（关联查询） | 关联 User 表获取 email/name |

### 2.4 后台路由结构

```
/admin              → 概览页（dashboard）
/admin/users        → 用户管理
/admin/[业务模块]    → [业务对象]管理
/admin/[业务模块]/[id] → [业务对象]详情页
```

### 2.5 后台通用布局

```
┌─────────────────────────────────────────────────────────┐
│  顶部标题区：[产品名]管理后台          admin@example.com  │
│                                       [退出登录]        │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  📊 概览     │                                          │
│  👥 用户管理 │         主内容区                          │
│  📋 [业务]   │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**布局规范：**
- 左侧导航：固定宽度 `200px`，高亮当前页
- 顶部标题区：高度 `60px`，右侧显示管理员邮箱 + 退出按钮
- 主内容区：剩余空间，内边距 `24px`
- 桌面端最小宽度 `1024px`

**鉴权重定向逻辑：**
```
未登录用户访问 /admin/* → 重定向到 /login
已登录但 isAdmin=false → 重定向到 /（首页）
已登录且 isAdmin=true → 正常访问
```

**统一状态处理：**
- 加载态：显示"加载中..."文字
- 空状态：显示"暂无数据"文字
- 错误态：显示红色错误提示文字 + 重试按钮

### 2.6 `/admin` 概览页

**展示指标（根据真实 schema 能支持的展示，不支持的跳过）：**

| 指标 | 数据来源 | 展示形式 |
|------|----------|----------|
| 用户总数 | `User.count()` | 数字卡片 |
| 最近7天新增用户数 | `User.count({ where: { createdAt: { gte: 7天前 } } })` | 数字卡片 |
| [业务对象]总数 | `[Model].count()` | 数字卡片 |
| 最近7天[业务对象]数 | `[Model].count({ where: { createdAt: { gte: 7天前 } } })` | 数字卡片 |
| [业务对象]状态分布 | `[Model].groupBy({ by: ['status'] })` | 横向条形图（纯 CSS） |
| 总成交额 | 跳过 | 无 amount 字段则不展示 |

**不展示的内容：** 金额相关指标（无 amount 字段时跳过，不硬造）

### 2.7 `/admin/users` 用户管理页

**功能清单：**

| 功能 | 实现方式 |
|------|----------|
| 列表展示 | 表格：`id`（截断前8位）、`[name/email字段]`、`createdAt`（格式：YYYY-MM-DD HH:mm）、`[角色/状态字段]` |
| 搜索 | 按 `[name/email字段]` 模糊搜索（`contains`，不区分大小写） |
| 筛选 | 下拉框：全部 / [管理员/普通用户 或 状态枚举] |
| 分页 | 默认每页 10 条，最大 100，底部显示"共 X 条，第 Y/Z 页" |
| 编辑 | 编辑 `[isAdmin/status]` 字段（弹窗确认） |
| 删除 | ❌ 不做 |

**编辑交互流程：**
```
1. 点击编辑按钮
2. 弹出确认对话框："确认将 xxx 设置为 yyy？"
3. 点击"确认" → 调用 PATCH API
4. 成功 → 关闭对话框，刷新列表，显示绿色提示"更新成功"
5. 失败 → 对话框保留，显示红色错误提示
```

### 2.8 `/admin/[业务模块]` [业务对象]管理页

**功能清单：**

| 功能 | 实现方式 |
|------|----------|
| 列表展示 | 表格：id、用户信息（关联查询）、[核心字段]、状态、创建时间 |
| 搜索 | 按用户 [name/email] 模糊搜索 |
| 筛选 | 按 `status` 筛选（全部 + 状态枚举值） |
| 分页 | 默认每页 10 条，最大 100 |
| 查看详情 | 点击行跳转到 `/admin/[业务模块]/[id]` |
| 编辑 | 详情页内编辑 `status`（下拉框 + 确认弹窗） |
| 删除 | ❌ 不做 |

**状态枚举（根据业务定义）：**

| 状态值 | 含义 | 标签颜色 |
|--------|------|----------|
| `processing` | 处理中 | 黄色 |
| `completed` | 已完成 | 绿色 |
| `failed` | 失败 | 红色 |

**AI 产品特殊考虑：**
- 如果有图片输入/输出，列表中显示缩略图（如 48x48px）
- 详情页展示大图
- 结果为空时显示灰色占位框

### 2.9 管理员鉴权方案

**登录 API 改动：**

登录响应新增 `isAdmin` 字段：
```json
{
  "success": true,
  "user": { 
    "id": "xxx", 
    "email": "admin@example.com",
    "isAdmin": true
  },
  "token": "eyJhbGci..."
}
```

**JWT Token 内容改动：**

`generateToken` 函数新增 `isAdmin` 字段：
```json
{
  "sub": "user-id",
  "email": "admin@example.com",
  "isAdmin": true,
  "iat": ...,
  "exp": ...
}
```

**首个管理员设置方式：**

在数据库控制台执行 SQL：
```sql
UPDATE users SET is_admin = true WHERE email = '你的邮箱';
```

### 2.10 API 接口清单

**统一响应格式：**
```json
{
  "success": true,
  "data": {},
  "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
}
```

**错误响应格式：**
```json
{
  "success": false,
  "error": "错误信息"
}
```

| API 路径 | 方法 | 鉴权 | 说明 |
|----------|------|------|------|
| `/api/admin/stats` | GET | 管理员 | 概览统计数据 |
| `/api/admin/users` | GET | 管理员 | 用户列表（page/limit/search/isAdmin） |
| `/api/admin/users/[id]` | PATCH | 管理员 | 编辑用户 isAdmin |
| `/api/admin/[业务]` | GET | 管理员 | [业务对象]列表（page/limit/search/status） |
| `/api/admin/[业务]/[id]` | GET | 管理员 | [业务对象]详情 |
| `/api/admin/[业务]/[id]` | PATCH | 管理员 | 编辑 [业务对象] status |

---

## 3. Technical Constraints（技术约束）

- [ ] 必须复用现有技术栈（Next.js App Router + Prisma + JWT）
- [ ] 不引入新的 UI 组件库，用 Tailwind 手写
- [ ] 数据库唯一改动：User 表新增 `isAdmin` 字段（`is_admin` 列，默认 false）
- [ ] 所有管理 API 放在 `/api/admin/*` 路径下
- [ ] 所有管理 API 必须校验 JWT Token + `isAdmin === true`
- [ ] 管理员 API 校验失败返回 401（未登录）或 403（非管理员）
- [ ] 不删除现有 API，只新增管理 API
- [ ] 分页参数：`page` 默认 1，`limit` 默认 10，最大 100
- [ ] 搜索使用 `contains` 模式（不区分大小写）
- [ ] 不做删除功能
- [ ] 桌面端最小宽度 1024px，不做复杂响应式
- [ ] 统一响应格式：`{ success: boolean, data?: any, error?: string, pagination?: {...} }`

---

## 4. Non-goals（明确不做的事）

- [ ] 不做订单管理（如果项目没有订单概念，用业务对象替代）
- [ ] 不做金额相关功能（无 amount 字段时）
- [ ] 不做删除功能（用户删除、业务对象删除）
- [ ] 不做独立后台登录页（复用现有登录）
- [ ] 不做角色权限系统（只用 isAdmin 布尔值，不做多角色）
- [ ] 不做数据导出（CSV/Excel）
- [ ] 不做操作日志/审计日志
- [ ] 不做批量操作
- [ ] 不做复杂响应式（只保证桌面端）
- [ ] 不做 products、payments、logs 模块（后续扩展）

---

## 5. Success Criteria（成功标准）

### 5.1 数据库验证

- [ ] User 表成功新增 `is_admin` 字段（Boolean, 默认 false）
- [ ] 数据库迁移成功执行
- [ ] Prisma Client 重新生成成功
- [ ] 现有用户数据不受影响（isAdmin 默认 false）

### 5.2 鉴权验证

| 测试场景 | 预期结果 |
|----------|----------|
| 未登录访问 `/admin` | 重定向到 `/login` |
| 普通用户（isAdmin=false）访问 `/admin` | 重定向到 `/` |
| 管理员（isAdmin=true）访问 `/admin` | 正常访问 |
| 未登录调用 `/api/admin/*` | 返回 401 |
| 普通用户调用 `/api/admin/*` | 返回 403 |
| 管理员调用 `/api/admin/*` | 返回 200 + 数据 |
| 管理员登录后 | 自动跳转到 `/admin` |

### 5.3 功能验证

**概览页：**
- [ ] 显示用户总数
- [ ] 显示最近7天新增用户数
- [ ] 显示 [业务对象] 总数
- [ ] 显示最近7天 [业务对象] 数
- [ ] 显示 [业务对象] 状态分布

**用户管理：**
- [ ] 列表正确展示用户数据
- [ ] 搜索功能正常
- [ ] 按角色/状态筛选功能正常
- [ ] 分页正常
- [ ] 编辑 isAdmin/status 成功后列表刷新
- [ ] 编辑失败显示错误提示

**[业务对象]管理：**
- [ ] 列表正确展示数据（含用户信息）
- [ ] 搜索功能正常
- [ ] 按 status 筛选功能正常
- [ ] 分页正常
- [ ] 点击"查看"跳转到详情页
- [ ] 详情页展示完整信息
- [ ] 编辑 status 成功后刷新
- [ ] 非法状态值返回 400 错误

### 5.4 构建验证

- [ ] `npm run build` 成功通过
- [ ] 无 TypeScript 编译错误

---

## 6. 实施步骤

```
1. 数据库变更
   → User 表新增 isAdmin 字段
   → 运行 prisma migrate dev
   → 重新生成 Prisma Client

2. 改造认证
   → lib/auth.ts：generateToken/verifyToken 支持 isAdmin
   → /api/auth/login：响应新增 isAdmin 字段
   → AuthContext：User 接口新增 isAdmin，login 返回 User
   → 登录页：管理员登录跳转到 /admin

3. 创建管理员鉴权工具
   → lib/admin.ts：verifyAdmin(request) 工具函数

4. 创建后台 API
   → /api/admin/stats（概览统计）
   → /api/admin/users（列表：GET）
   → /api/admin/users/[id]（编辑：PATCH）
   → /api/admin/[业务]（列表：GET）
   → /api/admin/[业务]/[id]（详情：GET，编辑：PATCH）

5. 创建后台布局
   → /admin/layout.tsx（左侧导航 + 顶部标题 + 鉴权重定向）

6. 创建概览页
   → /admin/page.tsx（指标卡片 + 状态分布）

7. 创建用户管理页
   → /admin/users/page.tsx（列表 + 搜索 + 筛选 + 分页 + 编辑弹窗）

8. 创建 [业务对象] 管理页
   → /admin/[业务]/page.tsx（列表 + 搜索 + 筛选 + 分页）
   → /admin/[业务]/[id]/page.tsx（详情 + 编辑状态）

9. 验证测试
   → 数据库设置首个管理员
   → 登录验证鉴权
   → 各页面功能验证
   → npm run build 验证
```

---

## 7. 后续扩展说明

如果后续要继续做 products、payments、logs 等模块：

1. **新增路由**：`/admin/products`、`/admin/payments`、`/admin/logs`
2. **新增 API**：`/api/admin/products` 等
3. **左侧导航**：在现有导航中添加新入口
4. **复用布局**：`/admin/layout.tsx` 自动应用
5. **复用鉴权**：所有新 API 校验 JWT + isAdmin（复用 `lib/admin.ts`）
6. **复用分页**：沿用 page/limit 方案
7. **复用状态处理**：加载态、空状态、错误提示

---

## 三、避坑指南（实践总结）

### 坑1：登录后不跳后台

- **现象**：管理员登录后进入的是首页，不是后台
- **原因**：登录页固定 `router.push('/')`，没有判断 isAdmin
- **解决方案**：`login` 函数返回 User 对象，登录页根据 `user.isAdmin` 判断跳转目标

### 坑2：Prisma 7.x Adapter

- **现象**：`new PrismaClient()` 报错
- **原因**：Prisma 7.x 必须传 adapter 参数
- **解决方案**：
  ```typescript
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
  const prisma = new PrismaClient({ adapter });
  ```

### 坑3：isAdmin 为 false 时 JWT 不包含该字段

- **现象**：普通用户的 Token 解码后没有 isAdmin 字段
- **原因**：generateToken 没有传 isAdmin 参数
- **解决方案**：`generateToken(userId, email, user.isAdmin)`

### 坑4：真实 schema 与模板不一致

- **现象**：模板要求的字段在项目中不存在（如 name、order_no、amount）
- **解决方案**：
  - 先扫描项目真实 schema
  - 做字段映射表，明确替代关系
  - 不支持的字段直接跳过，不硬造数据
  - 在 SPEC 中说明映射关系

### 坑5：管理员权限如何初始化

- **现象**：加了 isAdmin 字段后，所有用户默认都是普通用户，没人能进后台
- **解决方案**：
  - 在 NEON/数据库控制台执行 SQL 设置首个管理员
  - 文档中明确说明设置步骤
  - 也可以选择"首个注册用户自动成为管理员"的策略

### 坑6：路由重定向闪烁

- **现象**：访问 /admin 时先看到页面再跳走
- **原因**：客户端组件 useEffect 中做重定向，有渲染延迟
- **解决方案**：
  - 在 useEffect 检查鉴权
  - 未通过鉴权时不渲染主内容，只显示"加载中..."
  - 后续可以考虑用 Next.js Middleware 做服务端重定向（可选优化）

---

## 四、最佳实践

1. **先扫描再设计**：先看真实 schema，再做后台设计，不假设字段存在
2. **字段映射表**：把模板字段和真实字段的映射关系写清楚，避免歧义
3. **最小数据库改动**：只加 isAdmin 一个字段，其他都用现有字段
4. **统一 API 格式**：所有管理 API 统一 `{ success, data, error, pagination }` 格式
5. **统一状态处理**：加载态、空状态、错误态保持一致的用户体验
6. **鉴权工具复用**：`verifyAdmin()` 一个函数搞定所有管理 API 的鉴权
7. **弹窗确认**：所有编辑操作都要有确认弹窗，防止误操作
8. **状态用枚举**：status 字段限定可选值，非法值返回 400
9. **不做删除**：管理后台不提供删除功能，降低风险
10. **逐步扩展**：先做核心的用户+业务管理，后续再加其他模块
