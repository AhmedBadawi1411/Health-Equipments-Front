export interface IUser {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  role?: IRole;
  permissions?: IPermission[];
  facilities?: { id: number; name: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserForm {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
}

export interface IRole {
  id: string;
  name: string;
  description?: string;
}

export interface IPermission {
  id: string;
  name: string;
  module: string;
  action?: string;
  description?: string;
}
