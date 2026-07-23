#!/usr/bin/env bash
# polem.org 복구 감시 — Neon 무료 컴퓨트 quota 리셋을 기다리는 동안 매시간 확인.
# launchd(com.polem.recovery-watch, 매시 30분)가 호출.
#  - 아직 500(다운): 조용히 로그만(다운 스팸 방지).
#  - 200(복구): 텔레그램 1회 알림 + 일시정지했던 헬스체크 재개 + 이 감시 자기 종료.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
LOG="$HOME/polem/launchd/recovery-watch.log"
HC_PLIST="$HOME/Library/LaunchAgents/com.polem.healthcheck-fallback.plist"
SELF_PLIST="$HOME/Library/LaunchAgents/com.polem.recovery-watch.plist"
TG="$HOME/bin/tg_send.sh"
TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"

code="$(curl -s -m 25 -o /dev/null -w '%{http_code}' -L https://polem.org/ 2>/dev/null || echo 000)"
echo "[$TS] polem.org HTTP $code" >> "$LOG"

if [ "$code" = "200" ]; then
  "$TG" "✅ polem.org 복구됨 (HTTP 200)!
Neon 무료 컴퓨트 quota가 리셋된 것으로 보입니다. 데이터 그대로 살아있고, 폴러는 이미 고쳐서 재발 안 합니다.
모니터링(헬스체크) 자동 재개합니다. (${TS})"
  launchctl load "$HC_PLIST" 2>/dev/null || true   # 일시정지했던 헬스체크 재개
  launchctl unload "$SELF_PLIST" 2>/dev/null || true # 이 감시는 임무 완료 → 종료
fi
