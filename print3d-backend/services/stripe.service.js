import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY no está configurado.');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function createStripeSession(order) {
  const stripe = getStripe();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';

  const lineItems = order.items.map(item => ({
    price_data: {
      currency: 'ars',
      product_data: {
        name: item.name,
        ...(item.seed ? { metadata: { seed: item.seed } } : {})
      },
      unit_amount: Math.round(Number(item.price) * 100)
    },
    quantity: Number(item.qty)
  }));

  if (Number(order.shipping) > 0) {
    lineItems.push({
      price_data: {
        currency: 'ars',
        product_data: { name: 'Envío' },
        unit_amount: Math.round(Number(order.shipping) * 100)
      },
      quantity: 1
    });
  }

  if (Number(order.discount) > 0) {
    lineItems.push({
      price_data: {
        currency: 'ars',
        product_data: { name: 'Descuento' },
        unit_amount: Math.round(Number(order.discount) * -100)
      },
      quantity: 1
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: order.customer.email,
    client_reference_id: order.number,
    metadata: {
      orderNumber: order.number,
      orderId: order._id.toString()
    },
    success_url: `${frontendUrl}/index.html?payment=stripe_success&order=${encodeURIComponent(order.number)}`,
    cancel_url: `${frontendUrl}/index.html?payment=stripe_cancelled&order=${encodeURIComponent(order.number)}`
  });

  return {
    sessionId: session.id,
    url: session.url
  };
}

export function validateStripeWebhook(payload, sig) {
  const stripe = getStripe();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET no está configurado.');
  }

  return stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
