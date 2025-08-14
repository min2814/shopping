// ====== 장바구니 렌더링 & 결제 요약 ======
const ul = document.querySelector(".shopping__list ul");

// 결제 요약 영역 요소 (현재 마크업 구조 기준)
const [orderAmountEl, deliveryEl] = Array.from(
  document.querySelectorAll(".payment__top_list span:last-child")
);
const totalEl = document.querySelector(".payment__price > div:last-child");
const checkoutBtn = document.querySelector(".payment__btn button");

const DELIVERY_FEE = 5; // 기본 배송비(원하면 조건부 무료배송 로직으로 바꿔도 됨)

// 1) 원본 cart 로드
function loadCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// 2) 동일 상품 집계 (id 우선, 없으면 title로)
function aggregateCart(rawCart) {
  const map = new Map();
  rawCart.forEach((p) => {
    const key = p.id ?? p.title;
    if (!map.has(key)) {
      map.set(key, { ...p, quantity: 1, _key: key });
    } else {
      map.get(key).quantity += 1;
    }
  });
  return Array.from(map.values());
}

// 3) 저장 형태: 수량만큼 복제해서 저장(기존 로직과 호환)
function saveAggregatedToLocalStorage(aggregated) {
  const expanded = [];
  aggregated.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      const { quantity, _key, ...pure } = item;
      expanded.push(pure);
    }
  });
  localStorage.setItem("cart", JSON.stringify(expanded));
}

// 4) 결제 요약 업데이트
function updateSummary(items) {
  const order = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  // 장바구니 비었으면 배송비 0 처리(원하면 항상 5로 유지 가능)
  const delivery = items.length === 0 ? 0 : DELIVERY_FEE;
  const total = order + delivery;

  orderAmountEl.textContent = `$${order.toFixed(2)}`;
  deliveryEl.textContent = `$${delivery.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;

  // 빈 장바구니면 결제 비활성화
  if (checkoutBtn) {
    checkoutBtn.disabled = items.length === 0;
  }
}

// 5) 렌더링
function render() {
  const raw = loadCart();
  const items = aggregateCart(raw);

  ul.innerHTML = "";

  if (items.length === 0) {
    ul.innerHTML = `
      <li style="text-align:center; width:100%; padding:40px; background:#fff; border-radius:20px; border:2px solid #ccc;">
        장바구니가 비었습니다.
      </li>
    `;
    updateSummary(items);
    return;
  }

  items.forEach((item) => {
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
          <div>
            <span>${item.category}</span>
            <i class="fa-regular fa-heart"></i>
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
    ul.appendChild(li);
  });

  // 렌더 후 요약금액 갱신
  updateSummary(items);
}

// 6) 이벤트 위임: 삭제, 수량증감
ul.addEventListener("click", (e) => {
  // (a) 삭제 아이콘
  if (e.target.classList.contains("fa-circle-xmark")) {
    const key = e.target.dataset.key;
    const raw = loadCart();
    const filtered = raw.filter((p) => (p.id ?? p.title) !== key);
    localStorage.setItem("cart", JSON.stringify(filtered));
    render();
    return;
  }

  // (b) 수량 조절 버튼
  const control = e.target.closest(".qty-control");
  if (control) {
    const key = control.dataset.key;
    const isPlus = e.target.classList.contains("qty-plus");
    const isMinus = e.target.classList.contains("qty-minus");
    if (!isPlus && !isMinus) return;

    const raw = loadCart();
    const items = aggregateCart(raw);
    const idx = items.findIndex((it) => it._key === key);
    if (idx === -1) return;

    if (isPlus) items[idx].quantity += 1;
    if (isMinus) {
      items[idx].quantity -= 1;
      if (items[idx].quantity <= 0) items.splice(idx, 1);
    }

    saveAggregatedToLocalStorage(items);
    render();
  }
});

// 초기 렌더
render();

//  pay
// 결제 버튼 클릭 → 현재 장바구니(집계본)를 products로 저장 후 페이지 이동
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    const items = aggregateCart(loadCart()); // 수량이 합쳐진 형태
    if (!items.length) return; // 장바구니 비었으면 종료

    // _key 제거 + quantity 포함해서 저장
    const payload = items.map(({ _key, ...rest }) => ({
      ...rest,
      quantity: rest.quantity, // 수량 유지
    }));
    localStorage.setItem("products", JSON.stringify(payload));

    // 합계 정보 저장
    const order = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const delivery = items.length === 0 ? 0 : DELIVERY_FEE;
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
}
