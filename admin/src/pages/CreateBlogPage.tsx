import { BlogForm, type BlogFormValues } from "../components/admin/BlogForm";

const initial: BlogFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  artistName: "",
  tourName: "",
  genre: "Rock",
  tourYear: String(new Date().getFullYear()),
  tourStartDate: "",
  tourEndDate: "",
  featuredImage: "",
  additionalImages: [],
  supportingArtists: [],
  previousTour: "",
  albums: [],
  tourCities: [],
  content: "",
  widgetEnabled: false,
  widgetCode: "",
  scheduleArtistQuery: "",
  scheduleEndDate: "",
  scheduleAffiliateUrl: "",
  schedulePerPage: 24,
  metaTitle: "",
  metaDescription: "",
  seoKeywords: "",
  status: "DRAFT",
  featured: false,
  publishedAt: "",
};

export function CreateBlogPage() {
  return <BlogForm mode="create" initial={initial} />;
}
