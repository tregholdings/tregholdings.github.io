/* TREG Holdings site: lightbox, archive filters, contact form. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // ---- lightbox: links with data-lb open the full page image; links sharing a data-lb value form a gallery
  const lb = $('#lb');
  if (lb && lb.showModal) {
    const img = $('img', lb), cap = $('.cap', lb), pv = $('.pv', lb), nx = $('.nx', lb);
    let set = [], i = 0, opener = null;
    function show(k) {
      i = k; const a = set[i];
      img.src = a.href; img.alt = a.querySelector('img') ? a.querySelector('img').alt : '';
      cap.innerHTML = a.dataset.cap || '';
      pv.hidden = i === 0; nx.hidden = i === set.length - 1;
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[data-lb]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); opener = a;
      set = $$('a[data-lb="' + a.dataset.lb + '"]').filter(x => !x.closest('[hidden]'));
      show(set.indexOf(a)); lb.showModal();
    });
    pv.addEventListener('click', () => i > 0 && show(i - 1));
    nx.addEventListener('click', () => i < set.length - 1 && show(i + 1));
    $('.x', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('fr')) lb.close(); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' && i > 0) show(i - 1);
      if (e.key === 'ArrowRight' && i < set.length - 1) show(i + 1);
    });
    lb.addEventListener('close', () => { img.removeAttribute('src'); if (opener) opener.focus(); });
  }

  // ---- shared filter: chips + search over items carrying data-k (filter key) and data-q (search text)
  function filterable(root, opts) {
    const items = $$(opts.item, root), groups = $$(opts.group, root);
    const chips = $$('.chip', opts.chips), q = opts.search ? $('input', opts.search) : null;
    const extra = opts.extra ? $$('.chip', opts.extra) : [];
    let key = 'all', key2 = 'all';
    function run() {
      const t = q ? q.value.trim().toLowerCase() : '';
      let n = 0;
      items.forEach(el => {
        const ok = (key === 'all' || el.dataset.k === key) && (key2 === 'all' || el.dataset.k2 === key2) && (!t || el.dataset.q.includes(t));
        el.hidden = !ok; if (ok) n++;
      });
      groups.forEach(g => { g.hidden = !$$(opts.item, g).some(el => !el.hidden); });
      opts.count.textContent = n === 1 ? opts.one : opts.many.replace('{n}', n);
      opts.empty.hidden = n > 0;
    }
    chips.forEach(c => c.addEventListener('click', () => { chips.forEach(x => x.setAttribute('aria-pressed', x === c)); key = c.dataset.k; run(); }));
    extra.forEach(c => c.addEventListener('click', () => { extra.forEach(x => x.setAttribute('aria-pressed', x === c)); key2 = c.dataset.k; run(); }));
    if (q) q.addEventListener('input', run);
    return run;
  }

  const pj = $('#pj-list');
  if (pj) {
    filterable(pj, { item: '.pj', group: '.ygroup', chips: $('#pj-chips'), search: $('#pj-search'),
      count: $('#pj-count'), empty: $('#pj-empty'), one: 'Showing 1 project', many: 'Showing {n} projects' });
    const sort = $('#pj-sort');
    sort.addEventListener('change', () => {
      const gs = $$('.ygroup', pj);
      if (sort.value === 'old') gs.sort((a, b) => a.dataset.y - b.dataset.y);
      else gs.sort((a, b) => b.dataset.y - a.dataset.y);
      gs.forEach(g => pj.appendChild(g));
    });
    if (location.hash) { const d = document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') d.open = true; }
  }

  const pr = $('#pr-list');
  if (pr) {
    filterable(pr, { item: '.prc', group: '.ygroup', chips: $('#pr-chips'), extra: $('#pr-lang'),
      count: $('#pr-count'), empty: $('#pr-empty'), one: 'Showing 1 article', many: 'Showing {n} articles' });
  }

  // ---- contact form: posts to the form service when FORM_ENDPOINT is set, otherwise opens the visitor's email app
  const f = $('#cform');
  if (f) {
    const st = $('.status', f), btn = $('button[type=submit]', f);
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (f.elements._gotcha && f.elements._gotcha.value) return;
      st.classList.remove('err');
      const v = n => (f.elements[n] ? f.elements[n].value.trim() : '');
      if (!f.dataset.endpoint) {
        const body = [v('message'), '', v('name'), v('email'), v('phone'), v('about') ? 'Enquiry: ' + v('about') : ''].filter(Boolean).join('\n');
        location.href = 'mailto:' + f.dataset.to + '?subject=' + encodeURIComponent('Website enquiry from ' + v('name')) + '&body=' + encodeURIComponent(body);
        st.textContent = 'Your email app should now open with the message ready. Press send to deliver it.';
        return;
      }
      btn.disabled = true; st.textContent = 'Sending…';
      try {
        const r = await fetch(f.dataset.endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(r.status);
        f.reset(); st.textContent = 'Thank you for your message. It has been sent.';
      } catch (err) {
        st.classList.add('err'); st.textContent = 'There was an error trying to send your message. Please try again later, or email ' + f.dataset.to + '.';
      } finally { btn.disabled = false; }
    });
  }
})();
