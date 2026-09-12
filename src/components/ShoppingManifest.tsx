import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  Search,
  Check,
  ArrowDownUp,
  Store,
  Package,
  Info,
  Minus,
  Edit3,
  Sliders,
  RotateCcw,
  CheckSquare,
  Square,
  DollarSign,
  AlertCircle,
  Tag,
  Zap,
} from 'lucide-react';
import { ShoppingItem, Department } from '../types/party';
import { STORE_DEPARTMENTS, CYMBAL_CATALOG_ITEMS } from '../data/mockCatalog';

interface ShoppingManifestProps {
  items: ShoppingItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onUpdateItem: (id: string, updated: Partial<ShoppingItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (item: ShoppingItem) => void;
  onToggleCheckItem: (id: string) => void;
  onSwapItem: (id: string, type: 'budget' | 'premium') => void;
  onScaleQuantities?: (factor: number) => void;
  onClearCheckedItems?: () => void;
  onToggleAllItems?: (check: boolean) => void;
  recentlyRemovedItem?: ShoppingItem | null;
  onRestoreRemovedItem?: () => void;
  guestCount: number;
  targetBudget: number;
}

export const ShoppingManifest: React.FC<ShoppingManifestProps> = ({
  items,
  onUpdateQuantity,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onToggleCheckItem,
  onSwapItem,
  onScaleQuantities,
  onClearCheckedItems,
  onToggleAllItems,
  recentlyRemovedItem,
  onRestoreRemovedItem,
  guestCount,
  targetBudget,
}) => {
  const [activeDept, setActiveDept] = useState<Department | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showScaleMenu, setShowScaleMenu] = useState(false);

  // Catalog search & state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogQuantities, setCatalogQuantities] = useState<Record<string, number>>({});

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('Cymbal Basics');
  const [customDept, setCustomDept] = useState<Department>('food');
  const [customAisle, setCustomAisle] = useState('Aisle 3 - Snacks');
  const [customPrice, setCustomPrice] = useState('4.99');
  const [customQty, setCustomQty] = useState(1);
  const [customSize, setCustomSize] = useState('16 oz');
  const [customWhy, setCustomWhy] = useState('Host party favorite');

  // Edit Item Form State
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editDept, setEditDept] = useState<Department>('food');
  const [editAisle, setEditAisle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editSize, setEditSize] = useState('');
  const [editWhy, setEditWhy] = useState('');

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchDept = activeDept === 'all' || item.department === activeDept;
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aisle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchQuery;
  });

  // Real-time automatic calculations
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const estimatedTax = subtotal * 0.0825;
  const rewardsDiscount = subtotal >= 100 ? 10.0 : 0.0;
  const grandTotal = Math.max(0, subtotal + estimatedTax - rewardsDiscount);
  const budgetDiff = targetBudget - subtotal;
  const costPerGuest = guestCount > 0 ? subtotal / guestCount : 0;
  const checkedItemsCount = items.filter((i) => i.checked).length;
  const allChecked = items.length > 0 && checkedItemsCount === items.length;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customPrice) || 3.99;
    const newItem: ShoppingItem = {
      id: `custom-${Date.now()}`,
      name: customName,
      brand: customBrand,
      department: customDept,
      aisle: customAisle,
      unitPrice: priceNum,
      quantity: Math.max(1, customQty),
      packageSize: customSize,
      whyNeeded: customWhy,
      checked: false,
    };
    onAddItem(newItem);
    setCustomName('');
    setShowCustomModal(false);
  };

  const handleStartEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditBrand(item.brand);
    setEditDept(item.department);
    setEditAisle(item.aisle);
    setEditPrice(item.unitPrice.toString());
    setEditQty(item.quantity);
    setEditSize(item.packageSize);
    setEditWhy(item.whyNeeded || '');
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const priceNum = parseFloat(editPrice) || editingItem.unitPrice;
    onUpdateItem(editingItem.id, {
      name: editName,
      brand: editBrand,
      department: editDept,
      aisle: editAisle,
      unitPrice: Math.max(0.25, priceNum),
      quantity: Math.max(1, editQty),
      packageSize: editSize,
      whyNeeded: editWhy,
    });
    setEditingItem(null);
  };

  const handleAddFromCatalog = (catItem: (typeof CYMBAL_CATALOG_ITEMS)[0]) => {
    const qty = catalogQuantities[catItem.id] || 1;
    const newItem: ShoppingItem = {
      ...catItem,
      id: `cat-added-${Date.now()}-${catItem.id}`,
      quantity: qty,
      checked: false,
    };
    onAddItem(newItem);
    // Reset quantity for that item
    setCatalogQuantities((prev) => ({ ...prev, [catItem.id]: 1 }));
  };

  const handleInlineQuantityChange = (id: string, valueStr: string) => {
    const val = parseInt(valueStr, 10);
    if (!isNaN(val) && val >= 1) {
      onUpdateQuantity(id, val);
    }
  };

  const filteredCatalog = CYMBAL_CATALOG_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.aisle.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.department.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Undo Banner if item was recently removed */}
      {recentlyRemovedItem && onRestoreRemovedItem && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs">
            <Info className="w-4 h-4 text-teal-400" />
            <span>
              Removed <strong>"{recentlyRemovedItem.name}"</strong> ($
              {(recentlyRemovedItem.unitPrice * recentlyRemovedItem.quantity).toFixed(2)})
            </span>
          </div>
          <button
            onClick={onRestoreRemovedItem}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Controls Bar: Search, Quick Filters & Add Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter list by item, brand, aisle..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* Scale Quantities Quick Menu */}
          {onScaleQuantities && (
            <div className="relative">
              <button
                onClick={() => setShowScaleMenu(!showScaleMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title="Scale all item quantities automatically"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                <span>Scale Quantities</span>
              </button>

              {showScaleMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Auto-Scale Multiplier
                  </div>
                  <button
                    onClick={() => {
                      onScaleQuantities(1.1);
                      setShowScaleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-teal-50 text-slate-700 font-medium cursor-pointer"
                  >
                    +10% Extra Cushion
                  </button>
                  <button
                    onClick={() => {
                      onScaleQuantities(1.25);
                      setShowScaleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-teal-50 text-slate-700 font-medium cursor-pointer"
                  >
                    +25% Larger Appetite
                  </button>
                  <button
                    onClick={() => {
                      onScaleQuantities(1.5);
                      setShowScaleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-teal-50 text-slate-700 font-medium cursor-pointer"
                  >
                    +50% Big Crowd
                  </button>
                  <button
                    onClick={() => {
                      onScaleQuantities(0.8);
                      setShowScaleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 font-medium cursor-pointer"
                  >
                    -20% Streamline Budget
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Browse Catalog Button */}
          <button
            onClick={() => setShowCatalogDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-teal-600" />
            <span>Store Catalog</span>
          </button>

          {/* Add Custom Item Button */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Item</span>
          </button>
        </div>
      </div>

      {/* Department Filter Pills & Bulk Check Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveDept('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDept === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Items ({items.length})
          </button>

          {STORE_DEPARTMENTS.map((dept) => {
            const count = items.filter((i) => i.department === dept.id).length;
            const isActive = activeDept === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDept(dept.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{dept.icon}</span>
                <span>{dept.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-teal-800 text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bulk Check / Clear Controls */}
        <div className="flex items-center gap-2">
          {onToggleAllItems && (
            <button
              onClick={() => onToggleAllItems(!allChecked)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {allChecked ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                  <span>Uncheck All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Check All</span>
                </>
              )}
            </button>
          )}

          {onClearCheckedItems && checkedItemsCount > 0 && (
            <button
              onClick={onClearCheckedItems}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Clear Checked ({checkedItemsCount})
            </button>
          )}
        </div>
      </div>

      {/* Shopping List Items Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Shopping List Manifest
            </h2>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              {filteredItems.length} items • {filteredItems.reduce((s, i) => s + i.quantity, 0)} units
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Filtered Subtotal:</span>
            <span className="text-xs font-bold font-mono text-slate-900">
              ${filteredItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 p-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching items found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No items match "${searchQuery}". Try clearing search or browsing the catalog.`
                : 'Your shopping list is currently empty. Add items from the catalog or custom item form.'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setShowCatalogDrawer(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Browse Store Catalog
              </button>
              <button
                onClick={() => setShowCustomModal(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                + Add Custom Item
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const itemSubtotal = item.unitPrice * item.quantity;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 transition-colors group ${
                    item.checked ? 'bg-slate-50/70 opacity-75' : 'hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Left Side: Checkbox & Item Details */}
                    <div className="flex items-start gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => onToggleCheckItem(item.id)}
                        className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          item.checked
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 hover:border-teal-500 bg-white'
                        }`}
                        title={item.checked ? 'Mark as needed' : 'Mark as in-cart'}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`font-bold text-xs sm:text-sm text-slate-900 ${
                              item.checked ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60">
                            {item.brand}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                            {item.aisle}
                          </span>
                        </div>

                        {/* Package & Dietary Details */}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="text-[11px]">Pack: {item.packageSize}</span>
                          {item.servingsPerPack && (
                            <>
                              <span>•</span>
                              <span className="text-teal-700 font-medium text-[11px]">
                                {item.servingsPerPack}
                              </span>
                            </>
                          )}
                          {item.dietaryTags && item.dietaryTags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {item.dietaryTags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Why Needed AI Rationale */}
                        {item.whyNeeded && (
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 italic">
                            <Info className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.whyNeeded}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Quantity Stepper, Price, Subtotal & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Quantity Modifier (Direct Input & Stepper) */}
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 rounded cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={item.quantity}
                          onChange={(e) => handleInlineQuantityChange(item.id, e.target.value)}
                          className="w-9 text-center text-xs font-bold text-slate-800 font-mono bg-transparent outline-none focus:bg-white rounded"
                          title="Type quantity directly"
                        />
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unit Price & Auto-Recalculating Subtotal */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <div className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                          ${itemSubtotal.toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleStartEditItem(item)}
                          className="text-[10px] text-slate-400 hover:text-teal-700 font-mono transition-colors cursor-pointer"
                          title="Click to edit unit price or details"
                        >
                          ${item.unitPrice.toFixed(2)} / pack
                        </button>
                      </div>

                      {/* Edit Item Details Modal Trigger */}
                      <button
                        onClick={() => handleStartEditItem(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit item name, price, aisle, or details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Item */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove item from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alternative Swaps Bar if available */}
                  {(item.budgetAlternative || item.premiumAlternative) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                        Smart Swaps:
                      </span>
                      {item.budgetAlternative && (
                        <button
                          onClick={() => onSwapItem(item.id, 'budget')}
                          className="flex items-center gap-1 text-teal-700 hover:bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 transition-colors cursor-pointer font-semibold text-[11px]"
                        >
                          <ArrowDownUp className="w-3 h-3" />
                          <span>Save with {item.budgetAlternative} (-30%)</span>
                        </button>
                      )}
                      {item.premiumAlternative && (
                        <button
                          onClick={() => onSwapItem(item.id, 'premium')}
                          className="flex items-center gap-1 text-amber-700 hover:bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 transition-colors cursor-pointer font-semibold text-[11px]"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Upgrade: {item.premiumAlternative}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Real-time Order Budget Calculation Summary Footer */}
        <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left: Summary Metrics */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({totalUnits} total units):</span>
                <span className="font-bold font-mono text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Sales Tax (8.25%):</span>
                <span className="font-mono">${estimatedTax.toFixed(2)}</span>
              </div>
              {rewardsDiscount > 0 && (
                <div className="flex justify-between text-teal-700 font-medium">
                  <span>Cymbal Rewards Member Credit:</span>
                  <span className="font-bold font-mono">-${rewardsDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Middle: Per Guest & Budget Variance */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cost per Guest:</span>
                <span className="font-bold font-mono text-slate-900">
                  ${costPerGuest.toFixed(2)} / guest
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Target Budget:</span>
                <span className="font-mono text-slate-700">${targetBudget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="font-medium text-slate-700">Variance:</span>
                <span
                  className={`font-bold font-mono ${
                    budgetDiff < 0 ? 'text-rose-600' : 'text-teal-700'
                  }`}
                >
                  {budgetDiff < 0
                    ? `+$${Math.abs(budgetDiff).toFixed(2)} over`
                    : `-$${budgetDiff.toFixed(2)} under`}
                </span>
              </div>
            </div>

            {/* Right: Grand Out-of-Pocket Total & Browse */}
            <div className="flex flex-col items-end justify-center space-y-2">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Live Estimated Total
                </p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
                  ${grandTotal.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCatalogDrawer(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3 text-teal-300" />
                  <span>Browse Catalog</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Drawer Modal */}
      {showCatalogDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    CymbalMart Store Catalog
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Browse essentials with instant price & budget calculation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCatalogDrawer(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Catalog Search */}
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search catalog items, ice, snacks, platters, tableware..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCatalog.map((catItem) => {
                  const currentItemQty = catalogQuantities[catItem.id] || 1;
                  const itemCost = catItem.unitPrice * currentItemQty;
                  return (
                    <div
                      key={catItem.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-teal-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900">{catItem.name}</span>
                          <span className="font-bold font-mono text-xs text-teal-700">
                            ${catItem.unitPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {catItem.brand} • {catItem.aisle}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{catItem.packageSize}</div>
                      </div>

                      {/* Quantity Stepper & Add Button */}
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              setCatalogQuantities((prev) => ({
                                ...prev,
                                [catItem.id]: Math.max(1, (prev[catItem.id] || 1) - 1),
                              }))
                            }
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono">
                            {currentItemQty}
                          </span>
                          <button
                            onClick={() =>
                              setCatalogQuantities((prev) => ({
                                ...prev,
                                [catItem.id]: (prev[catItem.id] || 1) + 1,
                              }))
                            }
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAddFromCatalog(catItem)}
                          className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add (${itemCost.toFixed(2)})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 text-right bg-slate-50">
              <button
                onClick={() => setShowCatalogDrawer(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Done Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Modal (with Live Budget Calculation Preview) */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Custom CymbalMart Item</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustom} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Scented Citronella Candles"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Brand Line
                  </label>
                  <select
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="Cymbal Fresh">Cymbal Fresh</option>
                    <option value="Cymbal Basics">Cymbal Basics</option>
                    <option value="Cymbal Select">Cymbal Select</option>
                    <option value="Cymbal Eco">Cymbal Eco</option>
                    <option value="Cymbal Party+">Cymbal Party+</option>
                    <option value="Cymbal Craft">Cymbal Craft</option>
                    <option value="Cymbal Bakery">Cymbal Bakery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Department
                  </label>
                  <select
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value as Department)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="food">Food & Appetizers</option>
                    <option value="beverages">Beverages & Mixology</option>
                    <option value="tableware">Tableware & Serveware</option>
                    <option value="decor">Decor & Ambience</option>
                    <option value="entertainment">Games & Fun</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.25"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="e.g. 2-pack"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Store Aisle Location
                </label>
                <input
                  type="text"
                  value={customAisle}
                  onChange={(e) => setCustomAisle(e.target.value)}
                  placeholder="e.g. Aisle 11 - Seasonal & Candles"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Real-time Subtotal Impact Preview */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">
                    Item Budget Footprint
                  </span>
                  <span className="font-semibold">
                    {customQty} × ${parseFloat(customPrice || '0').toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">
                    Calculated Subtotal
                  </span>
                  <span className="text-sm font-bold font-mono text-teal-800">
                    +${((parseFloat(customPrice) || 0) * customQty).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal (Modify price, qty, aisle, notes directly) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Edit Shopping Item</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Department
                  </label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value as Department)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="food">Food & Appetizers</option>
                    <option value="beverages">Beverages & Mixology</option>
                    <option value="tableware">Tableware & Serveware</option>
                    <option value="decor">Decor & Ambience</option>
                    <option value="entertainment">Games & Fun</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.25"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono font-bold text-teal-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editQty}
                    onChange={(e) => setEditQty(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Store Aisle
                </label>
                <input
                  type="text"
                  value={editAisle}
                  onChange={(e) => setEditAisle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Host Note / Why Needed
                </label>
                <input
                  type="text"
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Updated Subtotal Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Updated Subtotal
                  </span>
                  <span className="font-medium text-slate-700">
                    {editQty} packs × ${(parseFloat(editPrice) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-900">
                    ${((parseFloat(editPrice) || 0) * editQty).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
