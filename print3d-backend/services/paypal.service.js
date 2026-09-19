import paypal from '@paypal/checkout-server-sdk';

function getEnvironment() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('Las credenciales de PayPal no están configuradas.');
  }

  if (String(process.env.PAYPAL_ENV).toLowerCase() === 'live') {
    return new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    );
  }

  return new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
}

function getClient() {
  return new paypal.core.PayPalHttpClient(getEnvironment());
}

export async function createPayPalOrder(order) {
  const request = new paypal.orders.OrdersCreateRequest();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';

  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: order.number,
        description: `Compra ${order.number} - PrintLab 3D`,
        amount: {
          currency_code: 'ARS',
          value: Number(order.total).toFixed(2)
        }
      }
    ],
    application_context: {
      brand_name: 'PrintLab 3D',
      user_action: 'PAY_NOW',
      return_url: `${frontendUrl}/index.html?payment=paypal_success&order=${encodeURIComponent(order.number)}`,
      cancel_url: `${frontendUrl}/index.html?payment=paypal_cancelled&order=${encodeURIComponent(order.number)}`
    }
  });

  const response = await getClient().execute(request);

  return {
    orderID: response.result.id
  };
}

export async function capturePayPalOrder(orderID) {
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  return getClient().execute(request);
}
