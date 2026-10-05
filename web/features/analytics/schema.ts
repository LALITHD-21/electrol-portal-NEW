import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  district: z.string().trim().optional(),
  ac: z.string().trim().optional(),
  taluk: z.string().trim().optional(),
  part: z.string().trim().optional(),
});

export const boothTableQuerySchema = z.object({
  district: z.string().trim().optional(),
  ac: z.string().trim().optional(),
  search: z.string().trim().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  sortBy: z.enum(['part_number', 'total', 'male', 'female', 'mobile_pct']).default('part_number'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type AnalyticsQueryParams = z.infer<typeof analyticsQuerySchema>;
export type BoothTableQueryParams = z.infer<typeof boothTableQuerySchema>;
