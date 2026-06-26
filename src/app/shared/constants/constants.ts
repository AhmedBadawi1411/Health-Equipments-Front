export const INVENTORY_STATUS = {
  NOT_STARTED: {
    label: 'لم تبدأ بعد',
    severity: 'secondary',
  },
  IN_PROGRESS: {
    label: 'قيد التنفيذ',
    severity: 'warn',
  },
  SUBMITTED: {
    label: 'تم التقديم',
    severity: 'info',
  },
  APPROVED: {
    label: 'تمت الموافقة',
    severity: 'success',
  },
  REJECTED: {
    label: 'مرفوض',
    severity: 'danger',
  },
} as const;

export type InventoryStatusKey = keyof typeof INVENTORY_STATUS;