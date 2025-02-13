export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  NOT_ACTIVE = 'NOT ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum TypeOfRoadEnum {
  TOLL = 'TOLL',
  NON_TOLL = 'NON TOLL',
  OTHERS = 'OTHERS',
}

export enum TypeOfPortEnum {
  SEA = 'SEA',
  RIVER = 'RIVER',
  LAKE = 'LAKE',
}
export enum TruckStatusEnum {
  ACTIVE = 'ACTIVE',
  NOT_ACTIVE = 'NOT ACTIVE',
}
export enum QueueStatusEnum {
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  ASSIGNED_TO_CP = 'ASSIGNED_TO_CP',
  // ASSIGNED_TO_CP_QUEUE = 'ASSIGNED_TO_CP_QUEUE',
  ARRIVED = 'ARRIVED',
}
export enum TrackingStatusEnum {
  NOT_STARTED = 'NOT STARTED',
  ON_GOING = 'ON GOING',
  COMPLETED = 'COMPLETED',
}
export enum ActivityStatusEnum {
  IDLE = 'IDLE',
  ENROUTE = 'ENROUTE',
  REROUTED = 'REROUTED',
  COMPLETED = 'COMPLETED',
}
export enum TrafficStatusEnum {
  CLEAR = 'CLEAR',
  MODERATE = 'MODERATE',
  HEAVY = 'HEAVY',
}

export enum TypeOfTruckEnum {
  'Dump Truck' = 'DT',
  'Double Dumpt Truck' = 'DDT',
  'Side Dumpt Truck' = 'SDT',
}

export enum TypeofDrivingLicenseEnum {
  SIM_B1 = 'SIM-B1',
  SIM_B2 = 'SIM-B2',
  OTHERS = 'OTHERS',
}

export enum TypeOfDeviceEnum {
  RFID = 'RFID',
  CCTV = 'CCTV',
}

export enum TypeOfRFIDSubmitionEnum {
  ONPROCESS = 'On Process',
  COMPLETED = 'Completed',
}

export enum KafkaServiceTypeEnum {
  TOPIC = 'assign-truck',
}

export enum PriorityUpdateStatusCPEnum {
  ADMIN = 'ADMIN',
  API = 'API',
}

export enum UpdatePositioningEnum {
  UPDATE = 'UPDATE',
  CREATE = 'CREATE',
  DELETE = 'DELETE',
}
export enum TokenUscavisEnum {
  TOKEN = 'EE2YLXDPiY5BMZ5tPhZJy5ZSwB130XNs',
}

export enum VidiotronTypeEnum {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
}
export enum WebSocketAntrianCp {
  LANETOCP = 'LANE TO CP',
  LANETOLANE = 'LANE TO LANE',
  CPTOLANE = 'CP TO LANE',
  CPTOCP = 'CP TO CP',
  COMPLETED = 'COMPLETED',
}

export enum entranceTypeEnum {
  RFID = 'RFID',
  GEOFENCE = 'GEOFENCE',
}
export enum exitTypeEnum {
  RFID = 'RFID',
  GEOFENCE = 'GEOFENCE',
  UCAN = 'UCAN',
}
