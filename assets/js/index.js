const limit = 10;
let skip = 0;
let searchKeyword = '';
let total = 0;
let scrollLoading = false;
let selectedProduct = null;
let products = [];

const debounce = (func, delay) => {
  let timeoutId;

  return (...args) => {
    const context = this;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
};

const handleSearch = () => {
  const searchEl = document.getElementById('searchInput');
  searchKeyword = searchEl.value;
  renderStatusText('Searching ...');
  fetchProducts({}, {search: true});
};

const fetchProducts = (options = {}) => {
  const { fromScroll } = options;
  let endpoint = 'https://dummyjson.com/products?';
  let query = {limit};

  if (fromScroll) {
    query = {...query, skip};
  } else {
    skip = 0;
    products = [];
  }

  if (searchKeyword) {
    query = {...query, q: searchKeyword}
    endpoint = 'https://dummyjson.com/products/search?';
  }

  const url = endpoint + new URLSearchParams(query);
  
  fetch(url).then(res => res.json())
    .then(data => {
      const { products: resProducts, total: resTotal } = data;
      total = resTotal;
      products = products.concat(resProducts);
      skip += resProducts.length;
      renderTable(resProducts, fromScroll);
    }).finally(() => {
      if (fromScroll) {
        scrollLoading = false;
        destroyStatusText();
      }
    })
}

const renderTable = (products, fromScroll) => {  
  if (products.length == 0) {
    renderStatusText('No products matched your search keyword.');
    return;
  }

  const table = document.getElementById('productsTable');
  const tbody = table.querySelector('tbody');

  if (!fromScroll) {
    tbody.innerHTML = '';
  }

  products.forEach(product => {
    const { thumbnail: imgSrc, title: name, description, price } = product;
    const row = tbody.insertRow();
    const thumbnailCell = row.insertCell(0);
    const infoCell = row.insertCell(1);
    const priceCell = row.insertCell(2);

    row.setAttribute('data-id', product.id);

    // render thumbnail cell
    thumbnailCell.classList.add('thumbnail');
    thumbnailWrapper = document.createElement('div');
    thumbnailWrapper.classList.add('grow', 'clickable');
    const thumbnail = document.createElement('img');
    thumbnail.src = imgSrc;
    thumbnailWrapper.appendChild(thumbnail);
    thumbnailCell.appendChild(thumbnailWrapper);
    
    // render info cell
    const infoWrapper = document.createElement('div');
    const nameEl = document.createElement('span');
    const descEl = document.createElement('span');
    
    infoWrapper.classList.add('product-info');
    nameEl.classList.add('name', 'clickable');
    descEl.classList.add('description');

    nameEl.textContent = name;
    descEl.textContent = description;

    infoWrapper.append(nameEl, descEl);
    infoCell.appendChild(infoWrapper);

    // render price cell
    const priceWrapper = document.createElement('div');
    const currencyEl = document.createElement('span');
    const priceEl = document.createElement('span');

    priceWrapper.classList.add('price-wrapper');
    currencyEl.classList.add('currency-sign');
    priceEl.classList.add('price');

    currencyEl.textContent = '\u20B1';
    priceEl.textContent = Number.parseFloat(price).toFixed(2);

    priceWrapper.append(currencyEl, priceEl);
    priceCell.appendChild(priceWrapper);
  });
}

const closeModal = () => {
  const modal = document.getElementById('productInfoModal');
  modal.style.display = 'none';

  const previewEl = document.querySelector('img.preview');

  previewEl.src = '';
}

const renderStatusText = (text, reset = true) => {
  const table = document.getElementById('productsTable');
  const tbody = table.querySelector('tbody');
  
  if (reset) {
    tbody.innerHTML = '';
  }

  const emptyRow = tbody.insertRow();
  const emptyCell = emptyRow.insertCell(0);
  
  emptyCell.colSpan = 3;
  emptyCell.classList.add('status-text');
  emptyCell.textContent = text;
}

const destroyStatusText = () => {
  const el = document.querySelector('.status-text');
  el.remove();
}

window.addEventListener('scroll', debounce((event) => {
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) {
    if (skip < total && !scrollLoading) {
      scrollLoading = true;
      renderStatusText('loading...', false);
      window.scrollTo(0, document.body.scrollHeight);
      fetchProducts({fromScroll: true});
    } else {
      const el = document.querySelector('.status-text');
      if (!el) {
        renderStatusText("You've reached the end of the list.", false);
        window.scrollTo(0, document.body.scrollHeight);
      }
    }
  }
}, 500))

const searchEl = document.getElementById('searchInput');
const debouncedHandleSearch = debounce(handleSearch, 500);
const closeModalBtn = document.getElementById('closeModalBtn');
searchEl.addEventListener('input', debouncedHandleSearch);
document.addEventListener("click", function(e){
  const clickable = e.target.closest(".clickable");
  if (clickable){
    const modal = document.getElementById('productInfoModal');
    const productId = clickable.closest('tr').getAttribute('data-id');
    const product = products.find(product => product.id == productId);
    const productCategoryEl = document.querySelector('.product-info .product-category');
    const productNameEl = document.querySelector('.product-info .product-name');
    const productDescriptionEl = document.querySelector('.product-info .product-description');
    const productPriceEl = document.querySelector('.product-info .product-price');
    const imagesWrapper = document.querySelector('.product-images .images-wrapper');

    imagesWrapper.innerHTML = '';
    product.images.forEach((image) => {
      const imageWrapper = document.createElement('div');
      const imageEl = document.createElement('img');

      imageWrapper.classList.add('image');
      imageWrapper.setAttribute('data-image', image);
      imageEl.src = image;

      imageWrapper.appendChild(imageEl);
      imagesWrapper.appendChild(imageWrapper);
    })

    productCategoryEl.textContent = product.category;
    productNameEl.textContent = product.title;
    productDescriptionEl.textContent = product.description;
    productPriceEl.textContent = `\u20B1 ${product.price}`;
    modal.style.display = 'block';
    return;
  }
});

document.addEventListener("click", function(e){
  const clickable = e.target.closest(".images-wrapper div.image");

  if (clickable) {
    const imgSrc = clickable.getAttribute('data-image');
    const previewEl = document.querySelector('img.preview');
    
    if (clickable.classList.contains('active')) {
      clickable.classList.remove('active');
      previewEl.src = '';
      previewEl.classList.remove('visible');
    } else {
      const activeImage = document.querySelector('div.image.active');

      if(activeImage) {
        activeImage.classList.remove('active');
      }

      clickable.classList.add('active');
      previewEl.src = imgSrc;
      previewEl.classList.add('visible');
    }
  }
});


closeModalBtn.onclick = function() {
  closeModal();
};

window.onclick = function(event) {
  const modal = document.getElementById('productInfoModal');
  if (event.target === modal) {
    closeModal();
  }
};

fetchProducts();