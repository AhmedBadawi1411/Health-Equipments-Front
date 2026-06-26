export interface IDepartment {
  departmentID: number;
  departmentName: string;
  facilityID: number;
  createdAt: string;
  updatedAt: string;
}

export interface INormalizedDepartment {
  id:number,
  data: IDepartment
}
