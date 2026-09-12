import React from 'react';
import { ShoppingBag, Mic } from 'lucide-react';

interface NavbarProps {
  activeTab: 'wizard' | 'shopping' | 'aisles' | 'toolkit' | 'chat';
  setActiveTab: (tab: 'wizard' | 'shopping' | 'aisles' | 'toolkit' | 'chat') => void;
  cartCount: number;
  cartTotal: number;
  onOpenCheckout: () => void;
  onOpenNewParty: () => void;
  partyTitle?: string;
  onOpenVoiceGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  cartTotal,
  onOpenCheckout,
  onOpenNewParty,
  onOpenVoiceGuide,
}) => {
  const navItems = [
    { id: 'wizard' as const, label: 'Plan Party' },
    { id: 'shopping' as const, label: 'Shopping List', badge: cartCount },
    { id: 'aisles' as const, label: 'Store Aisles' },
    { id: 'toolkit' as const, label: 'Host Toolkit' },
    { id: 'chat' as const, label: 'Assistant' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone: 1 text element without subtext in DOM */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewParty}
            className="flex items-center gap-2 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg py-1 cursor-pointer"
          >
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-xs group-hover:bg-teal-700 transition-colors text-white font-bold text-sm">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              CymbalMart Party
            </span>
          </button>
        </div>

        {/* Navigation Zone (5 items) */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Primary Action Zone (1-2 actions: Voice & Checkout) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenVoiceGuide && (
            <button
              onClick={onOpenVoiceGuide}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              title="Hands-free voice control guide & status"
            >
              <Mic className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Voice Control</span>
            </button>
          )}

          <button
            onClick={onOpenCheckout}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-teal-100" />
            <span className="font-mono font-medium">${cartTotal.toFixed(2)}</span>
            <span className="hidden sm:inline font-semibold">Checkout</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto gap-1.5 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 font-semibold transition-colors ${
              activeTab === item.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
          </button>
        ))}
      </div>
    </header>
  );
};
