// 下載 OG 圖渲染用的 CJK 字型（satori 需要 otf/ttf 字型資料）
import fs from 'node:fs'
import path from 'node:path'

const FONT_URL =
  'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Bold.otf'
const dest = path.resolve('.fonts/NotoSansCJKtc-Bold.otf')

if (fs.existsSync(dest)) {
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), { recursive: true })
console.log('Downloading OG font (one-time, ~16MB)...')
let res
try {
  res = await fetch(FONT_URL, { signal: AbortSignal.timeout(30000) })
} catch (err) {
  console.error(`OG font download failed/timed out: ${err.message}`)
  process.exit(1)
}
if (!res.ok) {
  console.error(`OG font download failed: HTTP ${res.status}`)
  process.exit(1)
}
fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
console.log(`OG font saved to ${dest}`)
