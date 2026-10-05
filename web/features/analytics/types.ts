export interface DashboardTotals {
  total: number;
  male: number;
  female: number;
  unspecified: number;
}

export interface DashboardHierarchy {
  districts: number;
  ac_names: number;
  taluks: number;
  hoblis: number;
  grama_panchayaths: number;
  villages: number;
  booths: number;
}

export interface CoverageMetric {
  count: number;
  pct: number;
}

export interface DashboardCoverage {
  mobile: CoverageMetric;
  photo: CoverageMetric;
  caste: CoverageMetric;
  occupation: CoverageMetric;
  qualification: CoverageMetric;
}

export interface DashboardDuplicates {
  groups: number;
  rows: number;
}

export interface AgeBracketNode {
  bracket: string;
  total: number;
  male: number;
  female: number;
  unspecified: number;
  pct: number;
}

export interface DistrictStrengthNode {
  district: string;
  total: number;
  male: number;
  female: number;
  pct: number;
}

export interface AcStrengthNode {
  ac_name: string;
  total: number;
  male: number;
  female: number;
  pct: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  pct: number;
}

export interface DashboardStatsResponse {
  totals: DashboardTotals;
  hierarchy: DashboardHierarchy;
  coverage: DashboardCoverage;
  duplicates: DashboardDuplicates;
  age_brackets: AgeBracketNode[];
  district_strength: DistrictStrengthNode[];
  ac_strength: AcStrengthNode[];
  caste_majority?: DistributionItem[];
  occupations: DistributionItem[];
  qualifications: DistributionItem[];
  refreshed_at?: string;
  isFiltered?: boolean;
  durationMs?: number;
}

export interface BoothTableRow {
  part_number: string;
  polling_station_name: string | null;
  polling_address: string | null;
  district: string | null;
  ac_name: string | null;
  total_electors: number;
  male_count: number;
  female_count: number;
  gender_ratio: number;
  mobile_count: number;
  mobile_pct: number;
}

export interface BoothTableResponse {
  booths: BoothTableRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QualityCompleteness {
  serial_number: number;
  epic_number: number;
  name: number;
  relative_name: number;
  address: number;
  age: number;
  sex: number;
  occupation: number;
  qualification: number;
  part_number: number;
  polling_station_name: number;
  whatsapp_mob: number;
  caste: number;
  district: number;
  ac_name: number;
  taluk: number;
  photo_url: number;
}

export interface QualityAnomalies {
  age_under_18: number;
  age_over_110: number;
  age_null: number;
  sex_invalid: number;
  part_missing: number;
  epic_invalid_format: number;
  name_blank: number;
  shared_mobile_10plus: number;
}

export interface QualityDuplicates {
  rule_a_clusters: number;
  rule_a_voters_affected: number;
}

export interface DataQualityReport {
  total_electors: number;
  refreshed_at: string;
  completeness: QualityCompleteness;
  anomalies: QualityAnomalies;
  duplicates: QualityDuplicates;
}

export interface CompareResponse {
  type: 'district' | 'ac';
  itemA: {
    name: string;
    stats: DashboardStatsResponse;
  };
  itemB: {
    name: string;
    stats: DashboardStatsResponse;
  };
}

export interface LiveActivityBucket {
  t: string;
  count: number;
}

export interface LiveDataResponse {
  version: string;
  total: number;
  snapshotAt: string | null;
  addedLastWindow: number;
  windowMinutes: number;
  activityCapped: boolean;
  buckets: LiveActivityBucket[];
  selfHealed: boolean;
  serverTime: string;
}

