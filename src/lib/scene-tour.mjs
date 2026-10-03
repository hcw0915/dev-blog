/**
 * 「3D 場景」頁的鏡頭導覽：停靠點資料與鏡頭數學。
 *
 * 鏡頭由網頁程式驅動（不是 Spline 的 States）：上下樓要能被鍵盤、按鈕、滑動、手機體感
 * 四種輸入共用，而且要能用瀏覽器自動測試 —— 寫在 Spline 裡的事件做不到後兩件。
 * 座標是 Spline 場景的世界座標（Cascade 群組在 x=20000，往 -z 方向爬升）。
 *
 * 純 .mjs：`node src/lib/scene-tour.mjs` 直接跑自檢。
 */

/** 停靠點：鏡頭位置、注視點、標籤。路徑在相鄰兩點間直線內插，已確認會越過每一層的立面頂端 */
export const STOPS = [
  { pos: [20000, 260, 2300], look: [20000, 300, -800], zh: "雕塑公園", en: "Sculpture garden" },
  ...[1, 2, 3, 4].map(k => ({
    pos: [20000, 470 * k + 180, -1300 * k + 250],
    look: [20000, 470 * k + 230, -1300 * k - 800],
    zh: `第 ${k} 層平台`,
    en: `Terrace ${k}`,
  })),
  { pos: [20000, 2530, -6100], look: [20000, 3600, -8250], zh: "頂層觀景台", en: "Top viewing terrace" },
  // 站在紀念碑側後方的高處往山下看整座 Cascade；偏到 x=20900 是為了讓路徑繞過碑身
  { pos: [20900, 4300, -9300], look: [20000, 1900, -2500], zh: "紀念碑平台", en: "Monument plaza" },
]

export const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** 以 pos 為中心把注視方向水平轉 yaw、上下抬 pitch（弧度），回傳新的注視點 */
export const offsetLook = (pos, look, yaw, pitch) => {
  const d = look.map((v, i) => v - pos[i])
  const horiz = Math.hypot(d[0], d[2])
  const dist = Math.hypot(horiz, d[1])
  const baseYaw = Math.atan2(d[0], d[2])
  const basePitch = Math.atan2(d[1], horiz)
  const p = Math.max(-1.3, Math.min(1.3, basePitch + pitch))
  const y = baseYaw + yaw
  return [pos[0] + Math.sin(y) * Math.cos(p) * dist, pos[1] + Math.sin(p) * dist, pos[2] + Math.cos(y) * Math.cos(p) * dist]
}

/**
 * 鏡頭朝 look 看時的 three.js Euler（XYZ 順序、弧度）。鏡頭看向自己的 -Z。
 * 直接算旋轉矩陣再拆 Euler，而不是分別算 yaw / pitch：轉身 180° 時（最後一站往山下看）
 * 分開算的 pitch 會整個反向。
 */
export const lookAtEuler = (pos, look) => {
  const f = look.map((v, i) => v - pos[i])
  const n = v => { const l = Math.hypot(...v) || 1; return v.map(c => c / l) }
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const z = n(f.map(c => -c))
  const x = n(cross([0, 1, 0], z))
  const y = cross(z, x)
  // 欄向量 x / y / z 組成的矩陣，依 three.js Euler.setFromRotationMatrix（XYZ）拆解
  const m13 = z[0], m23 = z[1], m33 = z[2], m12 = y[0], m11 = x[0], m32 = y[2], m22 = y[1]
  const ry = Math.asin(Math.max(-1, Math.min(1, m13)))
  return Math.abs(m13) < 0.9999999
    ? { x: Math.atan2(-m23, m33), y: ry, z: Math.atan2(-m12, m11) }
    : { x: Math.atan2(m32, m22), y: ry, z: 0 }
}

// 自檢：node src/lib/scene-tour.mjs
// 這支也會被瀏覽器載入，那裡沒有 process —— 不先判斷就會在模組載入時直接丟錯
if (typeof process !== "undefined" && import.meta.url === `file://${process.argv[1]}`) {
  const { default: assert } = await import("node:assert/strict")
  const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} ≠ ${b}`)
  let e = lookAtEuler([0, 0, 0], [0, 0, -10])
  near(e.x, 0, "看 -Z：無俯仰"); near(e.y, 0, "看 -Z：無偏轉"); near(e.z, 0, "看 -Z：無滾轉")
  e = lookAtEuler([0, 0, 0], [0, -10, -10])
  near(e.x, -Math.PI / 4, "往下 45°：x 為 -45°")
  // 轉身往 +Z 再往下看：不能出現滾轉以外的翻轉 —— 用矩陣反推前方向量驗證
  e = lookAtEuler([0, 0, 0], [0, -10, 10])
  const { x, y } = e
  const cy = Math.cos(y), sy = Math.sin(y), cx = Math.cos(x), sx = Math.sin(x)
  const dir = [-sy, sx * cy, -cx * cy] // XYZ Euler 下 (0,0,-1) 的世界方向
  near(dir[0], 0, "轉身：x 分量"); near(dir[1], -Math.SQRT1_2, "轉身：往下"); near(dir[2], Math.SQRT1_2, "轉身：朝 +Z")
  // 路徑越過每一層立面頂端：相鄰兩站在立面所在 z 的內插高度要高於立面
  for (let k = 0; k < 5; k++) {
    const a = STOPS[k].pos, b = STOPS[k + 1].pos, wallZ = -1300 * k - 800, wallTop = 470 * (k + 1)
    const t = (a[2] - wallZ) / (a[2] - b[2])
    assert.ok(t > 0 && t < 1 && a[1] + (b[1] - a[1]) * t > wallTop, `第 ${k} 段會撞到立面`)
  }
  // 最後一段要繞過碑身（x≈20000、高到 4135）並高過深色平台（z -7900~-8600、頂 3280）
  {
    const a = STOPS[5].pos, b = STOPS[6].pos
    for (let t = 0; t <= 1; t += 0.01) {
      const [x, y, z] = a.map((v, i) => v + (b[i] - v) * t)
      if (z < -7900 && z > -8600) assert.ok(y > 3280, `穿過平台 t=${t.toFixed(2)}`)
      if (Math.abs(z + 8250) < 80) assert.ok(Math.abs(x - 20000) > 100 || y > 4135, `穿過碑身 t=${t.toFixed(2)}`)
    }
  }
  const l = offsetLook([0, 0, 0], [0, 0, -10], Math.PI / 2, 0)
  near(l[0], -10, "向左轉 90°"); near(l[2], 0, "向左轉 90°：z 歸零")
  console.log("scene-tour ok")
}
