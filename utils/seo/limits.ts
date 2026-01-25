export const SEO_LIMITS = {
  metaTitle: {
    recommendedMin: 50,
    recommendedMax: 60,
    hardMax: 60,
  },
  metaDescription: {
    recommendedMin: 140,
    recommendedMax: 160,
    hardMax: 160,
  },
  urlSlug: {
    hardMax: 75,
  },
} as const;

export type SeoLimits = typeof SEO_LIMITS;


