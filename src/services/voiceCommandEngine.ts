import { PartyPlan, ShoppingItem, PartyFormInput, Department } from '../types/party';
import { CYMBAL_CATALOG_ITEMS, PRESET_PARTIES } from '../data/mockCatalog';
import { speakText, audioCues } from './voiceAssistant';
import { sendCymbalMartAssistantChat } from './partyApi';

export interface VoiceEngineContext {
  partyPlan: PartyPlan;
  activeTab: 'wizard' | 'shopping' | 'aisles' | 'toolkit' | 'chat';
  setActiveTab: (tab: 'wizard' | 'shopping' | 'aisles' | 'toolkit' | 'chat') => void;
  showCheckout: boolean;
  setShowCheckout: (open: boolean) => void;
  showShare: boolean;
  setShowShare: (open: boolean) => void;
  onAddItem: (item: ShoppingItem) => void;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateItem: (id: string, fields: Partial<ShoppingItem>) => void;
  onToggleCheckItem: (id: string) => void;
  onCheckAllInAisle: (aisleName: string, check: boolean) => void;
  onSwapItem: (id: string, type: 'budget' | 'premium') => void;
  onScaleQuantities: (factor: number) => void;
  onClearCheckedItems: () => void;
  onToggleAllItems: (check: boolean) => void;
  onRestoreRemovedItem: () => void;
  onUpdateTargetBudget: (budget: number) => void;
  onTriggerRebalance: () => Promise<void>;
  onToggleTask: (milestoneId: string, taskId: string) => void;
  onGeneratePlan: (form: PartyFormInput) => Promise<void>;
  onLoadPreset: (preset: PartyPlan) => void;
  onCheckoutPlaceOrder?: () => void;
  onCheckoutFulfillmentChange?: (type: 'pickup' | 'delivery') => void;
  voiceFeedbackEnabled: boolean;
  showToast: (text: string, type: 'success' | 'info' | 'error') => void;
}

export interface VoiceExecutionResult {
  matched: boolean;
  category: 'navigation' | 'shopping' | 'budget' | 'aisle' | 'toolkit' | 'checkout' | 'ai_chat' | 'unknown';
  actionName: string;
  feedbackText: string;
  transcript: string;
}

export async function processVoiceCommand(
  rawTranscript: string,
  context: VoiceEngineContext
): Promise<VoiceExecutionResult> {
  const t = rawTranscript.trim().toLowerCase();
  if (!t) {
    return {
      matched: false,
      category: 'unknown',
      actionName: 'Empty command',
      feedbackText: 'I did not catch that. Try saying a command like "Go to shopping list" or "Add 2 bags of ice".',
      transcript: rawTranscript,
    };
  }

  const {
    partyPlan,
    setActiveTab,
    setShowCheckout,
    setShowShare,
    showCheckout,
    onAddItem,
    onRemoveItem,
    onUpdateQuantity,
    onToggleCheckItem,
    onCheckAllInAisle,
    onSwapItem,
    onScaleQuantities,
    onClearCheckedItems,
    onToggleAllItems,
    onRestoreRemovedItem,
    onUpdateTargetBudget,
    onTriggerRebalance,
    onToggleTask,
    onGeneratePlan,
    onLoadPreset,
    onCheckoutPlaceOrder,
    onCheckoutFulfillmentChange,
    voiceFeedbackEnabled,
    showToast,
  } = context;

  const currentTotal = partyPlan.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const respond = (text: string, category: VoiceExecutionResult['category'], actionName: string): VoiceExecutionResult => {
    audioCues.playSuccess();
    showToast(text, 'success');
    if (voiceFeedbackEnabled) {
      speakText(text);
    }
    return {
      matched: true,
      category,
      actionName,
      feedbackText: text,
      transcript: rawTranscript,
    };
  };

  // ----------------------------------------------------
  // 1. MODAL / DIALOG CLOSE COMMANDS
  // ----------------------------------------------------
  if (
    t.includes('close modal') ||
    t.includes('close checkout') ||
    t.includes('close window') ||
    t.includes('cancel checkout') ||
    t.includes('dismiss') ||
    t.includes('close share')
  ) {
    setShowCheckout(false);
    setShowShare(false);
    return respond('Closed open window.', 'navigation', 'Close Modal');
  }

  // ----------------------------------------------------
  // 2. CHECKOUT COMMANDS (HANDS-FREE CHECKOUT)
  // ----------------------------------------------------
  if (
    t.includes('open checkout') ||
    t.includes('start checkout') ||
    t.includes('go to checkout') ||
    t.includes('ready to checkout') ||
    t.includes('proceed to checkout') ||
    t.includes('buy items') ||
    t.includes('view cart')
  ) {
    setShowCheckout(true);
    return respond(
      `Opening checkout. Your cart total is $${currentTotal.toFixed(2)}. Say "Select curbside pickup", "Select delivery", or "Confirm order".`,
      'checkout',
      'Open Checkout'
    );
  }

  if (showCheckout) {
    if (t.includes('curbside') || t.includes('pickup') || t.includes('pick up')) {
      if (onCheckoutFulfillmentChange) onCheckoutFulfillmentChange('pickup');
      return respond('Selected free Curbside Pickup at Bay #3.', 'checkout', 'Select Pickup');
    }

    if (t.includes('delivery') || t.includes('ship') || t.includes('deliver')) {
      if (onCheckoutFulfillmentChange) onCheckoutFulfillmentChange('delivery');
      return respond('Selected Same-Day Express 2-hour Delivery ($5.99).', 'checkout', 'Select Delivery');
    }

    if (
      t.includes('place order') ||
      t.includes('confirm order') ||
      t.includes('submit order') ||
      t.includes('confirm checkout') ||
      t.includes('complete order') ||
      t.includes('pay now')
    ) {
      if (onCheckoutPlaceOrder) {
        onCheckoutPlaceOrder();
        return respond(
          `Your order has been placed! Our personal shoppers are packing your party items at CymbalMart now.`,
          'checkout',
          'Place Order'
        );
      }
    }
  }

  // ----------------------------------------------------
  // 3. MAIN TAB NAVIGATION COMMANDS
  // ----------------------------------------------------
  if (
    t.includes('go to shopping list') ||
    t.includes('show shopping list') ||
    t.includes('open shopping list') ||
    t.includes('view manifest') ||
    t.includes('show manifest') ||
    t.includes('go to cart') ||
    t.includes('show cart') ||
    t.includes('my items')
  ) {
    setActiveTab('shopping');
    setShowCheckout(false);
    return respond(`Switched to Shopping List. You have ${partyPlan.items.length} items totaling $${currentTotal.toFixed(2)}.`, 'navigation', 'Navigate Shopping');
  }

  if (
    t.includes('go to store aisles') ||
    t.includes('show store aisles') ||
    t.includes('show aisles') ||
    t.includes('aisle view') ||
    t.includes('in store route') ||
    t.includes('shopping route') ||
    t.includes('aisle route')
  ) {
    setActiveTab('aisles');
    setShowCheckout(false);
    return respond('Showing CymbalMart in-store aisle route, sorted front-to-back for easy shopping.', 'navigation', 'Navigate Aisles');
  }

  if (
    t.includes('go to host toolkit') ||
    t.includes('show host toolkit') ||
    t.includes('host toolkit') ||
    t.includes('prep timeline') ||
    t.includes('show timeline') ||
    t.includes('party timeline') ||
    t.includes('show recipe') ||
    t.includes('view toolkit')
  ) {
    setActiveTab('toolkit');
    setShowCheckout(false);
    return respond('Switched to Host Toolkit with prep schedule and signature recipe.', 'navigation', 'Navigate Toolkit');
  }

  if (
    t.includes('ask assistant') ||
    t.includes('open assistant') ||
    t.includes('chat with assistant') ||
    t.includes('cymbalmart assistant') ||
    t.includes('concierge') ||
    t.includes('ai chat')
  ) {
    setActiveTab('chat');
    setShowCheckout(false);
    return respond('Opened CymbalMart Assistant chat. Ask any party or store questions!', 'navigation', 'Navigate Chat');
  }

  if (
    t.includes('plan new party') ||
    t.includes('start party wizard') ||
    t.includes('open wizard') ||
    t.includes('new plan') ||
    t.includes('create party')
  ) {
    setActiveTab('wizard');
    setShowCheckout(false);
    return respond('Opened Party Planner Wizard. Choose a preset or tell me your party theme and guest count.', 'navigation', 'Navigate Wizard');
  }

  if (t.includes('share plan') || t.includes('print plan') || t.includes('export plan')) {
    setShowShare(true);
    return respond('Opened Share and Print Modal.', 'navigation', 'Open Share');
  }

  // ----------------------------------------------------
  // 4. PRESET LOADER BY VOICE
  // ----------------------------------------------------
  if (t.startsWith('load ') || t.includes('preset') || t.includes('template')) {
    const matchedPreset = PRESET_PARTIES.find(
      (p) =>
        t.includes(p.title.toLowerCase()) ||
        t.includes(p.partyType.toLowerCase()) ||
        (t.includes('taco') && p.title.toLowerCase().includes('taco')) ||
        (t.includes('bbq') && p.title.toLowerCase().includes('bbq')) ||
        (t.includes('barbecue') && p.title.toLowerCase().includes('bbq')) ||
        (t.includes('game') && p.title.toLowerCase().includes('game')) ||
        (t.includes('birthday') && p.title.toLowerCase().includes('birthday')) ||
        (t.includes('cocktail') && p.title.toLowerCase().includes('cocktail'))
    );

    if (matchedPreset) {
      onLoadPreset(matchedPreset);
      return respond(
        `Loaded preset: "${matchedPreset.title}" with ${matchedPreset.items.length} curated items for ${matchedPreset.guestCount} guests!`,
        'toolkit',
        'Load Preset'
      );
    }
  }

  // ----------------------------------------------------
  // 5. PARTY CREATION FROM NATURAL SPEECH
  // e.g. "Plan a Taco Fiesta for 20 guests with 150 dollar budget"
  // ----------------------------------------------------
  if (
    (t.startsWith('plan ') || t.startsWith('create ') || t.startsWith('make a party')) &&
    (t.includes('guest') || t.includes('people') || t.includes('budget') || t.includes('for '))
  ) {
    const guestMatch = t.match(/(\d+)\s*(guests?|people|attendees|friends)/i);
    const budgetMatch = t.match(/(\d+)\s*(dollars?|bucks?|\$|budget)/i);
    const guestCount = guestMatch ? parseInt(guestMatch[1], 10) : 16;
    const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : 200;

    let theme = rawTranscript.replace(/^(plan|create|make a party|a party)\s+/i, '').trim();
    if (theme.toLowerCase().includes(' for ')) {
      theme = theme.split(/ for /i)[0].trim();
    }

    const formInput: PartyFormInput = {
      partyType: theme || 'Party Gathering',
      theme: theme || 'Festive Celebration',
      budget,
      guestCount,
      adultCount: Math.round(guestCount * 0.8),
      kidCount: Math.round(guestCount * 0.2),
      dietaryRestrictions: t.includes('gluten') ? ['Gluten-Free'] : t.includes('vegan') ? ['Vegan'] : t.includes('vegetarian') ? ['Vegetarian'] : [],
      specialRequests: 'Voice-generated party plan',
      indoorOutdoor: t.includes('outdoor') ? 'outdoor' : t.includes('indoor') ? 'indoor' : 'both',
      vibe: t.includes('chill') ? 'Relaxed & casual' : 'High energy celebration',
    };

    onGeneratePlan(formInput);
    return respond(
      `Creating your custom party: "${theme}" for ${guestCount} guests with a $${budget} budget!`,
      'toolkit',
      'Generate Party'
    );
  }

  // ----------------------------------------------------
  // 6. BUDGET QUERIES & MODIFICATIONS
  // ----------------------------------------------------
  if (
    t.includes('what is my total') ||
    t.includes('what is the total') ||
    t.includes('how much is my cart') ||
    t.includes('budget status') ||
    t.includes('how much have i spent') ||
    t.includes('tell me my total')
  ) {
    const diff = partyPlan.targetBudget - currentTotal;
    const costPerGuest = partyPlan.guestCount > 0 ? (currentTotal / partyPlan.guestCount).toFixed(2) : '0';
    const statusText =
      diff >= 0
        ? `Your current live total is $${currentTotal.toFixed(2)}, which is $${diff.toFixed(2)} under your target budget of $${partyPlan.targetBudget.toFixed(2)}. Cost per guest is $${costPerGuest}.`
        : `Your live total is $${currentTotal.toFixed(2)}, which is $${Math.abs(diff).toFixed(2)} over your target budget of $${partyPlan.targetBudget.toFixed(2)}.`;
    return respond(statusText, 'budget', 'Query Budget');
  }

  if (
    t.startsWith('set budget to') ||
    t.startsWith('change budget to') ||
    t.startsWith('update budget to') ||
    t.includes('dollar budget') ||
    t.includes('dollars budget')
  ) {
    const numMatch = t.match(/(\d+(\.\d+)?)/);
    if (numMatch) {
      const newBudget = parseFloat(numMatch[1]);
      if (newBudget > 0) {
        onUpdateTargetBudget(newBudget);
        return respond(
          `Target budget set to $${newBudget.toFixed(2)}. All metrics have been recalculated.`,
          'budget',
          'Set Target Budget'
        );
      }
    }
  }

  if (
    t.includes('rebalance budget') ||
    t.includes('smart rebalance') ||
    t.includes('fix budget') ||
    t.includes('balance cart') ||
    t.includes('rebalance')
  ) {
    await onTriggerRebalance();
    return respond(
      `Rebalanced your shopping list to fit your $${partyPlan.targetBudget.toFixed(2)} budget while preserving essential party items.`,
      'budget',
      'Smart Rebalance'
    );
  }

  // ----------------------------------------------------
  // 7. IN-STORE AISLE LOOKUP & BATCH AISLE CHECKING
  // ----------------------------------------------------
  if (
    t.startsWith('where is ') ||
    t.startsWith('where are ') ||
    t.startsWith('which aisle has ') ||
    t.startsWith('find aisle for ') ||
    t.includes('what aisle')
  ) {
    const query = t
      .replace(/^(where is|where are|which aisle has|find aisle for|what aisle is|what aisle are|find)\s+/i, '')
      .replace(/[?.]/g, '')
      .trim();

    // Check shopping list items first
    const listMatch = partyPlan.items.find(
      (i) => i.name.toLowerCase().includes(query) || query.includes(i.name.toLowerCase())
    );

    if (listMatch) {
      return respond(
        `"${listMatch.name}" is located in ${listMatch.aisle} under ${listMatch.brand}. Price is $${listMatch.unitPrice.toFixed(2)}.`,
        'aisle',
        'Find Aisle'
      );
    }

    // Check master catalog
    const catMatch = CYMBAL_CATALOG_ITEMS.find(
      (i) => i.name.toLowerCase().includes(query) || query.includes(i.name.toLowerCase())
    );

    if (catMatch) {
      return respond(
        `"${catMatch.name}" is located in ${catMatch.aisle} under ${catMatch.brand} ($${catMatch.unitPrice.toFixed(2)}). Say "Add ${catMatch.name}" to put it in your cart!`,
        'aisle',
        'Find Catalog Aisle'
      );
    }

    return respond(`I couldn't locate "${query}" in the active store index. Try asking the CymbalMart Assistant!`, 'aisle', 'Aisle Unknown');
  }

  if (
    (t.includes('check all in aisle') || t.includes('mark aisle') || t.includes('complete aisle') || t.includes('check aisle')) &&
    !t.includes('uncheck')
  ) {
    const aisleNumMatch = t.match(/(\d+)/);
    if (aisleNumMatch) {
      const aisleNum = aisleNumMatch[1];
      const targetAisle = partyPlan.items.find((i) => i.aisle.includes(`Aisle ${aisleNum}`))?.aisle;
      if (targetAisle) {
        onCheckAllInAisle(targetAisle, true);
        return respond(`Checked off all items in ${targetAisle}!`, 'aisle', 'Check Aisle');
      }
    }
  }

  if (t.includes('uncheck aisle') || t.includes('uncheck all in aisle')) {
    const aisleNumMatch = t.match(/(\d+)/);
    if (aisleNumMatch) {
      const aisleNum = aisleNumMatch[1];
      const targetAisle = partyPlan.items.find((i) => i.aisle.includes(`Aisle ${aisleNum}`))?.aisle;
      if (targetAisle) {
        onCheckAllInAisle(targetAisle, false);
        return respond(`Unchecked all items in ${targetAisle}.`, 'aisle', 'Uncheck Aisle');
      }
    }
  }

  // ----------------------------------------------------
  // 8. SHOPPING LIST BATCH ACTIONS
  // ----------------------------------------------------
  if (t === 'check all' || t === 'check all items' || t === 'mark all complete' || t === 'select all') {
    onToggleAllItems(true);
    return respond('Checked all items on your shopping list.', 'shopping', 'Check All');
  }

  if (t === 'uncheck all' || t === 'uncheck all items' || t === 'deselect all') {
    onToggleAllItems(false);
    return respond('Unchecked all items on your shopping list.', 'shopping', 'Uncheck All');
  }

  if (t.includes('clear checked') || t.includes('remove checked') || t.includes('delete checked')) {
    onClearCheckedItems();
    return respond('Cleared all completed items from your list.', 'shopping', 'Clear Checked');
  }

  if (t.includes('undo') || t.includes('restore item') || t.includes('bring back item')) {
    onRestoreRemovedItem();
    return respond('Restored the recently removed item to your shopping list.', 'shopping', 'Undo Remove');
  }

  if (t.includes('scale') && (t.includes('percent') || t.includes('%') || t.includes('up') || t.includes('down'))) {
    if (t.includes('10') || t.includes('ten')) {
      onScaleQuantities(1.1);
      return respond('Scaled all item quantities up by 10%. Budget updated!', 'shopping', 'Scale Quantities');
    }
    if (t.includes('25') || t.includes('twenty five')) {
      onScaleQuantities(1.25);
      return respond('Scaled all item quantities up by 25% for larger appetite.', 'shopping', 'Scale Quantities');
    }
    if (t.includes('50') || t.includes('fifty')) {
      onScaleQuantities(1.5);
      return respond('Scaled all item quantities up by 50% for a large crowd.', 'shopping', 'Scale Quantities');
    }
    if (t.includes('20') || t.includes('twenty')) {
      onScaleQuantities(0.8);
      return respond('Scaled down item quantities by 20% to streamline budget.', 'shopping', 'Scale Quantities');
    }
  }

  // ----------------------------------------------------
  // 9. ITEM ADDITION (e.g. "Add 2 bags of ice", "Add salsa", "Add guacamole")
  // ----------------------------------------------------
  if (t.startsWith('add ') || t.startsWith('buy ') || t.startsWith('put ')) {
    let itemPhrase = t.replace(/^(add|buy|put)\s+/i, '').replace(/\s*(to (my |the )?(cart|list|manifest))\s*$/i, '').trim();

    // Extract quantity if present
    let qty = 1;
    const qtyMatch = itemPhrase.match(/^(\d+)\s*(bags? of|packs? of|cases? of|cans? of|bottles? of|units? of)?\s*(.*)$/i);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10);
      itemPhrase = qtyMatch[3].trim();
    }

    // Match against catalog items
    const catMatch = CYMBAL_CATALOG_ITEMS.find(
      (i) => i.name.toLowerCase().includes(itemPhrase) || itemPhrase.includes(i.name.toLowerCase())
    );

    if (catMatch) {
      const newItem: ShoppingItem = {
        ...catMatch,
        id: `voice-add-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        quantity: qty,
        checked: false,
      };
      onAddItem(newItem);
      return respond(
        `Added ${qty} × ${newItem.name} (${newItem.brand}, ${newItem.aisle}) for $${(newItem.unitPrice * qty).toFixed(2)}. Total updated!`,
        'shopping',
        'Add Catalog Item'
      );
    }

    // If not found in catalog, add as a custom item!
    const customItem: ShoppingItem = {
      id: `voice-custom-${Date.now()}`,
      name: itemPhrase.charAt(0).toUpperCase() + itemPhrase.slice(1),
      brand: 'Cymbal Basics',
      department: 'food',
      aisle: 'Aisle 3 - Snacks & Grocery',
      unitPrice: 4.99,
      quantity: qty,
      packageSize: '1 unit',
      whyNeeded: 'Added by voice command',
      checked: false,
    };
    onAddItem(customItem);
    return respond(
      `Added ${qty} × "${customItem.name}" to your shopping list for $${(customItem.unitPrice * qty).toFixed(2)}.`,
      'shopping',
      'Add Custom Item'
    );
  }

  // ----------------------------------------------------
  // 10. QUANTITY ADJUSTMENTS / REMOVALS / CHECKS (Item specific)
  // ----------------------------------------------------
  if (t.startsWith('remove ') || t.startsWith('delete ')) {
    const itemName = t.replace(/^(remove|delete)\s+/i, '').trim();
    const item = partyPlan.items.find(
      (i) => i.name.toLowerCase().includes(itemName) || itemName.includes(i.name.toLowerCase())
    );
    if (item) {
      onRemoveItem(item.id);
      return respond(`Removed "${item.name}" from your shopping list. Say "Undo" if you want it back.`, 'shopping', 'Remove Item');
    }
  }

  if (
    t.startsWith('check ') ||
    t.startsWith('mark ') ||
    t.startsWith('cross off ') ||
    t.startsWith('got ') ||
    t.startsWith('uncheck ')
  ) {
    const isUnchecking = t.startsWith('uncheck ');
    const itemName = t
      .replace(/^(check|mark|cross off|got|uncheck)\s+(off\s+)?/i, '')
      .replace(/\s+(as done|complete|done)\s*$/i, '')
      .trim();

    const item = partyPlan.items.find(
      (i) => i.name.toLowerCase().includes(itemName) || itemName.includes(i.name.toLowerCase())
    );

    if (item) {
      if ((isUnchecking && item.checked) || (!isUnchecking && !item.checked)) {
        onToggleCheckItem(item.id);
      }
      return respond(
        `${isUnchecking ? 'Unchecked' : 'Checked off'} "${item.name}".`,
        'shopping',
        'Toggle Item Check'
      );
    }
  }

  if (
    t.startsWith('increase ') ||
    t.startsWith('more ') ||
    t.startsWith('decrease ') ||
    t.startsWith('less ') ||
    t.startsWith('set ')
  ) {
    // e.g. "increase ice to 3" or "set guacamole quantity to 2"
    let targetItem: ShoppingItem | undefined;
    let newQty: number | undefined;

    const numMatch = t.match(/(\d+)/);
    if (numMatch) {
      newQty = parseInt(numMatch[1], 10);
    }

    targetItem = partyPlan.items.find(
      (i) => t.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(t.replace(/[^a-z]/g, ''))
    );

    if (targetItem) {
      const finalQty =
        newQty !== undefined
          ? newQty
          : t.startsWith('increase') || t.startsWith('more')
          ? targetItem.quantity + 1
          : Math.max(1, targetItem.quantity - 1);

      onUpdateQuantity(targetItem.id, finalQty);
      return respond(
        `Updated "${targetItem.name}" quantity to ${finalQty}. New item total is $${(targetItem.unitPrice * finalQty).toFixed(2)}.`,
        'shopping',
        'Update Quantity'
      );
    }
  }

  // ----------------------------------------------------
  // 11. SMART SWAPS (BUDGET / PREMIUM)
  // ----------------------------------------------------
  if (t.includes('swap') || t.includes('upgrade') || t.includes('switch')) {
    const isPremium = t.includes('premium') || t.includes('upgrade') || t.includes('gourmet');
    const targetItem = partyPlan.items.find(
      (i) =>
        (isPremium && i.premiumAlternative && (t.includes(i.name.toLowerCase()) || t.includes(i.premiumAlternative.toLowerCase()))) ||
        (!isPremium && i.budgetAlternative && (t.includes(i.name.toLowerCase()) || t.includes(i.budgetAlternative.toLowerCase())))
    ) || partyPlan.items.find((i) => (isPremium ? !!i.premiumAlternative : !!i.budgetAlternative));

    if (targetItem) {
      onSwapItem(targetItem.id, isPremium ? 'premium' : 'budget');
      return respond(
        isPremium
          ? `Upgraded "${targetItem.name}" to gourmet tier (${targetItem.premiumAlternative}).`
          : `Swapped "${targetItem.name}" to budget alternative (${targetItem.budgetAlternative}), saving 30%!`,
        'shopping',
        'Swap Item'
      );
    }
  }

  // ----------------------------------------------------
  // 12. HOST TOOLKIT & RECIPE READOUTS
  // ----------------------------------------------------
  if (
    t.includes('read recipe') ||
    t.includes('tell me the recipe') ||
    t.includes('how to make') ||
    t.includes('signature drink') ||
    t.includes('signature cocktail') ||
    t.includes('cocktail recipe')
  ) {
    if (partyPlan.signatureRecipe) {
      const r = partyPlan.signatureRecipe;
      const text = `The signature recipe is "${r.name}" (${r.type}, prep time: ${r.prepTime}). Key ingredients include: ${r.ingredients.slice(0, 3).join(', ')}. Say "Go to host toolkit" to see full step-by-step instructions!`;
      return respond(text, 'toolkit', 'Read Recipe');
    }
  }

  if (
    t.includes('read timeline') ||
    t.includes('what are my tasks') ||
    t.includes('upcoming tasks') ||
    t.includes('prep tasks')
  ) {
    const pendingMilestone = partyPlan.prepTimeline.find((m) => m.tasks.some((task) => !task.done));
    if (pendingMilestone) {
      const pendingTask = pendingMilestone.tasks.find((task) => !task.done);
      const text = `Your next prep milestone is "${pendingMilestone.timeframe}: ${pendingMilestone.title}". Next task: "${pendingTask?.text || 'All tasks done'}".`;
      return respond(text, 'toolkit', 'Read Timeline');
    } else {
      return respond('All prep timeline tasks are marked complete! You are ready to host.', 'toolkit', 'Read Timeline');
    }
  }

  // ----------------------------------------------------
  // 13. CONVERSATIONAL FALLBACK TO CYMBALMART ASSISTANT
  // (Customers can ask any party/grocery question completely hands-free!)
  // ----------------------------------------------------
  try {
    const aiAnswer = await sendCymbalMartAssistantChat(
      [{ id: `voice-${Date.now()}`, role: 'user', content: rawTranscript, timestamp: new Date().toLocaleTimeString() }],
      partyPlan
    );
    return respond(aiAnswer, 'ai_chat', 'AI Assistant Voice Answer');
  } catch (err) {
    return respond(
      `I heard "${rawTranscript}". You can say "Go to shopping list", "Add 2 bags of ice", "Set budget to $200", or "Open checkout".`,
      'unknown',
      'Unknown Command'
    );
  }
}
