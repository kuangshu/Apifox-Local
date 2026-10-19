# Agents

## 开发命令

```sh
pnpm dev      # 启动开发服务器，端口 5174（外部可访问，host: true）
pnpm build    # 构建生产版本
pnpm start    # 运行生产版本（react-router-serve ./build/server/index.js）
pnpm lint     # 运行：tsc --noEmit --skipLibCheck && eslint && stylelint
```

## 数据库

- SQLite 文件位于 `runtime/apifox-collab.sqlite`（gitignore，首次运行自动创建）
- 启动时自动在 `runtime/` 目录下创建所需表结构

## 架构

- `src/app/` - 页面路由和 API 路由处理器
- `src/components/` - UI 组件、编辑器、设置面板
- `src/server/` - 业务逻辑、导入导出、请求执行器、SQLite 仓储
- `src/contexts/` - 全局状态和编辑上下文
- `@/*` 别名映射到 `./src/*`

## 框架注意事项

- React Router v7 启用 SSR（`react-router.config.ts` 中 `ssr: true`）
- Tailwind 仅扫描 `src/{app,components}/**/*.{js,jsx,ts,tsx}` — 新增组件目录需加入此 pattern
- ESLint 使用 `prefer-code-style/next` 预设，`@typescript-eslint/no-unsafe-assignment` 已禁用
- Stylelint 使用 `prefer-code-style` 预设

## Docker

```sh
cd docker
./build.sh build   # 构建镜像
./build.sh start   # 运行容器
./build.sh stop    # 停止容器
./build.sh export  # 导出镜像为 tar
./build.sh import  # 从 tar 导入镜像
```

## 导入/导出

- 导入：OpenAPI 3.x、Postman Collection v2/v2.1（`.json`、`.yaml`、`.yml`）
- 导入为静默合并，不会清空已有资源
- 导出：OpenAPI JSON/YAML（需要 `editor` 或更高权限）
- 支持从 cURL 导入单条请求

## 关键约束

- Node >= 20
- pnpm >= 9
- Binary Body 已建模，但请求运行器暂不支持执行
