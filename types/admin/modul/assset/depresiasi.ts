export interface AssetDepresiasi {
  id: number;
  asset_category_id: number;
  asset_location_id: number;
  pic_id: number;
  code: string;
  name: string;
  description: string;
  acquired_at: string;
  acquired_value: number;
  depreciation_method: string;
  useful_life_years: number;
  salvage_value: number;
  depreciation_total: number;
  current_value: number;
  condition: string;
  status: boolean | number;
  created_at: string;
  updated_at: string;
  pic_name: string;
  asset_category_code: string;
  asset_category_name: string;
  asset_location_code: string;
  asset_location_name: string;
}
