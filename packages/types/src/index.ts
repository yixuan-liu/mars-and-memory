import { z } from "zod";

// ==========================================
// Zod Schemas — single source of truth for runtime validation
// and compile-time type inference
// ==========================================

export const ExhibitDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  detailText: z.string().optional(),
  imageSrc: z.string(),
});
export type ExhibitData = z.infer<typeof ExhibitDataSchema>;

export const RelatedThemeSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  thumbnail: z.string(),
  url: z.string(),
});
export type RelatedTheme = z.infer<typeof RelatedThemeSchema>;

export const RelatedStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  thumbnail: z.string(),
  type: z.string(),
  url: z.string(),
});
export type RelatedStory = z.infer<typeof RelatedStorySchema>;

export const RelatedContentSchema = z.object({
  theme: RelatedThemeSchema,
  partner: z.string(),
  stories: z.array(RelatedStorySchema),
});
export type RelatedContent = z.infer<typeof RelatedContentSchema>;

export const CollectionCarouselItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  era: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  color: z.string().optional(),
});
export type CollectionCarouselItem = z.infer<typeof CollectionCarouselItemSchema>;

export const CarouselItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageSrc: z.string(),
});
export type CarouselItem = z.infer<typeof CarouselItemSchema>;
