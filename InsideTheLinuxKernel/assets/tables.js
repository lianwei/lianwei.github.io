/* Keep short table labels on one line.
 *
 * With automatic table layout a column of short labels ("Stage 2", "Kernel
 * code") is often squeezed until a label wraps, while the column beside it has
 * room to spare.  For every table this script measures each column's
 * min-content and max-content width and each cell's one-line width.  Chrome
 * shares the table width among columns in proportion to (max - min) once every
 * column has its min, so the script can predict, without further layout, the
 * column widths and roughly the table's height in lines for any choice of
 * cells.  Short cells are then marked .nowrap, a column at a time, shortest
 * first, while that lowers (height in lines + LABEL per short cell still
 * wrapping) without making the table taller: a label stays on one line only
 * when the room comes from columns that can spare it.  If short cells still
 * wrap, the table is tried as .compact (smaller type and padding) and kept that
 * way only if fewer of them wrap.  Line counts are estimates, so the result is
 * checked against the real layout, and a table that came out taller than it
 * was gives back half of its changes until it is not.  tools/build_pdf.py runs
 * the same code before printing.
 */
(() => {
  const FRAC = 0.25;   // a "short" cell is at most this share of the column...
  const CAP = 180;     // ...and at most this many px wide on one line
  const LABEL = 1;     // lines of table height one label kept on one line is worth

  const px = (cs, a, b) => parseFloat(cs[a]) + parseFloat(cs[b]);
  const sum = a => a.reduce((x, y) => x + y, 0);

  const range = el => {
    const r = document.createRange();
    r.selectNodeContents(el);
    return r.getBoundingClientRect();
  };

  // Three layout passes for all tables at once: as laid out now, to see how
  // many lines each cell takes at its current width; at width 0, where every
  // column shrinks to its min-content width; and at max-content, where no cell
  // wraps.
  const measure = tables => {
    for (const t of tables)
      t.grid = [...t.table.rows].map(row => [...row.cells].map(c => {
        const cs = getComputedStyle(c), em = parseFloat(cs.fontSize);
        const lh = parseFloat(cs.lineHeight) || 1.5 * em, pad = px(cs, 'paddingLeft', 'paddingRight');
        return { c, col: c.cellIndex, pad, em, room0: c.getBoundingClientRect().width - pad,
                 lines0: Math.max(1, Math.round(range(c).height / lh)),
                 block: !!c.querySelector('br, p, ul, ol, div, pre'), text: c.textContent.trim() !== '' };
      }));
    for (const t of tables) t.table.style.width = '0px';
    for (const t of tables) t.min = [...t.table.rows[0].cells].map(c => c.getBoundingClientRect().width);
    for (const t of tables) t.table.style.width = 'max-content';
    for (const t of tables) {
      t.max = [...t.table.rows[0].cells].map(c => c.getBoundingClientRect().width);
      for (const x of t.grid.flat()) {
        x.w = range(x.c).width;
        x.short = x.text && !x.block;
        // A wrapped line ends short of the column edge by about 1.6em of
        // prose, or by much more for code that only breaks at spaces; take it
        // from the line count observed now when the cell already wraps.
        x.waste = x.lines0 > 1 && !x.block
          ? Math.min(0.6 * x.room0, Math.max(0, x.room0 - x.w / (x.lines0 - 0.5))) : 1.6 * x.em;
      }
    }
    for (const t of tables) t.table.style.width = '';
  };

  // Column widths Chrome gives a table of width W (exact for auto layout
  // without spanning cells).
  const widths = (min, max, W) => {
    const smin = sum(min), smax = sum(max);
    if (smax <= W) return max.map(m => m + (W - smax) * m / smax);
    if (smin < W) return min.map((m, j) => m + (W - smin) * (max[j] - m) / (smax - smin));
    return min;
  };
  // Lines a cell takes in a column of width col.
  const lines = (x, col, nowrap) => {
    const room = col - x.pad;
    if (x.block) return Math.max(1, Math.ceil(x.lines0 * x.room0 / Math.max(1, room) - 0.25));
    if (nowrap.has(x.c) || x.w <= room + 0.5) return 1;
    return Math.ceil(x.w / Math.max(1, room - x.waste));
  };

  // Greedy search: each step widens one column just enough for all of its
  // short cells up to some width to stay on one line, choosing the step that
  // lowers cost = height in lines + LABEL * short cells still wrapping.
  const plan = t => {
    const limit = Math.min(CAP, FRAC * t.avail), room = Math.max(t.avail, sum(t.min)) + 0.5;
    const cand = t.grid.flat().filter(x => x.short && x.w <= limit);
    let h0 = Infinity;
    const cost = (min, nowrap) => {
      const col = widths(min, t.max, t.avail);
      const h = sum(t.grid.map(row => Math.max(...row.map(x => lines(x, col[x.col], nowrap)))));
      if (h > h0) return Infinity;
      return h + LABEL * cand.filter(x => lines(x, col[x.col], nowrap) > 1).length;
    };
    const min = t.min.slice(), nowrap = new Set();
    t.steps = [];
    let best = cost(min, nowrap);
    h0 = best - LABEL * cand.filter(x => lines(x, widths(min, t.max, t.avail)[x.col], nowrap) > 1).length;
    for (;;) {
      let step = null;
      for (let j = 0; j < min.length; j++) {
        const mine = cand.filter(x => x.col === j && !nowrap.has(x.c)).sort((p, q) => p.w - q.w);
        for (let k = 0; k < mine.length; k++) {
          if (k + 1 < mine.length && mine[k + 1].w === mine[k].w) continue;
          const m = min.slice();
          m[j] = Math.max(m[j], mine[k].w + mine[k].pad + 1);
          if (sum(m) > room) break;
          const add = mine.slice(0, k + 1).map(x => x.c), nw = new Set([...nowrap, ...add]);
          const c = cost(m, nw);
          if (c <= best + 1e-6 && (!step || c < step.c - 1e-6 || (c < step.c + 1e-6 && add.length > step.add.length))) step = { c, m, add };
        }
      }
      if (!step) break;
      best = step.c;
      min.splice(0, min.length, ...step.m);
      step.add.forEach(c => nowrap.add(c));
      t.steps.push(step.add);
    }
    const col = widths(min, t.max, t.avail);
    t.miss = cand.filter(x => lines(x, col[x.col], nowrap) > 1).length;
  };

  const reset = () => {
    for (const el of document.querySelectorAll('table.compact')) el.classList.remove('compact');
    for (const el of document.querySelectorAll('td.nowrap, th.nowrap')) el.classList.remove('nowrap');
  };

  const balance = () => {
    reset();
    const tables = [];
    for (const table of document.querySelectorAll('table:not(.col-sized)')) {
      if (!table.rows.length || [...table.rows].some(r => [...r.cells].some(c => c.colSpan > 1 || c.rowSpan > 1)))
        continue;
      const host = table.parentElement, cs = getComputedStyle(host);
      tables.push({ table, avail: host.clientWidth - px(cs, 'paddingLeft', 'paddingRight'),
                    height: table.getBoundingClientRect().height });
    }
    measure(tables);
    tables.forEach(plan);
    const tight = tables.filter(t => t.miss);
    const before = new Map(tight.map(t => [t, [t.steps, t.miss]]));
    tight.forEach(t => t.table.classList.add('compact'));
    measure(tight);
    for (const t of tight) {
      plan(t);
      const [steps, miss] = before.get(t);
      if (t.miss >= miss) {
        t.table.classList.remove('compact');
        t.steps = steps;
      }
    }
    // The line counts are estimates, so check the real layout: a table that
    // came out taller than it started keeps only the first half of its steps,
    // and is checked again.
    let check = tables.filter(t => t.steps.length || t.table.classList.contains('compact'));
    check.forEach(t => { t.n = t.steps.length; });
    for (let round = 0; check.length && round < 4; round++) {
      for (const t of check) t.steps.slice(0, t.n).flat().forEach(c => c.classList.add('nowrap'));
      check = check.filter(t => t.table.getBoundingClientRect().height > t.height + 2);
      for (const t of check) {
        t.table.querySelectorAll('.nowrap').forEach(c => c.classList.remove('nowrap'));
        t.n >>= 1;
        if (!t.n) t.table.classList.remove('compact');
      }
      check = check.filter(t => t.n);
    }
  };

  window.ulkBalanceTables = balance;
  if (window.ulkNoAutoBalance) return;

  let width = 0, timer = 0;
  const run = () => { width = window.innerWidth; balance(); };
  const later = () => { clearTimeout(timer); timer = setTimeout(run, 150); };
  if (document.fonts) {
    document.fonts.ready.then(run);
    document.fonts.addEventListener('loadingdone', later);
  } else {
    run();
  }
  window.addEventListener('resize', () => { if (window.innerWidth !== width) later(); });
  // The print stylesheet lays tables out at the paper's width instead.
  window.addEventListener('beforeprint', reset);
  window.addEventListener('afterprint', run);
})();
