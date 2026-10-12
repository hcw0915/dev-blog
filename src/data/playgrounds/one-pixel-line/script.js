// 每條線的 top：起點 + i × 間距。間距刻意用小數，讓線落在不同的次像素位置。
const COUNT = 12
const START = 4
const GAP = 15.37

const offsetInput = document.getElementById("offset")
const offsetOut = document.getElementById("offset-out")

// 盒子的上下邊各自四捨五入到實體像素；border 寬度則先往下取整（至少 1 個實體像素）
const roundPx = v => Math.floor(v + 0.5)
const devicePx = (kind, top, dpr) =>
  kind === "border"
    ? Math.max(1, Math.floor(dpr))
    : roundPx((top + 1) * dpr) - roundPx(top * dpr)

function render() {
  const dpr = window.devicePixelRatio
  const offset = Number(offsetInput.value)
  offsetOut.textContent = `${offset.toFixed(2)}px`

  const dprEl = document.getElementById("dpr")
  dprEl.textContent = Number(dpr.toFixed(3))
  const fractional = !Number.isInteger(Math.round(dpr * 1000) / 1000)
  dprEl.parentElement.classList.toggle("fractional", fractional)
  document.getElementById("hint").textContent = fractional
    ? "非整數 DPR：height 那欄會在 1 和 2 個實體像素之間跳、shadow 那欄邊緣發糊，border 那欄每條都一樣。"
    : "整數 DPR：三欄看起來一樣。按 ⌘+ 或 ⌘−（Windows 用 Ctrl）把瀏覽器縮放調到 125% 或 150% 試試。"

  for (const col of document.querySelectorAll(".col")) {
    const kind = col.dataset.kind
    const box = col.querySelector(".lines")
    const baseTop = box.getBoundingClientRect().top + window.scrollY
    box.replaceChildren()
    for (let i = 0; i < COUNT; i++) {
      const top = START + i * GAP + offset
      const line = document.createElement("div")
      line.className = "line"
      line.style.top = `${top}px`
      box.append(line)
      // 陰影不做像素對齊，邊緣靠反鋸齒，沒有整數的「幾個像素」可以標
      if (kind === "shadow") continue
      const n = devicePx(kind, baseTop + top, dpr)
      const label = document.createElement("span")
      // 比 border 那欄粗的才標色：DPR 2 時大家都是 2，不該全部亮起來
      label.className = n > Math.max(1, Math.floor(dpr)) ? "px thick" : "px"
      label.style.top = `${top}px`
      label.textContent = n
      box.append(label)
    }
  }
}

offsetInput.addEventListener("input", render)
// 瀏覽器縮放會改變 DPR，並觸發 resize
window.addEventListener("resize", render)
render()
