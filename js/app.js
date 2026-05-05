/* ============================================================
   TEACHING WEBSITE – MAIN APP LOGIC
   ============================================================ */

/* ── Mobile nav toggle ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // Mark active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
});

/* ── Vocabulary Flashcard App ─────────────────────────────── */
async function initVocabApp() {
  const container = document.getElementById('vocab-app');
  if (!container) return;

  let allCards = [];
  let deck = [];
  let current = 0;

  try {
    const res = await fetch('data/vocabulary.json');
    allCards = await res.json();
  } catch {
    container.innerHTML = '<p>Could not load vocabulary data.</p>';
    return;
  }

  const categoryFilter = document.getElementById('filter-category');
  const levelFilter    = document.getElementById('filter-level');
  const searchInput    = document.getElementById('search-vocab');
  const cardEl         = document.getElementById('flip-card');
  const counterEl      = document.getElementById('card-counter');
  const progressFill   = document.getElementById('progress-fill');

  function buildDeck() {
    const cat   = categoryFilter.value;
    const level = levelFilter.value;
    const q     = searchInput.value.toLowerCase().trim();

    deck = allCards.filter(c => {
      if (cat   && c.category !== cat)   return false;
      if (level && c.level    !== level) return false;
      if (q && !c.word.toLowerCase().includes(q) && !c.definition.toLowerCase().includes(q)) return false;
      return true;
    });
    current = 0;
    renderCard();
  }

  function renderCard() {
    if (deck.length === 0) {
      cardEl.innerHTML = `<div class="flip-card-front" style="align-items:center;text-align:center;">
        <div class="feature-icon">🔍</div>
        <p>No cards match your filters. Try adjusting the category or level.</p>
      </div>`;
      counterEl.textContent = '0 / 0';
      progressFill.style.width = '0%';
      return;
    }

    const c = deck[current];
    cardEl.classList.remove('flipped');

    // Highlight the target word inside the sentence (case-insensitive)
    const re  = new RegExp(`\\b(${c.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
    const highlighted = c.sentence.replace(re, '<span class="highlight">$1</span>');

    cardEl.innerHTML = `
      <div class="flip-card-front">
        <div>
          <div class="card-level-badge">${c.level} · ${c.category}</div>
          <div class="card-word">${c.word}</div>
          <div class="card-phonetic">${c.phonetic}</div>
          <div class="card-sentence">${highlighted}</div>
        </div>
        <p class="card-hint">Click the card to see the definition ↓</p>
      </div>
      <div class="flip-card-back">
        <div>
          <span class="card-pos">${c.partOfSpeech}</span>
          <div class="card-word" style="font-size:1.5rem">${c.word}</div>
          <div class="card-definition">${c.definition}</div>
          <div class="card-sentence">${highlighted}</div>
          <div class="card-cn">🇨🇳 ${c.sentenceCN}</div>
          <div class="card-usage">💡 <strong>Usage note:</strong> ${c.usageNote}</div>
        </div>
      </div>`;

    counterEl.textContent = `${current + 1} / ${deck.length}`;
    progressFill.style.width = `${((current + 1) / deck.length) * 100}%`;
  }

  function prev() { if (deck.length === 0) return; current = (current - 1 + deck.length) % deck.length; renderCard(); }
  function next() { if (deck.length === 0) return; current = (current + 1) % deck.length; renderCard(); }

  cardEl.addEventListener('click', () => cardEl.classList.toggle('flipped'));
  document.getElementById('btn-prev').addEventListener('click', prev);
  document.getElementById('btn-next').addEventListener('click', next);

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === ' ') { e.preventDefault(); cardEl.classList.toggle('flipped'); }
  });

  [categoryFilter, levelFilter].forEach(el => el.addEventListener('change', buildDeck));
  searchInput.addEventListener('input', buildDeck);

  buildDeck();
}

/* ── Resources Filter App ─────────────────────────────────── */
async function initResourcesApp() {
  const grid = document.getElementById('resources-grid');
  if (!grid) return;

  let all = [];
  try {
    const res = await fetch('data/resources.json');
    all = await res.json();
  } catch {
    grid.innerHTML = '<p>Could not load resources.</p>';
    return;
  }

  function tagClass(cat) {
    return { writing: 'tag-writing', speaking: 'tag-speaking', vocab: 'tag-vocab', grammar: 'tag-grammar' }[cat] || 'tag-level';
  }

  function render(filter) {
    const filtered = filter === 'all' ? all : all.filter(r => r.category === filter);
    grid.innerHTML = filtered.map(r => `
      <div class="resource-card" data-cat="${r.category}">
        <div class="resource-meta">
          <span class="tag ${tagClass(r.category)}">${r.category}</span>
          <span class="tag tag-level">${r.level}</span>
          ${r.tags.map(t => `<span class="tag" style="background:#eee;color:#555">${t}</span>`).join('')}
        </div>
        <h4>${r.title}</h4>
        <p>${r.description}</p>
        <a class="resource-link" href="${r.link}">→ ${r.linkText}</a>
      </div>`).join('');
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.filter);
    });
  });

  render('all');
}

/* ── Blog App ─────────────────────────────────────────────── */
async function initBlogApp() {
  const listEl = document.getElementById('blog-list');
  const postEl = document.getElementById('blog-post');
  if (!listEl) return;

  let posts = [];
  try {
    const res = await fetch('data/blog-posts.json');
    posts = await res.json();
  } catch {
    listEl.innerHTML = '<p>Could not load posts.</p>';
    return;
  }

  function renderList() {
    postEl.classList.add('blog-hidden');
    listEl.classList.remove('blog-hidden');
    listEl.innerHTML = `<div class="grid-3">${posts.map(p => `
      <article class="blog-card">
        <div class="blog-card-header">
          <p class="blog-date">${formatDate(p.date)}</p>
          <p class="blog-category">${p.category}</p>
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
        </div>
        <div class="blog-card-footer">
          <span class="read-time">⏱ ${p.readTime}</span>
          <a class="btn btn-outline" href="#" onclick="readPost(${p.id});return false;">Read →</a>
        </div>
      </article>`).join('')}
    </div>`;
  }

  window.readPost = function(id) {
    const p = posts.find(x => x.id === id);
    if (!p) return;
    listEl.classList.add('blog-hidden');
    postEl.classList.remove('blog-hidden');
    postEl.innerHTML = `
      <div class="blog-post-content">
        <p class="blog-category" style="margin-bottom:.25rem">${p.category}</p>
        <h1 style="color:var(--primary);margin-bottom:.5rem">${p.title}</h1>
        <p style="color:var(--text-muted);font-size:.9rem;margin-bottom:2rem">${formatDate(p.date)} · ${p.readTime}</p>
        ${p.content}
        <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--border)">
          <a class="btn btn-outline" href="#" onclick="backToList();return false;">← Back to all posts</a>
        </div>
      </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.backToList = renderList;

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  renderList();
}

/* ── Bootstrap all apps ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initVocabApp();
  initResourcesApp();
  initBlogApp();
});
