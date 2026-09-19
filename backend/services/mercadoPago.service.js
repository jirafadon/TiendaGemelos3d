import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

function getClient() {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no está configurado.');
  }

  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
  });
}

export async function createMPPreference(order) {
  const client = getClient();
  const preference = new Preference(client);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

  const response = await preference.create({
    body: {
      items: order.items.map(item => ({
        id: item.productId?.toString(),
        title: item.name,
        description: item.variant ? JSON.stringify(item.variant) : undefined,
        quantity: item.qty,
        unit_price: Number(item.price),
        currency_id: 'ARS'
      })),
      external_reference: order.number,
      back_urls: {
        success: `${frontendUrl}/index.html?payment=success&order=${encodeURIComponent(order.number)}`,
        failure: `${frontendUrl}/index.html?payment=failure&order=${encodeURIComponent(order.number)}`,
        pending: `${frontendUrl}/index.html?payment=pending&order=${encodeURIComponent(order.number)}`
      },
      auto_return: 'approved',
      notification_url: `${backendUrl}/api/payments/webhook/mercadopago`,
      payer: {
        name: order.customer.name,
        email: order.customer.email
      }
    }
  });

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point
  };
}

export async function getMPPayment(id) {
  const client = getClient();
  const payment = new Payment(client);
  return payment.get({ id });
}
