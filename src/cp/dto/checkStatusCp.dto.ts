export interface checkStatusDevicesCp {
  device_id: string;
  item_id: string;
}
export interface insertDeviceAndItemsCp {
  device_id: string;
  item_id: string;
  device_name: string;
  item_name: string;
  status: number;
}

export interface reorderingPosition {
  position: number;
}
export interface createLogCp {
  cp_id: number;
  status: boolean;
  reason: string;
  updated_by: string;
}

export interface dtoListLogCp {
  page?: number;
  limit?: number;
}

export interface CreateLogDevice {
  device_id: string;
  item_id: string;
  item_name: string;
  device_name: string;
  updated_by: string;
  status: number;
  connection: boolean;
}
export interface CreateLogTonages {
  device_id: string;
  item_id: string;
  item_name: string;
  device_name: string;
  updated_by: string;
  value: number;
  connection: boolean;
}
export interface ConnectionDeviceFailDTO {
  device_id: string;
  item_id: string;
  item_name: string;
  device_name: string;
  updated_by: string;
  status_device: number;
  status_cp: boolean;
  reason: string;
  connection: boolean;
  cp_id: number;
  id_device: number;
}

export interface UpdateAllPriorityCpDTO {
  priority: string;
}
