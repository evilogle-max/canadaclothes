// frontend: src/pages/products/create.jsx

async function handleCreateProduct(productData, imageFiles) {
  try {
    // Call YOUR backend endpoint (which calls Printify)
    const response = await fetch('/api/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: productData.name,
        description: productData.description,
        price: productData.price,
        images: imageFiles  // or URLs if using Printify's storage
      })
    });

    const result = await response.json();
    
    // The backend already synced to Supabase
    // result.product contains the Supabase record
    
    return result;
  } catch (error) {
    console.error('Create product error:', error);
  }
}