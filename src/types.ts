export type ResourceType = 'ballast' | 'rail' | 'tie' | 'signal';

export interface Resources {
  ballast: number; // tons
  rail: number; // tons
  tie: number; // units
  signal: number; // units
}

export type StaffType = 'general' | 'engineer' | 'operator';

export interface Staff {
  general: number; // counts
  engineer: number;
  operator: number;
}

export interface Node {
  id: string;
  name: string;
  jpName: string;
  type: 'hub' | 'station' | 'port' | 'junction';
  coord: { x: number; y: number };
  stockpile: Resources;
  capacity: number; // max materials stockpile capacity
  staff: Staff;
  isolationLevel: number; // 0 (connected) to 100 (fully isolated)
  population: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  distance: number; // km
  status: 'operational' | 'damaged' | 'under_construction';
  damageType: 'landslide' | 'bridge_washout' | 'track_washaway' | 'signal_submerged';
  damageSeverity: number; // 0 to 100%
  requiredResources: Resources;
  consumedResources: Resources;
  requiredLaborDays: {
    general: number;
    engineer: number;
    operator: number;
  };
  consumedLaborDays: {
    general: number;
    engineer: number;
    operator: number;
  };
  activeWorkers: Staff;
  progress: number; // 0 to 100
  restorationCost: number; // initial estimate in JPY
}

export interface ActiveTransport {
  id: string;
  type: 'truck' | 'barge' | 'train';
  cargo: Partial<Resources>;
  staff: Partial<Staff>;
  from: string;
  to: string;
  progress: number; // 0 to 1
  speed: number; // progress per game-tick
  cost: number; // total cost for this trip
  eta: number; // days remaining
  cargoType: ResourceType | 'staff';
}

export interface GameEvent {
  id: string;
  day: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  effectText?: string;
}

export interface MarketPrice {
  ballast: number; // JPY per ton
  rail: number; // JPY per ton
  tie: number; // JPY per unit
  signal: number; // JPY per unit
  generalWage: number; // JPY per day
  engineerWage: number; // JPY per day
  operatorWage: number; // JPY per day
}

export interface GameState {
  day: number;
  budget: number;
  approvalRating: number; // 0 - 100
  nodes: Node[];
  edges: Edge[];
  transports: ActiveTransport[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  marketPrices: MarketPrice;
  events: GameEvent[];
  isPaused: boolean;
  simSpeed: number; // 1 | 2 | 5
  totalRestoredKm: number;
  totalKm: number;
  unlockedGrants: string[];
}
