document.addEventListener("DOMContentLoaded", function () {
  const products = [
    { name: "여름 린넨 셔츠", price: 45000, quantity: 1 },
    { name: "데님 숏 팬츠", price: 38000, quantity: 1 },
  ];

  const productList = document.getElementById("product-list");
  const totalAmountSpan = document.getElementById("total-amount");
  const paymentButton = document.getElementById("payment-button");
  let total = 0;

  products.forEach((product) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <span>${product.name} (${product.quantity}개)</span>
            <span>${product.price.toLocaleString()}원</span>
        `;
    productList.appendChild(li);
    total += product.price * product.quantity;
  });

  totalAmountSpan.textContent = `${total.toLocaleString()}원`;

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
                주문이 완료되었습니다!
                이름: ${name}
                주소: ${address}
                연락처: ${phone}
                결제 방법: ${paymentMethodText}
                총 금액: ${total.toLocaleString()}원
            `);
      window.location.href = "../shopping-mainpage/main.html";
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
