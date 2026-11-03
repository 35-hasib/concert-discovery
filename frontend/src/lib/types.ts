export type SocialLinks = {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
};

export type SiteSettings = {
  websiteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  description: string;
  contactEmail: string;
  socialLinks: SocialLinks;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
};

export type BlogStatus = "DRAFT" | "PUBLISHED";
export type SortOption = "newest" | "oldest";

export type TourAlbum = {
  title: string;
  year: string;
  cover: string;
  description: string;
  tracks: string[];
};

export type ScheduleSummary = {
  concertsRemaining: number;
  totalConcerts: number;
  nextConcert: {
    city: string;
    date: string;
    venue: string;
  } | null;
  source: "widget" | "tour" | "none";
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  artistName: string;
  tourName: string;
  genre: string;
  tourStartDate: string | null;
  tourEndDate: string | null;
  featuredImage: string;
  additionalImages: string[];
  supportingArtists: string[];
  previousTour: string;
  albums: TourAlbum[];
  tourCities: string[];
  content: string;
  widgetEnabled: boolean;
  widgetCode: string;
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  status: BlogStatus;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingTime: number;
  scheduleSummary: ScheduleSummary;
};

export type BlogListResult = {
  items: Blog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BlogDetailResult = {
  blog: Blog;
  related: Blog[];
  moreByArtist: Blog[];
};

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};
