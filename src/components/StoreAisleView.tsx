import React from 'react';
import { Navigation, Snowflake, Check, Plus, Minus } from 'lucide-react';
import { ShoppingItem } from '../types/party';

interface StoreAisleViewProps {
  items: ShoppingItem[];
  onToggleCheckItem: (id: string) => void;
  onCheckAllInAisle: (aisleName: string, check: boolean) => void;
  onUpdateQuantity?: (id: string, newQty: number) => void;
}

export const StoreAisleView: React.FC<StoreAisleViewProps> = ({
  items,
  onToggleCheckItem,
  onCheckAllInAisle,
  onUpdateQuantity,
}) => {
  // Group items by Aisle
  const aisleGroups = items.reduce((acc, item) => {
    const aisleKey = item.aisle || 'General Store';
    if (!acc[aisleKey]) {
      acc[aisleKey] = [];
    }
    acc[aisleKey].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  // Sort aisles numerically if possible
  const sortedAisles = Object.keys(aisleGroups).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '999', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '999', 10);
    return numA - numB;
  });

  const totalItems = items.length;
  const checkedCount = items.filter((i) => i.checked).length;
  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & In-Store Guidance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Navigation className="w-3.5 h-3.5" />
              <span>CymbalMart In-Store Shopper Path</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Aisle-by-Aisle Shopping Route</h2>
            <p className="text-xs text-slate-500 mt-1">
              Optimized front-to-back path through your local CymbalMart to save walking time and keep cold items fresh.
            </p>
          </div>

          {/* Progress Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[220px] text-right">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Cart Progress</div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-2xl font-bold font-mono text-teal-700">
                {checkedCount} / {totalItems}
              </span>
              <span className="text-xs text-slate-500 font-medium">({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-teal-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cold-chain Pro Tip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          <Snowflake className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong className="text-slate-800">Pro Tip:</strong> Produce, dry tableware, and decor are listed first. Chilled deli meats, beverages, and bagged ice are staged last for peak freshness.
          </span>
        </div>
      </div>

      {/* Aisle Cards List */}
      <div className="space-y-4">
        {sortedAisles.map((aisleName, idx) => {
          const aisleItems = aisleGroups[aisleName];
          const allCheckedInAisle = aisleItems.every((i) => i.checked);
          const aisleTotal = aisleItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

          return (
            <div
              key={aisleName}
              className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                allCheckedInAisle
                  ? 'border-slate-200/80 bg-slate-50/50 opacity-75'
                  : 'border-slate-200 shadow-sm'
              }`}
            >
              {/* Aisle Banner Header */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{aisleName}</h3>
                    <div className="text-[11px] text-slate-500">
                      {aisleItems.length} {aisleItems.length === 1 ? 'item' : 'items'} • Subtotal: <span className="font-mono font-semibold text-teal-700">${aisleTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onCheckAllInAisle(aisleName, !allCheckedInAisle)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {allCheckedInAisle ? 'Uncheck Aisle' : 'Mark All in Aisle'}
                </button>
              </div>

              {/* Items in this aisle */}
              <div className="divide-y divide-slate-100">
                {aisleItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:px-5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => onToggleCheckItem(item.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          item.checked
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div
                          className={`font-semibold text-xs text-slate-900 ${
                            item.checked ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.brand} • {item.packageSize}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {onUpdateQuantity && (
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="text-right shrink-0 min-w-[70px]">
                        <div className="text-xs font-bold font-mono text-slate-900">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ${item.unitPrice.toFixed(2)} / pack
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
