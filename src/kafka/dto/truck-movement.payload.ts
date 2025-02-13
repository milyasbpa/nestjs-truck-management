export interface TruckMovementPayload {
  data: TruckMovementData[],
}

export interface TruckMovementData {
  id: number,
  name: string,
  contractor: string,
  lat: number,
  lng: number,
  geofence: string,
  status: string,
  speed: number,
  course: number,
  gps_time: string,
}