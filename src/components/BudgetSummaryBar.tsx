import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Edit2,
  Check,
  RefreshCw,
  PieChart,
  Users,
  DollarSign,
  Award,
} from 'lucide-react';
import { ShoppingItem, Department } from '../types/party';

interface BudgetSummaryBarProps {
  items: ShoppingItem[];
  targetBudget: number;
  guestCount: number;
  onUpdateTargetBudget: (newBudget: number) => void;
  onTriggerRebalance: () => void;
  isRebalancing?: boolean;
}

const DEPT_COLORS: Record<Department, { bg: string; text: string; bar: string; label: string }> = {
  food: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', label: 'Food' },
  beverages: { bg: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-500', label: 'Beverages' },
  tableware: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', label: 'Tableware' },
  decor: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', label: 'Decor' },
  entertainment: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500', label: 'Fun' },
};

export const BudgetSummaryBar: React.FC<BudgetSummaryBarProps> = ({
  items,
  targetBudget,
  guestCount,
  onUpdateTargetBudget,
  onTriggerRebalance,
  isRebalancing = false,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [customBudgetInput, setCustomBudgetInput] = useState(targetBudget.toString());
  const [showDeptBreakdown, setShowDeptBreakdown] = useState(false);

  // Real-time automatic recalculations
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const currentTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const diff = targetBudget - currentTotal;
  const isOverBudget = diff < -0.01;
  const isNearBudget = diff >= 0 && diff <= targetBudget * 0.1;
  const percentUsed = targetBudget > 0 ? (currentTotal / targetBudget) * 100 : 0;
  const costPerGuest = guestCount > 0 ? currentTotal / guestCount : 0;
  const cymbalRewardsPoints = Math.round(currentTotal * 2);
  const qualifiedForCoupon = currentTotal >= 100;

  // Department spend breakdown
  const deptBreakdown = items.reduce(
    (acc, item) => {
      acc[item.department] = (acc[item.department] || 0) + item.unitPrice * item.quantity;
      return acc;
    },
    { food: 0, beverages: 0, tableware: 0, decor: 0, entertainment: 0 } as Record<Department, number>
  );

  const handleSaveBudget = () => {
    const val = parseFloat(customBudgetInput);
    if (!isNaN(val) && val > 0) {
      onUpdateTargetBudget(val);
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 text-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 space-y-2.5">
        {/* Main Stat Strip */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Key Metrics Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 w-full lg:w-auto">
            {/* Target Budget */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Target Budget
              </span>
              {isEditingBudget ? (
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-medium text-xs">$</span>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    value={customBudgetInput}
                    onChange={(e) => setCustomBudgetInput(e.target.value)}
                    className="w-20 px-2 py-0.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                  />
                  <button
                    onClick={handleSaveBudget}
                    className="p-1 text-teal-600 hover:bg-slate-100 rounded-md cursor-pointer"
                    title="Save target budget"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCustomBudgetInput(targetBudget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="flex items-center gap-1 font-bold font-mono text-sm sm:text-base text-slate-900 hover:text-teal-700 transition-colors group cursor-pointer"
                  title="Click to edit target budget"
                >
                  <span>${targetBudget.toFixed(2)}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-teal-600 opacity-70" />
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Current Cart Total (Auto-Recalculating) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Live Total
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-bold font-mono text-sm sm:text-base transition-colors ${
                    isOverBudget ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  ${currentTotal.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({items.length} items / {totalUnits} units)
                </span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Status / Difference Badge */}
            <div className="flex items-center gap-1.5">
              {isOverBudget ? (
                <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 animate-in fade-in duration-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>${Math.abs(diff).toFixed(2)} Over Target ({Math.round(percentUsed)}%)</span>
                </div>
              ) : isNearBudget ? (
                <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>On Target! (${diff.toFixed(2)} remaining)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                  <span>${diff.toFixed(2)} Under Budget ({Math.round(percentUsed)}%)</span>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 hidden md:block" />

            {/* Cost Per Guest */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Per Guest:</span>
              <span className="font-bold font-mono text-slate-900">${costPerGuest.toFixed(2)}</span>
            </div>

            {/* Rewards points indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50/70 border border-teal-200/60 px-2 py-0.5 rounded-md">
              <Award className="w-3 h-3 text-teal-600" />
              <span className="font-semibold text-[11px]">+{cymbalRewardsPoints} Cymbal Pts</span>
              {qualifiedForCoupon && (
                <span className="text-[10px] font-bold bg-teal-600 text-white px-1.5 py-0.2 rounded">
                  $10 Off Active
                </span>
              )}
            </div>
          </div>

          {/* Action / Rebalance & Breakdown Trigger */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowDeptBreakdown(!showDeptBreakdown)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                showDeptBreakdown
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Toggle department spend breakdown"
            >
              <PieChart className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Spend Breakdown</span>
            </button>

            {isOverBudget ? (
              <button
                onClick={onTriggerRebalance}
                disabled={isRebalancing}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {isRebalancing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>1-Click Budget Fix</span>
              </button>
            ) : (
              <button
                onClick={onTriggerRebalance}
                disabled={isRebalancing}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {isRebalancing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-300" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-teal-300" />
                )}
                <span>Smart Rebalance</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Visual Budget Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
          {(['food', 'beverages', 'tableware', 'decor', 'entertainment'] as Department[]).map((dept) => {
            const deptAmount = deptBreakdown[dept] || 0;
            const widthPct = targetBudget > 0 ? Math.min(100, (deptAmount / targetBudget) * 100) : 0;
            if (widthPct <= 0) return null;
            return (
              <div
                key={dept}
                style={{ width: `${widthPct}%` }}
                className={`${DEPT_COLORS[dept].bar} h-full transition-all duration-300`}
                title={`${DEPT_COLORS[dept].label}: $${deptAmount.toFixed(2)} (${Math.round((deptAmount / (currentTotal || 1)) * 100)}%)`}
              />
            );
          })}
          {isOverBudget && (
            <div
              style={{ width: `${Math.min(30, ((currentTotal - targetBudget) / targetBudget) * 100)}%` }}
              className="bg-rose-500 h-full animate-pulse"
              title={`Over budget by $${Math.abs(diff).toFixed(2)}`}
            />
          )}
        </div>

        {/* Expandable Department Spend Breakdown Bar */}
        {showDeptBreakdown && (
          <div className="pt-2 pb-1 grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-slate-100 animate-in fade-in duration-150 text-xs">
            {(['food', 'beverages', 'tableware', 'decor', 'entertainment'] as Department[]).map((dept) => {
              const amount = deptBreakdown[dept] || 0;
              const pctOfSpend = currentTotal > 0 ? Math.round((amount / currentTotal) * 100) : 0;
              const config = DEPT_COLORS[dept];
              return (
                <div
                  key={dept}
                  className={`p-2 rounded-xl border border-slate-200/80 ${config.bg} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{config.label}</span>
                    <span className="font-bold text-slate-500">{pctOfSpend}%</span>
                  </div>
                  <div className="mt-1 font-bold font-mono text-slate-900 text-xs">
                    ${amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
