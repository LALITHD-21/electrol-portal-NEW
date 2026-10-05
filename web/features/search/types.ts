import { Elector } from '@/lib/types';

export type SearchQueryType = 'epic' | 'mobile' | 'name' | 'filter' | 'fuzzy' | 'booth';

export interface SearchResultRow {
  id: number;
  serial_number: number | null;
  epic_number: string;
  name: string;
  relative_name: string | null;
  age: number | null;
  sex: 'M' | 'F' | null;
  whatsapp_mob: string | null;
  district: string | null;
  ac_name: string | null;
  taluk: string | null;
  village: string | null;
  part_number: string | null;
  polling_station_name: string | null;
  address: string | null;
  isFuzzyMatch?: boolean;
}

export interface BoothHeaderInfo {
  part_number: string;
  polling_station_name: string | null;
  polling_address: string | null;
  totalElectors?: number;
}

export interface SearchApiResponse {
  rows: SearchResultRow[];
  total: number;
  page: number;
  pageSize: number;
  queryType: SearchQueryType;
  durationMs: number;
  boothInfo?: BoothHeaderInfo | null;
}

export interface SearchFacets {
  districts: string[];
  acs: string[];
  parts: string[];
  districtAcs?: Record<string, string[]>;
}

export interface SearchFiltersState {
  district?: string;
  ac?: string;
  part?: string;
  village?: string;
  fuzzy?: boolean;
}
