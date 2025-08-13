const ul = document.querySelector(".shopping__list ul");

fetch("https://fakestoreapi.com/products?limit=10")
  .then((v) => v.json()) // JSON 변환
  .then((data) => {
    ul.innerHTML = "";
    data.forEach((product) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${product.image}" alt="${product.title}">
        <div>
          <div class="shopping__product_detail">
            <div>
              <span>${product.title}</span>
              <i class="fa-regular fa-circle-xmark"></i>
            </div>
            <div>
              <span>${product.category}</span>
              <i class="fa-regular fa-heart"></i>
            </div>
          </div>
          <div class="shopping__product_price">
            <div>$${product.price}</div>
            <div>1</div>
          </div>
        </div>
      `;
      ul.appendChild(li);
      //   console.log(product.title, product.price);
    });
  })
  .catch((error) => console.error("API 호출 에러:", error));

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
// =================== tooltip
// 아이콘 클릭 시 토글
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
