export interface INeedRequest {
        departmentId:Number,
        requestedBy:string,
        items: INeedRequestItem[]
}

export interface INeedRequestItem {
        equipmentTypeId:number,
        quantity:number,
        justification: string
}

export interface INeedRequestItemForm {
        equipmentTypeId?:number,
        quantity?:number,
        justification?: string
}