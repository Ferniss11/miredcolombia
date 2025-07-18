

import { z } from 'zod';

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


export type UserRole = 'Guest' | 'Advertiser' | 'Admin' | 'User';

export const BusinessAgentConfigSchema = z.object({
  model: z.string().default('googleai/gemini-1.5-flash-latest'),
  systemPrompt: z.string().default('Eres un asistente amigable para mi negocio.'),
});
export type BusinessAgentConfig = z.infer<typeof BusinessAgentConfigSchema>;


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
  agentConfig?: BusinessAgentConfig;
};

export type UserProfile = {
  uid: string; // Document ID should match auth UID
  name: string | null;
  email: string | null;
  role: UserRole;
  businessProfile?: BusinessProfile;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  address: string;
  phone: string;
  website: string;
};

// Represents a blog post stored in the database
export interface BlogPost {
  id: string; // Firestore document ID
  slug: string;
  title: string;
  author: string;
  authorId: string;
  date: string; // Should be ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: 'Published' | 'Draft' | 'In Review' | 'Archived';
  category: string;
  
  // Rich content from AI
  introduction: string;
  conclusion: string;
  sections: Array<{
    heading: string;
    content: string;
    imageUrl?: string;
    imageHint?: string;
  }>;
  featuredImageUrl?: string;
  featuredImageHint?: string;
  suggestedTags: string[];
  generationCost?: number; // Cost in EUR for generating this post

  // Optional placeholder fields for simpler posts
  excerpt?: string;
  content?: string;
  imageUrl?: string;
}

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
    priceCOP: string;
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

export type PlaceDetails = {
  id?: string; // The Google Place ID
  displayName: string;
  formattedAddress: string;
  internationalPhoneNumber?: string;
  formattedPhoneNumber?: string;
  website?: string;
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


// Chat Types Re-centralization
export const ChatRoleSchema = z.enum(['user', 'model', 'admin']);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export type ChatMessage = {
  id: string;
  text: string;
  role: ChatRole;
  timestamp: string; // ISO string
  authorName?: string;
  replyTo: {
    messageId: string;
    text: string;
    author: string;
  } | null;
};

export type ChatSession = {
  id: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  createdAt: string; // ISO string
};

export type ChatSessionWithTokens = ChatSession & {
    messageCount: number;
    totalTokens: number;
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
};
