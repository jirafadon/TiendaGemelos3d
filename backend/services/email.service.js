import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

let resendClient = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateDir = path.resolve(__dirname, '../templates/email');

export function initClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada. Los emails quedarán desactivados.');
    return null;
  }
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'PrintLab 3D <no-reply@example.com>';
}

function baseUrls() {
  const frontendUrl = String(process.env.FRONTEND_URL || 'http://localhost:5500').replace(/\/$/, '');
  const adminUrl = String(process.env.ADMIN_URL || frontendUrl).replace(/\/$/, '');
  return {
    websiteUrl: frontendUrl,
    catalogUrl: `${frontendUrl}/index.html#catalogo`,
    adminUrl,
    instagramUrl: process.env.INSTAGRAM_URL || `${frontendUrl}/#instagram`,
    facebookUrl: process.env.FACEBOOK_URL || `${frontendUrl}/#facebook`,
    unsubscribeUrl: process.env.UNSUBSCRIBE_URL || `${frontendUrl}/#unsubscribe`
  };
}

async function renderTemplate(templateName, variables = {}) {
  const filePath = path.join(templateDir, templateName);
  let html = await fs.readFile(filePath, 'utf8');
  const values = { ...baseUrls(), ...variables };
  const rawKeys = new Set(['itemsRows']);
  for (const [key, value] of Object.entries(values)) {
    const replacement = rawKeys.has(key) ? String(value ?? '') : escapeHtml(value);
    html = html.replaceAll(`{{${key}}}`, replacement);
  }
  return html;
}

async function sendEmail({ to, subject, html }) {
  try {
    const client = initClient();
    if (!client) return null;
    return await client.emails.send({ from: fromEmail(), to, subject, html });
  } catch (error) {
    console.error(`Error enviando email a ${to}:`, error.message);
    return null;
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function money(value) {
  return `$${formatMoney(value)}`;
}

function itemsRows(order) {
  return (order.items || []).map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #26333b;color:#eaf7f3">${escapeHtml(item.name)}</td>
      <td align="center" style="padding:10px;border-bottom:1px solid #26333b;color:#b8c9c4">${Number(item.qty || 0)}</td>
      <td align="right" style="padding:10px;border-bottom:1px solid #26333b;color:#eaf7f3">${money(Number(item.price || 0) * Number(item.qty || 0))}</td>
    </tr>
  `).join('');
}

export async function sendWelcome(user) {
  try {
    const html = await renderTemplate('welcome.html', { userName: user.name });
    return await sendEmail({ to: user.email, subject: '¡Bienvenido a PrintLab 3D!', html });
  } catch (error) {
    console.error('sendWelcome:', error.message);
    return null;
  }
}

export async function sendOrderConfirmation(order) {
  try {
    const html = await renderTemplate('orderConfirmation.html', {
      customerName: order.customer?.name,
      orderNumber: order.number,
      itemsRows: itemsRows(order),
      subtotal: money(order.subtotal),
      shipping: money(order.shipping),
      discount: money(order.discount),
      total: money(order.total),
      address: order.customer?.address,
      city: order.customer?.city,
      zip: order.customer?.zip,
      phone: order.customer?.phone,
      payMethod: order.payMethod
    });
    return await sendEmail({ to: order.customer.email, subject: `Confirmación de pedido ${order.number}`, html });
  } catch (error) {
    console.error('sendOrderConfirmation:', error.message);
    return null;
  }
}

export async function sendOrderShipped(order, tracking) {
  try {
    const trackingValue = tracking || 'No disponible';
    const trackingUrl = process.env.TRACKING_BASE_URL
      ? `${String(process.env.TRACKING_BASE_URL).replace(/\/$/, '')}/${encodeURIComponent(trackingValue)}`
      : `${baseUrls().websiteUrl}/#seguimiento-${encodeURIComponent(trackingValue)}`;
    const html = await renderTemplate('orderShipped.html', {
      customerName: order.customer?.name,
      orderNumber: order.number,
      tracking: trackingValue,
      trackingUrl
    });
    return await sendEmail({ to: order.customer.email, subject: `Tu pedido ${order.number} fue enviado`, html });
  } catch (error) {
    console.error('sendOrderShipped:', error.message);
    return null;
  }
}

export async function sendPasswordReset(user, token) {
  try {
    const frontendUrl = String(process.env.FRONTEND_URL || 'http://localhost:5500').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/index.html?resetToken=${encodeURIComponent(token)}`;
    const html = await renderTemplate('passwordReset.html', { userName: user.name, resetUrl });
    return await sendEmail({ to: user.email, subject: 'Restablecer contraseña - PrintLab 3D', html });
  } catch (error) {
    console.error('sendPasswordReset:', error.message);
    return null;
  }
}

export async function sendAdminNewOrder(order) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL no configurado. No se enviará el aviso de nuevo pedido.');
      return null;
    }
    const html = await renderTemplate('adminNewOrder.html', {
      orderNumber: order.number,
      total: money(order.total),
      customerName: order.customer?.name,
      customerEmail: order.customer?.email,
      address: order.customer?.address,
      city: order.customer?.city,
      zip: order.customer?.zip,
      payMethod: order.payMethod,
      itemsRows: itemsRows(order),
      subtotal: money(order.subtotal),
      shipping: money(order.shipping),
      discount: money(order.discount)
    });
    return await sendEmail({ to: adminEmail, subject: `Nuevo pedido ${order.number}`, html });
  } catch (error) {
    console.error('sendAdminNewOrder:', error.message);
    return null;
  }
}

export async function sendNewsletterWelcome(email) {
  try {
    const html = await renderTemplate('welcome.html', { userName: 'amigo/a de PrintLab 3D' });
    return await sendEmail({ to: email, subject: '¡Gracias por suscribirte a PrintLab 3D!', html });
  } catch (error) {
    console.error('sendNewsletterWelcome:', error.message);
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
