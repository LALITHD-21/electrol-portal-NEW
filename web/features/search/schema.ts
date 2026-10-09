import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  mobile: z.string().trim().regex(/^\d{0,15}$/, 'Invalid mobile digits').optional().default(''),
  part: z.string().trim().optional().default(''),
  ac: z.string().trim().optional().default(''),
  district: z.string().trim().optional().default(''),
  taluk: z.string().trim().optional().default(''),
  village: z.string().trim().optional().default(''),
  fuzzy: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.coerce.number().int().min(1).max(50, 'Maximum page size is 50').default(20),
});

export type SearchQueryParams = z.infer<typeof searchQuerySchema>;
