const ul = document.querySelector('ul');
const cart = JSON.parse(localStorage.getItem('cart')) || [];
ul.innerHTML = '';
cart.forEach((product, index) => {
  console.log(product);
  const li = document.createElement('li');
  li.innerHTML = `
  <img src="${product.image}" alt="${product.title}">
  <div>
    <div class="shopping__product_detail">
      <div class="row">
        <span>${product.title}</span>
        <i class="fa-solid fa-trash-can" data-index="${index}"></i>
      </div>
      <div class="row">
        <span>${product.category}</span>
        <i class="fa-regular fa-heart"></i>
      </div>
      <div class="row">
        <span>색상 : ${product.color} / 사이즈 : ${product.size}</span>
        <button class="increase-btn" data-index="${index}">+</button>
      </div>
    </div>
    <div class="row shopping__product_price">
      <div>$${product.price}</div>
      <div class="quantity" data-index="${index}">1</div>
    </div>
  </div>
`;
ul.appendChild(li);

})

//휴지통 버튼으로 localstorage 데이터 삭제
ul.addEventListener('click', (e) => {
  if (e.target.classList.contains('fa-trash-can')) {    //이벤트 대상 지정하기
    const index = e.target.dataset.index;
    cart.splice(index, 1);   //해당 인덱스 삭제 splice쓰면 cart 데이터도 삭제됨
    localStorage.setItem('cart', JSON.stringify(cart));


    //localstorage에 저장된 정보를 splice를 하고 
    //다시 localstorage에 setItem으로 정보를 저장(splice된 정보)
    //그러고 화면에 다시 뿌려줘야 실시간 업데이트가 보여짐
    ul.innerHTML = '';
    cart.forEach((product, index) => {
      console.log(product);
      const li = document.createElement('li');
      li.innerHTML = `
        <img src="${product.image}" alt="${product.title}">
        <div>
          <div class="shopping__product_detail">
            <div>
              <span>${product.title}</span>
              <i class="fa-solid fa-trash-can" data-index="${index}"></i>
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
    })
  }
})





