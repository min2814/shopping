const product = document.querySelector(".product-list");

fetch("https://fakestoreapi.com/products?limit=5")
  .then((v) => v.json()) // JSON 변환
  .then((data) => {
    product.innerHTML = "";
    data.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("product-card");

        // 제목 길이 제한 (20자 예시)
        let title = item.title;
        if (title.length > 20) {
          title = title.substring(0, 20) + "...";
        }

        div.innerHTML = `<button class="wishlist-btn" aria-label="찜하기">
          <i class="fa-regular fa-heart"></i>
        </button>
        <div class="img-wrap">
          <img src="${item.image}" alt="상품 이미지">
        </div>
        <p class="product-name">${title}</p>
        <div class="price-row">
          <span class="price">${item.price}</span>
          <button class="add-btn" aria-label="담기"><i class="fa-solid fa-plus"></i></button>
        </div>`;
        product.appendChild(div);
        console.log(item);
    });
  });
