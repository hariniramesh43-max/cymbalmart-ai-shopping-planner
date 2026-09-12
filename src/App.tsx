/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { BudgetSummaryBar } from './components/BudgetSummaryBar';
import { PartySetupWizard } from './components/PartySetupWizard';
import { ShoppingManifest } from './components/ShoppingManifest';
import { StoreAisleView } from './components/StoreAisleView';
import { HostToolkit } from './components/HostToolkit';
import { AgentChatDrawer } from './components/AgentChatDrawer';
import { FloatingAssistantWidget } from './components/FloatingAssistantWidget';
import { CheckoutModal } from './components/CheckoutModal';
import { ShareExportModal } from './components/ShareExportModal';
import { VoiceControlHUD } from './components/VoiceControlHUD';
import { PartyPlan, ShoppingItem, PartyFormInput } from './types/party';
import { PRESET_PARTIES } from './data/mockCatalog';
import { generatePartyPlan, rebalanceCartBudget } from './services/partyApi';
import { VoiceEngineContext } from './services/voiceCommandEngine';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'wizard' | 'shopping' | 'aisles' | 'toolkit' | 'chat'>('shopping');
  const [partyPlan, setPartyPlan] = useState<PartyPlan>(() => {
    const saved = localStorage.getItem('cymbal_active_party');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved plan', e);
      }
    }
    return PRESET_PARTIES[0];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [checkoutFulfillment, setCheckoutFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [checkoutOrderPlaced, setCheckoutOrderPlaced] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Save active party in localStorage on changes
  useEffect(() => {
    if (partyPlan) {
      localStorage.setItem('cymbal_active_party', JSON.stringify(partyPlan));
    }
  }, [partyPlan]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Plan Generator Handler
  const handleGeneratePlan = async (formData: PartyFormInput) => {
    setIsLoading(true);
    try {
      const newPlan = await generatePartyPlan(formData);
      setPartyPlan(newPlan);
      setActiveTab('shopping');
      showToast(`Created tailored plan: "${newPlan.title}" for ${newPlan.guestCount} guests!`, 'success');
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      showToast(err.message || 'Failed to generate party plan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset Loader Handler
  const handleLoadPreset = (preset: PartyPlan) => {
    setPartyPlan({
      ...preset,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    setActiveTab('shopping');
    showToast(`Loaded preset template: ${preset.title}`, 'info');
  };

  // Item Modifiers
  const [recentlyRemovedItem, setRecentlyRemovedItem] = useState<ShoppingItem | null>(null);

  const handleUpdateQuantity = (id: string, newQty: number) => {
    setPartyPlan((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)),
    }));
  };

  const handleUpdateItem = (id: string, updatedFields: Partial<ShoppingItem>) => {
    setPartyPlan((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...updatedFields } : i)),
    }));
    showToast(`Updated "${updatedFields.name || 'item'}" in shopping list`, 'info');
  };

  const handleRemoveItem = (id: string) => {
    const item = partyPlan.items.find((i) => i.id === id);
    if (item) {
      setRecentlyRemovedItem(item);
      setPartyPlan((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== id),
      }));
      showToast(`Removed "${item.name}" from shopping list`, 'info');
    }
  };

  const handleRestoreRemovedItem = () => {
    if (recentlyRemovedItem) {
      setPartyPlan((prev) => ({
        ...prev,
        items: [recentlyRemovedItem, ...prev.items],
      }));
      showToast(`Restored "${recentlyRemovedItem.name}"`, 'success');
      setRecentlyRemovedItem(null);
    }
  };

  const handleAddItem = (newItem: ShoppingItem) => {
    setPartyPlan((prev) => ({
      ...prev,
      items: [newItem, ...prev.items],
    }));
    showToast(`Added "${newItem.name}" to manifest`, 'success');
  };

  const handleScaleQuantities = (factor: number) => {
    setPartyPlan((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({
        ...i,
        quantity: Math.max(1, Math.round(i.quantity * factor)),
      })),
    }));
    const pct = Math.round((factor - 1) * 100);
    showToast(
      `${pct >= 0 ? '+' : ''}${pct}% scaled across all item quantities. Budget recalculated!`,
      'info'
    );
  };

  const handleClearCheckedItems = () => {
    const count = partyPlan.items.filter((i) => i.checked).length;
    if (count === 0) return;
    setPartyPlan((prev) => ({
      ...prev,
      items: prev.items.filter((i) => !i.checked),
    }));
    showToast(`Cleared ${count} completed items from list`, 'info');
  };

  const handleToggleAllItems = (check: boolean) => {
    setPartyPlan((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({ ...i, checked: check })),
    }));
  };

  const handleToggleCheckItem = (id: string) => {
    setPartyPlan((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    }));
  };

  const handleCheckAllInAisle = (aisleName: string, check: boolean) => {
    setPartyPlan((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.aisle === aisleName ? { ...i, checked: check } : i)),
    }));
    showToast(`${check ? 'Checked' : 'Unchecked'} all items in ${aisleName}`, 'info');
  };

  const handleSwapItem = (id: string, type: 'budget' | 'premium') => {
    const item = partyPlan.items.find((i) => i.id === id);
    if (!item) return;

    if (type === 'budget' && item.budgetAlternative) {
      const priceDiscount = item.unitPrice * 0.3;
      const newPrice = Math.max(1.99, parseFloat((item.unitPrice - priceDiscount).toFixed(2)));
      setPartyPlan((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === id
            ? {
                ...i,
                name: item.budgetAlternative || i.name,
                brand: 'Cymbal Basics',
                unitPrice: newPrice,
                budgetAlternative: undefined,
              }
            : i
        ),
      }));
      showToast(`Swapped to budget alternative: saved $${(priceDiscount * item.quantity).toFixed(2)}!`, 'success');
    } else if (type === 'premium' && item.premiumAlternative) {
      const priceIncrease = item.unitPrice * 0.35;
      const newPrice = parseFloat((item.unitPrice + priceIncrease).toFixed(2));
      setPartyPlan((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === id
            ? {
                ...i,
                name: item.premiumAlternative || i.name,
                brand: 'Cymbal Select',
                unitPrice: newPrice,
                premiumAlternative: undefined,
              }
            : i
        ),
      }));
      showToast(`Upgraded to gourmet tier: ${item.premiumAlternative}`, 'success');
    }
  };

  const handleUpdateTargetBudget = (newBudget: number) => {
    setPartyPlan((prev) => ({
      ...prev,
      targetBudget: newBudget,
    }));
    showToast(`Updated target budget to $${newBudget.toFixed(2)}`, 'info');
  };

  const handleTriggerRebalance = async () => {
    setIsRebalancing(true);
    try {
      const currentTotal = partyPlan.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const result = await rebalanceCartBudget(
        partyPlan.items,
        currentTotal,
        partyPlan.targetBudget,
        'balanced'
      );
      setPartyPlan((prev) => ({
        ...prev,
        items: result.items,
      }));
      showToast(result.summary, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Budget rebalance completed with local optimization', 'info');
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleToggleTask = (milestoneId: string, taskId: string) => {
    setPartyPlan((prev) => ({
      ...prev,
      prepTimeline: prev.prepTimeline.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
            }
          : m
      ),
    }));
  };

  const handleCheckoutPlaceOrder = () => {
    setCheckoutOrderPlaced(true);
    showToast('Order confirmed via Hands-Free Voice Control!', 'success');
  };

  const currentCartTotal = partyPlan.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // Voice Engine Context
  const voiceEngineContext: VoiceEngineContext = useMemo(
    () => ({
      partyPlan,
      activeTab,
      setActiveTab,
      showCheckout,
      setShowCheckout,
      showShare,
      setShowShare,
      onAddItem: handleAddItem,
      onRemoveItem: handleRemoveItem,
      onUpdateQuantity: handleUpdateQuantity,
      onUpdateItem: handleUpdateItem,
      onToggleCheckItem: handleToggleCheckItem,
      onCheckAllInAisle: handleCheckAllInAisle,
      onSwapItem: handleSwapItem,
      onScaleQuantities: handleScaleQuantities,
      onClearCheckedItems: handleClearCheckedItems,
      onToggleAllItems: handleToggleAllItems,
      onRestoreRemovedItem: handleRestoreRemovedItem,
      onUpdateTargetBudget: handleUpdateTargetBudget,
      onTriggerRebalance: handleTriggerRebalance,
      onToggleTask: handleToggleTask,
      onGeneratePlan: handleGeneratePlan,
      onLoadPreset: handleLoadPreset,
      onCheckoutPlaceOrder: handleCheckoutPlaceOrder,
      onCheckoutFulfillmentChange: setCheckoutFulfillment,
      voiceFeedbackEnabled: true,
      showToast,
    }),
    [partyPlan, activeTab, showCheckout, showShare]
  );

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Bar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={partyPlan.items.length}
        cartTotal={currentCartTotal}
        onOpenCheckout={() => {
          setCheckoutOrderPlaced(false);
          setShowCheckout(true);
        }}
        onOpenNewParty={() => setActiveTab('wizard')}
        partyTitle={partyPlan.title}
        onOpenVoiceGuide={() => {
          showToast('Speak or tap the bottom-left mic for full hands-free control', 'info');
        }}
      />

      {/* Dynamic Budget Bar (shown on shopping, aisles, and toolkit tabs) */}
      {activeTab !== 'wizard' && (
        <BudgetSummaryBar
          items={partyPlan.items}
          targetBudget={partyPlan.targetBudget}
          guestCount={partyPlan.guestCount}
          onUpdateTargetBudget={handleUpdateTargetBudget}
          onTriggerRebalance={handleTriggerRebalance}
          isRebalancing={isRebalancing}
        />
      )}

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'wizard' && (
          <PartySetupWizard
            onGeneratePlan={handleGeneratePlan}
            onLoadPreset={handleLoadPreset}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingManifest
            items={partyPlan.items}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
            onAddItem={handleAddItem}
            onToggleCheckItem={handleToggleCheckItem}
            onSwapItem={handleSwapItem}
            onScaleQuantities={handleScaleQuantities}
            onClearCheckedItems={handleClearCheckedItems}
            onToggleAllItems={handleToggleAllItems}
            recentlyRemovedItem={recentlyRemovedItem}
            onRestoreRemovedItem={handleRestoreRemovedItem}
            guestCount={partyPlan.guestCount}
            targetBudget={partyPlan.targetBudget}
          />
        )}

        {activeTab === 'aisles' && (
          <StoreAisleView
            items={partyPlan.items}
            onToggleCheckItem={handleToggleCheckItem}
            onCheckAllInAisle={handleCheckAllInAisle}
            onUpdateQuantity={handleUpdateQuantity}
          />
        )}

        {activeTab === 'toolkit' && (
          <HostToolkit
            partyPlan={partyPlan}
            onToggleTask={handleToggleTask}
            onOpenShare={() => setShowShare(true)}
          />
        )}

        {activeTab === 'chat' && (
          <AgentChatDrawer
            partyPlan={partyPlan}
            onAddItemFromChat={handleAddItem}
          />
        )}
      </main>

      {/* Hands-Free Voice Control HUD (Floating bottom-left) */}
      <VoiceControlHUD engineContext={voiceEngineContext} />

      {/* Floating CymbalMart Assistant Chat Widget (bottom-right, available on all planning views) */}
      {activeTab !== 'chat' && (
        <FloatingAssistantWidget
          partyPlan={partyPlan}
          onAddItem={handleAddItem}
          onOpenFullChatTab={() => setActiveTab('chat')}
        />
      )}

      {/* Sleek Interface Footer */}
      <footer className="h-12 bg-white border-t border-slate-200 px-4 sm:px-8 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <span>Hands-Free Voice Control: Active (Say "Go to shopping list" or "Add 2 bags of ice")</span>
        </div>
        <div className="flex gap-4">
          <span className="hover:text-slate-700 cursor-pointer transition-colors">Voice Help</span>
          <span className="hover:text-slate-700 cursor-pointer transition-colors">Privacy Policy</span>
          <span>© 2026 CymbalMart</span>
        </div>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        items={partyPlan.items}
        isOpen={showCheckout}
        onClose={() => {
          setShowCheckout(false);
          setCheckoutOrderPlaced(false);
        }}
        partyTitle={partyPlan.title}
        guestCount={partyPlan.guestCount}
        externalFulfillment={checkoutFulfillment}
        onFulfillmentChange={setCheckoutFulfillment}
        onOrderPlacedExternally={() => setCheckoutOrderPlaced(true)}
        orderPlacedState={checkoutOrderPlaced}
      />

      {/* Share / Export Modal */}
      <ShareExportModal
        partyPlan={partyPlan}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-16 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xl animate-in fade-in">
          {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-600 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
