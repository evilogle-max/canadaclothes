// filepath: src/js/checkout.js
// Checkout flow and order creation

import { validateEmail } from './utils.js';

export class Checkout {
  constructor(store, apiClient) {
    this.store = store;
    this.apiClient = apiClient;
    this.isProcessing = false;
  }

  validateOrder() {
    const { cart } = this.store;

    if (!cart || cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const total = this.store.getCartTotal();
    if (total <= 0) {
      throw new Error('Invalid cart total');
    }

    return true;
  }

  async processCheckout(email) {
    if (this.isProcessing) {
      throw new Error('Checkout already in progress');
    }

    if (!email || !validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    this.isProcessing = true;

    try {
      this.validateOrder();

      const items = this.store.getCartItems();
      const response = await this.apiClient.createOrder(email, items);

      if (!response.order_id) {
        throw new Error('No order ID returned');
      }

      // Clear cart after successful order
      this.store.clearCart();
      this.store.saveToLocalStorage();

      return {
        orderId: response.order_id,
        status: response.status || 'pending',
        total: this.store.getCartTotal(),
      };
    } finally {
      this.isProcessing = false;
    }
  }

  isProcessingCheckout() {
    return this.isProcessing;
  }
}
