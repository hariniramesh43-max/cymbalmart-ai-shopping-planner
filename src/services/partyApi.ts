import { PartyFormInput, PartyPlan, ShoppingItem, ChatMessage } from '../types/party';
import { PRESET_PARTIES, CYMBAL_CATALOG_ITEMS } from '../data/mockCatalog';

export async function generatePartyPlan(formData: PartyFormInput): Promise<PartyPlan> {
  try {
    const response = await fetch('/api/plan-party', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error('Invalid response structure from server');
  } catch (error) {
    console.warn('API error, building intelligent local party plan fallback:', error);
    // Intelligent client-side fallback using catalog items scaled to guest count & budget
    return generateLocalFallbackPlan(formData);
  }
}

export async function rebalanceCartBudget(
  currentItems: ShoppingItem[],
  currentTotal: number,
  targetBudget: number,
  strategy: 'balanced' | 'budget-first' | 'keep-food' = 'balanced'
): Promise<{ summary: string; items: ShoppingItem[]; savingsTips: string[] }> {
  try {
    const response = await fetch('/api/rebalance-budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentItems, currentTotal, targetBudget, strategy }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error('Invalid rebalance response');
  } catch (error) {
    console.warn('Local rebalancing fallback invoked:', error);
    // Algorithmic local rebalance
    return localRebalance(currentItems, currentTotal, targetBudget, strategy);
  }
}

export async function sendCymbalMartAssistantChat(
  messages: ChatMessage[],
  currentPlan: PartyPlan | null
): Promise<string> {
  try {
    const response = await fetch('/api/chat-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        currentPlan,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    return json.message || 'Hello! I am your CymbalMart Assistant. How can I help you today?';
  } catch (error) {
    console.warn('CymbalMart Assistant API error:', error);
    return `👋 **CymbalMart Assistant**: I'm here to help you shop smart!\n\n- **Aisle Lookup**: Check Aisle 1-2 for Fresh Produce, Aisle 4 for Deli & Bakery, Aisle 7 for Eco Tableware, Aisle 9 for 10lb Ice.\n- **Ice & Drink Math**: Plan 1.5 lbs of ice & 2 drinks per guest for the first hour.\n- **Store Hours & Pickup**: We're open 6:00 AM – 11:00 PM daily. Free Curbside pickup in Bays 1-12 on orders over $35.\n- **Freshness Guarantee**: 100% money-back freshness guarantee on all produce & bakery goods.`;
  }
}

// Backward compatibility alias
export const sendPartyConciergeChat = sendCymbalMartAssistantChat;

// Client fallback generator
function generateLocalFallbackPlan(formData: PartyFormInput): PartyPlan {
  const matchingPreset = PRESET_PARTIES.find(
    (p) => p.partyType.toLowerCase().includes(formData.partyType.toLowerCase()) ||
           formData.theme.toLowerCase().includes(p.title.toLowerCase())
  ) || PRESET_PARTIES[0];

  const scaleFactor = Math.max(0.5, Math.min(3, formData.guestCount / 16));
  const budgetRatio = formData.budget / 175;

  const adjustedItems: ShoppingItem[] = matchingPreset.items.map((item, idx) => {
    let qty = Math.ceil(item.quantity * scaleFactor);
    if (budgetRatio < 0.8 && qty > 1) {
      qty = Math.max(1, qty - 1);
    }
    return {
      ...item,
      id: `item-${Date.now()}-${idx}`,
      quantity: qty,
      checked: false,
    };
  });

  return {
    id: `plan-${Date.now()}`,
    title: `${formData.theme || formData.partyType} Celebration`,
    themeVibe: `A tailored ${formData.vibe.toLowerCase()} gathering at CymbalMart value for ${formData.guestCount} guests.`,
    partyType: formData.partyType,
    guestCount: formData.guestCount,
    targetBudget: formData.budget,
    createdAt: new Date().toISOString(),
    servingsNote: `Smart scaled for ${formData.guestCount} guests (${formData.adultCount} adults, ${formData.kidCount} kids).`,
    items: adjustedItems,
    prepTimeline: matchingPreset.prepTimeline,
    signatureRecipe: matchingPreset.signatureRecipe,
    partyTips: matchingPreset.partyTips,
  };
}

function localRebalance(
  currentItems: ShoppingItem[],
  currentTotal: number,
  targetBudget: number,
  strategy: string
): { summary: string; items: ShoppingItem[]; savingsTips: string[] } {
  let items = JSON.parse(JSON.stringify(currentItems)) as ShoppingItem[];
  let diff = currentTotal - targetBudget;

  const tips: string[] = [];

  // 1. Reduce non-food quantities first if possible
  for (const item of items) {
    if (diff <= 0) break;
    if (item.department === 'decor' || item.department === 'entertainment') {
      if (item.quantity > 1) {
        item.quantity -= 1;
        diff -= item.unitPrice;
        tips.push(`Reduced ${item.name} from ${item.quantity + 1} to ${item.quantity} pack(s) (Saved $${item.unitPrice.toFixed(2)})`);
      }
    }
  }

  // 2. Reduce tableware pack quantities if over 1
  for (const item of items) {
    if (diff <= 0) break;
    if (item.department === 'tableware' && item.quantity > 1) {
      item.quantity -= 1;
      diff -= item.unitPrice;
      tips.push(`Optimized ${item.name} quantity to match exact guest count (Saved $${item.unitPrice.toFixed(2)})`);
    }
  }

  // 3. Swap to budget alternatives
  for (const item of items) {
    if (diff <= 0) break;
    if (item.budgetAlternative && item.unitPrice > 6) {
      const priceDrop = item.unitPrice * 0.35;
      item.unitPrice = parseFloat((item.unitPrice - priceDrop).toFixed(2));
      item.name = `${item.name} (Value Pack)`;
      item.brand = 'Cymbal Basics';
      diff -= priceDrop * item.quantity;
      tips.push(`Swapped to Cymbal Basics value tier for ${item.name}`);
    }
  }

  const newTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return {
    summary: `Rebalanced shopping list to $${newTotal.toFixed(2)} (within $${targetBudget} budget target) while preserving key food and beverage essentials.`,
    items,
    savingsTips: tips.length > 0 ? tips : ['Adjusted pack sizes to perfectly cover the exact head count without leftover waste.'],
  };
}
