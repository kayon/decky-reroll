#!/bin/sh
set -e

echo "Container's IP address: `awk 'END{print $1}' /etc/hosts`"

# memscan is built from source, pinned to an exact commit, so the plugin and the engine
# always come from a known pair. This currently points at the multi-type search feature
# branch proposed to this engine (see the companion PR to kayon/memscan); once that is
# merged, point MEMSCAN_REPO/MEMSCAN_REF back at kayon/memscan's own default branch.
# Override with: MEMSCAN_REPO=<owner>/<repo> MEMSCAN_REF=<commit|tag|branch> in the environment.
MEMSCAN_REPO="${MEMSCAN_REPO:-naparuba/memscan}"
MEMSCAN_REF="${MEMSCAN_REF:-286778aa752230f5da9ddee9cec8ab4dd1fdbee3}"
BACKEND_SHARED="memscan.so"
ARCHIVE_URL="https://github.com/$MEMSCAN_REPO/archive/$MEMSCAN_REF.tar.gz"

SRC_DIR="$(mktemp -d)"
mkdir -p /backend/out

echo "Fetching memscan sources ($MEMSCAN_REPO @ $MEMSCAN_REF)..."
curl -fsSL "$ARCHIVE_URL" | tar -xz --strip-components=1 -C "$SRC_DIR"

echo "Building $BACKEND_SHARED..."
# go.mod may require a newer Go than the image ships; GOTOOLCHAIN=auto fetches it.
cd "$SRC_DIR/cmd/backend"
GOTOOLCHAIN=auto CGO_ENABLED=1 GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o "/backend/out/$BACKEND_SHARED" \
    -buildmode=c-shared

# the cgo header is not needed by the plugin
rm -f "/backend/out/${BACKEND_SHARED%.so}.h"
chmod +x "/backend/out/$BACKEND_SHARED"
rm -rf "$SRC_DIR"
