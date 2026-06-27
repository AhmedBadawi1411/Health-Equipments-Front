export interface IUser {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  role?: IRole;
  permissions?: IPermission[];
  customPermissions?: IPermission[];
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
  permissions?: string[];
}

export interface IPermission {
  id: string;
  name: string;
  module: string;
  code?: string;
  action?: string;
  description?: string;
}
