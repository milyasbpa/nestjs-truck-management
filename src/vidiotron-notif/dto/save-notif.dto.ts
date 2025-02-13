export interface SaveNotifDto {
  cpId?: number;
  laneId?: number;
  status?: boolean;
  header?: string;
  body?: string;
  total?: string;
  typeTruck?: string;
  type?: string;
  command?: any;
  vidiotron_id: number;
}