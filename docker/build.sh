#!/bin/bash

cd "$(dirname "$0")"

build() {
    docker build -t apifox-local -f Dockerfile ..
}

run() {
    docker run -p 3000:3000 -v apifox-data:/app/data apifox-local
}

export_image() {
    docker save apifox-local -o apifox-local.tar
}

import_image() {
    docker load -i apifox-local.tar
}

case "$1" in
    build)
        build
        ;;
    start)
        run
        ;;
    export)
        export_image
        ;;
    import)
        import_image
        ;;
    *)
        echo "Usage: $0 {build|start|export|import}"
        echo ""
        echo "  build   - Build Docker image"
        echo "  start   - Run container with persistent data"
        echo "  export  - Export image to apifox-local.tar"
        echo "  import  - Import image from apifox-local.tar"
        ;;
esac
