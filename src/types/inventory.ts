import { ObjectDetailResponse } from './objectDetail';

// 单位类型
export type UnitType = 'box' | 'jin' | 'piece';

// 操作类型
export type OperationType = 'add_inventory' | 'reduce_inventory' | 'new_item' | 'edit_item' | 'delete_item';

// 库存项目
export interface InventoryItem {
  id: string;
  name: string;
  boxQuantity: number;
  jinQuantity: number;
  pieceQuantity: number;
  jinPerBox: number;
  piecePerBox: number;
  updateTime: string;
  operator: string;
  isDeleted?: boolean;
}

// 库存操作记录
export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  operationType: OperationType;
  quantity: number;
  unit: UnitType;
  boxQuantity: number;
  jinQuantity: number;
  pieceQuantity: number;
  jinPerBox: number;
  piecePerBox: number;
  remark: string;
  operateTime: string;
  operator: string;
}

// 添加新的类型定义
export interface AddInventoryItemRequest {
  amountForBox: number;
  jinForBox: number;
  objectDetailName: string;
  tenant: string;
}

export interface AddInventoryItemResponse extends ObjectDetailResponse {
  // 继承 ObjectDetailResponse 的所有字段
} 