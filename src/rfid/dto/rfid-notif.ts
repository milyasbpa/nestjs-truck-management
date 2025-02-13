export interface RfidNotifIn {
  no_lambung?: string;
  driver_name?: string;
  device_id?: string;
  rfid_tag?: string;
  is_valid?: boolean;
  date?: string;
  photo_url?: string;
}

export interface RfidNotifOut {
  no_lambung?: string;
  device_id?: string;
  is_valid?: boolean;
  rfid_tag?: string;
  date?: string;
  photo_url?: string;
}


export interface DtCountLocationDTO {

}

export interface RfidCpQueueDTO {
  lane_id?: number;
  date?: Date;
  no_lambung?: string;
  device_id?: string;
  status?: string;
  is_valid?: boolean;
  rfid_tag?: string;  
}

export interface RfidCheckTruckOutIn {
  nomor_lambung?: string,
  date_truck?: string
}

export interface listRfidTransactionDTO {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  nomor_lambung?: string;
  rfid_code_in?: string;
  rfid_code_out?: string;
  truck_in_date?: string;
  truck_out_date?: string;
  location_in?: string;
  location_out?: string;
  status?: string;
}

export interface listAnomalyDTO {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}

export interface removeAnomaliesDTO {
  id: Array<number>;
}

export interface archiveDataDTO {
}

export interface detailRfidTransactionDTO {
  id: number;
}

export interface removeListTransactionWithouRfidOutDTO {
  
}

export interface rfidUpdateAnomalyQueryDTO {
  id: number;
}

export interface rfidAnomalyDTO {
  desc?: string;
  type_anomaly?: string;
  rfid_transaction_id?: number;

}

export interface updateThresholdDTO {
  min_threshold_hours: number;
  max_threshold_hours: number;
}

export interface getThresholdDTO {
  page: number;
  size: number;
}