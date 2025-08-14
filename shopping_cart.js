// const ul = document.querySelector(".shopping__list ul");

// fetch("https://fakestoreapi.com/products?limit=5")
//   .then((v) => v.json()) // JSON 변환
//   .then((data) => {
//     ul.innerHTML = "";
//     data.forEach((product) => {
//       const li = document.createElement("li");
//       li.innerHTML = `
//         <img src="${product.image}" alt="${product.title}">
//         <div>
//           <div class="shopping__product_detail">
//             <div>
//               <span>${product.title}</span>
//               <i class="fa-regular fa-circle-xmark"></i>
//             </div>
//             <div>
//               <span>${product.category}</span>
//               <i class="fa-regular fa-heart"></i>
//             </div>
//           </div>
//           <div class="shopping__product_price">
//             <div>$${product.price}</div>
//             <div>1</div>
//           </div>
//         </div>
//       `;
//       ul.appendChild(li);
//     });

//   document
//     .querySelector(".payment__btn button")
//     .addEventListener("click", () => {
//       localStorage.setItem("products", JSON.stringify(data));
//       window.location.href = "../pay/pay.html";
//     });
// })
// .catch((error) => console.error("API 호출 에러:", error));
// payment container 따라오기 ============================
// (function () {
//   const follower = document.querySelector(".payment__container");
//   if (!follower) return;

//   const OFFSET = 120;

//   const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

//   const baseY = follower.getBoundingClientRect().top + window.scrollY;

//   let current = 0;
//   let target = 0;
//   const ease = 0.06;

//   function updateTarget() {
//     if (isMobile()) {
//       follower.style.transform = "none";
//       return;
//     }
//     const t = Math.max(window.scrollY + OFFSET - baseY, 0);
//     target = t;
//   }

//   function tick() {
//     if (!isMobile()) {
//       current += (target - current) * ease;
//       if (Math.abs(target - current) < 0.5) current = target;
//       follower.style.transform = `translateY(${current}px)`;
//     }
//     requestAnimationFrame(tick);
//   }

//   window.addEventListener("scroll", updateTarget, { passive: true });
//   window.addEventListener("resize", updateTarget);
//   updateTarget();
//   tick();
// })();
// =================== tooltip
// 아이콘 클릭 시 토글
//
// ====== 장바구니 렌더링 유틸 ======
const ul = document.querySelector(".shopping__list ul");

// 1) 원본 cart 로드
function loadCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// 2) 동일 상품 집계 (id 우선, 없으면 title로)
function aggregateCart(rawCart) {
  const map = new Map();
  rawCart.forEach((p) => {
    const key = p.id ?? p.title; // id가 있으면 id, 없으면 title로 묶기
    if (!map.has(key)) {
      map.set(key, { ...p, quantity: 1, _key: key });
    } else {
      map.get(key).quantity += 1;
    }
  });
  return Array.from(map.values());
}

// 3) 저장 형태: 수량을 quantity만큼 풀어헤쳐서 원래 구조로 저장(호환 유지)
function saveAggregatedToLocalStorage(aggregated) {
  // fakestoreapi 등 기존 코드와 호환 위해 quantity만큼 복제하여 저장
  const expanded = [];
  aggregated.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      const { quantity, _key, ...pure } = item;
      expanded.push(pure);
    }
  });
  localStorage.setItem("cart", JSON.stringify(expanded));
}

// 4) 렌더링
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
    return;
  }

  items.forEach((item, index) => {
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
}

// 5) 이벤트 위임: 삭제, 수량증감
ul.addEventListener("click", (e) => {
  // (a) 삭제 아이콘
  if (e.target.classList.contains("fa-circle-xmark")) {
    const key = e.target.dataset.key;
    const raw = loadCart();
    // key에 해당하는 모든 항목 제거
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

    // 현재 집계 기준으로 조작 후 저장
    const raw = loadCart();
    const items = aggregateCart(raw);

    const idx = items.findIndex((it) => it._key === key);
    if (idx === -1) return;

    if (isPlus) {
      items[idx].quantity += 1;
    } else if (isMinus) {
      items[idx].quantity -= 1;
      if (items[idx].quantity <= 0) {
        // 0 이하면 해당 품목 제거
        items.splice(idx, 1);
      }
    }

    // 로컬스토리지에 반영 (호환 형식으로 확장 저장)
    saveAggregatedToLocalStorage(items);
    render();
  }
});

// 초기 렌더
render();
