# Conexión exacta Frontend ↔ Backend

Pegá estos fragmentos dentro de `index.html` y `admin.html`. Variables, funciones y estructura quedan en inglés; textos visibles en español.

## 1. Google Identity Services

En el `<head>` o antes de `</body>`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

Dentro del modal de login:

```html
<div id="googleButton"></div>
```

JavaScript:

```html
<script>
const API_URL = 'http://localhost:4000/api';
const TOKEN_KEY = 'printlab_token';
const USER_KEY = 'printlab_user';

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function handleGoogleResponse(response) {
  try {
    const result = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential: response.credential })
    });

    const data = await result.json();
    if (!result.ok || !data.success) {
      throw new Error(data.message || 'No se pudo iniciar sesión con Google.');
    }

    saveSession(data.token, data.user);
    window.dispatchEvent(new CustomEvent('printlab:login', { detail: data.user }));
  } catch (error) {
    console.error('Google Login:', error);
    if (typeof showToast === 'function') {
      showToast(error.message || 'Error al iniciar sesión con Google.', 'error');
    }
  }
}

function initGoogleLogin() {
  if (!window.google?.accounts?.id) return;

  google.accounts.id.initialize({
    client_id: '⚠️ REEMPLAZAR: TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    callback: handleGoogleResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  google.accounts.id.renderButton(
    document.getElementById('googleButton'),
    {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 320
    }
  );
}

window.addEventListener('load', initGoogleLogin);
</script>
```

## 2. Helper `apiFetch()`

```html
<script>
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('printlab_token');
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401) {
    localStorage.removeItem('printlab_token');
    localStorage.removeItem('printlab_user');
    window.dispatchEvent(new Event('printlab:logout'));

    if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = 'index.html';
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(data?.message || `Error HTTP ${response.status}.`);
  }

  return data;
}
</script>
```

## 3. `processPayment()` real + fallback demo

El backend espera `couponCode`, por eso el valor del input/frontend llamado `coupon` se envía como `couponCode`.

```html
<script>
async function processPayment() {
  const cart = Array.isArray(window.cart) ? window.cart : [];
  const customer = window.checkoutCustomer || {};
  const payMethod = window.selectedPaymentMethod || 'mercadopago';
  const coupon = window.appliedCoupon || '';

  if (!cart.length) {
    if (typeof showToast === 'function') showToast('El carrito está vacío.', 'error');
    return;
  }

  const payload = {
    items: cart.map(item => ({
      productId: item.productId || item.id,
      qty: Number(item.qty || item.quantity || 1),
      variant: item.variant || null
    })),
    customer: {
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      zip: customer.zip || ''
    },
    payMethod,
    couponCode: coupon
  };

  try {
    const data = await apiFetch('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!data.success) {
      throw new Error(data.message || 'No se pudo iniciar el pago.');
    }

    if (payMethod === 'mercadopago') {
      const url = data.payment?.initPoint || data.payment?.sandboxInitPoint;
      if (!url) throw new Error('Mercado Pago no devolvió una URL de checkout.');
      window.location.href = url;
      return;
    }

    if (payMethod === 'paypal') {
      const orderID = data.payment?.orderID;
      if (!orderID) throw new Error('PayPal no devolvió el ID de la orden.');
      const paypalHost = data.payment?.environment === 'live'
        ? 'https://www.paypal.com'
        : 'https://www.sandbox.paypal.com';
      window.location.href = `${paypalHost}/checkoutnow?token=${encodeURIComponent(orderID)}`;
      return;
    }

    if (payMethod === 'stripe') {
      const url = data.payment?.url;
      if (!url) throw new Error('Stripe no devolvió una URL de checkout.');
      window.location.href = url;
      return;
    }

    throw new Error('Método de pago no soportado.');
  } catch (error) {
    console.error('processPayment:', error);

    // Fallback demo: permite probar la UX si el backend no está disponible.
    if (typeof completeDemoCheckout === 'function') {
      completeDemoCheckout({ payload, reason: error.message });
      return;
    }

    if (typeof showToast === 'function') {
      showToast(`No se pudo conectar con el backend. ${error.message}`, 'error');
    }
  }
}
</script>
```

## 4. Verificación de admin al cargar `admin.html`

```html
<script>
async function verifyAdminSession() {
  try {
    const data = await apiFetch('/auth/me', { method: 'GET' });

    if (!data.success || data.user?.role !== 'admin') {
      window.location.href = 'index.html';
      return false;
    }

    localStorage.setItem('printlab_user', JSON.stringify(data.user));
    return true;
  } catch (error) {
    console.error('Verificación de administrador:', error);
    localStorage.removeItem('printlab_token');
    localStorage.removeItem('printlab_user');
    window.location.href = 'index.html';
    return false;
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await verifyAdminSession();
});
</script>
```

## 5. Exportar CSV desde admin

```html
<script>
function exportCsv(rows, filename = 'pedidos.csv') {
  if (!Array.isArray(rows) || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const escapeCsv = value => {
    const text = String(value ?? '').replaceAll('"', '""');
    return `"${text}"`;
  };

  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))
  ].join('\r\n');

  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
</script>
```
