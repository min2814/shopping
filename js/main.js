const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// === mini cart ===
function scLoad() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}
function scSave(arr) {
  localStorage.setItem("cart", JSON.stringify(arr));
}

const DELIVERY_FEE = 5;

// === [헤더 미니카트 DOM] ===
const cartIcon = document.querySelector(".cart-icon");
const miniCart = document.getElementById("mini-cart");
const miniList = document.getElementById("mini-cart-list");
const miniOrder = document.getElementById("mini-order");
const miniDelivery = document.getElementById("mini-delivery");
const miniTotal = document.getElementById("mini-total");
const miniCheckoutBtn = document.getElementById("mini-checkout");
const miniViewCartBtn = document.getElementById("mini-view-cart");
const cartCountBadge = document.getElementById("cart-count");

// 동일 상품 묶기 (id 있으면 id, 없으면 title 기준)
function groupCartItems(rawCart) {
  const grouped = {};
  rawCart.forEach((item) => {
    const key = item.id ?? item.title;
    if (!grouped[key]) grouped[key] = { ...item, quantity: 0, _key: key };
    grouped[key].quantity += 1;
  });
  return Object.values(grouped);
}

// 헤더 배지
function updateCartBadge() {
  const cnt = scLoad().length;
  if (cartCountBadge) {
    cartCountBadge.textContent = String(cnt);
    cartCountBadge.style.display = cnt > 0 ? "inline-block" : "none";
  }
}

// 미니카트 렌더
function renderMiniCart() {
  if (!miniList || !miniOrder || !miniDelivery || !miniTotal) return;
  const grouped = groupCartItems(scLoad());

  // 리스트
  miniList.innerHTML = "";
  grouped.forEach((item) => {
    const li = document.createElement("li");
    li.className = "mini-cart__item";
    li.innerHTML = `
      <img class="mini-cart__thumb" src="${item.image}" alt="${item.title}">
      <div class="mini-cart__meta">
        <div class="mini-cart__title">${item.title}</div>
        <div class="mini-cart__sub">x${item.quantity} · ${
      item.category || ""
    }</div>
      </div>
      <div class="mini-cart__price">$${(item.price * item.quantity).toFixed(
        2
      )}</div>
    `;
    miniList.appendChild(li);
  });

  // 합계
  const order = grouped.reduce((s, i) => s + i.price * i.quantity, 0);
  const delv = grouped.length === 0 ? 0 : DELIVERY_FEE;
  const total = order + delv;

  miniOrder.textContent = `$${order.toFixed(2)}`;
  miniDelivery.textContent = `$${delv.toFixed(2)}`;
  miniTotal.textContent = `$${total.toFixed(2)}`;

  if (miniCheckoutBtn) miniCheckoutBtn.disabled = grouped.length === 0;
}

// 결제 진행(공용)
function proceedCheckout() {
  const grouped = groupCartItems(scLoad());
  if (!grouped.length) return;

  const productsForPayment = grouped.map(({ _key, ...rest }) => rest);
  const order = grouped.reduce((s, it) => s + it.price * it.quantity, 0);
  const delivery = grouped.length === 0 ? 0 : DELIVERY_FEE;
  const total = order + delivery;

  localStorage.setItem("products", JSON.stringify(productsForPayment));
  localStorage.setItem(
    "summary",
    JSON.stringify({
      order: Number(order.toFixed(2)),
      delivery: Number(delivery.toFixed(2)),
      total: Number(total.toFixed(2)),
    })
  );

  window.location.href = "./pay.html";
}

// 미니카트 토글/닫기/버튼 이벤트
cartIcon?.addEventListener("click", (e) => {
  e.stopPropagation();
  cartIcon.classList.toggle("open");
  renderMiniCart();
});
document.addEventListener("click", (e) => {
  if (cartIcon && !cartIcon.contains(e.target))
    cartIcon.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cartIcon?.classList.remove("open");
});
miniCheckoutBtn?.addEventListener("click", proceedCheckout);
miniViewCartBtn?.addEventListener("click", () => {
  location.href = "./shopping_cart.html";
});

// 초기 동기화
updateCartBadge();
renderMiniCart();

// (선택) 다른 탭에서 장바구니 바뀌면 배지/미니카트 갱신
window.addEventListener("storage", (e) => {
  if (e.key === "cart") {
    updateCartBadge();
    renderMiniCart();
  }
});
// === [add-to-cart: 공통 "cart" 포맷] ===
// 개별 아이템을 1개씩 push → 묶기는 렌더 단계에서 처리
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;

  const id = String(btn.dataset.id || "");
  const title = btn.dataset.name || "상품";
  const price = Number(btn.dataset.price || 0);
  const image = btn.dataset.image || "";
  // 선택 항목(있으면 dataset에 넣어 사용)
  const category = btn.dataset.category || "";
  const color = btn.dataset.color || "";
  const size = btn.dataset.size || "";

  const arr = scLoad();
  arr.push({ id, title, price, image, category, color, size });
  scSave(arr);

  updateCartBadge();
  renderMiniCart();
});
updateCartBadge();
renderMiniCart();

const productList = document.querySelector(".product-list");

async function loadProducts() {
  try {
    if (!productList) return;
    if (productList.querySelector(".product-card")) return;

    const res = await fetch("https://fakestoreapi.com/products?limit=8");
    const data = await res.json();

    const frag = document.createDocumentFragment();
    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "product-card";
      div.dataset.id = item.id;
      div.dataset.name = item.title;
      div.dataset.price = item.price;
      div.dataset.image = item.image;
      const title =
        item.title.length > 10 ? item.title.slice(0, 20) + "…" : item.title;
      div.innerHTML = `
        <button class="wishlist-btn" aria-label="찜하기"><i class="fa-regular fa-heart"></i></button>
        <div class="img-wrap"><img src="${item.image}" alt="상품 이미지"></div>
        <p class="product-name">${title}</p>
        <div class="price-row">
          <span class="price">$${Number(item.price).toFixed(2)}</span>
          <button class="add-btn add-to-cart"
            aria-label="담기"
            data-id="${item.id}"
            data-name="${item.title.replace(/"/g, "&quot;")}"
            data-price="${item.price}"
            data-image="${item.image}">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      `;
      frag.appendChild(div);
    });
    productList.appendChild(frag);
  } catch (e) {
    if (!productList.children.length) {
      productList.innerHTML = `<div class="muted">상품을 불러오지 못했습니다.</div>`;
    }
  }
}

$("#checkoutBtn")?.addEventListener("click", () =>
  alert("결제 플로우로 이동합니다.")
);
$("#viewCartBtn")?.addEventListener("click", () =>
  alert("장바구니 상세 페이지로 이동합니다.")
);

function updateDeliveryDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  const el = document.getElementById("delivery-time-text");
  if (el) el.textContent = dateString;
}
updateDeliveryDate();

(function () {
  const WISH_KEY = "wish";

  const heartIcon = document.querySelector(".icons .icon-box i.fa-heart");
  const box = heartIcon ? heartIcon.parentElement : null;
  if (!box) return;

  let badge = box.querySelector("#wishCount");
  if (!badge) {
    badge = document.createElement("span");
    badge.id = "wishCount";
    badge.className = "badge badge--pink";
    badge.textContent = "0";
    box.appendChild(badge);
  }

  const readWish = () => {
    try {
      return JSON.parse(localStorage.getItem(WISH_KEY)) || {};
    } catch {
      return {};
    }
  };

  const calcCount = () => {
    const map = readWish();
    return Object.values(map).filter(Boolean).length;
  };

  const updateBadge = () => {
    const n = calcCount();
    badge.textContent = String(n);
    box.setAttribute("aria-label", `찜 ${n}개`);
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", updateBadge, { once: true });
  } else {
    updateBadge();
  }

  window.addEventListener("storage", (e) => {
    if (e.key === WISH_KEY) updateBadge();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".wishlist-btn")) return;
    setTimeout(updateBadge, 0);
  });
})();

(function () {
  const WISH_KEY = "wish";
  const $productList = document.querySelector(".product-list");

  const readWish = () => {
    try {
      return JSON.parse(localStorage.getItem(WISH_KEY)) || {};
    } catch {
      return {};
    }
  };
  function writeWish(map) {
    localStorage.setItem(WISH_KEY, JSON.stringify(map));
  }

  const updateWishBadge = () => {
    const heartIcon = document.querySelector(".icons .icon-box i.fa-heart");
    const box = heartIcon ? heartIcon.parentElement : null;
    const badge = box ? box.querySelector("#wishCount") : null;
    if (!box || !badge) return;
    const n = Object.values(readWish()).filter(Boolean).length;
    badge.textContent = String(n);
    box.setAttribute("aria-label", `찜 ${n}개`);
  };

  const simpleHash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };
  const ensureCardId = (card) => {
    if (card.dataset.id) return card.dataset.id;
    const name = card.querySelector(".product-name")?.textContent?.trim() || "";
    const price = card.querySelector(".price")?.textContent?.trim() || "";
    const img = card.querySelector("img")?.src || "";
    const id = "auto-" + simpleHash(name + "|" + price + "|" + img);
    card.dataset.id = id;
    return id;
  };

  const applyWishState = (card, wishMap) => {
    const id = ensureCardId(card);
    const liked = !!wishMap[id];
    const btn = card.querySelector(".wishlist-btn");
    const icon = btn?.querySelector(".fa-heart");
    if (!btn) return;
    btn.classList.toggle("active", liked);
    btn.setAttribute("aria-pressed", liked);
    if (icon) {
      icon.classList.toggle("fa-solid", liked);
      icon.classList.toggle("fa-regular", !liked);
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    const saved = readWish();
    document
      .querySelectorAll(".product-card")
      .forEach((card) => applyWishState(card, saved));
    updateWishBadge();
  });

  if ($productList) {
    const obs = new MutationObserver((mutations) => {
      const saved = readWish();
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList.contains("product-card"))
            applyWishState(node, saved);
          node
            .querySelectorAll?.(".product-card")
            .forEach((card) => applyWishState(card, saved));
        });
      });
      updateWishBadge();
    });
    obs.observe($productList, { childList: true, subtree: true });
  }

  // 위시 버튼 클릭: 토글 → 저장 → 배지 갱신
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".wishlist-btn");
    if (!btn) return;

    const card = btn.closest(".product-card");
    if (!card) return;

    // 필요한 헬퍼: ensureCardId, readWish, writeWish, updateWishBadge 는 기존 코드 그대로 사용
    const id = ensureCardId(card);

    // 1) 현재 상태 뒤집기(토글)
    const isNowActive =
      btn.classList.contains("active") ||
      btn.getAttribute("aria-pressed") === "true";
    const willLike = !isNowActive;

    btn.classList.toggle("active", willLike);
    btn.setAttribute("aria-pressed", String(willLike));

    const icon = btn.querySelector(".fa-heart");
    if (icon) {
      icon.classList.toggle("fa-solid", willLike);
      icon.classList.toggle("fa-regular", !willLike);
    }

    // 2) 저장소 반영
    const saved = readWish(); // { [id]: true } 형태
    if (willLike) saved[id] = true;
    else delete saved[id];
    writeWish(saved);

    // 3) 상단 배지 갱신
    updateWishBadge();
  });

  (function () {
    const MAP_KEY = "wish";
    const DATA_KEY = "wish.items.v1";

    const readMap = () => {
      try {
        return JSON.parse(localStorage.getItem(MAP_KEY)) || {};
      } catch {
        return {};
      }
    };
    const readData = () => {
      try {
        return JSON.parse(localStorage.getItem(DATA_KEY)) || {};
      } catch {
        return {};
      }
    };
    const writeData = (m) => localStorage.setItem(DATA_KEY, JSON.stringify(m));
    const fmtUSD = (n) => `$${Number(n).toFixed(2)}`;

    if (!document.getElementById("wishPopoverCSS")) {
      const css = document.createElement("style");
      css.id = "wishPopoverCSS";
      css.textContent = `
      .wish-popover{position:fixed;inset:0;pointer-events:none;z-index:41}
      
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
      if (!document.getElementById("wishBackdrop")) {
        const bd = document.createElement("div");
        bd.id = "wishBackdrop";
        bd.className = "backdrop";
        bd.hidden = true;
        document.body.appendChild(bd);
      }
      if (!document.getElementById("wishPopover")) {
        const wrap = document.createElement("div");
        wrap.id = "wishPopover";
        wrap.className = "wish-popover";
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

    let anchor = document.getElementById("wishIcon");
    const popover = document.getElementById("wishPopover");
    const panel = popover?.querySelector(".wish-panel");
    const listEl = document.getElementById("wishPopItems");
    const countEl = document.getElementById("wishPopCount");
    const totalEl = document.getElementById("wishPopTotal");
    const closeWishBtn = document.getElementById("wishPopClose");
    const wishBackdrop = document.getElementById("wishBackdrop");

    const pickFromCard = (id) => {
      const card = document.querySelector(
        `.product-card[data-id="${CSS.escape(id)}"]`
      );
      if (!card) return null;
      const title =
        card
          .querySelector(".product-name, [data-title], .title, h4, h3")
          ?.textContent?.trim() || "";
      const img = card.querySelector("img")?.getAttribute("src") || "";
      const ptxt =
        card.querySelector(".price, [data-price]")?.textContent || "";
      const m = String(ptxt)
        .replace(/,/g, "")
        .match(/-?\d+(\.\d+)?/);
      const price = m ? Number(m[0]) : NaN;
      return { id, title, img, price };
    };

    const ensureSnapshots = (ids) => {
      const data = readData();
      ids.forEach((id) => {
        if (!data[id]) {
          const p = pickFromCard(id);
          if (p) data[id] = p;
        }
      });
      writeData(data);
      return data;
    };

    function renderWish() {
      const map = readMap();
      const ids = Object.keys(map).filter((k) => !!map[k]);
      const data = ensureSnapshots(ids);
      const items = ids.map((id) => data[id]).filter(Boolean);

      countEl.textContent = String(items.length);

      if (items.length === 0) {
        listEl.innerHTML = `
        <li class="wish-row wish-row--empty">
          <div class="wish-title">찜한 상품이 없습니다.</div>
        </li>`;
        totalEl.textContent = fmtUSD(0);
        return;
      }

      listEl.innerHTML = items
        .map(
          (it) => `
      <li class="wish-row" data-id="${it.id}">
        <img class="wish-thumb" src="${it.img || ""}" alt="">
        <div>
          <p class="wish-title">${it.title || "(이름 미확인)"}</p>
          <p class="wish-price">${isNaN(it.price) ? "" : fmtUSD(it.price)}</p>
        </div>
        <button class="wish-remove" aria-label="삭제">×</button>
      </li>
    `
        )
        .join("");

      const total = items.reduce(
        (s, v) => s + (isNaN(v.price) ? 0 : Number(v.price)),
        0
      );
      totalEl.textContent = fmtUSD(total);
    }

    function placeWishPopover() {
      if (!anchor || !panel) return;
      const r = anchor.getBoundingClientRect();
      const gap = 10;
      const panelW = panel.offsetWidth || 360;
      const vw = document.documentElement.clientWidth;
      const sx = window.scrollX,
        sy = window.scrollY;

      let idealLeft = sx + (r.left + r.right) / 2 - panelW / 2;
      const minLeft = sx + 12;
      const maxLeft = sx + vw - panelW - 12;
      const left = Math.max(minLeft, Math.min(maxLeft, idealLeft));
      const top = sy + r.bottom + gap;

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;

      const arrowX = sx + (r.left + r.right) / 2 - left;
      const clamp = Math.max(16, Math.min(panelW - 24, arrowX));
      panel.style.setProperty("--wp-arrow-left", `${clamp}px`);
    }

    function placeWishFixed() {
      const PANEL_W = 360;
      const MARGIN_R = 12;
      const GAP_TOP = 20;

      const vw = document.documentElement.clientWidth;
      const leftPx = Math.max(12, vw - PANEL_W - MARGIN_R);

      const searchBar = document.querySelector(".search-section");
      const topPx = searchBar
        ? searchBar.getBoundingClientRect().bottom + GAP_TOP
        : 80;

      const anchor = document.querySelector(".icons .fa-heart")?.parentElement;
      let arrowLeft = 40;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        arrowLeft = Math.max(16, Math.min(PANEL_W - 24, centerX - leftPx));
      }

      const popover = document.querySelector(".wish-popover");
      popover.classList.add("wish-popover--fixed");
      popover.style.setProperty("--wp-fixed-left", `${leftPx}px`);
      popover.style.setProperty("--wp-fixed-top", `${topPx}px`);
      popover.style.setProperty("--wp-fixed-arrow-left", `${arrowLeft}px`);
    }

    function openWish() {
      renderWish();
      popover.hidden = false;
      wishBackdrop.hidden = false;
      requestAnimationFrame(() => {
        popover.classList.add("open");
        wishBackdrop.classList.add("show");
        placeWishPopover();
        // placeWishFixed();
      });
      anchor?.setAttribute("aria-expanded", "true");
      window.addEventListener("resize", placeWishPopover);
      window.addEventListener("scroll", placeWishPopover, { passive: true });
      window.addEventListener("keydown", onEsc);
    }
    function closeWish() {
      popover.classList.remove("open");
      wishBackdrop.classList.remove("show");
      anchor?.setAttribute("aria-expanded", "false");
      window.removeEventListener("resize", placeWishPopover);
      window.removeEventListener("scroll", placeWishPopover);
      window.removeEventListener("keydown", onEsc);
      setTimeout(() => {
        popover.hidden = true;
        wishBackdrop.hidden = true;
      }, 150);
    }
    function onEsc(e) {
      if (e.key === "Escape") closeWish();
    }

    if (anchor) {
      const cloned = anchor.cloneNode(true);
      anchor.parentNode.replaceChild(cloned, anchor);
      anchor = cloned;
    }

    anchor?.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        const isOpen = popover.classList.contains("open") && !popover.hidden;
        if (isOpen) closeWish();
        else openWish();
      },
      { capture: true }
    );

    closeWishBtn?.addEventListener("click", closeWish);
    wishBackdrop?.addEventListener("click", closeWish);

    listEl?.addEventListener("click", (e) => {
      const rm = e.target.closest(".wish-remove");
      if (!rm) return;
      const row = rm.closest(".wish-row");
      const id = row?.dataset.id;
      if (!id) return;

      const map = readMap();
      delete map[id];
      localStorage.setItem(MAP_KEY, JSON.stringify(map));
      const data = readData();
      delete data[id];
      writeData(data);

      const btn = document.querySelector(
        `.product-card[data-id="${CSS.escape(id)}"] .wishlist-btn`
      );
      const icon = btn?.querySelector(".fa-heart");
      if (btn) {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      }
      if (icon) {
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
      }

      const n = Object.values(map).filter(Boolean).length;
      const badge = document.getElementById("wishCount");
      const box = document.getElementById("wishIcon");
      if (badge) badge.textContent = String(n);
      box?.setAttribute("aria-label", `찜 ${n}개`);

      renderWish();
      placeWishPopover();
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".wishlist-btn");
      if (!btn) return;
      const card = btn.closest(".product-card");
      if (!card) return;
      const id = ensureCardId(card);

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
  })();

  (function () {
    const PROFILE_KEY = "shop.profile.v1";
    const TITLE_ID = "recommendTitle";

    function getNameFromProfile() {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return "";
        const obj = JSON.parse(raw);
        const name = obj && typeof obj.name === "string" ? obj.name.trim() : "";
        return name.length > 24 ? name.slice(0, 24) + "…" : name;
      } catch {
        return "";
      }
    }

    function applyRecommendTitle() {
      const el = document.getElementById(TITLE_ID);
      if (!el) return;
      const name = getNameFromProfile();
      el.textContent = name ? `${name}님을 위한 추천 상품` : "추천 상품";
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyRecommendTitle, {
        once: true,
      });
    } else {
      applyRecommendTitle();
    }
    window.addEventListener("load", applyRecommendTitle, { once: true });
    window.addEventListener("storage", (e) => {
      if (e.key === PROFILE_KEY) applyRecommendTitle();
    });
  })();
  // document.addEventListener("DOMContentLoaded", () => {
  //   loadProducts();
  // });
  if (!/\/list\.html(\?|#|$)/.test(location.pathname + location.search)) {
    document.addEventListener("DOMContentLoaded", () => {
      loadProducts();
    });
  }
  // search
  // === [검색 자동완성 - shopping_cart 동일 로직] ===
  (function () {
    const searchInput = document.querySelector(".search-input");
    const searchButton = document.querySelector(".search-submit");
    const group = document.querySelector(".search-group");
    if (!group || !searchInput) return;

    // 드롭다운 DOM (동적으로 추가)
    const suggest = document.createElement("ul");
    suggest.className = "suggest-list";
    suggest.id = "search-suggest";
    suggest.setAttribute("role", "listbox");
    suggest.setAttribute("aria-label", "연관 검색어");
    group.appendChild(suggest);

    let productsIndex = []; // [{title, category}]
    let flatTerms = []; // 추출된 문자열 후보들
    let activeIndex = -1; // 키보드 선택 인덱스

    // 검색 이동
    function goSearch(forceValue) {
      const q = (
        forceValue !== undefined && forceValue !== null
          ? forceValue
          : searchInput.value || ""
      ).trim();

      if (q)
        window.location.href = `./list.html?query=${encodeURIComponent(q)}`;
    }

    // 버튼 클릭
    searchButton?.addEventListener("click", () => goSearch());

    // 키보드 처리
    searchInput.addEventListener("keydown", (e) => {
      const count = itemCount();
      if (e.key === "Enter") {
        e.preventDefault();
        if (count > 0 && activeIndex >= 0) {
          const li = suggest.children[activeIndex];
          goSearch(li.dataset.value);
        } else {
          goSearch();
        }
        closeSuggest();
      } else if (e.key === "ArrowDown") {
        if (!count) return;
        e.preventDefault();
        activeIndex = (activeIndex + 1) % count;
        paintActive();
      } else if (e.key === "ArrowUp") {
        if (!count) return;
        e.preventDefault();
        activeIndex = (activeIndex - 1 + count) % count;
        paintActive();
      } else if (e.key === "Escape") {
        closeSuggest();
      }
    });

    // 입력 디바운스
    const debouncedInput = debounce(handleSuggestInput, 120);
    searchInput.addEventListener("input", debouncedInput);

    // 바깥 클릭 → 닫기
    document.addEventListener("click", (e) => {
      if (!suggest.contains(e.target) && e.target !== searchInput)
        closeSuggest();
    });

    // ===== helpers =====
    function normalize(s) {
      return (s || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .trim();
    }
    function buildTerms() {
      const set = new Set();
      productsIndex.forEach((p) => {
        set.add(p.title);
        normalize(p.title)
          .split(/\s+/)
          .forEach((w) => {
            if (w.length >= 3) set.add(w);
          });
        if (p.category) set.add(p.category);
      });
      flatTerms = Array.from(set);
    }
    function handleSuggestInput() {
      const q = normalize(searchInput.value);
      if (!q) {
        closeSuggest();
        return;
      }
      const starts = [],
        includes = [];
      for (const t of flatTerms) {
        const n = normalize(t);
        if (n.startsWith(q)) starts.push(t);
        else if (n.includes(q)) includes.push(t);
        if (starts.length >= 6 && includes.length >= 4) break;
      }
      renderSuggest([...starts, ...includes].slice(0, 10));
    }
    function renderSuggest(items) {
      suggest.innerHTML = "";
      activeIndex = -1;
      if (!items.length) {
        closeSuggest();
        return;
      }
      items.forEach((text) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.dataset.value = text;
        li.innerHTML = `<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>${text}</span>`;
        // mousedown: click보다 먼저 발생 → input blur 방지
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
          goSearch(text);
          closeSuggest();
        });
        suggest.appendChild(li);
      });
      suggest.style.display = "block";
    }
    function paintActive() {
      [...suggest.children].forEach((li, idx) => {
        li.setAttribute(
          "aria-selected",
          idx === activeIndex ? "true" : "false"
        );
        if (idx === activeIndex) li.scrollIntoView({ block: "nearest" });
      });
    }
    function closeSuggest() {
      suggest.style.display = "none";
      suggest.innerHTML = "";
      activeIndex = -1;
    }
    function itemCount() {
      return suggest.style.display === "block" ? suggest.children.length : 0;
    }
    function debounce(fn, ms) {
      let id;
      return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), ms);
      };
    }

    // 초기 1회: 후보어 인덱스 구성 (fakestore)
    (async function bootstrapSuggest() {
      try {
        const res = await fetch("https://fakestoreapi.com/products");
        const data = await res.json();
        productsIndex = data.map((d) => ({
          title: d.title,
          category: d.category,
        }));
        buildTerms();
      } catch (e) {
        console.warn("suggest seed fetch fail", e);
      }
    })();
  })();
})();
