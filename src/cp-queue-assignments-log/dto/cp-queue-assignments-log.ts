export interface AssignmentLogCreate {
  assignments_id: number;
  truck_id: number;
  nomorlambung: string;
  flag: string;
  entrance_by?: string;
  exit_by?: string;
  cp_id?: number;
}