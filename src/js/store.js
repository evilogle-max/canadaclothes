// filepath: src/js/store.js
// State management for cart, products, user

export class Store {
  constructor() {
    this.products = [];
    this.cart = [];
    this.user = null;
    this.loading = false;
    this.error = null;
  }

  // Product management
  setProducts(products) {
    this.products = products || [];
  }

  getProduct(id) {
    return this.products.find(p => p.id === id);
  }

  // Cart management
  addToCart(product) {
    if (!product || !product.id) {
      throw new Error('Invalid product');
    }

    const existing = this.cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        qty: 1,
      });
    }
  }

  updateQuantity(productId, change) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += change;
    if (item.qty <= 0) {
      this.removeFromCart(productId);
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.id !== productId);
  }

  // Cart calculations
  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  getCartItems() {
    return this.cart.map(item => ({
      ...item,
      total: item.price * item.qty,
    }));
  }

  clearCart() {
    this.cart = [];
  }

  // User management
  setUser(user) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }

  // State management
  setLoading(loading) {
    this.loading = loading;
  }

  setError(error) {
    this.error = error;
  }

  clearError() {
    this.error = null;
  }

  // Persistence
  saveToLocalStorage() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        this.cart = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    }
  }
}
