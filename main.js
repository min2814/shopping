/* =========================
   간단 장바구니 상태/유틸
========================= */
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

/* =========================
   요소 참조
========================= */
const openBtn = $("#cartOpenBtn");
const cartCount = $("#cartCount");
const drawer = $("#cartDrawer");
const backdrop = $("#cartBackdrop");
const closeBtn = $("#cartClose");
const listEl = $("#cartItems");
const subtotalEl = $("#cpSubtotal");

/* =========================
   드로어 열기/닫기 + 포커스
========================= */
let lastFocused;
function openDrawer(){
  lastFocused = document.activeElement;
  drawer.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    drawer.classList.add("open");
    backdrop.classList.add("show");
  });
  openBtn?.setAttribute("aria-expanded", "true");
  closeBtn?.focus();
  window.addEventListener("keydown", onEscClose);
}
function closeDrawer(){
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
  openBtn?.setAttribute("aria-expanded", "false");
  window.removeEventListener("keydown", onEscClose);
  setTimeout(() => {
    drawer.hidden = true;
    backdrop.hidden = true;
    if (lastFocused) lastFocused.focus();
  }, 280);
}
function onEscClose(e){ if(e.key === "Escape") closeDrawer(); }

/* 트리거 */
openBtn?.addEventListener("click", openDrawer);
openBtn?.addEventListener("keydown", (e)=>{ if(e.key === "Enter" || e.key === " ") { e.preventDefault(); openDrawer(); }});
closeBtn?.addEventListener("click", closeDrawer);
backdrop?.addEventListener("click", closeDrawer);

/* =========================
   장바구니 렌더링
========================= */
function renderCart(){
  // 배지 갱신
  cartCount.textContent = cart.reduce((s, it) => s + it.qty, 0);

  // 합계
  subtotalEl.textContent = currencyKRW(subtotal(cart) * 1400); // 데모 환산(달러->원 대략)

  // 목록
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

/* 수량/삭제 버튼 위임 */
listEl.addEventListener("click", (e) => {
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
});

/* =========================
   담기 동작(위임)
   - .add-to-cart 버튼 사용
   - data-* : id, name, price, image
========================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if(!btn) return;

  const id = String(btn.dataset.id);
  const name = btn.dataset.name || "상품";
  const price = Number(btn.dataset.price || 0);  // USD(데모)
  const image = btn.dataset.image || "";

  const found = cart.find((x) => x.id === id);
  if(found) found.qty += 1;
  else cart.push({ id, name, price, image, qty: 1 });

  saveCart(cart);
  renderCart();
});

/* =========================
   데모용 상품 카드 로드
========================= */
const productList = document.querySelector(".product-list");

async function loadProducts(){
  try{
    const res = await fetch("https://fakestoreapi.com/products?limit=8");
    const data = await res.json();

    productList.innerHTML = "";
    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "product-card";

      const title = item.title.length > 42 ? item.title.slice(0,42) + "…" : item.title;

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
      productList.appendChild(div);
    });
  }catch(e){
    productList.innerHTML = `<div class="muted">상품을 불러오지 못했습니다.</div>`;
  }
}

/* 초기 렌더 */
renderCart();
loadProducts();

/* 선택: 결제/상세 버튼 데모 */
$("#checkoutBtn")?.addEventListener("click", () => alert("결제 플로우로 이동합니다(데모)."));
$("#viewCartBtn")?.addEventListener("click", () => alert("장바구니 상세 페이지로 이동합니다(데모)."));

function updateDeliveryDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const dateString = `${year}-${month}-${day}`;
  document.getElementById("delivery-time-text").textContent = `: ${dateString}`;
}

// 페이지 로드 시 실행
updateDeliveryDate();
