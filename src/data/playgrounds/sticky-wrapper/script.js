const tpl = document.getElementById("content")
const boxes = [...document.querySelectorAll(".box")]

for (const box of boxes) {
  box.append(tpl.content.cloneNode(true))
  const nav = document.createElement("nav")
  nav.className = "nav"
  nav.dataset.sticky = "true"
  nav.innerHTML = "導覽列 <output>—</output>"

  const slot = box.querySelector(".slot")
  if (box.dataset.case === "a") {
    slot.replaceWith(nav)
  } else {
    // B、C：外面多包一層，高度自然等於導覽列
    const wrapper = document.createElement("div")
    wrapper.className = "wrapper"
    if (box.dataset.case === "c") wrapper.classList.add("has-fix")
    wrapper.append(nav)
    slot.replaceWith(wrapper)
  }
}

const fix = document.getElementById("fix")
fix.addEventListener("change", () => {
  document.querySelector(".wrapper.has-fix").classList.toggle("compensate", fix.checked)
  update()
})

// 同步捲動：一欄捲，其他欄跟著
let syncing = false
for (const box of boxes) {
  box.addEventListener("scroll", () => {
    if (!syncing) {
      syncing = true
      for (const other of boxes) if (other !== box) other.scrollTop = box.scrollTop
      requestAnimationFrame(() => (syncing = false))
    }
    update()
  })
}

function update() {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header"))
  for (const box of boxes) {
    const nav = box.querySelector(".nav")
    const top = Math.round(nav.getBoundingClientRect().top - box.getBoundingClientRect().top - box.clientTop)
    nav.querySelector("output").textContent = `${top}px`
    // 捲過 header 之後，頂端不是 44 就是沒吸好（被捲走或蓋住 header）
    nav.classList.toggle("bad", box.scrollTop > 100 && top !== header)
  }
}
update()
