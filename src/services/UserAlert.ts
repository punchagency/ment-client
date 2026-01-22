export interface UserAlert {
  id: number;
  file_association_id: number;
  file_name: string;
  symbol_interval: string;
  field_name: string;
  condition_type: string;
  compare_value: string;
  last_value: string | null;
  is_active: boolean;
}
