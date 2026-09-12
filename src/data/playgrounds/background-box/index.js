// 拉動或勾選就換變數，同時把對應的 CSS 印出來
const live = document.querySelector(".btn--live")
const range = document.querySelector('[data-var="--bw"]')
const out = document.querySelector('[data-out="bw"]')
const check = document.querySelector("[data-clip]")
const code = document.querySelector("[data-code]")

const render = () => {
  const width = `${range.value}px`
  const clip = check.checked ? "border-box" : "padding-box"
  live.style.setProperty("--bw", width)
  live.style.setProperty("--fill-clip", clip)
  out.textContent = width
  code.textContent = [
    `border: ${width} solid transparent;`,
    "background:",
    `  var(--fill) ${clip},`,
    "  var(--edge) border-box;"
  ].join("\n")
}

range.addEventListener("input", render)
check.addEventListener("change", render)
render()
