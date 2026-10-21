// Drives the thin reading-progress bar (<progress class="chapter-progress">)
// fixed to the top of every chapter page.
(function () {
  var bar = document.querySelector('.chapter-progress');
  if (!bar) return;
  var pending = false;
  function update() {
    pending = false;
    var d = document.documentElement;
    var max = d.scrollHeight - d.clientHeight;
    bar.value = max > 0 ? Math.min(100, (d.scrollTop / max) * 100) : 0;
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
})();
