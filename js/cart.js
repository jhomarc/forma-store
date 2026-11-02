// cart.js
// Shopping cart logic. The cart is saved in localStorage so it survives page refreshes.

const CART_STORAGE_KEY = "formaCart";
const ORDERS_STORAGE_KEY = "formaOrders";

// Read the cart from localStorage. Returns an empty array if nothing is saved.
function getCart() {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  return savedCart ? JSON.parse(savedCart) : [];
}

// Save the cart array to localStorage.
function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Add one product to the cart by its id. If it already exists, increase the quantity.
function addToCart(productId) {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveCart(cart);
  updateCartCount();
  showToast("Added to cart");
}

// Change the quantity of an item by an amount (+1 or -1). Removes it if quantity reaches 0.
function changeQuantity(productId, change) {
  const cart = getCart();
  const item = cart.find(entry => entry.id === productId);
  if (!item) return;

  item.quantity += change;
  const updatedCart = item.quantity > 0 ? cart : cart.filter(entry => entry.id !== productId);

  saveCart(updatedCart);
  updateCartCount();
}

// Remove a product completely from the cart.
function removeFromCart(productId) {
  const updatedCart = getCart().filter(item => item.id !== productId);
  saveCart(updatedCart);
  updateCartCount();
}

// Empty the whole cart.
function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartCount();
}

// Count the total number of items (sum of all quantities) for the navbar badge.
function getCartItemCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

// Update every cart count badge on the page.
function updateCartCount() {
  const countElements = document.querySelectorAll("[data-cart-count]");
  const count = getCartItemCount();
  countElements.forEach(element => {
    element.textContent = count;
  });
}

// Combine cart items with their product details. Returns an array of full line items.
function getCartDetails() {
  return getCart()
    .map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      };
    })
    .filter(Boolean); // remove any items whose product no longer exists
}

// Calculate the total price of everything in the cart.
function getCartTotal() {
  return getCartDetails().reduce((total, item) => total + item.subtotal, 0);
}

// Format a number as Philippine pesos, for example ₱1,290.00
function formatPeso(amount) {
  return "₱" + amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Show a short popup message at the bottom of the screen.
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast.hideTimer);
  toast.hideTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}
