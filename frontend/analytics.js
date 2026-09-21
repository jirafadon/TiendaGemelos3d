/* frontend/analytics.js
   Solo funciones de analítica. NO funciones del panel admin. */

const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // ⚠️ REEMPLAZAR

// Inicialización (si aplica)
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', GA_MEASUREMENT_ID);

// Track de página vista
export function trackPageView(page = location.pathname) {
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', { page_path: page });
  }
}

// Track de evento genérico
export function trackEvent(name, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', name, params);
  }
}

// Track de compra (e-commerce)
export function trackPurchase(order) {
  if (typeof gtag === 'function') {
    gtag('event', 'purchase', {
      transaction_id: order.number,
      value: order.total,
      currency: 'ARS',
      items: (order.items || []).map(i => ({
        item_id: i.productId,
        item_name: i.name,
        price: i.price,
        quantity: i.qty
      }))
    });
  }
}
