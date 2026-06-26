export interface IInventorySurvey {
  surveyID?: number;
  facilityID: number;
  surveyDate: Date | string;
  surveyType: string;
  status: string;
  createdBy: string;
  notes: string;
  items: IInventorySurveyItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IInventorySurveyItem {
  surveyItemID?: number;
  surveyID?: number;
  assetID?: number | null;
  equipmentMasterID?: number | null;
  equipmentNameSnapshot: string;
  serialNumberSnapshot?: string | null;
  departmentID: number;
  statusSnapshot: string;
  quantity: number;
  needRegistration: boolean;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IInventorySurveyItemForm {
  surveyItemID?: number;
  surveyID?: number;
  assetID?: number | null;
  equipmentMasterID?: number | null;
  isExistingAsset?: boolean;
  equipmentNameSnapshot?: string;
  serialNumberSnapshot?: string | null;
  departmentID?: number;
  statusSnapshot?: string;
  quantity?: number;
  needRegistration?: boolean;
  remarks?: string | null;
}
