import type { SubscriptionPlan, MigrationPackage, MigrationService } from './types';


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
    id: 'esencial',
    name: 'Esencial',
    title: 'Esencial',
    price: 500,
    priceCOP: '',
    description: 'Perfecto para comenzar tu proceso migratorio con lo fundamental en España',
    features: [
      'Asesoría inicial personalizada (2 horas)',
      'Revisión completa de documentos',
      'Guía detallada de trámites básicos',
      'Lista de verificación personalizada',
      'Soporte por WhatsApp (horario laboral)',
      'Recursos digitales descargables', 
      'Gestión NIE/TIE'

    ],
    color: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    textColor: 'text-green-600'
  },
  {
    id: 'vip',
    name: 'VIP',
    title: 'VIP',
    price: 700,
    priceCOP: '',
    description: 'Acompañamiento completo durante todo tu proceso de migración',
    features: [
      'Todo lo del paquete Esencial',
      'Búsqueda y orientación de vivienda',
      'Orientación laboral y preparación de CV',
      'Soporte telefónico prioritario',
      'Guía de integración cultural',
      'Seguimiento mensual por 3 meses'
    ],
    popular: true,
    color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    textColor: 'text-blue-600'
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    title: 'Empresarial',
    price: 1500,
    priceCOP: '',
    description: 'Servicio premium con atención personalizada y exclusiva para emprendedores colombianos',
    features: [
      'Todo lo del paquete Integral',
      'Orientación para apertura de empresa',
      'Gestor personal asignado exclusivamente',
      'Atención prioritaria 24/7',
      'Networking',
      'Acompañamiento en primeros 30 días',
      'Seguimiento por 6 meses',
    ],
    color: 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
    textColor: 'text-purple-600'
  }
];

export const migrationServices: MigrationService[] = [
    {
        id: 'recogida-aeropuerto',
        title: 'Recogida en Aeropuerto',
        description: 'Te esperamos en el aeropuerto y te llevamos a tu nuevo hogar.',
        price: 120,
        icon: 'Plane',
        buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
        id: 'homologacion-licencia',
        title: 'Homologación Licencia Conducción',
        description: 'Gestionamos el canje de tu licencia de conducir colombiana por la española.',
        price: 250,
        icon: 'FileText', // You might want a better icon like Car
        buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    {
        id: 'apertura-cuenta',
        title: 'Apertura de Cuenta Bancaria',
        description: 'Asesoría para abrir tu primera cuenta bancaria en España sin complicaciones.',
        price: 100,
        icon: 'CreditCard',
        buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
    },
    
    {
        id: 'seguro-medico',
        title: 'Contratación de Seguro Médico',
        description: 'Encontramos el seguro de salud con la cobertura que necesitas al mejor precio.',
        price: 80,
        icon: 'Shield',
        buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    {
        id: 'empadronamiento',
        title: 'Cita de Empadronamiento',
        description: 'Agendamos tu cita y te preparamos para el trámite de empadronamiento.',
        price: 90,
        icon: 'MapPin',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
    },
     {
        id: 'homologacion-titulo',
        title: 'Homologación de Título',
        description: 'Gestión completa para la validación de tu título profesional en España.',
        price: 350,
        icon: 'FileText',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
];
