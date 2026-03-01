let count = 0;
const counterEl = document.getElementById('counter');
const increaseBtn = document.getElementById('increase');
const decreaseBtn = document.getElementById('decrease');
const resetBtn = document.getElementById('reset');

function updateCounter() {
  counterEl.textContent = count;
  counterEl.classList.add('animate');
  setTimeout(() => {
    counterEl.classList.remove('animate');
  }, 200);
}

increaseBtn.addEventListener('click', () => {
  count++;
  updateCounter();
});

decreaseBtn.addEventListener('click', () => {
  count--;
  updateCounter();
});

resetBtn.addEventListener('click', () => {
  count = 0;
  updateCounter();
});
