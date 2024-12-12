export interface CustomerType {
  id: string;
  name: string;
  phone: string;
  remark?: string;
  preference?: string;
  updateTime: string;
}

export interface AddUserRequest {
  favorite: string;
  mobile: string;
  name: string;
  remark: string;
}

export interface UserResponse {
  data: {
    favorite: string;
    mobile: string;
    name: string;
    remark: string;
    updateTime: number;
    updater: string;
    userId: number;
  };
  success: boolean;
  displayMsg?: string;
}

export interface PageUserRequest {
  currentPage: number;
  pageSize: number;
  filters: {
    mobile?: string;
    name?: string;
  };
}

export interface PageUserResponse {
  data: {
    total: number;
    totalPage: number;
    items: {
      id: number;
      name: string;
      mobile: string;
      remark: string;
      favorite: string;
      creator: string;
      updater: string;
      updateTime: number;
      createTime: number;
    }[];
  };
  success: boolean;
  displayMsg?: string;
}

export interface UpdateUserRequest {
  favorite: string;
  id: number;
  mobile: string;
  name: string;
  remark: string;
}