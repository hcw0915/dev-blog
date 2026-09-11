// 點一下翻牌；aria-pressed 讓輔助工具知道現在翻到哪一面
const card = document.querySelector(".card")
const hint = document.querySelector(".hint")

card.addEventListener("click", () => {
  const faceUp = card.getAttribute("aria-pressed") !== "true"
  card.setAttribute("aria-pressed", String(faceUp))
  card.classList.toggle("is-up", faceUp)
  card.classList.toggle("is-down", !faceUp)
  hint.textContent = faceUp ? "Click again to flip back" : "Click the card to flip"
})
