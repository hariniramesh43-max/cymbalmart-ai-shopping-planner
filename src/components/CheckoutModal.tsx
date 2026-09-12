import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Car,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Mic,
} from 'lucide-react';
import { ShoppingItem } from '../types/party';

interface CheckoutModalProps {
  items: ShoppingItem[];
  isOpen: boolean;
  onClose: () => void;
  partyTitle: string;
  guestCount: number;
  externalFulfillment?: 'pickup' | 'delivery';
  onFulfillmentChange?: (type: 'pickup' | 'delivery') => void;
  onOrderPlacedExternally?: () => void;
  orderPlacedState?: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  items,
  isOpen,
  onClose,
  partyTitle,
  guestCount,
  externalFulfillment,
  onFulfillmentChange,
  onOrderPlacedExternally,
  orderPlacedState = false,
}) => {
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [storeLocation, setStoreLocation] = useState('CymbalMart Supercenter #104 (Flagship)');
  const [timeSlot, setTimeSlot] = useState('Today, 2:00 PM - 4:00 PM');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('CYM-839210');

  useEffect(() => {
    if (externalFulfillment) {
      setFulfillmentType(externalFulfillment);
    }
  }, [externalFulfillment]);

  useEffect(() => {
    if (orderPlacedState) {
      setOrderId(`CYM-${Math.floor(100000 + Math.random() * 900000)}`);
      setOrderPlaced(true);
    }
  }, [orderPlacedState]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const estimatedTax = subtotal * 0.0825;
  const deliveryFee = fulfillmentType === 'delivery' ? 5.99 : 0.0;
  const cymbalRewardsDiscount = subtotal > 100 ? 10.0 : 0.0;
  const finalTotal = Math.max(0, subtotal + estimatedTax + deliveryFee - cymbalRewardsDiscount);
  const pointsEarned = Math.round(finalTotal * 2);

  const handleSelectFulfillment = (type: 'pickup' | 'delivery') => {
    setFulfillmentType(type);
    if (onFulfillmentChange) onFulfillmentChange(type);
  };

  const handlePlaceOrder = () => {
    setOrderId(`CYM-${Math.floor(100000 + Math.random() * 900000)}`);
    setOrderPlaced(true);
    if (onOrderPlacedExternally) {
      onOrderPlacedExternally();
    }
  };

  const handleReset = () => {
    setOrderPlaced(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {orderPlaced ? (
          /* Order Confirmation View */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Order Confirmed (Hands-Free Checkout Complete)
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Your Party Order is Ready to Stage!
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Order #{orderId} • Scheduled for {timeSlot}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Party Event:</span>
                <span className="font-semibold text-slate-900">{partyTitle}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfillment:</span>
                <span className="font-semibold text-teal-700 capitalize">
                  {fulfillmentType === 'pickup' ? 'Curbside Pickup (Bay #3)' : 'Same-Day Express Delivery'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Location:</span>
                <span className="text-slate-900">{storeLocation}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                <span>Total Charged:</span>
                <span className="font-bold font-mono text-teal-700 text-sm">${finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-teal-700 pt-1">
                <span>Cymbal Rewards Earned:</span>
                <span className="font-semibold font-mono">+{pointsEarned} Points</span>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-medium">
              🛒 Our CymbalMart personal shoppers are packing your produce, ice, and party items right now.
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              Back to Party Planner
            </button>
          </div>
        ) : (
          /* Checkout Preparation View */
          <>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">CymbalMart Instant Checkout</h3>
                  <div className="flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                    <Mic className="w-3 h-3 text-teal-600" />
                    <span>Voice Enabled: Say "Select Pickup" or "Confirm Order"</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Party Summary Pill */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{partyTitle}</span>
                  <div className="text-slate-500">{items.length} items manifest • {guestCount} guests</div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-teal-700 text-base">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Fulfillment Method */}
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">
                  1. Choose Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectFulfillment('pickup')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      fulfillmentType === 'pickup'
                        ? 'bg-teal-50 border-teal-500 text-slate-900 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
                      <Car className="w-4 h-4 text-teal-600" />
                      <span>Free Curbside Pickup</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Ready in 2 hours • Staged in climate bags</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectFulfillment('delivery')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      fulfillmentType === 'delivery'
                        ? 'bg-teal-50 border-teal-500 text-slate-900 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
                      <Truck className="w-4 h-4 text-teal-600" />
                      <span>Express 2-Hr Delivery</span>
                    </div>
                    <p className="text-[11px] text-slate-500">$5.99 • Direct to your door</p>
                  </button>
                </div>
              </div>

              {/* Store & Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                    CymbalMart Location
                  </label>
                  <select
                    value={storeLocation}
                    onChange={(e) => setStoreLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option>CymbalMart Supercenter #104 (Flagship)</option>
                    <option>CymbalMart Metro Market #88</option>
                    <option>CymbalMart Express Plaza #12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Staging Window
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option>Today, 2:00 PM - 4:00 PM</option>
                    <option>Today, 4:30 PM - 6:30 PM</option>
                    <option>Tomorrow Morning, 9:00 AM - 11:00 AM</option>
                  </select>
                </div>
              </div>

              {/* Order Calculation Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Shopping Items ({items.length} items):</span>
                  <span className="text-slate-900 font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Sales Tax (8.25%):</span>
                  <span className="text-slate-900 font-mono">${estimatedTax.toFixed(2)}</span>
                </div>
                {fulfillmentType === 'delivery' && (
                  <div className="flex justify-between text-slate-600">
                    <span>Express Delivery Fee:</span>
                    <span className="text-slate-900 font-mono">$5.99</span>
                  </div>
                )}
                {cymbalRewardsDiscount > 0 && (
                  <div className="flex justify-between text-teal-700 font-semibold">
                    <span>Cymbal Host Rewards ($100+ Party Perk):</span>
                    <span className="font-mono">-${cymbalRewardsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                  <span className="text-slate-900">Total Amount:</span>
                  <span className="text-teal-700 font-mono text-base">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Cymbal Freshness Guarantee</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  Place CymbalMart Order (${finalTotal.toFixed(2)})
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
