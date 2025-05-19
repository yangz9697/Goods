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
  filters?: Record<string, any>;
}

export interface PageObjectDetailResponse {
  data: {
    total: number;
    totalPage: number;
    items: {
      objectDetailId: number;
      objectDetailName: string;
      tenant: string;
      amountForBox: number;
      jinForBox: number;
      amount: number;
      jin: number;
      box: number;
      updateTime: number;
      updater: string;
    }[];
  };
}

export interface PageObjectPriceRequest {
  currentPage: number;
  pageSize: number;
  filters: {
    detailObjectName?: string;
    startTime?: number;
    endTime?: number;
  };
}

export interface ObjectPrice {
  objectDetailId: number;
  objectDetailName: string;
  priceForAmount: number;
  priceForJin: number;
  priceForBox: number;
  yesterdayPriceForAmount?: number;
  yesterdayPriceForJin?: number;
  yesterdayPriceForBox?: number;
  createTime: number;
  updateTime: number;
  updater: string;
  jinForBox: number;
  amountForBox: number;
}

export interface PageObjectPriceResponse {
  data: {
    total: number;
    totalPage: number;
    items: ObjectPrice[];
  };
}

export interface ObjectOpLog {
  content: string;
  objectDetailId: number;
  objectDetailName: string;
  opName: string;
  opType: string;
  operator: string;
  userRemark: string;
  operatorTime: number;
}

export interface QueryObjectOpLogResponse {
  data: ObjectOpLog[];
  success: boolean;
  displayMsg?: string;
}