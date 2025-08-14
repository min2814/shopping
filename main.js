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

const subtotal = (items) => items.reduce((s, it) => s + it.price * it.qty, 0);

const openBtn = $("#cartOpenBtn");
const cartCount = $("#cartCount");
const drawer = $("#cartDrawer");
const backdrop = $("#cartBackdrop");
const closeBtn = $("#cartClose");
const panel = drawer?.querySelector(".cart-panel");
const listEl = $("#cartItems");
const subtotalEl = $("#cpSubtotal");

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
  lastFocused = document.activeElement;
  drawer.hidden = false;
  backdrop.hidden = false;
  renderCart();
  requestAnimationFrame(() => {
    drawer.classList.add("open");
    backdrop.classList.add("show");
    placePopover(); 
  });
  openBtn?.setAttribute("aria-expanded", "true");
  closeBtn?.focus();
  window.addEventListener("keydown", onEscClose);
  window.addEventListener("resize", placePopover);
  window.addEventListener("scroll", placePopover, { passive: true });
}
function closeDrawer(){
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
  openBtn?.setAttribute("aria-expanded", "false");
  window.removeEventListener("keydown", onEscClose);
  window.removeEventListener("resize", placePopover);
  window.removeEventListener("scroll", placePopover);
  setTimeout(() => {
    drawer.hidden = true;
    backdrop.hidden = true;
    if (lastFocused) lastFocused.focus();
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
  if (subtotalEl) subtotalEl.textContent = currencyKRW(subtotal(cart) * 1400);

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
      <div><strong>${currencyKRW(it.price * 1400 * it.qty)}</strong></div>
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

$("#checkoutBtn")?.addEventListener("click", () => alert("결제 플로우로 이동합니다(데모)."));
$("#viewCartBtn")?.addEventListener("click", () => alert("장바구니 상세 페이지로 이동합니다(데모)."));

function updateDeliveryDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  const el = document.getElementById("delivery-time-text");
  if (el) el.textContent = `: ${dateString}`;
}
updateDeliveryDate();


// 
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

  // 버튼 단위로만 계산 (중복 방지)
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

  // 저장
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
    const n = document.querySelectorAll('.wishlist-btn.active, .wishlist-btn[aria-pressed="true"]').length;
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
