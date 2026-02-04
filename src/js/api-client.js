// filepath: src/js/api-client.js
// Handles all API calls to Vercel backend

export class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async request(method, endpoint, body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Products endpoints
  async getProducts() {
    return this.request('GET', '/products');
  }

  // Orders endpoints
  async createOrder(email, items) {
    if (!email || !items || items.length === 0) {
      throw new Error('Email and items are required');
    }

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return this.request('POST', '/orders', {
      email,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        qty: item.qty,
        price: item.price,
      })),
      total,
    });
  }

  // Config endpoints
  async getConfig() {
    return this.request('GET', '/config');
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
}
