import React, { useState } from 'react';
import { Share2, Copy, Check, Printer, Download } from 'lucide-react';
import { PartyPlan } from '../types/party';

interface ShareExportModalProps {
  partyPlan: PartyPlan;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  partyPlan,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalCost = partyPlan.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const generateMarkdownList = () => {
    let text = `🎉 **${partyPlan.title}** - CymbalMart Party Shopping List\n`;
    text += `👥 Guests: ${partyPlan.guestCount} | 💰 Budget Target: $${partyPlan.targetBudget} | 🛒 Estimated Total: $${totalCost.toFixed(2)}\n\n`;

    const deptMap: Record<string, string> = {
      food: '🥑 FOOD & APPETIZERS',
      beverages: '🍹 BEVERAGES & MIXOLOGY',
      tableware: '🍽️ TABLEWARE & SERVEWARE',
      decor: '✨ DECOR & AMBIENCE',
      entertainment: '🎲 GAMES & FUN',
    };

    ['food', 'beverages', 'tableware', 'decor', 'entertainment'].forEach((dept) => {
      const itemsInDept = partyPlan.items.filter((i) => i.department === dept);
      if (itemsInDept.length > 0) {
        text += `\n### ${deptMap[dept]}\n`;
        itemsInDept.forEach((item) => {
          text += `- [ ] **${item.name}** (${item.brand}) - ${item.quantity}x @ $${item.unitPrice.toFixed(2)} (${item.packageSize}) [${item.aisle}]\n`;
        });
      }
    });

    if (partyPlan.signatureRecipe) {
      text += `\n### 🍹 SIGNATURE BATCH RECIPE: ${partyPlan.signatureRecipe.name}\n`;
      text += `Yield: ${partyPlan.signatureRecipe.servings} servings | Prep: ${partyPlan.signatureRecipe.prepTime}\n`;
      text += `Ingredients:\n` + partyPlan.signatureRecipe.ingredients.map((i) => `  * ${i}`).join('\n') + '\n';
      text += `Instructions:\n` + partyPlan.signatureRecipe.instructions.map((s, idx) => `  ${idx + 1}. ${s}`).join('\n') + '\n';
    }

    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownList());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(partyPlan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CymbalMart-PartyPlan-${partyPlan.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-900">Share & Export Party Manifest</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Checklist'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Checklist</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export JSON File</span>
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
              Checklist Preview (Markdown format)
            </label>
            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto select-all">
              {generateMarkdownList()}
            </pre>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
