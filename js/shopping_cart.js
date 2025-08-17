const cartListElement = document.querySelector(".shopping__list ul");
const orderAmountElement = document.querySelectorAll(
  ".payment__top_list span:last-child"
)[0];
const deliveryElement = document.querySelectorAll(
  ".payment__top_list span:last-child"
)[1];
const totalElement = document.querySelector(".payment__price > div:last-child");
const checkoutButton = document.querySelector(".payment__btn button");
const paymentContainer = document.querySelector(".payment__container"); // ← 추가

const DELIVERY_FEE = 5; // 배송비

// 장바구니 데이터 불러오기
function loadCartFromStorage() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// 동일 상품 묶기
function groupCartItems(rawCart) {
  const groupedItems = {};
  rawCart.forEach((item) => {
    const key = item.id ?? item.title;
    if (!groupedItems[key]) {
      groupedItems[key] = { ...item, quantity: 0, _key: key };
    }
    groupedItems[key].quantity += 1;
  });
  return Object.values(groupedItems);
}

// 묶은 상품 배열에 저장 ..
function saveGroupedItemsToStorage(groupedItems) {
  const expandedItems = [];
  groupedItems.forEach(({ quantity, _key, ...rest }) => {
    for (let i = 0; i < quantity; i++) expandedItems.push(rest);
  });
  localStorage.setItem("cart", JSON.stringify(expandedItems));
}

// 결제
function updatePaymentSummary(items) {
  const orderPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryPrice = items.length === 0 ? 0 : DELIVERY_FEE;
  const totalPrice = orderPrice + deliveryPrice;

  orderAmountElement.textContent = `$${orderPrice.toFixed(2)}`;
  deliveryElement.textContent = `$${deliveryPrice.toFixed(2)}`;
  totalElement.textContent = `$${totalPrice.toFixed(2)}`;

  // 장바구니 비었을 때 버튼 비활성화
  checkoutButton.disabled = items.length === 0;
}

function renderCart() {
  const rawCart = loadCartFromStorage();
  const groupedItems = groupCartItems(rawCart);

  cartListElement.innerHTML = "";

  if (groupedItems.length === 0) {
    if (paymentContainer) paymentContainer.style.display = "none";

    // 장바구니 비었을 때
    cartListElement.innerHTML = `
      <div class="cart_empty">
        <i class="fa-solid fa-cart-shopping"></i>
        <div>장바구니가 비어있어요.</div>
        <p>새로운 상품으로 채워주세요.</p>
        <button type="button" class="go-shopping-btn">새로운 상품 보러가기</button>
      </div>
    `;

    const goBtn = document.querySelector(".go-shopping-btn");
    if (goBtn) {
      goBtn.addEventListener("click", () => {
        window.location.href = "./list.html";
      });
    }

    updatePaymentSummary(groupedItems);
    return;
  }

  if (paymentContainer) paymentContainer.style.display = "";

  groupedItems.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div>
        <div class="shopping__product_detail">
          <div>
            <span>${item.title}</span>
            <i class="fa-regular fa-circle-xmark" data-key="${
              item._key
            }" title="삭제"></i>
          </div>
          <div class="item_info">
            <span>${item.category}</span>/
            <span>색상 : ${item.color}</span>/
            <span>사이즈 : ${item.size}</span>
            </div>
        </div>

        <div class="shopping__product_price">
          <div>$${(item.price * item.quantity).toFixed(2)}</div>
          <div class="qty-control" data-key="${item._key}">
            <button class="qty-btn qty-minus" aria-label="수량 감소">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn qty-plus" aria-label="수량 증가">+</button>
          </div>
        </div>
      </div>
    `;
    cartListElement.appendChild(li);
  });

  updatePaymentSummary(groupedItems);
}

// 삭제, 왼 오 버튼
cartListElement.addEventListener("click", (event) => {
  // 상품 삭제
  if (event.target.classList.contains("fa-circle-xmark")) {
    const key = event.target.dataset.key;
    const filteredCart = loadCartFromStorage().filter(
      (p) => (p.id ?? p.title) !== key
    );
    localStorage.setItem("cart", JSON.stringify(filteredCart));
    renderCart();
    return;
  }

  // 수량 조절
  const qtyControl = event.target.closest(".qty-control");
  if (qtyControl) {
    const key = qtyControl.dataset.key;
    const isPlus = event.target.classList.contains("qty-plus");
    const isMinus = event.target.classList.contains("qty-minus");
    if (!isPlus && !isMinus) return;

    const groupedItems = groupCartItems(loadCartFromStorage());
    const targetItem = groupedItems.find((it) => it._key === key);
    if (!targetItem) return;

    if (isPlus) targetItem.quantity += 1;
    if (isMinus) targetItem.quantity -= 1;

    if (targetItem.quantity <= 0) {
      const index = groupedItems.findIndex((it) => it._key === key);
      groupedItems.splice(index, 1);
    }

    saveGroupedItemsToStorage(groupedItems);
    renderCart();
  }
});

// 결제 버튼 클릭
checkoutButton.addEventListener("click", () => {
  const groupedItems = groupCartItems(loadCartFromStorage());
  if (!groupedItems.length) return;

  const productsForPayment = groupedItems.map(({ _key, ...rest }) => rest);
  localStorage.setItem("products", JSON.stringify(productsForPayment));

  const order = groupedItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const delivery = groupedItems.length === 0 ? 0 : DELIVERY_FEE;
  const total = order + delivery;

  localStorage.setItem(
    "summary",
    JSON.stringify({
      order: Number(order.toFixed(2)),
      delivery: Number(delivery.toFixed(2)),
      total: Number(total.toFixed(2)),
    })
  );

  window.location.href = "./pay.html";
});

// 배송 날짜
function updateDeliveryDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const deliveryDateElement = document.getElementById("delivery-time-text");
  if (deliveryDateElement) {
    deliveryDateElement.textContent = `: ${year}-${month}-${day}`;
  }
}

// 초기 실행
renderCart();
updateDeliveryDate();

// tooltip
const boxes = document.querySelectorAll(".icon-box");

boxes.forEach((box) => {
  box.addEventListener("click", (e) => {
    e.stopPropagation();
    box.classList.toggle("tooltip-show");
  });
});

document.addEventListener("click", () => {
  boxes.forEach((b) => b.classList.remove("tooltip-show"));
});

// tooltip,.

// ====== 공용: 장바구니 수량 배지/미니카트 렌더 ======
const cartIcon = document.querySelector(".cart-icon");
const miniCart = document.getElementById("mini-cart");
const miniList = document.getElementById("mini-cart-list");
const miniOrder = document.getElementById("mini-order");
const miniDelivery = document.getElementById("mini-delivery");
const miniTotal = document.getElementById("mini-total");
const miniCheckoutBtn = document.getElementById("mini-checkout");
const miniViewCartBtn = document.getElementById("mini-view-cart");
const miniCloseBtn = document.querySelector(".mini-cart__close");
const cartCountBadge = document.getElementById("cart-count");

function getGroupedCart() {
  return groupCartItems(loadCartFromStorage());
}

function updateCartBadge() {
  const cnt = loadCartFromStorage().length;
  cartCountBadge.textContent = cnt;
  cartCountBadge.style.display = cnt > 0 ? "inline-block" : "none";
}

function renderMiniCart() {
  const grouped = getGroupedCart();

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

  // 요약금액
  const order = grouped.reduce((s, i) => s + i.price * i.quantity, 0);
  const delv = grouped.length === 0 ? 0 : DELIVERY_FEE;
  const total = order + delv;

  miniOrder.textContent = `$${order.toFixed(2)}`;
  miniDelivery.textContent = `$${delv.toFixed(2)}`;
  miniTotal.textContent = `$${total.toFixed(2)}`;

  miniCheckoutBtn.disabled = grouped.length === 0;
}

// 기존 결제 버튼 로직을 함수로 분리해 두 군데(큰 버튼/미니버튼)에서 재사용
function proceedCheckout() {
  const groupedItems = getGroupedCart();
  if (!groupedItems.length) return;

  const productsForPayment = groupedItems.map(({ _key, ...rest }) => rest);
  localStorage.setItem("products", JSON.stringify(productsForPayment));

  const order = groupedItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const delivery = groupedItems.length === 0 ? 0 : DELIVERY_FEE;
  const total = order + delivery;

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

// 큰 결제 버튼에 연결 (기존 리스너가 있으면 주석/삭제하고 아래만 두면 됨)
checkoutButton.onclick = proceedCheckout;
// 미니카트 결제 버튼 연결
miniCheckoutBtn.addEventListener("click", proceedCheckout);
// 미니카트 "View cart" → 현재 페이지면 닫기, 아닐 경우 장바구니로 이동
miniViewCartBtn.addEventListener("click", () => {
  if (
    location.pathname.endsWith("shopping_cart.html") ||
    location.pathname.endsWith("cart.html")
  ) {
    cartIcon.classList.remove("open");
  } else {
    location.href = "./shopping_cart.html";
  }
});

// 아이콘 클릭 → 패널 토글
cartIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  cartIcon.classList.toggle("open");
  renderMiniCart();
});

// 닫기 버튼 / 바깥 클릭 / ESC
miniCloseBtn.addEventListener("click", () => cartIcon.classList.remove("open"));
document.addEventListener("click", (e) => {
  if (!cartIcon.contains(e.target)) cartIcon.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cartIcon.classList.remove("open");
});

// 초기 실행 시 배지/미니카트 동기화
updateCartBadge();
renderMiniCart();

// 기존 renderCart 끝부분에서 배지/미니카트도 갱신되도록 한 줄만 추가
// (네 renderCart 함수 맨 마지막에 아래 두 줄을 추가하세요)
/// updateCartBadge();
/// renderMiniCart();

// scroll

(function () {
  const follower = document.querySelector(".payment__container");
  if (!follower) return;

  const OFFSET = 120;

  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

  const baseY = follower.getBoundingClientRect().top + window.scrollY;

  let current = 0;
  let target = 0;
  const ease = 0.06;

  function updateTarget() {
    if (isMobile()) {
      follower.style.transform = "none";
      return;
    }
    const t = Math.max(window.scrollY + OFFSET - baseY, 0);
    target = t;
  }

  function tick() {
    if (!isMobile()) {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.5) current = target;
      follower.style.transform = `translateY(${current}px)`;
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", updateTarget);
  updateTarget();
  tick();
})();

// search==================================
// const searchInput = document.querySelector(".search-input");
// const searchButton = document.querySelector(".search-submit");

// function goSearch() {
//   const query = searchInput.value.trim();
//   if (query) {
//     window.location.href = `list.html?query=${encodeURIComponent(query)}`;
//   }
// }

// // 버튼 클릭 시 검색
// searchButton.addEventListener("click", goSearch);

// // 엔터 키 눌렀을 때 검색
// searchInput.addEventListener("keydown", (e) => {
//   if (e.key === "Enter") {
//     e.preventDefault(); // 폼 제출 방지
//     goSearch();
//   }
// });
// search ...

const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-submit");

/* ▼ 드롭다운 DOM 추가 */
const suggest = document.createElement("ul");
suggest.className = "suggest-list";
suggest.id = "search-suggest";
suggest.setAttribute("role", "listbox");
suggest.setAttribute("aria-label", "연관 검색어");
document.querySelector(".search-group").appendChild(suggest);

let productsIndex = []; // fakestore에서 제목/카테고리
let flatTerms = []; // 추천 후보 문자열 배열
let activeIndex = -1; // 키보드 선택 인덱스

function goSearch(forceValue) {
  const q = (forceValue ?? searchInput.value).trim();
  if (q) window.location.href = `list.html?query=${encodeURIComponent(q)}`;
}

searchButton.addEventListener("click", () => goSearch());

searchInput.addEventListener("keydown", (e) => {
  const count = suggestItemsCount();
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

/* 연관검색어: 입력 변화 감지 + 디바운스 */
const debouncedInput = debounce(handleSuggestInput, 120);
searchInput.addEventListener("input", debouncedInput);

document.addEventListener("click", (e) => {
  if (!suggest.contains(e.target) && e.target !== searchInput) closeSuggest();
});

/* 추천 만들기 */
function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function buildTerms() {
  const set = new Set();
  productsIndex.forEach((p) => {
    // 전체 제목 자체도 후보
    set.add(p.title);
    // 단어 단위 후보(3글자 이상)
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
  const results = [...starts, ...includes].slice(0, 10);
  renderSuggest(results);
}

function renderSuggest(items) {
  suggest.innerHTML = "";
  activeIndex = -1;
  if (!items.length) {
    closeSuggest();
    return;
  }

  items.forEach((text, i) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.dataset.value = text;
    li.innerHTML = `<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>${text}</span>`;
    li.addEventListener("mousedown", (e) => {
      // blur 전에 실행되도록 mousedown 사용
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
    li.setAttribute("aria-selected", idx === activeIndex ? "true" : "false");
    if (idx === activeIndex) li.scrollIntoView({ block: "nearest" });
  });
}
function closeSuggest() {
  suggest.style.display = "none";
  suggest.innerHTML = "";
  activeIndex = -1;
}
function suggestItemsCount() {
  return suggest.style.display === "block" ? suggest.children.length : 0;
}

function debounce(fn, ms) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

/* 한번만 제품명 받아서 인덱스 구축 */
(async function bootstrapSuggest() {
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    const data = await res.json();
    productsIndex = data.map((d) => ({ title: d.title, category: d.category }));
    buildTerms();
  } catch (e) {
    console.warn("suggest seed fetch fail", e);
  }
})();
