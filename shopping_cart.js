const ul = document.querySelector(".shopping__list ul");

fetch("https://fakestoreapi.com/products?limit=5")
  .then((v) => v.json())
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
              <i class="fa-solid fa-trash-can"></i>
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
    });

document.querySelector(".payment__btn button").addEventListener("click", () => {
      localStorage.setItem("products", JSON.stringify(data)); 
      window.location.href = "../pay/pay.html"; 
    });
  })
  .catch((error) => console.error("API 호출 에러:", error));