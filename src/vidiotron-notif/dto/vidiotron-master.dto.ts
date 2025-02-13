export interface CreateVidiotronCP {
  cp_id: string;
  code: string;
  description: string;
  ip: string;
  status: boolean;
  is_dynamic: boolean;
  is_show_ads: boolean;
  ads_command?: vidiotron_command[],
}

export interface CreateVidiotronLane {
  lane_id: string;
  code: string;
  description: string;
  ip: string;
  status: boolean;
  is_dynamic: boolean;
  is_show_ads: boolean;
  ads_command?: vidiotron_command[],
}
export interface UpdateStatusVidiotronLane {
  is_dynamic: boolean;
}
export interface UpdateCountingVidiotronLane {
  count_geofence: boolean;
}
export interface UpdateVidiotronStaticLane {
  max_value: number;
  queue_lane_id: queue_lane_rules_vidiotron[];
}

interface queue_lane_rules_vidiotron {
  lane_id: string;
}

interface vidiotron_command {
  line_id: number;
  tipe: string;
  text: string;
  pos_x: number;
  pos_y: number;
  absolute: boolean;
  align: string;
  size: number;
  color: string;
  speed: number;
  image: string;
  padding: number;
  line_height: number;
  width: number;
  font: number;
  style: string;
}