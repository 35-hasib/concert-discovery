import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_TAGLINE,
} from "../constants.js";
import { prisma } from "../prisma.js";
import { serializeSettings } from "../utils.js";

export const FALLBACK_SETTINGS = {
  websiteName: DEFAULT_SITE_NAME,
  tagline: DEFAULT_TAGLINE,
  logo: "",
  favicon: "",
  description: DEFAULT_DESCRIPTION,
  contactEmail: "",
  socialLinks: {},
  defaultSeoTitle: `${DEFAULT_SITE_NAME} - ${DEFAULT_TAGLINE}`,
  defaultSeoDescription: DEFAULT_DESCRIPTION,
};

export async function getSettings() {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!setting) return FALLBACK_SETTINGS;
  const value = serializeSettings(setting);
  return {
    websiteName: value.websiteName || FALLBACK_SETTINGS.websiteName,
    tagline: value.tagline || FALLBACK_SETTINGS.tagline,
    logo: value.logo,
    favicon: value.favicon,
    description: value.description || FALLBACK_SETTINGS.description,
    contactEmail: value.contactEmail,
    socialLinks: value.socialLinks,
    defaultSeoTitle: value.defaultSeoTitle || FALLBACK_SETTINGS.defaultSeoTitle,
    defaultSeoDescription:
      value.defaultSeoDescription || FALLBACK_SETTINGS.defaultSeoDescription,
  };
}
