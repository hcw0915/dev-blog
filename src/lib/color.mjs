/**
 * WCAG 對比度計算。用途是「給定一個 tag 色，算出讀得清楚的前景/文字色」，
 * 而不是每加一個顏色就人工挑一次 —— 人工挑正是白字壓在 #F7DF1E 上的原因。
 *
 * 純 .mjs 而非 .ts：tools/check-contrast.mjs 要能直接 import 同一份演算法，
 * 檢查腳本與網站不能各算各的。
 */

/** @param {string} hex @returns {[number, number, number]} */
const toRgb = hex => {
  const h = hex.replace('#', '')
  const n =
    h.length === 3
      ? h
          .split('')
          .map(c => c + c)
          .join('')
      : h
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ]
}

const toHex = (/** @type {number[]} */ rgb) =>
  '#' +
  rgb
    .map(v =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')

/** sRGB -> 線性 */
const lin = (/** @type {number} */ v) => {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** WCAG 相對亮度 @param {string} hex */
export const luminance = hex => {
  const [r, g, b] = toRgb(hex)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG 對比度，1 ~ 21 @param {string} a @param {string} b */
export const contrast = (a, b) => {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** 兩色線性內插 @param {string} a @param {string} b @param {number} t */
export const mix = (a, b, t) => {
  const ra = toRgb(a)
  const rb = toRgb(b)
  return toHex(ra.map((v, i) => v + (rb[i] - v) * t))
}

/** 壓在 bg 上要用黑字還是白字 @param {string} bg */
export const foregroundFor = bg =>
  contrast(bg, '#0b0b0f') >= contrast(bg, '#ffffff') ? '#0b0b0f' : '#ffffff'

/**
 * 把 color 往遠離 bg 的方向調亮/調暗，直到對比度達標。
 * 回傳仍看得出原色相的版本，達不到才退回純黑/純白。
 * @param {string} color 想用的顏色
 * @param {string} bg 背景色
 * @param {number} [target] 目標對比度，預設 4.5（WCAG AA 內文）
 */
export const inkOn = (color, bg, target = 4.5) => {
  if (contrast(color, bg) >= target) return color
  const toward = luminance(bg) > 0.35 ? '#000000' : '#ffffff'
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = mix(color, toward, t)
    if (contrast(c, bg) >= target) return c
  }
  return toward
}
