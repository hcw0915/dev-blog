const color1 = document.getElementById('color1');
const color2 = document.getElementById('color2');
const angle = document.getElementById('angle');
const angleValue = document.getElementById('angleValue');
const preview = document.getElementById('preview');
const cssCode = document.getElementById('cssCode');
const copyBtn = document.getElementById('copyBtn');

function updateGradient() {
  const c1 = color1.value;
  const c2 = color2.value;
  const a = angle.value;
  
  angleValue.textContent = a + '°';
  
  const gradient = `linear-gradient(${a}deg, ${c1}, ${c2})`;
  preview.style.background = gradient;
  
  cssCode.value = `background: ${gradient};`;
}

color1.addEventListener('input', updateGradient);
color2.addEventListener('input', updateGradient);
angle.addEventListener('input', updateGradient);

copyBtn.addEventListener('click', () => {
  cssCode.select();
  document.execCommand('copy');
  copyBtn.textContent = '已复制！';
  setTimeout(() => {
    copyBtn.textContent = '复制代码';
  }, 2000);
});

// 初始化
updateGradient();
