export interface FamousApiDto {
  token?: string;
  user?: {
    id?: number;
    type_id?: number;
    member_id?: number;
    contractor_id?: number;
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    avatar?: string;
    last_login?: string;
    reset_code?: string;
    last_activity?: string;
    expired_date?: string;
    status?: number;
    is_first?: number;
    user_type: {
      id?: number;
      name?: string;
      alias?: string;
    };
    member: {
      id?: number;
      fullname?: string;
      code?: string;
    };
    permission?: string[];
    menus?: string[];
  };
  settings?: settings[];
}

export interface settings {
  id?: number;
  whitelist_location?: number;
  time_limited_valid_to_invalid?: number;
  disconnect_delay?: number;
  download_evidence?: string;
  restrict_intercom?: string;
}

export interface FamousLogin {
  email?: string;
  password?: string;
}
