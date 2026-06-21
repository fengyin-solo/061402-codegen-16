// 全局类型定义

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  topProducts: Product[];
}

export interface Survivor {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  combat: number;
  perception: number;
  status: 'idle' | 'resting' | 'guarding' | 'working' | 'injured';
}

export interface Building {
  id: number;
  name: string;
  type: 'shelter' | 'watchtower' | 'wall' | 'storage' | 'workshop';
  level: number;
  durability: number;
  maxDurability: number;
  defenseBonus: number;
  built: boolean;
}

export interface SentryPost {
  id: number;
  name: string;
  location: string;
  buildingId?: number;
  guardId?: number;
  defenseValue: number;
  alertLevel: number;
  status: 'active' | 'inactive' | 'damaged';
}

export interface NightWatch {
  survivorId: number;
  shift: 'first' | 'second' | 'third';
  startTime: string;
  endTime: string;
  alertness: number;
}

export interface EmergencySupply {
  type: 'weapon' | 'medicine' | 'food' | 'water' | 'tool';
  name: string;
  quantity: number;
  allocated: number;
  effectiveness: number;
}

export interface NightAttack {
  id: number;
  day: number;
  enemyType: 'wild_beasts' | 'raiders' | 'zombies' | 'storm';
  enemyStrength: number;
  enemyCount: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface BattleResult {
  attackId: number;
  victory: boolean;
  enemiesDefeated: number;
  casualties: number;
  injuredSurvivors: number[];
  buildingDamage: { buildingId: number; damage: number }[];
  suppliesUsed: { type: string; amount: number }[];
  experienceGained: number;
  nextDayPlanModifier: string;
}

export interface DayPlan {
  day: number;
  actions: string[];
  resourceAllocation: { food: number; water: number; wood: number; stone: number };
  survivorAssignments: { survivorId: number; task: string }[];
  modifiedByNightAttack: boolean;
}

export interface DefenseSystem {
  overallDefense: number;
  sentryPosts: SentryPost[];
  nightWatches: NightWatch[];
  emergencySupplies: EmergencySupply[];
  buildings: Building[];
  survivors: Survivor[];
  currentDay: number;
  nightAttackHistory: { attack: NightAttack; result: BattleResult }[];
  dayPlans: DayPlan[];
  alertLevel: 'green' | 'yellow' | 'orange' | 'red';
}