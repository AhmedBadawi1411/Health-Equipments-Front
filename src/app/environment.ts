export const AppEnvironment = {
  BASE_URL: '/api/v1',
  // BASE_URL: 'http://localhost:5000/api/v1',
};

export const EndPoints = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refreshToken',
    VALIDATE_ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  ASSETS: {
    GET_MASTER: '/equipment-master',
    SEARCH: '/equipment-search',
    SEARCH_BY_FACILITY: '/equipment-facility-search',
    RESOLVE_SURVEY: '/equipments/resolve-survey',
    CREATE: '/equipments',
    GET: '/equipments',
    GET_ONE: (id: number) => `/equipments/${id}`,
    UPDATE: (id: number) => `/equipments/${id}`,
    DELETE: (id: number) => `/equipments/${id}`,
  },
  FACILITIES: {
    CREATE: '/facility',
    REGIONS: '/regions',
    GET: '/facilities',
    GET_ONE: (id: number) => `/facility/${id}`,
    UPDATE: (id: number) => `/facility/${id}`,
    GET_DEPARTMENTS: (id: number) => `/facility/${id}/departments`,
  },
  DEPARTMENTS: {
    CREATE: '/department',
    GET: '/departments',
  },
  NEEDS: {
    CREATE: '/need-request',
    GET: '/need-requests',
    GET_ONE: (id: number) => `/need-request/${id}`,
    UPDATE: (id: number) => `/need-request/${id}`,
    DELETE: (id: number) => `/need-request/${id}`,
  },
  INVENTORY: {
    GET: '/inventory-surveys',
    CREATE: '/inventory-survey',
    UPDATE: (id: number) => `/inventory-survey/${id}`,
    DELETE: (id: number) => `/inventory-survey/${id}`,
  },
  USERS: {
    GET: '/users',
    GET_ONE: (id: string) => `/users/${id}`,
    CREATE: '/user',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    ROLES: '/roles',
    PERMISSIONS: '/permissions',
    ASSIGN_ROLE: (id: string) => `/users/${id}/role`,
    ASSIGN_PERMISSIONS: (id: string) => `/users/${id}/permissions`,
    ASSIGN_FACILITIES: (id: string) => `/users/${id}/facilities`,
    ASSIGN_SIMPLE_FACILITIES: (id: string) => `/users/${id}/facilities`,
  },
  SIMPLE_SYSTEM: {
    FACILITIES: '/facilities',
  },
  SUPPLIERS: {
    GET: '/suppliers',
    CREATE: '/suppliers',
    GET_ONE: (id: number) => `/suppliers/${id}`,
    UPDATE: (id: number) => `/suppliers/${id}`,
    DELETE: (id: number) => `/suppliers/${id}`,
  },
  CONTRACTS: {
    GET: '/contracts',
    CREATE: '/contracts',
    GET_ONE: (id: number) => `/contracts/${id}`,
    UPDATE: (id: number) => `/contracts/${id}`,
    DELETE: (id: number) => `/contracts/${id}`,
  },
  MANUFACTURERS: {
    GET: '/manufacturer',
    CREATE: '/manufacturer',
  },
  CATEGORIES: {
    GET: '/equipment/category',
    CREATE: '/equipment/category',
  },
  EQUIPMENT_CONTRACTS: {
    CREATE: '/equipment-contracts',
    DELETE: '/equipment-contracts',
  },
  DASHBOARD: {
    GET: '/dashboard/metrics',
    LIVE: '/dashboard/live',
  },
  IMPORTS: {
    VALIDATE: '/imports/validate',
    CREATE: '/imports',
    PENDING: '/imports/pending',
    HISTORY: (facilityId: number) => `/imports/facility/${facilityId}`,
    GET_ONE: (id: number) => `/imports/${id}`,
    REVIEW: (id: number) => `/imports/${id}/review`,
  },
};

export const Icons = {
  Dashboard: 'material-symbols:dashboard-outline-rounded',
  Inventory: 'material-symbols:inventory-2-outline-rounded',
  GisMap: 'material-symbols:map-outline-rounded',
  Maintenance: 'pajamas:work-item-maintenance',
  Users: 'mdi:users-outline',
  Reports: 'mdi:report-box-outline',
  Facilities: 'cuida:building-outline',
  Assets: 'jam:medical',
  Needs: 'carbon:need',
};
