// main.js
// Shared behavior for every page: mobile menu, cart badge, product cards,
// and the shop page search/filter/sort logic.

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  updateCartCount();
  setupYear();

  // Only run these if the matching elements exist on the current page.
  if (document.getElementById("featured-products")) renderFeaturedProducts();
  if (document.getElementById("shop-product-grid")) setupShopPage();
  if (document.getElementById("cart-items")) renderCartPage();
  if (document.getElementById("checkout-form")) setupCheckoutPage();
  if (document.getElementById("contact-form")) setupContactForm();
});

// Open and close the mobile navigation menu.
function setupMobileMenu() {
  const menuButton = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  if (!menuButton || !navLinks) return;

  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", isOpen);
  });
}

// Put the current year into the footer copyright text.
function setupYear() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}

// Build the HTML for one product card. Used on the home and shop pages.
function createProductCardHTML(product) {
  const badgeHTML = product.badge
    ? `<span class="badge">${product.badge}</span>`
    : "";

  return `
    <article class="product-card">
      <div class="product-image">
        ${badgeHTML}
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${formatPeso(product.price)}</p>
        <button class="btn btn-primary btn-full" data-add-id="${product.id}">
          Add to Cart
        </button>
      </div>
    </article>
  `;
}

// Attach click handlers to every "Add to Cart" button inside a container.
function attachAddToCartButtons(container) {
  container.querySelectorAll("[data-add-id]").forEach(button => {
    button.addEventListener("click", () => {
      addToCart(Number(button.dataset.addId));
    });
  });
}

// Home page: show the products marked as featured.
function renderFeaturedProducts() {
  const container = document.getElementById("featured-products");
  const featuredList = PRODUCTS.filter(product => product.featured);
  container.innerHTML = featuredList.map(createProductCardHTML).join("");
  attachAddToCartButtons(container);
}

// Shop page: set up search, category filter, price sort, and the product grid.
function setupShopPage() {
  const searchInput = document.getElementById("search-input");
  const categorySelect = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");
  const grid = document.getElementById("shop-product-grid");
  const emptyMessage = document.getElementById("empty-state");

  // Fill the category dropdown from the product data (no duplicates).
  const categories = [...new Set(PRODUCTS.map(product => product.category))];
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });

  // Re-draw the grid whenever the user changes a control.
  function refreshGrid() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categorySelect.value;
    const sortOrder = sortSelect.value;

    let visibleProducts = PRODUCTS.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchText);
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortOrder === "price-low") {
      visibleProducts.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-high") {
      visibleProducts.sort((a, b) => b.price - a.price);
    }

    grid.innerHTML = visibleProducts.map(createProductCardHTML).join("");
    attachAddToCartButtons(grid);
    emptyMessage.hidden = visibleProducts.length > 0;
  }

  searchInput.addEventListener("input", refreshGrid);
  categorySelect.addEventListener("change", refreshGrid);
  sortSelect.addEventListener("change", refreshGrid);

  refreshGrid();
}

// Cart page: show each item, quantity controls, subtotals, and the total.
function renderCartPage() {
  const itemsContainer = document.getElementById("cart-items");
  const emptyMessage = document.getElementById("cart-empty");
  const summary = document.getElementById("cart-summary");
  const totalElement = document.getElementById("cart-total");

  function drawCart() {
    const items = getCartDetails();
    const isEmpty = items.length === 0;

    emptyMessage.hidden = !isEmpty;
    summary.hidden = isEmpty;
    itemsContainer.hidden = isEmpty;

    itemsContainer.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h3>${item.name}</h3>
          <p>${formatPeso(item.price)} each</p>
          <div class="quantity-controls">
            <button class="btn btn-outline btn-small" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="btn btn-outline btn-small" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <p class="cart-item-subtotal">${formatPeso(item.subtotal)}</p>
          <button class="remove-link" data-action="remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `).join("");

    totalElement.textContent = formatPeso(getCartTotal());
    updateCartCount();
  }

  // One listener handles every quantity and remove button (event delegation).
  itemsContainer.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const productId = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "increase") changeQuantity(productId, 1);
    if (action === "decrease") changeQuantity(productId, -1);
    if (action === "remove") removeFromCart(productId);

    drawCart();
  });

  drawCart();
}

// Checkout page: show the order summary and handle the form submission.
function setupCheckoutPage() {
  const form = document.getElementById("checkout-form");
  const summaryList = document.getElementById("checkout-summary");
  const totalElement = document.getElementById("checkout-total");
  const emptyNotice = document.getElementById("checkout-empty");
  const confirmation = document.getElementById("order-confirmation");
  const orderNumberElement = document.getElementById("order-number");

  const items = getCartDetails();

  // If the cart is empty, show a notice and hide the form.
  if (items.length === 0) {
    form.hidden = true;
    emptyNotice.hidden = false;
  }

  summaryList.innerHTML = items.map(item => `
    <li>
      <span>${item.name} × ${item.quantity}</span>
      <span>${formatPeso(item.subtotal)}</span>
    </li>
  `).join("");
  totalElement.textContent = formatPeso(getCartTotal());

  // Show or hide the GCash note depending on the chosen payment method.
  const gcashNote = document.getElementById("gcash-note");
  form.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener("change", () => {
      gcashNote.hidden = radio.value !== "GCash" || !radio.checked;
    });
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    clearFormErrors(form);

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      payment: form.payment.value
    };

    const errors = validateCheckout(formData);
    if (Object.keys(errors).length > 0) {
      showFormErrors(form, errors);
      return;
    }

    const orderNumber = createOrderNumber();
    saveOrder(orderNumber, formData, getCartDetails(), getCartTotal());
    clearCart();

    form.hidden = true;
    summaryList.parentElement.hidden = true;
    confirmation.hidden = false;
    orderNumberElement.textContent = orderNumber;
  });
}

// Check the checkout fields. Returns an object of error messages (empty if valid).
function validateCheckout(data) {
  const errors = {};
  if (!data.name) errors.name = "Please enter your full name.";
  if (!isValidEmail(data.email)) errors.email = "Please enter a valid email address.";
  if (!/^[0-9+\-\s()]{7,}$/.test(data.phone)) errors.phone = "Please enter a valid phone number.";
  if (!data.address) errors.address = "Please enter your delivery address.";
  if (!data.payment) errors.payment = "Please choose a payment method.";
  return errors;
}

// Check that an email looks reasonable (something@something.something).
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Make a simple demo order number like FS-20261103-4821.
function createOrderNumber() {
  const today = new Date();
  const datePart = today.getFullYear().toString()
    + String(today.getMonth() + 1).padStart(2, "0")
    + String(today.getDate()).padStart(2, "0");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `FS-${datePart}-${randomPart}`;
}

// Save the demo order to localStorage so it can be reviewed later.
function saveOrder(orderNumber, customer, items, total) {
  const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
  orders.push({
    orderNumber,
    customer,
    items,
    total,
    date: new Date().toISOString(),
    demo: true
  });
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

// Show error messages next to each invalid field.
function showFormErrors(form, errors) {
  Object.keys(errors).forEach(fieldName => {
    const errorElement = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorElement) errorElement.textContent = errors[fieldName];
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) field.setAttribute("aria-invalid", "true");
  });
}

// Clear all previous error messages before validating again.
function clearFormErrors(form) {
  form.querySelectorAll("[data-error-for]").forEach(el => el.textContent = "");
  form.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
}

// Contact page: basic validation, then show a success message (no email is sent).
function setupContactForm() {
  const form = document.getElementById("contact-form");
  const successMessage = document.getElementById("contact-success");

  form.addEventListener("submit", event => {
    event.preventDefault();
    clearFormErrors(form);
    successMessage.hidden = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    const errors = {};
    if (!name) errors.name = "Please enter your name.";
    if (!isValidEmail(email)) errors.email = "Please enter a valid email address.";
    if (message.length < 10) errors.message = "Message should be at least 10 characters.";

    if (Object.keys(errors).length > 0) {
      showFormErrors(form, errors);
      return;
    }

    successMessage.hidden = false;
    form.reset();
  });
}
