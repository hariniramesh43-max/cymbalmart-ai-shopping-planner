import React from 'react';
import {
  Clock,
  GlassWater,
  Sparkles,
  Lightbulb,
  Share2,
  Check,
} from 'lucide-react';
import { PartyPlan } from '../types/party';

interface HostToolkitProps {
  partyPlan: PartyPlan;
  onToggleTask: (milestoneId: string, taskId: string) => void;
  onOpenShare: () => void;
}

export const HostToolkit: React.FC<HostToolkitProps> = ({
  partyPlan,
  onToggleTask,
  onOpenShare,
}) => {
  const { title, themeVibe, guestCount, prepTimeline, signatureRecipe, partyTips, servingsNote } =
    partyPlan;

  const totalTasks = prepTimeline.reduce((acc, m) => acc + m.tasks.length, 0);
  const doneTasks = prepTimeline.reduce(
    (acc, m) => acc + m.tasks.filter((t) => t.done).length,
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cymbal Host Run-of-Show Guide</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">{themeVibe}</p>
          <div className="mt-3 text-xs text-teal-700 font-semibold">
            {servingsNote || `Portions optimized for ${guestCount} guests.`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-teal-300" />
            <span>Share / Print Plan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Prep Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Party Prep Timeline</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {doneTasks} of {totalTasks} Completed
              </span>
            </div>

            <div className="space-y-6">
              {prepTimeline.map((milestone) => (
                <div key={milestone.id} className="relative pl-6 border-l-2 border-slate-200">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-600 border-4 border-white shadow-xs" />

                  <div className="mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      {milestone.timeframe}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-800">{milestone.title}</h3>
                  </div>

                  <div className="space-y-2 mt-3">
                    {milestone.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onToggleTask(milestone.id, task.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl text-xs transition-colors cursor-pointer border ${
                          task.done
                            ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            task.done
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{task.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Signature Recipe & Host Tips */}
        <div className="space-y-6">
          {/* Signature Recipe Card */}
          {signatureRecipe && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <GlassWater className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Signature Party Punch</h3>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <div className="font-bold text-sm text-teal-900">{signatureRecipe.name}</div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>⏱️ Prep: {signatureRecipe.prepTime}</span>
                  <span>•</span>
                  <span>🥂 Yield: {signatureRecipe.servings} Servings</span>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Batch Ingredients
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {signatureRecipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Batch Instructions
                </h4>
                <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside">
                  {signatureRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Host Pro Tips */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900">Cymbal Host Pro Tips</h3>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600">
              {partyTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-teal-700 font-bold shrink-0">{idx + 1}.</span>
                  <span className="leading-relaxed text-slate-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
