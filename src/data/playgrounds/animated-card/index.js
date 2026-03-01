const card = document.getElementById('card');
const btn = document.querySelector('.card-btn');

card.addEventListener('click', function() {
  this.style.transform = 'rotateY(0deg) rotateX(0deg) scale(0.95)';
  setTimeout(() => {
    this.style.transform = '';
  }, 200);
});

btn.addEventListener('click', function(e) {
  e.stopPropagation();
  alert('按钮被点击了！');
});
