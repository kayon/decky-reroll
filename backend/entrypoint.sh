#!/bin/sh
set -e

echo "Container's IP address: `awk 'END{print $1}' /etc/hosts`"

BACKEND_REPO="github.com/kayon/memscan"
BACKEND_VERSION="v0.2.1"
BACKEND_SHARED="memscan.so"

export GO111MODULE=on
export CGO_ENABLED=1

mkdir -p /tmp/build_workspace && cd /tmp/build_workspace
go mod init build_context
go get "${BACKEND_REPO}@${BACKEND_VERSION}"
SOURCE_DIR=$(go list -m -f '{{.Dir}}' "${BACKEND_REPO}@${BACKEND_VERSION}")

if [ -z "$SOURCE_DIR" ]; then
    echo "Error: Failed to locate source for ${BACKEND_VERSION}"
    exit 1
fi

cd "$SOURCE_DIR/cmd/backend"
chmod -R +w .
make
mkdir -p /backend/out
cp $BACKEND_SHARED /backend/out
