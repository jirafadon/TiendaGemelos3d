export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calcTotals({ items = [], shippingCost = 2500, freeShippingMin = 50000, coupon = null }) {
  const normalizedItems = items.map(item => ({
    ...item,
    price: Math.max(0, Number(item.price) || 0),
    qty: Math.max(0, Math.floor(Number(item.qty) || 0))
  }));

  const subtotal = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  let shipping = subtotal >= Number(freeShippingMin || 0) ? 0 : Math.max(0, Number(shippingCost) || 0);
  let discount = 0;
  let couponCode = null;

  if (coupon?.active) {
    const minPurchase = Math.max(0, Number(coupon.minPurchase) || 0);
    const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt).getTime() > Date.now();
    const availableUses = coupon.maxUses == null || Number(coupon.usedCount || 0) < Number(coupon.maxUses);

    if (notExpired && availableUses && subtotal >= minPurchase) {
      couponCode = coupon.code || null;

      if (coupon.type === 'percent') {
        discount = subtotal * (Math.min(100, Math.max(0, Number(coupon.value) || 0)) / 100);
      } else if (coupon.type === 'fixed') {
        discount = Math.min(subtotal, Math.max(0, Number(coupon.value) || 0));
      } else if (coupon.type === 'shipping') {
        shipping = 0;
      }
    }
  }

  discount = roundMoney(Math.max(0, discount));
  shipping = roundMoney(Math.max(0, shipping));
  const total = roundMoney(Math.max(0, subtotal - discount + shipping));

  return {
    subtotal: roundMoney(subtotal),
    shipping,
    discount,
    total,
    couponCode
  };
}

export function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `PL3D-${datePart}-${randomPart}`;
}
