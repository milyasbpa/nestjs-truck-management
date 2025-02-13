export interface DeviceSBDataPayload {
  data: DeviceSBData[];
}

export interface DeviceSBData {
  id: number;//truck_id
  device_id: number;//gps
  vendor_id: number;
  name: string;
  driver_name: string;
  tipe_truck: string;
  contractor: string;
  lat: number;
  lng: number;
  geofence: string;
  status: string;
  speed: number;
  course: number;
  gps_time: string;
}
