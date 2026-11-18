/* English Wrapped — "Share my Wrapped"
   Adds a share button to any Wrapped page. Turns every story into an image
   the student can post on Instagram (share sheet on phones, download elsewhere). */
(function () {
  const css = `
  .ewd-share-btn{position:absolute;z-index:40;border:0;cursor:pointer;font-family:Nunito,Arial,sans-serif;font-weight:1000;text-transform:uppercase;letter-spacing:.5px}
  .ewd-share-mini{top:46px;right:16px;background:#ffffffe6;color:#111;border-radius:999px;padding:7px 12px;font-size:11px;box-shadow:0 4px 14px #0004}
  .ewd-share-big{left:50%;bottom:20px;transform:translateX(-50%);background:#b7ff38;color:#111;border-radius:999px;padding:12px 16px;font-size:13px;box-shadow:4px 5px 0 #111;white-space:nowrap;display:none}
  .ewd-share-big.show{display:block;animation:ewdpop .5s both}
  @keyframes ewdpop{from{opacity:0;transform:translateX(-50%) translateY(15px)}to{opacity:1;transform:translateX(-50%)}}
  .ewd-panel{position:fixed;inset:0;z-index:9999;background:#13002cf2;color:#fff;font-family:Nunito,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;overflow:auto;padding:22px 16px 30px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
  .ewd-panel h2{padding:0 44px;font-size:28px;font-weight:1000;text-transform:uppercase;margin:6px 0 4px;letter-spacing:-1px;text-align:center}
  .ewd-panel p{margin:0 0 14px;opacity:.85;text-align:center;max-width:380px;font-size:15px;line-height:1.4}
  .ewd-close{position:fixed;top:14px;right:14px;background:#fff;color:#111;border:0;border-radius:50%;width:38px;height:38px;font-size:20px;font-weight:900;cursor:pointer;z-index:2}
  .ewd-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:16px}
  .ewd-actions button{border:0;border-radius:999px;padding:13px 20px;font-weight:1000;font-size:14px;text-transform:uppercase;cursor:pointer;font-family:inherit}
  .ewd-primary{background:#b7ff38;color:#111;box-shadow:4px 5px 0 #000}
  .ewd-secondary{background:transparent;color:#fff;border:2px solid #fff!important}
  .ewd-actions button:disabled{opacity:.5}
  .ewd-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;max-width:440px}
  .ewd-grid figure{margin:0;position:relative}
  .ewd-grid img{width:100%;border-radius:10px;display:block;box-shadow:0 6px 18px #0006}
  .ewd-grid figcaption{position:absolute;left:6px;top:6px;background:#000a;border-radius:6px;font-size:11px;font-weight:900;padding:2px 6px}
  .ewd-progress{font-weight:900;margin:20px 0;font-size:16px}
  .ewd-cap,.ewd-cap *{animation:none!important;transition:none!important}
  .ewd-cap .slide{opacity:1!important;transform:none!important}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const story = document.getElementById('story') || document.querySelector('.story');
  const slides = () => [...document.querySelectorAll('.slide')];
  if (!story || !slides().length) return;

  const name = (document.title.split('—')[0] || 'my').trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-');
  const isTouch = matchMedia('(pointer:coarse)').matches;

  // Buttons
  const mini = document.createElement('button');
  mini.className = 'ewd-share-btn ewd-share-mini';
  mini.textContent = '📸 Share';
  const big = document.createElement('button');
  big.className = 'ewd-share-btn ewd-share-big';
  big.textContent = '📸 Share';
  [mini, big].forEach(b => {
    b.addEventListener('click', e => { e.stopPropagation(); openPanel(); });
    story.appendChild(b);
  });

  // Show big button only on the last story
  const watch = () => {
    const all = slides();
    const last = all[all.length - 1].classList.contains('active');
    big.classList.toggle('show', last);
    const dots = story.querySelector('.dots,#count');
    if (dots) dots.style.visibility = last ? 'hidden' : '';
  };
  new MutationObserver(watch).observe(story, { attributes: true, subtree: true, attributeFilter: ['class'] });
  watch();

  // html2canvas loader
  let libPromise;
  const loadLib = () => libPromise || (libPromise = new Promise((ok, fail) => {
    if (window.html2canvas) return ok();
    const s = document.createElement('script');
    s.src = '/html2canvas.min.js';
    s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  }));

  async function renderSlide(slide) {
    const W = story.offsetWidth, H = story.offsetHeight;
    const box = document.createElement('div');
    box.className = 'story ewd-cap';
    box.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:-1;border-radius:0;box-shadow:none;margin:0`;
    const top = story.querySelector('.top');
    if (top) box.appendChild(top.cloneNode(true));
    const s = slide.cloneNode(true);
    s.classList.add('active');
    box.appendChild(s);
    document.body.appendChild(box);
    try {
      return await html2canvas(box, { scale: 1080 / W, backgroundColor: '#13002c', logging: false, useCORS: true });
    } finally { box.remove(); }
  }

  let cache = null; // [{file, url}]

  async function openPanel() {
    const panel = document.createElement('div');
    panel.className = 'ewd-panel';
    panel.innerHTML = `
      <button class="ewd-close" aria-label="Close">×</button>
      <h2>Share your Wrapped 📸</h2>
      <p>${isTouch ? 'Tap <b>Share</b> and choose Instagram. You can also press and hold any image to save it.' : 'Download your stories and post them on Instagram from your phone.'}</p>
      <div class="ewd-actions"></div>
      <div class="ewd-progress">Creating your stories…</div>
      <div class="ewd-grid"></div>`;
    document.body.appendChild(panel);
    const close = () => panel.remove();
    panel.querySelector('.ewd-close').onclick = close;
    const actions = panel.querySelector('.ewd-actions');
    const grid = panel.querySelector('.ewd-grid');
    const prog = panel.querySelector('.ewd-progress');

    try {
      if (!cache) {
        await loadLib();
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const out = [];
        const all = slides();
        for (let i = 0; i < all.length; i++) {
          prog.textContent = `Creating your stories… ${i + 1}/${all.length}`;
          const canvas = await renderSlide(all[i]);
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          const fname = `${name}-wrapped-${String(i + 1).padStart(2, '0')}.png`;
          out.push({ file: new File([blob], fname, { type: 'image/png' }), url: URL.createObjectURL(blob) });
        }
        cache = out;
      }
    } catch (err) {
      prog.textContent = 'Sorry, something went wrong. Try again or take screenshots. 🙏';
      return;
    }
    prog.remove();

    cache.forEach((c, i) => {
      const fig = document.createElement('figure');
      fig.innerHTML = `<img src="${c.url}" alt="Story ${i + 1}"><figcaption>${i + 1}</figcaption>`;
      fig.querySelector('img').onclick = () => shareFiles([c.file]) || download(c);
      grid.appendChild(fig);
    });

    const files = cache.map(c => c.file);
    const canShareAll = navigator.canShare && navigator.canShare({ files });
    if (canShareAll) {
      const b = document.createElement('button');
      b.className = 'ewd-primary';
      b.textContent = `Share all ${files.length}`;
      b.onclick = () => shareFiles(files);
      actions.appendChild(b);
    }
    const d = document.createElement('button');
    d.className = canShareAll ? 'ewd-secondary' : 'ewd-primary';
    d.textContent = 'Download all';
    d.onclick = async () => { for (const c of cache) { download(c); await new Promise(r => setTimeout(r, 350)); } };
    actions.appendChild(d);
  }

  function shareFiles(files) {
    if (!(navigator.canShare && navigator.canShare({ files }))) return false;
    navigator.share({ files, title: 'My English Wrapped 2026' }).catch(() => {});
    return true;
  }
  function download(c) {
    const a = document.createElement('a');
    a.href = c.url; a.download = c.file.name;
    document.body.appendChild(a); a.click(); a.remove();
  }
})();
