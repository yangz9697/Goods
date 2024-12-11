export interface ObjectDetailRequest {
  amountForBox: number;
  jinForBox: number;
  objectDetailName: string;
  tenant?: string;
}

export interface UpdateTime {
  date: number;
  day: number;
  hours: number;
  minutes: number;
  month: number;
  nanos: number;
  seconds: number;
  time: number;
  timezoneOffset: number;
  year: number;
}

export interface ObjectDetailResponse {
  data: {
    amount: number;
    amountForBox: number;
    box: number;
    jin: number;
    jinForBox: number;
    objectDetailId: number;
    objectDetailName: string;
    tenant: string;
    updateTime: UpdateTime;
    updater: string;
  };
  debugMsg: string;
  displayMsg: string;
  requestId: string;
  resultCode: string;
  serverTime: number;
  success: boolean;
  txId: string;
}

export interface PageObjectDetailRequest {
  currentPage: number;
  pageSize: number;
}

export interface PageObjectDetailResponse {
  data: {
    content: {
      amount: number;
      amountForBox: number;
      box: number;
      jin: number;
      jinForBox: number;
      objectDetailId: number;
      objectDetailName: string;
      tenant: string;
      updateTime: UpdateTime;
      updater: string;
    }[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  debugMsg: string;
  displayMsg: string;
  requestId: string;
  resultCode: string;
  serverTime: number;
  success: boolean;
  txId: string;
}