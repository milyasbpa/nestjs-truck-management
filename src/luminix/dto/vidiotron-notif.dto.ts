export interface VidiotronNotifDto {
  header: string;
  body_description: string;
  total_description: string;
  type_truck_description: string;
  lane_id: number;
  cp_id: number;
  notif_type: string;
  command: any;
  status: boolean;
  vidiotron_id: number;
  is_dynamic: boolean;
}