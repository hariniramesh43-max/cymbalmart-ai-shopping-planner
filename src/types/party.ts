export type Department = 'food' | 'beverages' | 'tableware' | 'decor' | 'entertainment';

export interface ShoppingItem {
  id: string;
  name: string;
  brand: string;
  department: Department;
  aisle: string;
  unitPrice: number;
  quantity: number;
  packageSize: string;
  servingsPerPack?: string;
  dietaryTags?: string[];
  whyNeeded: string;
  budgetAlternative?: string;
  premiumAlternative?: string;
  checked?: boolean;
}

export interface TimelineMilestone {
  id: string;
  timeframe: string;
  title: string;
  tasks: { id: string; text: string; done: boolean }[];
}

export interface SignatureRecipe {
  name: string;
  type: 'Drink' | 'Mocktail' | 'Cocktail' | 'Appetizer' | 'Dessert';
  servings: number;
  prepTime: string;
  ingredients: string[];
  instructions: string[];
}

export interface PartyFormInput {
  partyType: string;
  theme: string;
  budget: number;
  guestCount: number;
  adultCount: number;
  kidCount: number;
  dietaryRestrictions: string[];
  specialRequests: string;
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  vibe: string;
}

export interface PartyPlan {
  id: string;
  title: string;
  themeVibe: string;
  partyType: string;
  guestCount: number;
  targetBudget: number;
  createdAt: string;
  servingsNote: string;
  items: ShoppingItem[];
  prepTimeline: TimelineMilestone[];
  signatureRecipe?: SignatureRecipe;
  partyTips: string[];
  customNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedAction?: {
    type: 'add_item' | 'apply_rebalance' | 'apply_theme';
    label: string;
    payload?: any;
  };
}
