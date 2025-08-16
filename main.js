const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const STORAGE_KEY = "cart_drawer_demo_v1";

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
};
const saveCart = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

let cart = loadCart();

const currencyKRW = (n) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 })
    .format(Number(n));

const currencyUSD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })
    .format(Number(n));

const subtotal = (items) => items.reduce((s, it) => s + it.price * it.qty, 0);

const openBtn = $("#cartOpenBtn");
const cartCount = $("#cartCount");
const drawer = $("#cartDrawer") || document.querySelector(".cart-panel");
const backdrop = $("#cartBackdrop");
const closeBtn = $("#cartClose");
const panel = drawer?.querySelector?.(".cart-panel") || drawer;
const listEl = $("#cartItems");
const subtotalEl = $("#cpSubtotal");

function focusWithoutScroll(el){
  if (!el) return;
  try {
    el.focus({ preventScroll: true });
    return;
  } catch(_) {}
  const x = window.scrollX, y = window.scrollY;
  el.focus();
  window.scrollTo(x, y);
}

function placePopover(){
  if (!openBtn || !panel) return;
  const r = openBtn.getBoundingClientRect();
  const gap = 10;
  const panelW = panel.offsetWidth || 420;
  const vw = document.documentElement.clientWidth;
  const sx = window.scrollX, sy = window.scrollY;

  let idealLeft = sx + (r.left + r.right)/2 - panelW/2;
  const minLeft = sx + 12;
  const maxLeft = sx + vw - panelW - 12;
  const left = Math.max(minLeft, Math.min(maxLeft, idealLeft));
  const top  = sy + r.bottom + gap;

  const arrowX = sx + (r.left + r.right)/2 - left;
  const arrowClamp = Math.max(16, Math.min(panelW - 24, arrowX));

  panel.style.top  = `${top}px`;
  panel.style.left = `${left}px`;
  panel.style.setProperty("--arrow-left", `${arrowClamp - 8}px`);
}

let lastFocused;
function openDrawer(){
  if (!drawer) return;
  lastFocused = document.activeElement;
  drawer.hidden = false;
  backdrop && (backdrop.hidden = false);
  renderCart();
  requestAnimationFrame(() => {
    drawer.classList.add("open");
    backdrop && backdrop.classList.add("show");
    placePopover();
  });
  openBtn?.setAttribute("aria-expanded", "true");
  focusWithoutScroll(closeBtn);
  window.addEventListener("keydown", onEscClose);
  window.addEventListener("resize", placePopover);
  window.addEventListener("scroll", placePopover, { passive: true });
}
function closeDrawer(){
  if (!drawer) return;
  drawer.classList.remove("open");
  backdrop && backdrop.classList.remove("show");
  openBtn?.setAttribute("aria-expanded", "false");
  window.removeEventListener("keydown", onEscClose);
  window.removeEventListener("resize", placePopover);
  window.removeEventListener("scroll", placePopover);
  setTimeout(() => {
    drawer.hidden = true;
    backdrop && (backdrop.hidden = true);
    if (lastFocused) focusWithoutScroll(lastFocused);
  }, 180);
}
function onEscClose(e){ if(e.key === "Escape") closeDrawer(); }

document.addEventListener("click", (e) => {
  if (e.target.closest("#cartOpenBtn")) { e.preventDefault(); openDrawer(); }
});
closeBtn?.addEventListener("click", closeDrawer);
backdrop?.addEventListener("click", closeDrawer);

function renderCart(){
  if (cartCount) cartCount.textContent = cart.reduce((s, it) => s + it.qty, 0);
  // ✅ USD 그대로
  if (subtotalEl) subtotalEl.textContent = currencyUSD(subtotal(cart));

  if (!listEl) return;
  if(cart.length === 0){
    listEl.innerHTML = `<li class="muted" style="padding:12px;">장바구니가 비어 있습니다.</li>`;
    return;
  }
  listEl.innerHTML = "";
  cart.forEach((it, idx) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div class="thumb"><img src="${it.image}" alt=""></div>
      <div>
        <p class="title">${it.name}</p>
        <div class="qty-row">
          <button class="qty-btn" data-act="dec" data-idx="${idx}" aria-label="수량 감소">-</button>
          <span aria-live="polite">${it.qty}</span>
          <button class="qty-btn" data-act="inc" data-idx="${idx}" aria-label="수량 증가">+</button>
          <button class="remove-btn" data-act="remove" data-idx="${idx}">삭제</button>
        </div>
      </div>
      <div><strong>${currencyUSD(it.price * it.qty)}</strong></div>
    `;
    listEl.appendChild(li);
  });
}

listEl?.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if(!btn) return;
  const act = btn.dataset.act;
  const idx = Number(btn.dataset.idx);
  if(Number.isNaN(idx)) return;

  if(act === "inc") cart[idx].qty += 1;
  if(act === "dec") cart[idx].qty = Math.max(1, cart[idx].qty - 1);
  if(act === "remove") cart.splice(idx, 1);

  saveCart(cart);
  renderCart();
  placePopover(); 
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if(!btn) return;

  const id = String(btn.dataset.id);
  const name = btn.dataset.name || "상품";
  const price = Number(btn.dataset.price || 0); 
  const image = btn.dataset.image || "";

  const found = cart.find((x) => x.id === id);
  if(found) found.qty += 1;
  else cart.push({ id, name, price, image, qty: 1 });

  saveCart(cart);
  renderCart();
});

const productList = document.querySelector(".product-list");

async function loadProducts(){
  try{
    if(!productList) return;
    if (productList.querySelector(".product-card")) return;

    const res = await fetch("https://fakestoreapi.com/products?limit=8");
    const data = await res.json();

    const frag = document.createDocumentFragment();
    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "product-card";
      const title = item.title.length > 10 ? item.title.slice(0,20) + "…" : item.title;
      div.innerHTML = `
        <button class="wishlist-btn" aria-label="찜하기"><i class="fa-regular fa-heart"></i></button>
        <div class="img-wrap"><img src="${item.image}" alt="상품 이미지"></div>
        <p class="product-name">${title}</p>
        <div class="price-row">
          <span class="price">$${Number(item.price).toFixed(2)}</span>
          <button class="add-btn add-to-cart"
            aria-label="담기"
            data-id="${item.id}"
            data-name="${item.title.replace(/"/g,'&quot;')}"
            data-price="${item.price}"
            data-image="${item.image}">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      `;
      frag.appendChild(div);
    });
    productList.appendChild(frag);
  }catch(e){
    if (!productList.children.length) {
      productList.innerHTML = `<div class="muted">상품을 불러오지 못했습니다.</div>`;
    }
  }
}

renderCart();
loadProducts();

$("#checkoutBtn")?.addEventListener("click", () => alert("결제 플로우로 이동합니다."));
$("#viewCartBtn")?.addEventListener("click", () => alert("장바구니 상세 페이지로 이동합니다."));

function updateDeliveryDate() {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day   = String(now.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  const el = document.getElementById("delivery-time-text");
  if (el) el.textContent = dateString;
}
updateDeliveryDate();

(function () {
  const heartIcon = document.querySelector('.icons .icon-box i.fa-heart');
  const box = heartIcon ? heartIcon.parentElement : null;
  if (!box) return;

  let badge = box.querySelector('#wishCount');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'wishCount';
    badge.className = 'badge badge--pink';
    badge.textContent = '0';
    box.appendChild(badge);
  }

  const calcCount = () =>
    document.querySelectorAll(
      '.wishlist-btn.active, .wishlist-btn[aria-pressed="true"]'
    ).length;

  const updateBadge = () => {
    badge.textContent = String(calcCount());
    box.setAttribute('aria-label', `찜 ${badge.textContent}개`);
  };

  window.addEventListener('DOMContentLoaded', updateBadge);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.wishlist-btn')) return;
    setTimeout(updateBadge, 0);
  });
})();

(function () {
  const WISH_KEY = 'wish';
  const $productList = document.querySelector('.product-list');

  const readWish = () => {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || {}; }
    catch { return {}; }
  };
  const writeWish = (m) => localStorage.setItem(WISH_KEY, JSON.stringify(m));

  const updateWishBadge = () => {
    const heartIcon = document.querySelector('.icons .icon-box i.fa-heart');
    const box = heartIcon ? heartIcon.parentElement : null;
    const badge = box ? box.querySelector('#wishCount') : null;
    if (!box || !badge) return;
    const n = Object.values(readWish()).filter(Boolean).length;
    badge.textContent = String(n);
    box.setAttribute('aria-label', `찜 ${n}개`);
  };

  const simpleHash = (str) => { let h=0; for (let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; } return Math.abs(h); };
  const ensureCardId = (card) => {
    if (card.dataset.id) return card.dataset.id;
    const name = card.querySelector('.product-name')?.textContent?.trim() || '';
    const price = card.querySelector('.price')?.textContent?.trim() || '';
    const img = card.querySelector('img')?.src || '';
    const id = 'auto-' + simpleHash(name + '|' + price + '|' + img);
    card.dataset.id = id;
    return id;
  };

  const applyWishState = (card, wishMap) => {
    const id = ensureCardId(card);
    const liked = !!wishMap[id];
    const btn = card.querySelector('.wishlist-btn');
    const icon = btn?.querySelector('.fa-heart');
    if (!btn) return;
    btn.classList.toggle('active', liked);
    btn.setAttribute('aria-pressed', liked);
    if (icon) {
      icon.classList.toggle('fa-solid', liked);
      icon.classList.toggle('fa-regular', !liked);
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    const saved = readWish();
    document.querySelectorAll('.product-card').forEach(card => applyWishState(card, saved));
    updateWishBadge();
  });

  if ($productList) {
    const obs = new MutationObserver((mutations) => {
      const saved = readWish();
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.classList.contains('product-card')) applyWishState(node, saved);
          node.querySelectorAll?.('.product-card').forEach(card => applyWishState(card, saved));
        });
      });
      updateWishBadge();
    });
    obs.observe($productList, { childList: true, subtree: true });
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    const card = btn.closest('.product-card');
    if (!card) return;
    const id = ensureCardId(card);

    setTimeout(() => {
      const liked = btn.classList.contains('active') || btn.getAttribute('aria-pressed') === 'true';
      const saved = readWish();
      if (liked) saved[id] = true; else delete saved[id];
      writeWish(saved);
      updateWishBadge();
    }, 0);
  });
})();

(function () {
  const MAP_KEY  = 'wish';
  const DATA_KEY = 'wish.items.v1';

  const readMap   = () => { try { return JSON.parse(localStorage.getItem(MAP_KEY))  || {}; } catch { return {}; } };
  const readData  = () => { try { return JSON.parse(localStorage.getItem(DATA_KEY)) || {}; } catch { return {}; } };
  const writeData = (m)  => localStorage.setItem(DATA_KEY, JSON.stringify(m));
  const fmtUSD = (n) => `$${Number(n).toFixed(2)}`;

  if (!document.getElementById('wishPopoverCSS')) {
    const css = document.createElement('style');
    css.id = 'wishPopoverCSS';
    css.textContent = `
      .wish-popover{position:fixed;inset:0;pointer-events:none;z-index:41}
      .wish-popover.open{pointer-events:auto}
      .wish-popover[hidden]{display:none}
      .wish-panel{position:absolute; width:360px; max-width:88vw; background:#fff;
        border:1px solid #e6e6ea; border-radius:14px;
        box-shadow:0 18px 50px rgba(15,23,42,.22); transform:scale(.98); opacity:0;
        transition:transform .18s ease,opacity .18s ease; display:flex;flex-direction:column}
      .wish-panel::before{content:"";position:absolute;top:-8px;left:var(--wp-arrow-left,40px);
        width:16px;height:16px;background:#fff;transform:rotate(45deg);
        border-left:1px solid #e6e6ea;border-top:1px solid #e6e6ea}
      .wish-header,.wish-footer{padding:14px 16px;border-bottom:1px solid #e6e6ea;display:flex;align-items:center;gap:8px}
      .wish-header{justify-content:space-between}
      .wish-footer{border-top:1px solid #e6e6ea;border-bottom:0}
      .wish-items{list-style:none;margin:0;padding:8px 0;max-height:260px;overflow:auto}
      .wish-row{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;
        padding:10px;border-bottom:1px solid #f5f5f5}
      .wish-thumb{width:56px;height:56px;object-fit:contain}
      .wish-title{font-size:14px;}
      .wish-price{font-weight:700;margin:0}
      .wish-remove{border:none;background:transparent;font-size:18px;cursor:pointer}
      .wp-sum{margin-right:auto;display:flex;gap:10px;align-items:baseline}
      .wp-checkout{margin-left:auto;padding:10px 14px;border:none;border-radius:12px;background:#2f80ed;color:#fff;cursor:pointer}
      .wp-close{border:none;background:transparent;font-size:22px;cursor:pointer}
      .wish-row--empty{grid-template-columns:1fr !important;padding:14px 16px}
      .wish-row--empty .wish-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    `;
    document.head.appendChild(css);
  }

  function ensureDOM() {
    if (!document.getElementById('wishBackdrop')) {
      const bd = document.createElement('div');
      bd.id = 'wishBackdrop';
      bd.className = 'backdrop';
      bd.hidden = true;
      document.body.appendChild(bd);
    }
    if (!document.getElementById('wishPopover')) {
      const wrap = document.createElement('div');
      wrap.id = 'wishPopover';
      wrap.className = 'wish-popover';
      wrap.hidden = true;
      wrap.innerHTML = `
        <div class="wish-panel" role="dialog" aria-labelledby="wishPopTitle">
          <header class="wish-header">
            <h3 id="wishPopTitle">Wishlist (<span id="wishPopCount">0</span>)</h3>
            <button id="wishPopClose" class="wp-close" aria-label="닫기">×</button>
          </header>
          <ul id="wishPopItems" class="wish-items" role="list"></ul>
          <footer class="wish-footer">
            <div class="wp-sum"><span>Total</span><strong id="wishPopTotal">$0.00</strong></div>
          </footer>
        </div>`;
      document.body.appendChild(wrap);
    }
  }
  ensureDOM();

  let anchor = document.getElementById('wishIcon');
  const popover  = document.getElementById('wishPopover');
  const panel    = popover?.querySelector('.wish-panel');
  const listEl   = document.getElementById('wishPopItems');
  const countEl  = document.getElementById('wishPopCount');
  const totalEl  = document.getElementById('wishPopTotal');
  const closeWishBtn = document.getElementById('wishPopClose');
  const wishBackdrop = document.getElementById('wishBackdrop');

  const pickFromCard = (id) => {
    const card  = document.querySelector(`.product-card[data-id="${CSS.escape(id)}"]`);
    if (!card) return null;
    const title = card.querySelector('.product-name, [data-title], .title, h4, h3')?.textContent?.trim() || '';
    const img   = card.querySelector('img')?.getAttribute('src') || '';
    const ptxt  = card.querySelector('.price, [data-price]')?.textContent || '';
    const m     = String(ptxt).replace(/,/g,'').match(/-?\d+(\.\d+)?/);
    const price = m ? Number(m[0]) : NaN;
    return { id, title, img, price };
  };

  const ensureSnapshots = (ids) => {
    const data = readData();
    ids.forEach(id => { if (!data[id]) { const p = pickFromCard(id); if (p) data[id] = p; } });
    writeData(data);
    return data;
  };

  function renderWish(){
    const map  = readMap();
    const ids  = Object.keys(map).filter(k => !!map[k]);
    const data = ensureSnapshots(ids);
    const items = ids.map(id => data[id]).filter(Boolean);

    countEl.textContent = String(items.length);

    if (items.length === 0) {
      listEl.innerHTML = `
        <li class="wish-row wish-row--empty">
          <div class="wish-title">찜한 상품이 없습니다.</div>
        </li>`;
      totalEl.textContent = fmtUSD(0);
      return;
    }

    listEl.innerHTML = items.map(it => `
      <li class="wish-row" data-id="${it.id}">
        <img class="wish-thumb" src="${it.img || ''}" alt="">
        <div>
          <p class="wish-title">${it.title || '(이름 미확인)'}</p>
          <p class="wish-price">${isNaN(it.price) ? '' : fmtUSD(it.price)}</p>
        </div>
        <button class="wish-remove" aria-label="삭제">×</button>
      </li>
    `).join('');

    const total = items.reduce((s,v) => s + (isNaN(v.price)?0:Number(v.price)), 0);
    totalEl.textContent = fmtUSD(total);
  }

  function placeWishPopover(){
    if (!anchor || !panel) return;
    const r  = anchor.getBoundingClientRect();
    const gap = 10;
    const panelW = panel.offsetWidth || 360;
    const vw = document.documentElement.clientWidth;

    let idealLeft = (r.left + r.right)/2 - panelW/2;
    const minLeft = 12;
    const maxLeft = vw - panelW - 12;
    const left = Math.max(minLeft, Math.min(maxLeft, idealLeft));
    const top  = Math.max(12, r.bottom + gap);

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top  = `${Math.round(top)}px`;

    const arrowX = (r.left + r.right)/2 - left;
    const clamp  = Math.max(16, Math.min(panelW - 24, arrowX));
    panel.style.setProperty('--wp-arrow-left', `${Math.round(clamp)}px`);
  }

  function openWish(){
    renderWish();
    popover.hidden = false;
    wishBackdrop.hidden = false;
    requestAnimationFrame(() => {
      popover.classList.add('open');
      wishBackdrop.classList.add('show');
      placeWishPopover();
    });
    anchor?.setAttribute('aria-expanded', 'true');
    window.addEventListener('resize', placeWishPopover);
    window.addEventListener('keydown', onEsc);
  }
  function closeWish(){
    popover.classList.remove('open');
    wishBackdrop.classList.remove('show');
    anchor?.setAttribute('aria-expanded', 'false');
    window.removeEventListener('resize', placeWishPopover);
    window.removeEventListener('keydown', onEsc);
    setTimeout(() => { popover.hidden = true; wishBackdrop.hidden = true; }, 150);
  }
  function onEsc(e){ if (e.key === 'Escape') closeWish(); }

  if (anchor) {
    const cloned = anchor.cloneNode(true);
    anchor.parentNode.replaceChild(cloned, anchor);
    anchor = cloned;
  }

  anchor?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    const isOpen = popover.classList.contains('open') && !popover.hidden;
    if (isOpen) closeWish();
    else openWish();
  }, { capture: true });

  closeWishBtn?.addEventListener('click', closeWish);
  wishBackdrop?.addEventListener('click', closeWish);

  listEl?.addEventListener('click', (e) => {
    const rm = e.target.closest('.wish-remove');
    if (!rm) return;
    const row = rm.closest('.wish-row');
    const id = row?.dataset.id;
    if (!id) return;

    const map = readMap(); delete map[id]; localStorage.setItem(MAP_KEY, JSON.stringify(map));
    const data = readData(); delete data[id]; writeData(data);

    const btn = document.querySelector(`.product-card[data-id="${CSS.escape(id)}"] .wishlist-btn`);
    const icon = btn?.querySelector('.fa-heart');
    if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-pressed','false'); }
    if (icon){ icon.classList.remove('fa-solid'); icon.classList.add('fa-regular'); }

    const n = Object.values(map).filter(Boolean).length;
    const badge = document.getElementById('wishCount');
    const box = document.getElementById('wishIcon');
    if (badge) badge.textContent = String(n);
    box?.setAttribute('aria-label', `찜 ${n}개`);

    renderWish();
    placeWishPopover();                                                     
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    const card = btn.closest('.product-card');
    if (!card) return;
    const id = card.dataset.id;
    setTimeout(() => {
      const map = readMap();
      const data = readData();
      if (map[id]) {
        const snap = pickFromCard(id);
        if (snap) data[id] = snap;
      } else {
        delete data[id];
      }
      writeData(data);
      if (!popover.hidden) renderWish();
    }, 0);
  });

  window.addEventListener('storage', (e) => {
    if (e.key !== MAP_KEY && e.key !== DATA_KEY) return;
    const map = readMap();
    const n = Object.values(map).filter(Boolean).length;
    const badge = document.getElementById('wishCount');
    const box = document.getElementById('wishIcon');
    if (badge) badge.textContent = String(n);
    box?.setAttribute('aria-label', `찜 ${n}개`);
    if (!popover.hidden) { renderWish(); placeWishPopover(); }
  });

})();

(function(){
  const el = document.querySelector('.icons .icon-box[aria-label="마이페이지"]');
  if (!el) return;
  if (el.tagName.toLowerCase() === 'a' && el.getAttribute('href')) return;
  const go = () => { window.location.href = './연습장2.html'; };
  el.addEventListener('click', go);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }});
})();
