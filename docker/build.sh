#!/bin/bash

cd "$(dirname "$0")"

build() {
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    docker build -t apifox-local:latest -t apifox-local:${TIMESTAMP} -f Dockerfile ..
}

run() {
    PORT=${2:-3000}
    docker run -d -p ${PORT}:3000 -v apifox-data:/app/runtime --name apifox-local apifox-local
}

export_image() {
    docker save apifox-local -o apifox-local.tar
}

import_image() {
    docker load -i apifox-local.tar
}

stop() {
    docker stop apifox-local && docker rm apifox-local
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
        import_image
        ;;
    *)
        echo "Usage: $0 {build|start|stop|export|import} [port]"
        echo ""
        echo "  build       - Build Docker image"
        echo "  start [port]- Run container (default port: 3000)"
        echo "  stop        - Stop and remove container"
        echo "  export      - Export image to apifox-local.tar"
        echo "  import      - Import image from apifox-local.tar"
        ;;
esac
