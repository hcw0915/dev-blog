/**
 * 生成式縮圖：slug 決定圖案，tag 決定顏色，全在 build 時算完。
 * 不產生任何圖片檔，同一個 slug 永遠畫出同一張圖。
 *
 * 分層原則：
 *   圖案 = 氛圍層，每篇唯一，不負責精確解碼
 *   chips = 精確層，讀者要知道「是哪幾個主題」看 chips
 * 先前的做法是把多個 tag 色做成平滑漸層，插值會把色彩身分糊掉 —— 離散語意
 * 不能用連續插值表達，所以這裡一律「指派」顏色給個別元素，絕不混色。
 *
 * ponytail: inline SVG，每張約 100~180 個節點。若 /posts 的節點數變成瓶頸，
 * 改成 data: URI 背景圖可降到 0 個 DOM 節點，代價是失去跟隨主題的底色。
 */
import { paletteForTags, type TagColor } from "@/lib/tags"

const W = 400
const H = 150
const BOOST = 1.45 // 明亮化係數：底部 scrim 拿掉後，元素本身要夠亮才撐得住畫面

type Rand = () => number

const hash = (s: string): number => {
  let h = 2166136261
  for (const c of s) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32：同一 seed 永遠同一序列 */
const rng = (seed: number): Rand => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** 主題色拿 55% 的元素，其餘 tag 平分；每個 tag 內再分主色 / 輔色 */
const pick = (cols: TagColor[], r: Rand): string => {
  const x = r()
  let i = 0
  if (cols.length > 1 && x >= 0.55) {
    i = Math.min(
      Math.floor(((x - 0.55) / 0.45) * (cols.length - 1)) + 1,
      cols.length - 1
    )
  }
  return r() < 0.62 ? cols[i].base : cols[i].accent
}

const O = (r: Rand, lo: number, hi: number) =>
  Math.min(1, (lo + r() * (hi - lo)) * BOOST).toFixed(2)
const N = (v: number) => v.toFixed(1)

type Pattern = (r: Rand, c: TagColor[]) => string

const PATTERNS: Record<string, Pattern> = {
  // 星野：細碎點 + 少數大光斑
  particles: (r, c) =>
    Array.from(
      { length: 8 },
      () =>
        `<circle cx="${N(r() * W)}" cy="${N(r() * H)}" r="${N(18 + r() * 34)}" fill="${pick(c, r)}" opacity="${O(r, 0.05, 0.16)}"/>`
    ).join("") +
    Array.from(
      { length: 80 },
      () =>
        `<circle cx="${N(r() * W)}" cy="${N(r() * H)}" r="${N(0.6 + r() * 2.6)}" fill="${pick(c, r)}" opacity="${O(r, 0.25, 0.9)}"/>`
    ).join(""),

  // 波紋：偏心同心圓 + 環上散點
  rings: (r, c) => {
    const cx = W * (0.15 + r() * 0.7)
    const cy = H * (0.1 + r() * 0.8)
    return (
      Array.from(
        { length: 15 },
        (_, i) =>
          `<circle cx="${N(cx)}" cy="${N(cy)}" r="${N(10 + i * (8 + r() * 11))}" fill="none" stroke="${pick(c, r)}" stroke-width="${N(0.6 + r() * 2.6)}" opacity="${O(r, 0.18, 0.6)}"/>`
      ).join("") +
      Array.from({ length: 26 }, () => {
        const a = r() * 6.283
        const rad = 20 + r() * 150
        return `<circle cx="${N(cx + Math.cos(a) * rad)}" cy="${N(cy + Math.sin(a) * rad)}" r="${N(1 + r() * 2.4)}" fill="${pick(c, r)}" opacity="${O(r, 0.35, 0.85)}"/>`
      }).join("")
    )
  },

  // 低多邊形：網格頂點抖動後切三角
  lowpoly: (r, c) => {
    const cx = 7
    const cy = 3
    const gw = W / cx
    const gh = H / cy
    const grid = Array.from({ length: cy + 1 }, (_, j) =>
      Array.from({ length: cx + 1 }, (_, i): [number, number] => [
        i * gw + (i && i < cx ? (r() - 0.5) * gw * 0.7 : 0),
        j * gh + (j && j < cy ? (r() - 0.5) * gh * 0.7 : 0)
      ])
    )
    let s = ""
    for (let j = 0; j < cy; j++) {
      for (let i = 0; i < cx; i++) {
        const a = grid[j][i]
        const b = grid[j][i + 1]
        const d = grid[j + 1][i]
        const e = grid[j + 1][i + 1]
        s += `<polygon points="${N(a[0])},${N(a[1])} ${N(b[0])},${N(b[1])} ${N(d[0])},${N(d[1])}" fill="${pick(c, r)}" opacity="${O(r, 0.12, 0.6)}"/>`
        s += `<polygon points="${N(b[0])},${N(b[1])} ${N(e[0])},${N(e[1])} ${N(d[0])},${N(d[1])}" fill="${pick(c, r)}" opacity="${O(r, 0.12, 0.6)}"/>`
      }
    }
    return s
  },

  // 蜂巢：六邊形晶格，部分填實
  hex: (r, c) => {
    const rad = 15
    const hw = Math.sqrt(3) * rad
    const vh = rad * 1.5
    const hexAt = (x: number, y: number) =>
      Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 180) * (60 * k - 30)
        return `${N(x + rad * Math.cos(a))},${N(y + rad * Math.sin(a))}`
      }).join(" ")
    let s = ""
    for (let row = 0; row * vh < H + rad; row++) {
      for (let col = 0; col * hw < W + hw; col++) {
        const x = col * hw + (row % 2 ? hw / 2 : 0)
        const y = row * vh
        s += `<polygon points="${hexAt(x, y)}" fill="${r() > 0.58 ? pick(c, r) : "none"}" opacity="${O(r, 0.18, 0.62)}" stroke="${pick(c, r)}" stroke-opacity="0.14" stroke-width="1"/>`
      }
    }
    return s
  },

  // 流場：左右穿越的貝茲曲線束
  flow: (r, c) =>
    Array.from({ length: 20 }, () => {
      const y0 = r() * H
      const y1 = r() * H
      return `<path d="M-20 ${N(y0)} C ${N(W * 0.3)} ${N(y0 + (r() - 0.5) * 130)}, ${N(W * 0.7)} ${N(y1 + (r() - 0.5) * 130)}, ${N(W + 20)} ${N(y1)}" fill="none" stroke="${pick(c, r)}" stroke-width="${N(0.8 + r() * 3.4)}" opacity="${O(r, 0.18, 0.7)}"/>`
    }).join(""),

  // 泡泡：半透明大圓疊層
  bubbles: (r, c) =>
    Array.from(
      { length: 30 },
      () =>
        `<circle cx="${N(r() * W)}" cy="${N(r() * H)}" r="${N(6 + r() * 36)}" fill="${pick(c, r)}" opacity="${O(r, 0.07, 0.3)}" stroke="${pick(c, r)}" stroke-opacity="${O(r, 0.1, 0.45)}"/>`
    ).join(""),

  // 馬賽克：非等格矩形拼貼
  mosaic: (r, c) => {
    let s = ""
    let y = 0
    while (y < H) {
      const h = 12 + r() * 34
      let x = 0
      while (x < W) {
        const w = 14 + r() * 46
        if (r() > 0.22) {
          s += `<rect x="${N(x)}" y="${N(y)}" width="${N(w - 2)}" height="${N(h - 2)}" fill="${pick(c, r)}" opacity="${O(r, 0.1, 0.58)}"/>`
        }
        x += w
      }
      y += h
    }
    return s
  },

  // 星座：節點 + 近鄰連線
  constellation: (r, c) => {
    const pts = Array.from({ length: 26 }, (): [number, number] => [
      r() * W,
      r() * H
    ])
    let s = ""
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])
        if (d < 62) {
          s += `<line x1="${N(pts[i][0])}" y1="${N(pts[i][1])}" x2="${N(pts[j][0])}" y2="${N(pts[j][1])}" stroke="${pick(c, r)}" stroke-width="0.9" opacity="${(0.5 - d / 160).toFixed(2)}"/>`
        }
      }
    }
    return (
      s +
      pts
        .map(
          p =>
            `<circle cx="${N(p[0])}" cy="${N(p[1])}" r="${N(1.4 + r() * 3.2)}" fill="${pick(c, r)}" opacity="${O(r, 0.5, 0.95)}"/>`
        )
        .join("")
    )
  },

  // 螺旋：極座標點陣
  spiral: (r, c) => {
    const cx = W * (0.3 + r() * 0.4)
    const cy = H * 0.5
    const turns = 4 + r() * 3
    return Array.from({ length: 150 }, (_, i) => {
      const t = i / 150
      const a = t * turns * 6.283
      const rad = t * 130
      return `<circle cx="${N(cx + Math.cos(a) * rad * 1.5)}" cy="${N(cy + Math.sin(a) * rad * 0.62)}" r="${N(0.7 + t * 3.4)}" fill="${pick(c, r)}" opacity="${(0.25 + t * 0.6).toFixed(2)}"/>`
    }).join("")
  },

  // 波形：堆疊正弦折線
  waves: (r, c) =>
    Array.from({ length: 10 }, (_, i) => {
      const base = i * (H / 9)
      const amp = 6 + r() * 22
      const f = 0.01 + r() * 0.03
      const ph = r() * 6.283
      const d = Array.from({ length: 41 }, (_, k) => {
        const x = k * (W / 40)
        return `${k ? "L" : "M"}${N(x)} ${N(base + Math.sin(x * f + ph) * amp)}`
      }).join(" ")
      return `<path d="${d}" fill="none" stroke="${pick(c, r)}" stroke-width="${N(0.8 + r() * 2.6)}" opacity="${O(r, 0.2, 0.7)}"/>`
    }).join(""),

  // 等距方塊：偽 3D 平行四邊形
  blocks: (r, c) => {
    let s = ""
    for (let j = 0; j < 6; j++) {
      for (let i = 0; i < 14; i++) {
        if (r() > 0.55) continue
        const x = i * 30 + (j % 2 ? 15 : 0) - 20
        const y = j * 28 - 20
        const w = 26
        const h = 13
        s += `<polygon points="${N(x)},${N(y + h)} ${N(x + w / 2)},${N(y)} ${N(x + w)},${N(y + h)} ${N(x + w / 2)},${N(y + h * 2)}" fill="${pick(c, r)}" opacity="${O(r, 0.14, 0.6)}"/>`
      }
    }
    return s
  }
}

const KINDS = Object.keys(PATTERNS)

export interface ThumbPost {
  slug: string
  tags: string[]
}

/**
 * 同一主題的文章輪流取圖案，保證系列內不撞。
 * 純靠 hash(slug) % KINDS.length 會讓 AntiThree 那種 5 篇同 tag 的系列
 * 有機率抽到重複圖案，看起來像沒生成。
 */
export const assignKinds = (posts: ThumbPost[]): Record<string, string> => {
  const byTag: Record<string, ThumbPost[]> = {}
  for (const p of posts) {
    const t = paletteForTags(p.tags)[0]?.tag ?? "_"
    ;(byTag[t] ||= []).push(p)
  }
  const out: Record<string, string> = {}
  for (const [tag, list] of Object.entries(byTag)) {
    const offset = hash(tag) % KINDS.length
    list
      .slice()
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .forEach((p, i) => {
        out[p.slug] = KINDS[(offset + i) % KINDS.length]
      })
  }
  return out
}

/** 底色與整體不透明度走 CSS 變數，縮圖才會跟著亮/暗主題走 */
export const thumbSvg = (
  slug: string,
  tags: string[],
  kind = KINDS[hash(slug) % KINDS.length]
): string => {
  const cols = paletteForTags(tags)
  if (!cols.length) {
    cols.push({ tag: "", base: "#a1a1aa", accent: "#d4d4d8" })
  }
  const draw = PATTERNS[kind] ?? PATTERNS.particles
  const art = draw(rng(hash(slug)), cols)
  const second = cols.length > 1 ? cols[1] : cols[0]
  return `<svg class="thumb" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <rect class="t-bg" width="${W}" height="${H}"/>
  <rect class="t-tint" width="${W}" height="${H}" fill="${cols[0].base}"/>
  <rect class="t-tint2" width="${W}" height="${H}" fill="${second.accent}"/>
  <g class="t-art">${art}</g>
</svg>`
}
