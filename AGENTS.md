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

构建与导出用 `docker/build.sh`；容器运行参数（镜像名、容器名、端口、数据卷、重启策略）统一由仓库根的 `docker-compose.yml` 定义，`build.sh start/stop` 只做转发。

```sh
cd docker
./build.sh build         # 构建镜像，打 latest + 时间戳两个 tag
./build.sh start [port]  # docker compose up -d（默认 3000）
./build.sh stop          # docker compose down（数据卷 apifox-data 保留）
./build.sh export        # 导出 apifox-local-<时间戳>.tar（内含时间戳 tag + latest）
./build.sh import [file] # 导入 tar，默认取最新的 apifox-local*.tar
./build.sh clean [n]     # 删除旧镜像，保留最近 n 个（默认 2）
```

- 换端口：`./build.sh start 8080` 或 `PORT=8080 docker compose up -d`
- 数据卷 `apifox-data` 挂载到容器内 `/app/runtime`，`stop` 不会删除数据
- 查看 tar 内 tag：`tar -xOf apifox-local-<时间戳>.tar manifest.json`
- 构建缓存：`Dockerfile` 分 base/deps/builder/prod-deps/runner 五阶段，两个依赖层只由 lockfile 决定。只改业务代码约 152 秒（其中约 143 秒是 `vite build`）；改 `package.json` 或 `pnpm-lock.yaml` 会触发两次依赖安装
- `.dockerignore` 必须放在**仓库根**（构建上下文是项目根），放在 `docker/` 下不生效

## 导入/导出

- 导入：OpenAPI 3.x、Postman Collection v2/v2.1（`.json`、`.yaml`、`.yml`）
- 导入为静默合并，不会清空已有资源
- 导出：OpenAPI JSON/YAML（需要 `editor` 或更高权限）
- 支持从 cURL 导入单条请求

## 关键约束

- Node >= 20
- pnpm >= 9
- Binary Body 已建模，但请求运行器暂不支持执行
