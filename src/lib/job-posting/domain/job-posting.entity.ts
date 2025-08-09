
export interface JobPosting {
  id: string;
  title: string;
  description: string; // Descripción detallada en Markdown
  companyName: string;
  companyLogoUrl?: string; // URL del logo de la empresa
  imageUrl?: string; // URL de una imagen atractiva para la oferta

  // Detalles de la ubicación
  location: string; // E.g., "Madrid, España"
  city: string; // E.g., "Madrid"
  locationType: 'ON_SITE' | 'REMOTE' | 'HYBRID';

  // Detalles del salario
  salaryRange?: {
    min: number;
    max: number;
    currency: 'EUR';
  };

  // Detalles del contrato y aplicación
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  applicationUrl?: string; // Enlace para aplicar
  applicationEmail?: string; // Email para aplicar
  applicationDeadline?: string;
  requiredSkills?: string[]; // E.g., ['React', 'Node.js', 'TypeScript']

  // Metadatos de la publicación
  creatorId: string; // Can be a UID or a guest identifier like an email
  creatorRole: 'admin' | 'advertiser' | 'guest';
  status: 'ACTIVE' | 'INACTIVE' | 'FILLED' | 'PENDING_REVIEW'; // Estado de la oferta
  createdAt: Date;
  updatedAt: Date;
}
