export interface VidiotronCommandDetailDto {
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

export interface VidioTronCommandDto {
  code: string;
  command_name: string;
  description: string;
  detail: VidiotronCommandDetailDto[];
}