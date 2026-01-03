#!/bin/sh
set -e

echo "Container's IP address: `awk 'END{print $1}' /etc/hosts`"

BACKEND_VERSION="v0.3.0"
BACKEND_SHARED="memscan.so"
RELEASE_URL="https://github.com/kayon/memscan/releases/download/$BACKEND_VERSION/$BACKEND_SHARED"

mkdir -p /backend/out
echo "Downloading backend binary..."
curl -L -o "./backend/out/$BACKEND_SHARED" "$RELEASE_URL"
if [ $? -ne 0 ]; then
    echo "Error: Failed to download binary from GitHub."
    exit 1
fi

chmod +x "/backend/out/$BACKEND_SHARED"

