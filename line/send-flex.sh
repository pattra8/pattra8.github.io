#!/usr/bin/env bash
# ── LINE Flex push (รูป + ข้อความ) ──────────────────────────────
# วิธีใช้:
#   export LINE_TOKEN="<Channel Access Token>"
#   export LINE_TARGET="<userId | groupId | roomId>"   # เว้นว่าง = broadcast
#   ./send-flex.sh "<IMAGE_URL(https)>" "<หัวข้อ>" "<ข้อความ>"
#
# ตัวอย่าง:
#   ./send-flex.sh "https://example.com/car.jpg" "แจ้งเตือน" "พบรถเข้าหมู่บ้าน"
set -euo pipefail

IMAGE_URL="${1:?ต้องใส่ URL รูป (https)}"
TITLE="${2:-แจ้งเตือน}"
BODY="${3:-}"
: "${LINE_TOKEN:?ต้อง export LINE_TOKEN}"

# ── ประกอบ Flex bubble: รูป (hero) + หัวข้อ + ข้อความ ──
flex=$(cat <<JSON
{
  "type": "flex",
  "altText": "${TITLE}",
  "contents": {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": "${IMAGE_URL}",
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "md",
      "contents": [
        { "type": "text", "text": "${TITLE}", "weight": "bold", "size": "lg", "wrap": true },
        { "type": "text", "text": "${BODY}", "size": "sm", "color": "#555555", "wrap": true }
      ]
    }
  }
}
JSON
)

if [ -n "${LINE_TARGET:-}" ]; then
  endpoint="https://api.line.me/v2/bot/message/push"
  payload="{\"to\":\"${LINE_TARGET}\",\"messages\":[${flex}]}"
else
  endpoint="https://api.line.me/v2/bot/message/broadcast"
  payload="{\"messages\":[${flex}]}"
fi

curl -sS -X POST "${endpoint}" \
  -H "Authorization: Bearer ${LINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${payload}"
echo
