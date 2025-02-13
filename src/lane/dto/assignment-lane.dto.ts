export interface AssignmentLaneDto {
  lane_id: number;
  lane_code: string;
  status: boolean;
  nomor_lambung: string;
  vendor: string;
}

export interface AssignmentCPDto {
  queue_id: number;
  queue_name: string;
  status: boolean;
  nomor_lambung: string;
  vendor: string;
}

export interface TruckOnLaneToCPQueueResponseDTO {
  lane_id: string;
  lane_code: string;
  status: boolean;
  maxCapacity: number;
  totalQueue: number;
  trucks: TruckOnCPQueueDTO[]
}

export interface TruckOnCPQueueResponseDTO {
  queue_id: string;
  queue_name: string;
  status: boolean;
  maxCapacity: number;
  totalQueue: number;
  trucks: TruckOnCPQueueDTO[]
}

export interface TruckOnCPQueueDTO {
  nomor_lambung: string;
  vendor: string;
}