#!/usr/bin/env node
/**
 * 檢查 COLOR_MAP 每個 tag 在四種用法下都達 WCAG AA (4.5:1)：
 *   選取的篩選鈕（tag 色底 + 自動前景）、亮色主題的 chip 文字、暗色主題的 chip 文字。
 *
 * 這支存在的理由：白字寫死壓在 #F7DF1E 上讀不到，是人工挑前景色的必然結果。
 * 之後新增 tag 顏色時跑一次，壞掉會直接 exit 1。
 *
 *   node tools/check-contrast.mjs
 */
import { readFileSync } from 'node:fs'
import { contrast, foregroundFor, inkOn } from '../src/lib/color.mjs'

const SURFACE_LIGHT = '#ffffff'
const SURFACE_DARK = '#131317'
const TARGET = 4.5

// 只從 config.ts 取資料，演算法一律 import —— 檢查腳本不能自己算一套
const src = readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8')
const block = src.slice(src.indexOf('export const COLOR_MAP'))
const entries = [
  ...block
    .slice(0, block.indexOf('} as const'))
    .matchAll(/["']?([\w-]+)["']?:\s*\["(#[0-9A-Fa-f]{3,6})",\s*"(#[0-9A-Fa-f]{3,6})"\]/g)
].map(m => ({ tag: m[1], base: m[2], accent: m[3] }))

if (!entries.length) {
  console.error('✗ 讀不到 COLOR_MAP，config.ts 格式可能變了')
  process.exit(1)
}

const rows = []
let failed = 0

for (const { tag, base, accent } of entries) {
  const checks = [
    ['選取鈕', contrast(base, foregroundFor(base))],
    ['亮色 chip', contrast(inkOn(base, SURFACE_LIGHT), SURFACE_LIGHT)],
    ['暗色 chip', contrast(inkOn(base, SURFACE_DARK), SURFACE_DARK)],
    ['輔色可見度', contrast(accent, SURFACE_DARK)]
  ]
  for (const [what, ratio] of checks) {
    // 輔色只是圖案用色，不承載文字，門檻放寬到 1.6:1（看得見即可）
    const need = what === '輔色可見度' ? 1.6 : TARGET
    const pass = ratio >= need
    if (!pass) failed++
    rows.push(
      `${pass ? '✓' : '✗'} ${tag.padEnd(16)} ${what.padEnd(12)} ${ratio.toFixed(2)}:1 (需 ${need})`
    )
  }
}

console.log(rows.join('\n'))
console.log(
  `\n${entries.length} 個 tag，${rows.length} 項檢查，${failed} 項未達標`
)
process.exit(failed ? 1 : 0)
