#!/bin/bash
# Inkdrop -> git -> Vercel 自動發布。
# live-export 盯著本機 Inkdrop server，笔记一存就重写 src/pages/posts/*.md；
# 這支再把檔案變動 commit + push，Vercel 的 GitHub 整合接手部署。
# 由 launchd 開機啟動：~/Library/LaunchAgents/com.hcw.dev-blog.publish.plist
set -u

cd "$(dirname "$0")/.." || exit 1

NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"

"$NODE_BIN" --experimental-vm-modules tools/import.mjs &
IMPORT_PID=$!
trap 'kill $IMPORT_PID 2>/dev/null' EXIT

# ponytail: 兩分鐘輪詢就夠，發文不是高頻動作；要秒級再換 fswatch
while sleep 120; do
  # 匯出程序掛了就整支退出，讓 launchd 依 KeepAlive 重啟；否則會變成一個
  # 只會 commit、永遠拉不到新笔记的殭屍迴圈
  kill -0 "$IMPORT_PID" 2>/dev/null || exit 1

  git add -A src/pages/posts public/posts
  git diff --cached --quiet && continue

  git commit -q -m "post: sync from inkdrop ($(date '+%Y-%m-%d %H:%M'))"
  git push -q origin main || echo "[watch-publish] push failed $(date)" >&2
done
