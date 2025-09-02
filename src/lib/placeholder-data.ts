
import type { SubscriptionPlan, MigrationPackage, MigrationService, ValeriaPlan } from './types';


export const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Básico',
      price: '€19/mes',
      features: [
        'Perfil de Negocio Básico',
        'Aparece en la Búsqueda del Directorio',
        '1 Crédito de Anuncio al Mes',
        'Soporte por Email',
      ],
      cta: 'Elegir Básico',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '€49/mes',
      features: [
        'Perfil de Negocio Mejorado',
        'Destacado en el Directorio',
        '5 Créditos de Anuncio al Mes',
        'Soporte Prioritario por Email',
        'Analíticas Básicas',
      ],
      cta: 'Elegir Premium',
    },
    {
      id: 'featured',
      name: 'Destacado',
      price: '€99/mes',
      features: [
        'Perfil de Negocio Premium',
        'Posicionamiento Superior en Directorio',
        '15 Créditos de Anuncio al Mes',
        'Soporte por Teléfono y Email',
        'Analíticas Avanzadas e Ideas',
      ],
      cta: 'Elegir Destacado',
    },
  ];

export const mockAds = [
  { id: 'AD001', title: '20% de descuento en Arepas El Sabor', status: 'Activo', clicks: 1204, views: 45000 },
  { id: 'AD002', title: 'Nueva Colección de Verano - Moda Colombiana', status: 'Activo', clicks: 850, views: 32000 },
  { id: 'AD003', title: 'Degustación de Café Gratis en Café de Origen', status: 'Pausado', clicks: 320, views: 15000 },
  { id: 'AD004', title: 'Descuento en Consulta de Inmigración', status: 'Expirado', clicks: 50, views: 5000 },
];

export const mockUser = {
  name: 'Carlos Gomez',
  email: 'carlos.gomez@example.com',
  businessName: 'Arepas El Sabor',
  address: 'Calle de la Princesa, 2, 28008 Madrid',
  phone: '+34 912 345 678',
  website: 'https://arepaselsabor.es'
}

export const migrationPackages: MigrationPackage[] = [
  {
    id: 'pack_consultoria',
    name: 'Consultoría Inicial',
    price: 39,
    description: "Resuelve tus dudas con un experto y empieza con seguridad.",
    features: [],
    color: '',
    textColor: '',
  },
  {
    id: 'pack_onboarding',
    name: 'Onboarding en España',
    price: 0, // El precio se gestiona con el partner
    description: "Te recibimos, te guiamos en tus primeros trámites y te acompañamos en la adaptación.",
     features: [],
    color: '',
    textColor: '',
  },
  {
    id: 'pack_viaje',
    name: 'Viaje Completo',
    price: 0, // El precio se gestiona con el partner
    description: "Organizamos tu viaje a España con seguridad: vuelos, seguros y traslados.",
     features: [],
    color: '',
    textColor: '',
  }
];

export const migrationServices: MigrationService[] = [
    {
        id: 'recogida-aeropuerto',
        title: 'Recogida en Aeropuerto',
        name: 'Recogida en Aeropuerto',
        price: 120,
        description: 'Te esperamos en el aeropuerto y te llevamos a tu nuevo hogar.',
        icon: 'Plane',
        buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
        id: 'homologacion-licencia',
        title: 'Homologación Licencia Conducción',
        name: 'Homologación Licencia Conducción',
        description: 'Gestionamos el canje de tu licencia de conducir colombiana por la española.',
        price: 250,
        icon: 'FileText', // You might want a better icon like Car
        buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    {
        id: 'apertura-cuenta',
        title: 'Apertura de Cuenta Bancaria',
        name: 'Apertura de Cuenta Bancaria',
        description: 'Asesoría para abrir tu primera cuenta bancaria en España sin complicaciones.',
        price: 100,
        icon: 'CreditCard',
        buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
    },
    
    {
        id: 'seguro-medico',
        title: 'Contratación de Seguro Médico',
        name: 'Contratación de Seguro Médico',
        description: 'Encontramos el seguro de salud con la cobertura que necesitas al mejor precio.',
        price: 80,
        icon: 'Shield',
        buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    {
        id: 'empadronamiento',
        title: 'Cita de Empadronamiento',
        name: 'Cita de Empadronamiento',
        description: 'Agendamos tu cita y te preparamos para el trámite de empadronamiento.',
        price: 90,
        icon: 'MapPin',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
    },
     {
        id: 'homologacion-titulo',
        title: 'Homologación de Título',
        name: 'Homologación de Título',
        description: 'Gestión completa para la validación de tu título profesional en España.',
        price: 350,
        icon: 'FileText',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
];

export const valeriaPlans: ValeriaPlan[] = [
    {
      id: 'plan_free', // Internal ID, doesn't go to Stripe
      name: 'Gratis',
      price: 0,
      priceDetails: '/ mes',
      features: [
        '3 consultas al día',
        'Respuestas básicas de la base de conocimiento',
        'Acceso al chat 24/7',
      ],
      cta: 'Empieza Gratis',
      variant: 'outline'
    },
    {
      id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_COLOMBIA || 'price_colombia_default',
      name: 'Plan Colombia',
      price: 2.99,
      priceDetails: '/ mes',
      features: [
        'Consultas ilimitadas',
        'Respuestas extendidas y detalladas',
        'Acceso a checklists descargables',
        'Generación de documentos básicos en PDF',
      ],
      cta: 'Elegir Plan Colombia',
       variant: 'default'
    },
    {
      id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ESPANA || 'price_espana_default',
      name: 'Plan España',
      price: 7.99,
      priceDetails: '/ mes',
      features: [
        'Todo lo del Plan Colombia',
        'Alertas de empleo personalizadas',
        'Alertas de vivienda según tus criterios',
        'Acceso a todas las guías premium',
      ],
      cta: 'Elegir Plan España',
      variant: 'default'
    },
];
