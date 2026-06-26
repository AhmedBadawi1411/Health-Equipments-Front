import { InventoryStatusKey } from "../shared/constants/constants";

export interface IFacility {
  facilityID: number;
  facilityName: string; 
  facilityType: string;
  address?: string;
  facilityLevel: number;
  lat: number;
  lng: number;
  inventoryStatus: InventoryStatusKey;
  isApproved: boolean;
  capacity: number; 
  regionID: number; 
  createdAt: string;
  updatedAt: string;
}

export type FacilityForm = Partial<IFacility>;