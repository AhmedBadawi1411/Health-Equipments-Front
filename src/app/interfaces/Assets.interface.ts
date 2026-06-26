export interface NewAsset {
  assetName: string;
  facilityID: number;
  departmentID: number;
  assetType: number;
  assetStatus: number;
  assetSerial: string;
  installationDate: Date;
  purchaseDate: Date;
  supplierId?: number;
}

export interface AssetForm {
  assetName?: string;
  facilityID?: number;
  departmentID?: number;
  assetType?: number;
  assetStatus?: number;
  assetSerial?: string;
  installationDate?: Date;
  purchaseDate?: Date;
  contractID?: number;
  supplierId?: number;
}

export interface IAssetMaster {
  equipmentTypeId: number;
  equipmentName: string;
  categoryId: number;
  manufacturerId: number;
  model: string;
  expectedLifeYears: number;
}

export interface IAsset {
  assetId: number;
  equipmentTypeId: number;
  equipmentName: string;
  categoryId: number;
  manufacturerId: number;
  model: string;
  expectedLifeYears: number;
}

export interface IAsset {
  assetId: number;
  equipmentTypeId: number;
  serialNumber: string;
  barcode?: string;
  purchaseDate?: Date | string;
  installationDate?: Date | string;
  departmentId: number;
  facilityId: number;
  statusId: number;
  supplierId?: number;
  createdAt?: string;
  updatedAt?: string;
}
