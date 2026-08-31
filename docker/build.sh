# 构建镜像
docker build -t apifox-local -f Dockerfile ..

# 运行容器（临时）
docker run -p 3000:3000 apifox-local

# 运行容器（持久化数据）
docker run -p 3000:3000 -v apifox-data:/app/data apifox-local

# 导出镜像
docker save apifox-local -o apifox-local.tar

# 导入镜像（在其他机器上）
docker load -i apifox-local.tar
