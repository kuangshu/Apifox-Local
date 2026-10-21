#!/bin/bash

cd "$(dirname "$0")"

# clean 命令保留最近几个 apifox-local 镜像（含 latest），更老的删掉
KEEP=${KEEP:-2}

build() {
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    docker build -t apifox-local:latest -t apifox-local:${TIMESTAMP} -f Dockerfile ..
}

run() {
    PORT=${2:-3000}
    docker run -d -p ${PORT}:3000 -v apifox-data:/app/runtime --name apifox-local apifox-local
}

# 找出 latest 对应的 14 位时间戳 tag；若 latest 没有时间戳 tag（例如手工 tag 过），现场补一个
latest_timestamp_tag() {
    local id tag
    id=$(docker images -q apifox-local:latest 2>/dev/null)
    if [ -z "$id" ]; then
        echo "错误：找不到 apifox-local:latest，请先执行 ./build.sh build" >&2
        return 1
    fi
    tag=$(docker images apifox-local --format "{{.ID}}|{{.Tag}}" \
          | awk -F'|' -v id="$id" '$1 == id && $2 ~ /^[0-9]{14}$/ { print $2 }' \
          | sort -r | head -1)
    if [ -z "$tag" ]; then
        tag=$(date +%Y%m%d%H%M%S)
        docker tag apifox-local:latest "apifox-local:$tag" >&2
        echo "（latest 没有时间戳 tag，已补打 apifox-local:$tag）" >&2
    fi
    echo "$tag"
}

export_image() {
    local tag out
    tag=$(latest_timestamp_tag) || return 1
    out="apifox-local-${tag}.tar"
    # 同时写时间戳 tag 和 latest：指向同一镜像，层只存一份，体积几乎不增加
    docker save -o "$out" "apifox-local:${tag}" apifox-local:latest || return 1
    echo "已导出: $(pwd)/${out}  ($(du -h "$out" | cut -f1))"
    echo "内含 tag: apifox-local:${tag} , apifox-local:latest"
}

import_image() {
    local file=${2:-}
    if [ -z "$file" ]; then
        file=$(ls -t apifox-local*.tar 2>/dev/null | head -1)
        if [ -z "$file" ]; then
            echo "错误：当前目录没有 apifox-local*.tar，可指定文件：$0 import <file>" >&2
            return 1
        fi
    fi
    echo "导入: ${file}"
    docker load -i "$file"
}

stop() {
    docker stop apifox-local && docker rm apifox-local
}

clean() {
    local keep=${2:-$KEEP}
    local images total old
    # 按创建时间倒序去重
    images=$(docker images apifox-local --format "{{.CreatedAt}}|{{.ID}}" | sort -ru | cut -d'|' -f2 | awk '!seen[$0]++')
    total=$(echo "$images" | grep -c .)
    if [ "$total" -le "$keep" ]; then
        echo "当前只有 $total 个 apifox-local 镜像，无需清理（保留 $keep 个）"
        return 0
    fi
    old=$(echo "$images" | tail -n +$((keep + 1)))
    echo "将删除以下 $((total - keep)) 个旧镜像（保留最近 $keep 个）："
    echo "$old"
    echo "$old" | xargs -r docker rmi
}

case "$1" in
    build)
        build
        ;;
    start)
        run "$@"
        ;;
    stop)
        stop
        ;;
    export)
        export_image
        ;;
    import)
        import_image "$@"
        ;;
    clean)
        clean "$@"
        ;;
    *)
        echo "Usage: $0 {build|start|stop|export|import|clean} [port|keep|file]"
        echo ""
        echo "  build         - Build Docker image (tags: latest + 时间戳)"
        echo "  start [port]  - Run container (default port 3000)"
        echo "  stop          - Stop and remove container"
        echo "  export        - Export to apifox-local-<时间戳>.tar (含时间戳 tag + latest)"
        echo "  import [file] - Import from tar (默认取最新的 apifox-local*.tar)"
        echo "  clean [n]     - Remove older apifox-local images, keep newest n (default 2)"
        ;;
esac
