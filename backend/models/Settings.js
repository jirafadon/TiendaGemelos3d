import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'main',
      immutable: true
    },
    topBarText: { type: String, default: '🚚 Envíos a todo el país · Hasta 3 cuotas sin interés', trim: true },
    heroTitle: { type: String, default: 'Impresión 3D Profesional', trim: true },
    heroSubtitle: { type: String, default: '', trim: true },
    benefit1Icon: { type: String, default: 'fa-truck', trim: true },
    benefit1Title: { type: String, default: 'Envíos a todo el país', trim: true },
    benefit1Text: { type: String, default: 'A domicilio o sucursal más cercana', trim: true },
    benefit2Icon: { type: String, default: 'fa-wand-magic-sparkles', trim: true },
    benefit2Title: { type: String, default: 'Productos personalizados', trim: true },
    benefit2Text: { type: String, default: 'Consultanos por pedidos personalizados', trim: true },
    benefit3Icon: { type: String, default: 'fa-shield-halved', trim: true },
    benefit3Title: { type: String, default: 'Compra segura', trim: true },
    benefit3Text: { type: String, default: 'Aboná con Mercado Pago', trim: true },
    benefit4Icon: { type: String, default: 'fa-comments', trim: true },
    benefit4Title: { type: String, default: 'Venta mayorista', trim: true },
    benefit4Text: { type: String, default: 'Consultá por WhatsApp', trim: true },
    banner1Title: { type: String, default: 'Figuras 3D', trim: true },
    banner1Text: { type: String, default: 'Descubrí nuestra colección', trim: true },
    banner1ButtonText: { type: String, default: 'Comprar', trim: true },
    banner1Link: { type: String, default: '/?cat=figuras', trim: true },
    banner1Image: { type: String, default: '', trim: true },
    banner2Title: { type: String, default: 'Soportes y Decoración', trim: true },
    banner2Text: { type: String, default: 'Piezas únicas para tu hogar', trim: true },
    banner2ButtonText: { type: String, default: 'Comprar', trim: true },
    banner2Link: { type: String, default: '/?cat=decoracion', trim: true },
    banner2Image: { type: String, default: '', trim: true },
    newsletterTitle: { type: String, default: 'Recibí todas las ofertas', trim: true },
    newsletterSubtitle: { type: String, default: '¿Querés recibir nuestras ofertas? ¡Registrate ya y comenzá a disfrutarlas!', trim: true },
    installmentsTitle: { type: String, default: '3 cuotas sin interés en toda la web', trim: true },
    installmentsSubtitle: { type: String, default: 'También tenemos 15% OFF abonando en efectivo o transferencia', trim: true },
    footerCopyright: { type: String, default: '© 2026 Tienda Gemelos 3D · Todos los derechos reservados', trim: true },
    storeName: {
      type: String,
      default: 'PrintLab 3D',
      trim: true
    },
    storeLogo: { type: String, default: '', trim: true },
    primaryColor: { type: String, default: '#8fd82e', trim: true },
    primaryColorHover: { type: String, default: '#6da020', trim: true },
    backgroundColor: { type: String, default: '#ffffff', trim: true },
    textColor: { type: String, default: '#2a2a2a', trim: true },
    footerColor: { type: String, default: '#1a1a1a', trim: true },
    headerColor: { type: String, default: '#ffffff', trim: true },
    storeEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    storePhone: {
      type: String,
      default: '',
      trim: true
    },
    storeAddress: {
      type: String,
      default: '',
      trim: true
    },
    storeWhatsApp: { type: String, default: '', trim: true },
    instagramUrl: { type: String, default: '', trim: true },
    facebookUrl: { type: String, default: '', trim: true },
    tiktokUrl: { type: String, default: '', trim: true },
    shippingCost: {
      type: Number,
      default: 2500,
      min: 0
    },
    freeShippingMin: {
      type: Number,
      default: 50000,
      min: 0
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    allowRegister: {
      type: Boolean,
      default: true
    },
    allowGuestCheckout: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export default mongoose.model('Settings', settingsSchema);
