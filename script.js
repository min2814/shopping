document.addEventListener("DOMContentLoaded", function () {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  console.log(products);
  const productList = document.getElementById("product-list");
  const totalAmountSpan = document.getElementById("total-amount");
  const finalAmountSpan = document.getElementById("final-amount");
  const paymentButton = document.getElementById("payment-button");
  let total = 0;

  products.forEach((product) => {
    const li = document.createElement("li");
    // 제품명에 색상과 사이즈를 포함하여 표시
    products.forEach((product) => {
  const li = document.createElement("li");

  // color, size 중 null이 아닌 값만 모으기
  const options = [];
  if (product.color && product.color !== "null") options.push(product.color);
  if (product.size && product.size !== "null") options.push(product.size);

  // 옵션이 하나라도 있으면 괄호 포함, 없으면 그냥 상품명만 출력
  const productTitle = options.length > 0
    ? `${product.title} (${options.join(", ")})`
    : product.title;

  li.innerHTML = `
      <img src="${product.image}">
      <span class="product-title">${productTitle}</span>
      <span class="product-quantity">수량 ${product.quantity}개</span>
      <span class="product-price">${product.price.toLocaleString()}$</span>
  `;
  productList.appendChild(li);
  total += product.price * product.quantity;
});


    li.innerHTML = `
            <img src="${product.image}">
            <span class="product-title">${productTitle}</span>
            <span class="product-quantity">수량 ${product.quantity}개</span>
            <span class="product-price">${product.price.toLocaleString()}$</span>
        `;
    productList.appendChild(li);
    total += product.price * product.quantity;
  });

  totalAmountSpan.textContent = `${total.toLocaleString()}$`;
  finalAmountSpan.textContent = `${(total + 5).toLocaleString()}$`; // 배달비 5$ 추가

  const paymentLabels = document.querySelectorAll(".payment-options label");
  const cardSelectContainer = document.getElementById("card-select-container");

  function toggleCardSelector() {
    const selectedPayment = document.querySelector(
      'input[name="payment-method"]:checked'
    ).value;
    if (selectedPayment === "credit-card") {
      cardSelectContainer.classList.remove("hidden");
    } else {
      cardSelectContainer.classList.add("hidden");
    }
  }

  const initiallyCheckedLabel = document.querySelector(
    'input[name="payment-method"]:checked'
  ).parentElement;
  initiallyCheckedLabel.classList.add("selected");
  toggleCardSelector();

  paymentLabels.forEach((label) => {
    label.addEventListener("click", () => {
      paymentLabels.forEach((l) => l.classList.remove("selected"));
      label.classList.add("selected");
      label.querySelector('input[type="radio"]').checked = true;

      toggleCardSelector();
    });
  });

  const deliveryRequest = document.getElementById("delivery-request");
  const customRequest = document.getElementById("custom-request");

  deliveryRequest.addEventListener("change", function () {
    if (this.value === "기타") {
      customRequest.classList.remove("hidden");
      customRequest.required = true;
    } else {
      customRequest.classList.add("hidden");
      customRequest.required = false;
      customRequest.value = "";
    }
  });

  paymentButton.addEventListener("click", function () {
    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    const phone = document.getElementById("phone").value;
    const termsChecked = document.querySelector(
      '.payment-terms input[type="checkbox"]'
    ).checked;

    const selectedPaymentInput = document.querySelector(
      'input[name="payment-method"]:checked'
    );
    let paymentMethodText = selectedPaymentInput
      ? selectedPaymentInput.nextElementSibling.textContent
      : "선택 안 함";

    let selectedCard = null;
    if (selectedPaymentInput.value === "credit-card") {
      const cardSelector = document.getElementById("card-selector");
      selectedCard = cardSelector.options[cardSelector.selectedIndex];
      if (!selectedCard.value) {
        alert("카드사를 선택해 주세요.");
        return;
      }
      paymentMethodText += ` (${selectedCard.textContent})`;
    }

    if (name && address && phone && termsChecked) {
      alert(`
                이름: ${name}
                주소: ${address}
                연락처: ${phone}
                결제 방법: ${paymentMethodText}
                총 금액: ${total.toLocaleString()}$
            `);
      window.location.href = "../mainpage/main.html";
    } else {
      let message = "배송 정보를 모두 입력해 주세요.";
      if (name && address && phone && !termsChecked) {
        message =
          "결제 서비스 이용 약관 및 개인정보 처리 동의에 체크해 주세요.";
      } else if (!(name && address && phone) && termsChecked) {
        message = "배송 정보를 모두 입력해 주세요.";
      } else if (!(name && address && phone) && !termsChecked) {
        message =
          "배송 정보를 모두 입력해 주시고, 결제 서비스 이용 약관 및 개인정보 처리 동의에 체크해 주세요.";
      }
      alert(message);
    }
  });
});
