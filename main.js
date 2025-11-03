// ---------- 1. Karusel (agar kerak bo'lsa) ----------
let currentIndex = 0;
const carousel = document.getElementById("carousel");
if (carousel) {
  const totalSlides = carousel.children.length;
  function updateSlide() {
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
  }
  function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlide();
  }
  function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlide();
  }
  setInterval(nextSlide, 3000);
}

// ---------- 2. Kategoriya karusel ----------
let categoryIndex = 0;
const categoryCarousel = document.getElementById("categoryCarousel");
const cardWidth = 300;
function updateCategorySlide() {
  if (categoryCarousel)
    categoryCarousel.style.transform = `translateX(-${
      categoryIndex * cardWidth
    }px)`;
}
function nextCategory() {
  if (categoryCarousel) {
    categoryIndex = Math.min(
      categoryIndex + 1,
      categoryCarousel.children.length - 1
    );
    updateCategorySlide();
  }
}
function prevCategory() {
  if (categoryCarousel) {
    categoryIndex = Math.max(categoryIndex - 1, 0);
    updateCategorySlide();
  }
}

// ---------- 3. Utility: badge yangilash ----------
function updateBadge(badgeId, storageKey) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;
  const items = JSON.parse(localStorage.getItem(storageKey)) || [];
  const count = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

// ---------- 4. Favorites toggle (index va favorite sahifalar uchun) ----------
function toggleFavorite(product, icon) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const idx = favorites.findIndex((i) => i.id === product.id);
  const onFavoritePage = window.location.pathname.includes("favorite.html");

  if (idx !== -1) {
    // o'chirish
    favorites.splice(idx, 1);
    if (icon) {
      icon.classList.remove("text-red-500");
      icon.classList.add("text-gray-400");
    }
    if (onFavoritePage && icon) {
      const card = icon.closest(".card");
      if (card) card.remove();
    }
  } else {
    // qo'shish
    favorites.push(product);
    if (icon) {
      icon.classList.remove("text-gray-400");
      icon.classList.add("text-red-500");
    }
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateBadge("favoriteBadge", "favorites");
}

// ---------- 5. Cart: add, change quantity, remove ----------
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateBadge("cartBadge", "cart");
}

function changeQuantity(id, delta) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((p) => p.id === id);
  if (!item) return;
  item.quantity = (item.quantity || 1) + delta;
  if (item.quantity <= 0) cart = cart.filter((p) => p.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
  // agar cart sahifasida bo'lsak qayta render qilamiz, aks holda badge yangilanadi
  if (document.getElementById("cartRow")) renderCart();
  updateBadge("cartBadge", "cart");
}

function removeFromCart(id) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter((item) => item.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
  if (document.getElementById("cartRow")) renderCart();
  updateBadge("cartBadge", "cart");
}

// ---------- 6. Purchase (cart) sahifasini render qilish ----------
function renderCart() {
  const cartContainer = document.getElementById("cartRow");
  const totalDisplay = document.getElementById("totalAmount");
  if (!cartContainer) return;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = "<p class='text-gray-500'>Корзина пуста.</p>";
    if (totalDisplay) totalDisplay.textContent = "0 сум";
    return;
  }

  let total = 0;
  cart.forEach((product) => {
    const qty = product.quantity || 1;
    const price = Number(product.price) || 0;
    total += qty * price;

    const card = document.createElement("div");
    card.className = "card bg-white rounded-xl shadow p-4 flex flex-col mb-2";

    card.innerHTML = `
      <div class="flex items-start gap-4 ">
        <img src="${product.image}" alt="${
      product.name
    }" class="w-28 h-28 object-contain" />
        <div class="flex-1">
          <div class="text-sm text-gray-700 mb-1">${product.name}</div>
          <div class="text-base font-semibold mb-2">${price.toLocaleString()} сум</div>
          <div class="flex items-center gap-2">
            <button class="bg-gray-200 px-3 py-1 rounded" onclick='changeQuantity("${
              product.id
            }", -1)'>–</button>
            <span class="font-bold">${qty}</span>
            <button class="bg-gray-200 px-3 py-1 rounded" onclick='changeQuantity("${
              product.id
            }", 1)'>+</button>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500 mb-4">Сум: ${(
            qty * price
          ).toLocaleString()} сум</div>
          <button class="bg-red-500 text-white px-3 py-1 rounded" onclick='removeFromCart("${
            product.id
          }")'>Удалить</button>
        </div>
      </div>
    `;
    cartContainer.appendChild(card);
  });

  if (totalDisplay) totalDisplay.textContent = `${total.toLocaleString()} сум`;
}

// ---------- 7. Mahsulotlarni yuklash va sahifalarga render qilish ----------
async function loadProductsToIndex() {
  const productContainer = document.getElementById("productRow");
  if (!productContainer) return;

  try {
    const res = await fetch(
      "https://68fa6a99ef8b2e621e7feb11.mockapi.io/kamronbek/product-zon"
    );
    const products = await res.json();
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    products.forEach((product) => {
      const isFav = favorites.some((f) => f.id === product.id);
      const heartClass = isFav ? "text-red-500" : "text-gray-400";
      const card = document.createElement("div");
      card.className =
        "card bg-white rounded-xl shadow-lg p-4 flex flex-col justify-between";

      card.innerHTML = `
        <div class="flex justify-end mb-2">
          <i class="fa-solid fa-heart ${heartClass} cursor-pointer"
             onclick='toggleFavorite(${JSON.stringify(product)}, this)'></i>
        </div>
        <img src="${product.image}" alt="${
        product.name
      }" class="w-full h-40 object-contain mb-4" />
        <div class="text-sm text-gray-700 mb-2">${product.name}</div>
        <div class="text-lg font-bold text-black mb-4">${Number(
          product.price
        ).toLocaleString()} сум</div>
        <div class="flex gap-2">
          <button class="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm flex-1"
            onclick='addToCart(${JSON.stringify(product)})'>В корзину</button>
          
        </div>
      `;
      productContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Mahsulotlarni yuklash xatosi:", err);
    productContainer.innerHTML =
      "<p class='text-red-500'>Maʼlumotlarni yuklab bo‘lmadi.</p>";
  }
}

function loadFavoritesPage() {
  const favoriteContainer = document.getElementById("favoritesRow");
  if (!favoriteContainer) return;
  favoriteContainer.innerHTML = "";
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (favorites.length === 0) {
    favoriteContainer.innerHTML =
      "<p class='text-gray-500'>Нет избранных товаров.</p>";
    return;
  }
  favorites.forEach((product) => {
    const card = document.createElement("div");
    card.className =
      "card bg-white rounded-xl shadow p-4 flex flex-col justify-between";
    card.innerHTML = `
      <div class="flex justify-end mb-2">
        <i class="fa-solid fa-heart text-red-500 cursor-pointer"
           onclick='toggleFavorite(${JSON.stringify(product)}, this)'></i>
      </div>
      <img src="${product.image}" alt="${
      product.name
    }" class="w-full h-40 object-contain mb-4" />
      <div class="text-sm text-gray-700 mb-2">${product.name}</div>
      <div class="text-lg font-bold text-black mb-4">${Number(
        product.price
      ).toLocaleString()} сум</div>
      <div class="flex gap-2">
        <button class="bg-blue-600 text-white py-2 px-5 rounded hover:bg-blue-700 text-sm"
          onclick='addToCart(${JSON.stringify(product)})'>В корзину</button>
      </div>
    `;
    favoriteContainer.appendChild(card);
  });
}

// ---------- 8. DOMContentLoaded: boshlang'ich ishlar ----------
document.addEventListener("DOMContentLoaded", () => {
  updateBadge("favoriteBadge", "favorites");
  updateBadge("cartBadge", "cart");

  // Agar index sahifasida bo'lsak — mahsulotlarni yuklaymiz
  if (document.getElementById("productRow")) loadProductsToIndex();

  // Agar favorites sahifasi — yuklaymiz
  if (document.getElementById("favoritesRow")) loadFavoritesPage();

  // Agar purchase sahifasi — cartni render qilamiz
  if (document.getElementById("cartRow")) renderCart();
});
