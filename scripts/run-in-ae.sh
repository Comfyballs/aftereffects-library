#!/usr/bin/env bash
# Run a .jsx file in After Effects through the AE-MCP panel's file queue.
# Requires the panel open (Window > Extensions > AE-MCP). Prints the panel's JSON response.
set -euo pipefail

jsx="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
queue="$HOME/Documents/ae-mcp-commands"
id="cmd_$(date +%s)_$$"
cmd="$queue/cli_${id}.json"

mkdir -p "$queue"
python3 - "$cmd" "$id" "$jsx" <<'EOF'
import json, sys, time
path, cid, jsx = sys.argv[1:]
script = '$.evalFile(new File(%s))' % json.dumps(jsx)
json.dump({"id": cid, "script": script, "timestamp": int(time.time() * 1000)}, open(path, "w"))
EOF

for _ in $(seq 1 600); do
  if [[ -s "$cmd.response" ]]; then  # -s: the panel creates the file before it finishes writing
    cat "$cmd.response"; echo
    rm -f "$cmd.response" "$cmd" "$cmd.processed"
    exit 0
  fi
  sleep 0.1
done
rm -f "$cmd"
echo "Timed out: is the AE-MCP panel open?" >&2
exit 1
