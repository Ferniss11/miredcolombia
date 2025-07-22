import type { Business, BlogPost, SubscriptionPlan, MigrationPackage, MigrationService } from './types';

export const featuredBusinesses: Business[] = [
  {
    id: '1',
    name: 'Arepas El Sabor',
    slug: 'arepas-el-sabor',
    category: 'Restaurante',
    description: 'Auténticas arepas y empanadas colombianas en el corazón de Madrid.',
    longDescription: 'Fundado por una familia de Medellín, Arepas El Sabor trae el verdadero sabor de la comida callejera colombiana a España. Usamos recetas tradicionales pasadas de generación en generación para crear platos deliciosos y auténticos.',
    imageUrl: 'https://placehold.co/400x250.png',
    address: 'Calle de la Princesa, 2, 28008 Madrid',
    phone: '+34 912 345 678',
    website: 'https://arepaselsabor.es'
  },
  {
    id: '2',
    name: 'Moda Colombiana',
    slug: 'moda-colombiana',
    category: 'Moda',
    description: 'Diseños de ropa vibrantes y únicos directamente desde Colombia.',
    longDescription: 'Moda Colombiana es una boutique que muestra lo mejor de la moda colombiana. Trabajamos con diseñadores independientes para traerte piezas únicas y de alta calidad que no encontrarás en ningún otro lugar.',
    imageUrl: 'https://placehold.co/400x250.png',
    address: 'Passeig de Gràcia, 92, 08008 Barcelona',
    phone: '+34 934 567 890',
    website: 'https://modacolombiana.es'
  },
  {
    id: '3',
    name: 'Café de Origen',
    slug: 'cafe-de-origen',
    category: 'Cafetería',
    description: 'Café de especialidad colombiano obtenido directamente de fincas locales.',
    longDescription: 'En Café de Origen, nos apasiona el café. Obtenemos nuestros granos directamente de pequeñas fincas familiares en el eje cafetero colombiano, asegurando la más alta calidad y prácticas éticas.',
    imageUrl: 'https://placehold.co/400x250.png',
    address: 'Carrer de Sueca, 45, 46006 Valencia',
    phone: '+34 967 890 123',
    website: 'https://cafedeorigen.es'
  },
  {
    id: '4',
    name: 'Legal Asesores',
    slug: 'legal-asesores',
    category: 'Servicios Legales',
    description: 'Asesoramiento legal experto para colombianos navegando la inmigración española.',
    longDescription: 'Legal Asesores se especializa en derecho de inmigración, ayudando a ciudadanos colombianos con solicitudes de residencia, permisos de trabajo y otros asuntos legales en España. Nuestro equipo entiende los desafíos y está aquí para ayudar.',
    imageUrl: 'https://placehold.co/400x250.png',
    address: 'Calle Larios, 5, 29015 Málaga',
    phone: '+34 951 234 567',
    website: 'https://legalasesores.es'
  },
];

export const latestBlogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'colombian-entrepreneur-success-story',
    title: 'Historia de Éxito: Una Emprendedora Colombiana en Barcelona',
    excerpt: 'Cómo una mujer de Bogotá construyó una próspera startup tecnológica en la vibrante ciudad de Barcelona.',
    content: 'Este es el contenido completo de la publicación del blog...',
    author: 'Admin',
    date: '2024-05-15',
    status: 'Published',
    category: 'Emprendimiento',
    imageUrl: 'https://placehold.co/400x200.png'
  },
  {
    id: '2',
    slug: 'navigating-spanish-residency',
    title: 'Guía para Navegar la Residencia Española para Colombianos',
    excerpt: 'Guía paso a paso sobre el papeleo y el proceso para obtener la residencia legal en España.',
    content: 'Este es el contenido completo de la publicación del blog...',
    author: 'Admin',
    date: '2024-05-10',
    status: 'Published',
    category: 'Trámites',
    imageUrl: 'https://placehold.co/400x200.png'
  },
  {
    id: '3',
    slug: 'top-colombian-restaurants-madrid',
    title: 'Top 5 Restaurantes Colombianos para Visitar en Madrid',
    excerpt: '¿Antojo de un sabor de casa? Aquí están los restaurantes colombianos que no te puedes perder en la capital española.',
    content: 'Este es el contenido completo de la publicación del blog...',
    author: 'Admin',
    date: '2024-05-05',
    status: 'Published',
    category: 'Cultura',
    imageUrl: 'https://placehold.co/400x200.png'
  },
];

export const mockBlogPosts: BlogPost[] = [
    {
        id: '1',
        slug: 'oportunidades-laborales-educacion-colombianos-espana',
        title: 'Oportunidades Laborales y Educación para Colombianos en España: Guía Completa',
        excerpt: 'Guía completa sobre Oportunidades Laborales y Educación para Colombianos en España: Guía completa sobre Oportunidades Laborales y Educación para Colombianos en España',
        content: 'Contenido completo...',
        author: 'Admin',
        date: '28/6/2025',
        status: 'Published',
        category: 'Trabajo y Empleo',
        imageUrl: 'https://images.unsplash.com/photo-1579159334584-c3653194191d'
    },
    {
        id: '2',
        slug: 'diferentes-vias-migracion-legales-colombianos-espana-2025',
        title: 'Diferentes Vías de Migración Legales para Colombianos en España 2025',
        excerpt: 'Guía completa sobre Diferentes Vías de Migración Legales para Colombianos en España 2025 para...',
        content: 'Contenido completo...',
        author: 'Admin',
        date: '27/6/2025',
        status: 'Published',
        category: 'Trámites y Documentación',
        imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad'
    },
    {
        id: '3',
        slug: 'requisitos-actuales-migrar-espana-desde-colombia-2025',
        title: 'Requisitos Actuales para Migrar a España desde Colombia en 2025',
        excerpt: 'Guía completa sobre **Requisitos Actuales para Migrar a España desde Colombia en 2025** para...',
        content: 'Contenido completo...',
        author: 'Admin',
        date: '27/6/2025',
        status: 'Draft',
        category: 'Trámites y Documentación',
        imageUrl: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e'
    },
    {
        id: '4',
        slug: 'diferentes-modalidades-visado',
        title: 'Diferentes Modalidades de Visado',
        excerpt: 'Descripción de las diferentes modalidades de visado para colombianos.',
        content: 'Contenido completo...',
        author: 'Admin',
        date: '26/6/2025',
        status: 'Published',
        category: 'Visados',
        imageUrl: 'https://placehold.co/400x200.png'
    },
    {
        id: '5',
        slug: 'requisitos-procedimientos',
        title: 'Requisitos y Procedimientos para la Homologación de Títulos',
        excerpt: 'Información sobre cómo homologar títulos profesionales en España.',
        content: 'Contenido completo...',
        author: 'Admin',
        date: '25/6/2025',
        status: 'In Review',
        category: 'Educación',
        imageUrl: 'https://placehold.co/400x200.png'
    },
    {
        id: '6',
        slug: 'consejos-integrarte-exito',
        title: 'Consejos Prácticos para Integrarte con Éxito en la Sociedad Española',
        excerpt: 'Consejos culturales y sociales para una fácil adaptación.',
        content: 'Contenido completo...',
        author: 'Admin',
        date: '24/6/2025',
        status: 'Published',
        category: 'Integración',
        imageUrl: 'https://images.unsplash.com/photo-1521783854728-6999b4181a97'
    },
    {
        id: '7',
        slug: 'guia-financiera-para-recien-llegados',
        title: 'Guía Financiera para Recién Llegados',
        excerpt: 'Cómo abrir una cuenta bancaria, manejar impuestos y entender el coste de vida.',
        content: 'Contenido completo...',
        author: 'Admin',
        date: '23/6/2025',
        status: 'Archived',
        category: 'Finanzas',
        imageUrl: 'https://placehold.co/400x200.png'
    }
];

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
        id: 'homologacion-titulo',
        title: 'Homologación de Título',
        description: 'Gestión completa para la validación de tu título profesional en España.',
        price: 350,
        icon: 'FileText',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        id: 'busqueda-vivienda',
        title: 'Búsqueda de Vivienda',
        description: 'Te ayudamos a encontrar el piso o habitación ideal según tus necesidades.',
        price: 400,
        icon: 'Home',
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
        id: 'recogida-aeropuerto',
        title: 'Recogida en Aeropuerto',
        description: 'Te esperamos en el aeropuerto y te llevamos a tu nuevo hogar.',
        price: 120,
        icon: 'Plane',
        buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
        id: 'empadronamiento',
        title: 'Cita de Empadronamiento',
        description: 'Agendamos tu cita y te preparamos para el trámite de empadronamiento.',
        price: 90,
        icon: 'MapPin',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
    },
];
