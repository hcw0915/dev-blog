// Replay：先拿掉動畫讓屬性回到初始值，強制 reflow 一次，再加回去才會從頭播
document.querySelectorAll("[data-replay]").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.closest(".panel").querySelector(button.dataset.replay)
    target.classList.remove("is-playing")
    void target.offsetWidth
    target.classList.add("is-playing")
  })
})
