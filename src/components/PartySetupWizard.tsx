import React, { useState } from 'react';
import { Sparkles, Users, DollarSign, Utensils, Compass, SunMedium, PartyPopper, Check, Flame, ChevronRight, HelpCircle } from 'lucide-react';
import { PartyFormInput, PartyPlan } from '../types/party';
import { PRESET_PARTIES } from '../data/mockCatalog';

interface PartySetupWizardProps {
  onGeneratePlan: (form: PartyFormInput) => void;
  onLoadPreset: (preset: PartyPlan) => void;
  isLoading: boolean;
}

const PARTY_TYPES = [
  { id: 'Birthday Celebration', label: '🎂 Birthday Party', desc: 'Festive treats, decor, cake & favors' },
  { id: 'Casual Dinner & Hangout', label: '🌮 Dinner / Fiesta', desc: 'DIY food bar, batch drinks & mingling' },
  { id: 'Summer BBQ & Cookout', label: '🔥 BBQ & Cookout', desc: 'Grilled mains, crisp sides & cool drinks' },
  { id: 'Cocktail & Tapas Night', label: '🍸 Cocktail & Tapas', desc: 'Craft mixology, charcuterie & canapés' },
  { id: 'Game Night & Snacks', label: '🎲 Game & Movie Night', desc: 'Finger foods, dips & popcorn bowls' },
  { id: 'Kids Birthday Party', label: '🚀 Kids Adventure', desc: 'Kid-friendly bites, themed juice & fun' },
  { id: 'Baby / Bridal Shower', label: '🌸 Shower & Brunch', desc: 'Pastries, spritzers & elegant tableware' },
  { id: 'Holiday & Seasonal', label: '✨ Holiday Gathering', desc: 'Seasonal spreads, cozy lighting & cheer' },
];

const THEME_IDEAS = [
  'Modern Galactic / Space',
  'Tropical Sunkissed Fiesta',
  'Rustic Tuscan Wine & Pasta',
  'Street Taco & Margaritas Bar',
  'Cozy Backyard Firepit & S’mores',
  'Neon 80s Retro Arcade',
  'Glamorous Champagne & Caviar Tapas',
  'Botanical Garden Tea & Spritz',
];

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Nut-Free',
  'Dairy-Free',
  'Non-Alcoholic (Mocktails Only)',
  'Eco-Friendly (100% Compostable Tableware)',
];

export const PartySetupWizard: React.FC<PartySetupWizardProps> = ({
  onGeneratePlan,
  onLoadPreset,
  isLoading,
}) => {
  const [partyType, setPartyType] = useState('Casual Dinner & Hangout');
  const [theme, setTheme] = useState('Street Taco & Margaritas Bar');
  const [budget, setBudget] = useState<number>(200);
  const [guestCount, setGuestCount] = useState<number>(16);
  const [adultCount, setAdultCount] = useState<number>(14);
  const [kidCount, setKidCount] = useState<number>(2);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(['Eco-Friendly (100% Compostable Tableware)']);
  const [indoorOutdoor, setIndoorOutdoor] = useState<'indoor' | 'outdoor' | 'both'>('indoor');
  const [vibe, setVibe] = useState('Upbeat & Lively with warm ambient lighting');
  const [specialRequests, setSpecialRequests] = useState('');

  const toggleDietary = (item: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  const handleGuestCountChange = (total: number) => {
    const safeTotal = Math.max(2, Math.min(100, total));
    setGuestCount(safeTotal);
    const kids = Math.min(kidCount, safeTotal);
    setKidCount(kids);
    setAdultCount(safeTotal - kids);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGeneratePlan({
      partyType,
      theme,
      budget,
      guestCount,
      adultCount,
      kidCount,
      dietaryRestrictions,
      specialRequests,
      indoorOutdoor,
      vibe,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Banner */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CymbalMart AI Shopping Concierge</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Plan Your Next Party with CymbalMart
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
          Tell us about your event. Our shopping agent will craft a budget-exact grocery manifest, serving portions, and aisle-by-aisle shopping route.
        </p>
      </div>

      {/* Quick Start Presets Bar */}
      <div className="mb-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            ⚡ Quick-Load Popular Party Templates
          </span>
          <span className="text-xs text-teal-600 font-medium hidden sm:inline">1-Click instant plans</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_PARTIES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onLoadPreset(preset)}
              type="button"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 hover:border-teal-300 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div>
                <h4 className="font-semibold text-sm text-slate-800 group-hover:text-teal-900 transition-colors">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {preset.guestCount} guests • Target: <span className="font-mono font-medium text-teal-700">${preset.targetBudget}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform">
                <span>Load</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Party Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-lg font-semibold text-slate-800 pb-3 border-b border-slate-100">
          Party Parameters
        </h2>

        {/* 1. Party Type Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            1. Party Type & Occasion
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PARTY_TYPES.map((type) => {
              const isSelected = partyType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPartyType(type.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900">{type.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{type.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Theme & Vibe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Theme & Aesthetic
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Modern Galactic / Space"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
              required
            />
            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {THEME_IDEAS.slice(0, 4).map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setTheme(idea)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Atmosphere & Lighting Vibe
            </label>
            <input
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. Warm string lights, ambient lo-fi playlist"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
            />
          </div>
        </div>

        {/* 3. Guest Count & Budget Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          {/* Guest Count */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Guest Count: <span className="text-teal-700 font-bold font-mono text-sm">{guestCount} People</span>
              </label>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              value={guestCount}
              onChange={(e) => handleGuestCountChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />

            <div className="flex items-center gap-3 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Adults:</span>
                <input
                  type="number"
                  min="1"
                  max={guestCount}
                  value={adultCount}
                  onChange={(e) => {
                    const adults = Math.max(1, Math.min(guestCount, parseInt(e.target.value) || 1));
                    setAdultCount(adults);
                    setKidCount(guestCount - adults);
                  }}
                  className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Kids:</span>
                <input
                  type="number"
                  min="0"
                  max={guestCount}
                  value={kidCount}
                  onChange={(e) => {
                    const kids = Math.max(0, Math.min(guestCount, parseInt(e.target.value) || 0));
                    setKidCount(kids);
                    setAdultCount(guestCount - kids);
                  }}
                  className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Target Budget */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Target Budget Limit
              </label>
              <span className="text-teal-700 font-extrabold font-mono text-sm">${budget.toFixed(0)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                min="25"
                max="2500"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Math.max(20, parseFloat(e.target.value) || 20))}
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-teal-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              ≈ <strong className="text-slate-800 font-mono">${(budget / (guestCount || 1)).toFixed(2)}</strong> per guest allocated.
            </p>
          </div>
        </div>

        {/* 4. Dietary & Eco Preferences */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            4. Dietary & Sustainable Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((item) => {
              const isSelected = dietaryRestrictions.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleDietary(item)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Venue Setting & Special Requests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Venue Environment
            </label>
            <select
              value={indoorOutdoor}
              onChange={(e) => setIndoorOutdoor(e.target.value as 'indoor' | 'outdoor' | 'both')}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
            >
              <option value="indoor">🏠 Indoor Home / Living Room</option>
              <option value="outdoor">🌳 Outdoor Backyard / Patio / Park</option>
              <option value="both">🏡 Indoor + Outdoor Flow</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Special Requests & Notes
            </label>
            <input
              type="text"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g. Include 1 signature punch, extra crushed ice..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Crafting Budget-Exact CymbalMart Manifest...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-100" />
                <span>Generate Smart Shopping Manifest & Plan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
