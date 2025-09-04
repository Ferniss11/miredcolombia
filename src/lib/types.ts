

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';


// Schema for Blog Content Generation
export const GenerateBlogContentInputSchema = z.object({
  title: z.string().describe('The title of the blog post.'),
});
export type GenerateBlogContentInput = z.infer<typeof GenerateBlogContentInputSchema>;

export const GenerateBlogContentOutputSchema = z.object({
  content: z.string().describe('The generated blog content.'),
});
export type GenerateBlogContentOutput = z.infer<typeof GenerateBlogContentOutputSchema>;


// Schema for Blog Ideas Generation
export const GenerateBlogIdeasInputSchema = z.object({
  communityDescription: z
    .string()
    .describe('A description of the community the blog is for.'),
  keywords: z.string().describe('Keywords related to the community.'),
  numIdeas: z
    .number()
    .min(1)
    .max(10)
    .default(3)
    .describe('The number of blog ideas to generate.'),
});
export type GenerateBlogIdeasInput = z.infer<typeof GenerateBlogIdeasInputSchema>;

export const GenerateBlogIdeasOutputSchema = z.object({
  ideas: z.array(z.string()).describe('A list of blog content ideas.'),
});
export type GenerateBlogIdeasOutput = z.infer<typeof GenerateBlogIdeasOutputSchema>;


// Schema for Blog Title Generation
export const GenerateBlogTitleInputSchema = z.object({
  topic: z
    .string()
    .describe('The topic or short description of the blog post.'),
});
export type GenerateBlogTitleInput = z.infer<typeof GenerateBlogTitleInputSchema>;

export const GenerateBlogTitleOutputSchema = z.object({
  title: z.string().describe('The generated blog title.'),
});
export type GenerateBlogTitleOutput = z.infer<typeof GenerateBlogTitleOutputSchema>;


// Generic schema for Article Generation Input (used by all article generators)
export const GenerateArticleInputSchema = z.object({
  topic: z.string().describe('The core topic of the blog post.'),
  category: z.string().describe('The category of the blog post (e.g., Legal, Culture).'),
  tone: z.string().describe('The desired tone of voice (e.g., Professional, Friendly).'),
  length: z.string().describe('The desired length of the article (e.g., Short, Medium, Long).'),
  model: z.string().describe('The AI model to use for generation (e.g., googleai/gemini-1.5-pro-latest).'),
});
export type GenerateArticleInput = z.infer<typeof GenerateArticleInputSchema>;

// Output for Simple/Factual/Creative articles
export const SimpleArticleOutputSchema = z.object({
  title: z.string().describe('The generated, SEO-friendly blog title.'),
  content: z.string().describe('The full generated blog content, in Markdown format.'),
});
export type SimpleArticleOutput = z.infer<typeof SimpleArticleOutputSchema>;


// Schema for Intelligent Article Generation (more complex output)
const ArticleSectionSchema = z.object({
    heading: z.string().describe("A clear and concise heading for this section of the article."),
    content: z.string().describe("The detailed content for this section, written in Markdown format."),
    imageUrl: z.string().optional().describe("The final, full URL for an image from Unsplash for this section."),
    imageHint: z.string().optional().describe("A 2-3 word hint for the image's content, used for alt text and future searches.")
});

export const IntelligentArticleOutputSchema = z.object({
  title: z.string().describe('The generated, SEO-friendly blog title.'),
  introduction: z.string().describe("An engaging introductory paragraph for the article."),
  featuredImageUrl: z.string().optional().describe("The final, full URL for the main hero/featured image of the article."),
  featuredImageHint: z.string().describe("A 2-3 word hint for the featured image's content."),
  sections: z.array(ArticleSectionSchema).describe("An array of content sections that make up the body of the article."),
  conclusion: z.string().describe("A concluding paragraph that summarizes the article."),
  suggestedTags: z.array(z.string()).describe("A list of 3-5 relevant tags or keywords for the blog post."),
});
export type IntelligentArticle = z.infer<typeof IntelligentArticleOutputSchema>;


// --- Email Sequence Schemas ---

const SequenceTriggerSchema = z.enum(['on_guide_download', 'on_user_signup', 'on_service_purchase']);

export const GenerateEmailSequenceInputSchema = z.object({
  objective: z.string().describe('The main goal of the email sequence (e.g., "Welcome sequence for new users who downloaded the empadronamiento guide").'),
  numSteps: z.coerce.number().int().min(1, "Debe ser al menos 1").max(7, "No puede exceder 7"),
  tone: z.enum(['Amigable', 'Formal', 'Persuasivo', 'Informativo']).describe('The desired tone of voice for the emails.'),
  additionalInfo: z.string().optional().describe('Any other key information or context to include in the emails (e.g., "Mention a 10% discount on our services in the last email").'),
  model: z.string().optional().describe("The AI model to use for generation.").default('googleai/gemini-1.5-pro-latest'),
});
export type GenerateEmailSequenceInput = z.infer<typeof GenerateEmailSequenceInputSchema>;


const EmailStepOutputSchema = z.object({
  id: z.string().default(() => uuidv4()).describe("A unique UUID for this step."),
  delayMinutes: z.coerce.number().describe('The delay in minutes from the previous step. The first step\'s delay is from the initial trigger.'),
  subject: z.string().describe('The subject line for this email.'),
  body: z.string().describe('The full HTML content of the email. Use standard HTML tags like <p>, <strong>, <a>. Use {{firstName}} for personalization.'),
});

export const GenerateEmailSequenceOutputSchema = z.object({
  name: z.string().describe('A descriptive internal name for the sequence.'),
  trigger: SequenceTriggerSchema.describe('The trigger event that should start this sequence.'),
  steps: z.array(EmailStepOutputSchema).describe('The array of email steps in the sequence.'),
  isActive: z.boolean().default(true),
});
export type GenerateEmailSequenceOutput = z.infer<typeof GenerateEmailSequenceOutputSchema>;



// --- General Application Types ---

export type UserRole = 'Guest' | 'Advertiser' | 'Admin' | 'User' | 'SAdmin';

// BusinessAgentConfig is now in chat-types.ts
export type { BusinessAgentConfig } from './chat-types';


export type BusinessProfile = {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  category?: string;
  placeId?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'unclaimed';
  isAgentEnabled?: boolean;
  googleCalendarConnected?: boolean;
  gcalTokens?: GoogleTokens;
  agentConfig?: import('./chat-types').BusinessAgentConfig; // Use import() for type-only imports across modules
};

// --- Candidate Profile Schemas ---
const zStringOrFileList = z.custom<string | FileList>((data) => {
    return typeof data === 'string' || data instanceof FileList;
});

export const CandidateProfileSchema = z.object({
    professionalTitle: z.string().optional(),
    summary: z.string().optional(),
    skills: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          return val.split(',').map(s => s.trim()).filter(Boolean);
        }
        return val;
      },
      z.array(z.string()).optional()
    ),
    resumeFile: z.custom<FileList>().optional(),
});
export type CandidateProfileFormValues = z.infer<typeof CandidateProfileSchema>;


export type CandidateProfile = {
  professionalTitle?: string;
  summary?: string;
  skills?: string[];
  resumeUrl?: string; // URL al PDF en Firebase Storage
  experience?: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }>;
};

export type UserProfile = {
  uid: string; // Document ID should match auth UID
  name: string | null;
  email: string | null;
  role: UserRole;
  status: 'active' | 'deleted';
  valeriaProfile?: {
    planId: 'valeria_premium' | 'valeria_pro' | 'free',
    planExpiresAt?: Date | null,
  };
  businessProfile?: BusinessProfile;
  candidateProfile?: CandidateProfile;
};

// Re-exporting from the new canonical location in the blog domain
export type { BlogPost } from './blog/domain/blog-post.entity';


export type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  features: string[];
  cta: string;
};

export type MigrationPackage = {
    id:string;
    name: string;
    title: string;
    price: number;
    priceCOP?: string;
    description: string;
    features: string[];
    color: string;
    textColor: string;
    popular?: boolean;
}

export type MigrationService = {
    id: string;
    icon: string;
    title: string;
    name: string;
    price: number;
    priceCol: string;
    description: string;
    borderColor: string;
    buttonColor: string;
}

export type ValeriaPlan = {
    id: string;
    name: string;
    price: number | string;
    priceDetails: string;
    features: string[];
    cta: string;
    variant: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export type Customer = {
  id?: string;
  userId?: string | null; // Link to auth user if they are registered
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  wantsWhatsAppContact: boolean;
  comments?: string;
  createdAt: any; // Firestore Timestamp
};

export type Order = {
  id?: string;
  userId: string | null; // Still useful to link to a registered user who is logged in
  customerId: string;
  itemId: string;
  itemName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: any; // Firestore Timestamp
  stripePaymentIntentId: string;
}

export type PurchaseableItem = (MigrationPackage | MigrationService) & { type: 'package' | 'service' };

// Directory / Places types
export type Photo = {
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
    url: string;
};

export type Review = {
    author_name: string;
    profile_photo_url: string;
    rating: number;
    relative_time_description: string;
    text: string;
};

// This type is a legacy type for client-side rendering.
// The canonical source of truth is now the Business entity.
export type PlaceDetails = {
  id?: string; // The Google Place ID
  displayName: string;
  formattedAddress: string;
  internationalPhoneNumber?: string;
  formattedPhoneNumber?: string;
  website?: string;
  url?: string;
  category: string; // The category assigned in *our* system
  city: string; // The city of the business
  subscriptionTier?: string; // e.g., 'Gratuito', 'Premium'
  ownerUid?: string | null; // UID of the advertiser user who owns this
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'unclaimed';
  isAgentEnabled?: boolean; // For the business-specific agent
  photoUrl?: string; // For the list view
  photos?: Photo[]; // For the detail view
  rating?: number;
  userRatingsTotal?: number;
  openingHours?: string[];
  isOpenNow?: boolean;
  reviews?: Review[];
  geometry?: {
      location: {
          lat: number;
          lng: number;
      }
  };
  cachedAt?: string; // ISO string for when the data was cached
};

// Google Calendar
export type GoogleTokens = {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type: string;
    expiry_date: number;
};

// Platform Economics
export type PlatformConfig = {
    profitMarginPercentage: number;
};

export type PlatformCosts = {
    totalCost: number;
    chatCost: number;
    contentCost: number;
};


// Business Analytics
export type BusinessAnalytics = {
    totalFinalCost: number;
    totalConversations: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    profitMargin: number;
};

// Job Posting related types
export interface JobPosting {
  id: string;
  title: string;
  description: string;
  companyName: string;
  companyLogoUrl?: string;
  imageUrl?: string;
  location: string;
  locationType: 'ON_SITE' | 'REMOTE' | 'HYBRID';
  salaryRange?: {
    min: number;
    max: number;
    currency: 'EUR';
  };
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  applicationUrl?: string;
  applicationEmail?: string;
  applicationDeadline?: string;
  requiredSkills?: string[];
  creatorId: string;
  creatorRole: 'admin' | 'advertiser' | 'guest';
  status: 'ACTIVE' | 'INACTIVE' | 'FILLED' | 'PENDING_REVIEW';
  createdAt: string; // Storing as ISO string for client-side compatibility
  updatedAt: string; // Storing as ISO string
}

export const JobPostingFormSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  companyName: z.string().min(1, "El nombre de la empresa es requerido."),
  location: z.string().min(1, "La ubicación es requerida."),
  locationType: z.enum(['ON_SITE', 'REMOTE', 'HYBRID'], {
    errorMap: () => ({ message: "Tipo de ubicación inválido." }),
  }),
  salaryRangeMin: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "El salario mínimo no puede ser negativo.").optional()
  ),
  salaryRangeMax: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "El salario máximo no puede ser negativo.").optional()
  ),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT' | 'INTERNSHIP'], {
    errorMap: () => ({ message: "Tipo de empleo inválido." }),
  }),
  applicationUrl: z.string().url("URL de aplicación inválida.").optional().or(z.literal('')),
  applicationEmail: z.string().email("Email de aplicación inválido.").optional().or(z.literal('')),
  applicationDeadline: z.string().optional().or(z.literal('')), // Will be a string from date picker
  requiredSkills: z.array(z.string()).optional(), // Comma separated string to array
  status: z.enum(['ACTIVE', 'INACTIVE', 'FILLED', 'PENDING_REVIEW'], {
    errorMap: () => ({ message: "Estado inválido." }),
  }).default('ACTIVE'),
});

export type JobPostingFormValues = z.infer<typeof JobPostingFormSchema>;

export type ChatSession = import('./chat-types').ChatSession;
export type ChatMessage = import('./chat-types').ChatMessage;
export type Business = import('./directory/domain/business.entity').Business;
export type ServiceListing = import('./service-listing/domain/service-listing.entity').ServiceListing;
export type AgentConfig = import('./chat-types').AgentConfig;
export type JobsCtaSectionProps = { jobs: JobPosting[]; };
