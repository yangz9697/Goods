import request from './request';
import { AddUserRequest, UserResponse, PageUserRequest, PageUserResponse, UpdateUserRequest } from '../types/customer';

export const addUser = async (data: AddUserRequest): Promise<UserResponse> => {
  try {
    const response = await request.post<UserResponse>(
      '/erp/objectUser/addUser',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error('添加客户失败：' + (error as Error).message);
  }
};

export const pageUser = async (params: PageUserRequest): Promise<PageUserResponse> => {
  try {
    const response = await request.post<PageUserResponse>(
      '/erp/objectUser/pageUser',
      params
    );
    return response.data;
  } catch (error) {
    throw new Error('获取客户列表失败：' + (error as Error).message);
  }
};

export const updateUser = async (data: UpdateUserRequest): Promise<UserResponse> => {
  try {
    const response = await request.post<UserResponse>(
      '/erp/objectUser/updateUser',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error('修改客户信息失败：' + (error as Error).message);
  }
};

export const deleteUser = async (userId: number) => {
  try {
    const response = await request.post('/erp/objectUser/deleteUser', {
      userId
    });
    return response.data;
  } catch (error) {
    throw new Error('删除客户失败：' + (error as Error).message);
  }
}; 