export interface Rule {
  id: number;
  scoring_criteria_id: number;
  operator: string;
  min_value: number;
  max_value: number;
  score: number;
  description: string;
  created_at: string;
  updated_at: string;
  scoring_category: string;
  scoring_parameter: string;
}