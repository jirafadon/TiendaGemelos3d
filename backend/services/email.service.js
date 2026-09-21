import { Resend } from 'resend';

let resend = null;

const FROM = () => process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL || '3dgemelos@gmail.com';
const FRONTEND_URL = () => String(process.env.FRONTEND_URL || 'https://tiendagemelos3d.vercel.app').replace(/\/$/, '');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada, se omite el envío');
    return null;
  }
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function safeSend(options) {
  const client = getClient();
  if (!client) return { skipped: true };
  try {
    const result = await client.emails.send({
      from: FROM(),
      ...options
    });
    console.log('[email] Enviado:', result.data?.id || 'sin id');
    return result;
  } catch (err) {
    console.error('[email] Error al enviar:', err.message);
    return { error: err.message };
  }
}

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#2a2a2a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#8fd82e;padding:24px;text-align:center;"><h1 style="margin:0;color:#1a1a1a;font-size:22px;">Tienda Gemelos 3D</h1></td></tr>
<tr><td style="padding:32px 28px;">${content}</td></tr>
<tr><td style="background:#1a1a1a;padding:20px 28px;text-align:center;color:#9aa4b8;font-size:12px;">© 2026 Tienda Gemelos 3D · Impresión 3D profesional</td></tr>
</table></td></tr></table></body></html>`;
}

function renderWelcome(user) {
  return emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;">¡Hola ${escapeHtml(user.name || 'cliente')}!</h2>
    <p style="margin:0 0 16px;line-height:1.6;">Gracias por registrarte en <strong>Tienda Gemelos 3D</strong>. Ya podés ver nuestros productos, agregarlos al carrito y hacer tus pedidos.</p>
    <p style="margin:0 0 24px;line-height:1.6;">Cualquier consulta, escribinos por WhatsApp.</p>
    <p style="text-align:center;margin:0;"><a href="${FRONTEND_URL()}" style="display:inline-block;background:#8fd82e;color:#1a1a1a;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:8px;">Ver catálogo</a></p>`);
}

function renderOrderConfirmation(order) {
  const rows = (order.items || []).map(item => `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.name)}${item.variant ? ` <small style="color:#6b6b6b;">(${escapeHtml(item.variant)})</small>` : ''}</td>
    <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${Number(item.qty || 0)}</td>
    <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${Number(item.price || 0).toLocaleString('es-AR')}</td>
  </tr>`).join('');
  return emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;">¡Gracias por tu compra!</h2>
    <p style="margin:0 0 20px;line-height:1.6;color:#6b6b6b;">Pedido <strong style="color:#1a1a1a;">${escapeHtml(order.number)}</strong></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;font-size:14px;">
      <thead><tr><th align="left" style="padding:8px 0;border-bottom:2px solid #1a1a1a;">Producto</th><th align="center" style="padding:8px 0;border-bottom:2px solid #1a1a1a;">Cant.</th><th align="right" style="padding:8px 0;border-bottom:2px solid #1a1a1a;">Precio</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:0 0 8px;font-weight:700;">Dirección de envío:</p>
    <p style="margin:0 0 20px;line-height:1.6;color:#6b6b6b;">${escapeHtml(order.customer?.name)}<br>${escapeHtml(order.customer?.address)}<br>${escapeHtml(order.customer?.city)} ${escapeHtml(order.customer?.zip)}<br>${escapeHtml(order.customer?.phone)}</p>
    <p style="margin:0;line-height:1.6;color:#6b6b6b;font-size:13px;">Te vamos a avisar cuando tu pedido esté en camino.</p>`);
}

function renderAdminNewOrder(order) {
  const items = (order.items || []).map(i => `<li>${Number(i.qty || 0)}x ${escapeHtml(i.name)} — $${Number(i.price || 0).toLocaleString('es-AR')}</li>`).join('');
  return emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;">🎉 Nuevo pedido recibido</h2>
    <p style="margin:0 0 20px;line-height:1.6;">Pedido <strong>${escapeHtml(order.number)}</strong> · Total <strong>$${Number(order.total || 0).toLocaleString('es-AR')}</strong></p>
    <p style="margin:0 0 8px;font-weight:700;">Cliente:</p>
    <p style="margin:0 0 16px;line-height:1.6;color:#6b6b6b;">${escapeHtml(order.customer?.name)}<br>${escapeHtml(order.customer?.email)}<br>${escapeHtml(order.customer?.phone)}</p>
    <p style="margin:0 0 8px;font-weight:700;">Productos:</p><ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;color:#6b6b6b;">${items}</ul>
    <p style="margin:0;line-height:1.6;color:#6b6b6b;font-size:13px;">Método de pago: <strong>${escapeHtml(order.payMethod || '-')}</strong></p>`);
}

function renderPasswordReset(user, resetUrl) {
  return emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;">Recuperar contraseña</h2>
    <p style="margin:0 0 16px;line-height:1.6;">Hola ${escapeHtml(user.name || 'cliente')}, recibimos un pedido para restablecer tu contraseña.</p>
    <p style="margin:0 0 24px;line-height:1.6;">El enlace es válido por <strong>1 hora</strong>. Si no lo pediste vos, ignorá este mensaje.</p>
    <p style="text-align:center;margin:0;"><a href="${resetUrl}" style="display:inline-block;background:#8fd82e;color:#1a1a1a;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:8px;">Restablecer contraseña</a></p>
    <p style="margin:24px 0 0;line-height:1.6;color:#6b6b6b;font-size:13px;word-break:break-all;">Si el botón no funciona, copiá este link en el navegador:<br>${escapeHtml(resetUrl)}</p>`);
}

export async function sendWelcome(user) {
  if (!user?.email) return;
  return safeSend({ to: user.email, subject: '¡Bienvenido a Tienda Gemelos 3D!', html: renderWelcome(user) });
}

export async function sendOrderConfirmation(order) {
  if (!order?.customer?.email) return;
  return safeSend({ to: order.customer.email, subject: `Confirmación de pedido ${order.number}`, html: renderOrderConfirmation(order) });
}

export async function sendAdminNewOrder(order) {
  if (!order) return;
  return safeSend({ to: ADMIN_EMAIL(), subject: `Nuevo pedido ${order.number} - $${order.total}`, html: renderAdminNewOrder(order) });
}

export async function sendPasswordReset(user, resetToken) {
  if (!user?.email) return;
  const resetUrl = `${FRONTEND_URL()}/reset-password?token=${encodeURIComponent(resetToken)}`;
  return safeSend({ to: user.email, subject: 'Recuperar contraseña - Tienda Gemelos 3D', html: renderPasswordReset(user, resetUrl) });
}

// Se conserva para compatibilidad con futuras etapas; no se dispara en esta feature.
export async function sendOrderShipped() { return { skipped: true }; }

export async function sendNewsletterWelcome(email) {
  if (!email) return;
  return safeSend({
    to: email,
    subject: '¡Gracias por suscribirte a Tienda Gemelos 3D!',
    html: emailWrapper('<h2>¡Gracias por suscribirte!</h2><p>Te avisaremos de novedades y promociones de Tienda Gemelos 3D.</p>')
  });
}
