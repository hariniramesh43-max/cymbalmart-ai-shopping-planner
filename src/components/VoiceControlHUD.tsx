import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle2,
  ShoppingBag,
  Navigation,
  DollarSign,
  Clock,
  Compass,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { audioCues, speakText, stopSpeaking } from '../services/voiceAssistant';
import { processVoiceCommand, VoiceEngineContext, VoiceExecutionResult } from '../services/voiceCommandEngine';

interface VoiceControlHUDProps {
  engineContext: VoiceEngineContext;
}

export const VoiceControlHUD: React.FC<VoiceControlHUDProps> = ({ engineContext }) => {
  const [isListening, setIsListening] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [lastResult, setLastResult] = useState<VoiceExecutionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isExpandedHUD, setIsExpandedHUD] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const continuousModeRef = useRef(isContinuousMode);
  continuousModeRef.current = isContinuousMode;

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      audioCues.playWake();
    };

    recognition.onresult = async (event: any) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimText(interim);

      if (finalTranscript.trim()) {
        const spoken = finalTranscript.trim();
        setTranscript(spoken);
        setInterimText('');
        setIsProcessing(true);

        try {
          const result = await processVoiceCommand(spoken, {
            ...engineContext,
            voiceFeedbackEnabled: voiceFeedback,
          });
          setLastResult(result);
        } catch (err) {
          console.error('Error processing voice command:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false);
        setIsContinuousMode(false);
      }
    };

    recognition.onend = () => {
      if (continuousModeRef.current) {
        // Automatically restart for hands-free always-listening experience
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore
      }
    };
  }, [engineContext, voiceFeedback]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      setIsContinuousMode(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      setIsListening(false);
      stopSpeaking();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start failed:', e);
      }
    }
  };

  const toggleContinuousHandsFree = () => {
    const nextState = !isContinuousMode;
    setIsContinuousMode(nextState);
    if (nextState) {
      if (!isListening) {
        try {
          recognitionRef.current?.start();
          setIsListening(true);
        } catch (e) {
          // Ignore
        }
      }
      engineContext.showToast('Hands-Free Mode Active: Always listening for voice commands!', 'success');
      if (voiceFeedback) {
        speakText('Hands-free mode active. I am listening for your commands.');
      }
    } else {
      engineContext.showToast('Hands-Free Mode Deactivated (push-to-talk only).', 'info');
    }
  };

  const handleRunSampleCommand = async (sample: string) => {
    setTranscript(sample);
    setIsProcessing(true);
    try {
      const res = await processVoiceCommand(sample, {
        ...engineContext,
        voiceFeedbackEnabled: voiceFeedback,
      });
      setLastResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleCommands = [
    { cat: 'Navigation', text: 'Go to shopping list', desc: 'Jump to manifest' },
    { cat: 'Navigation', text: 'Show store aisles', desc: 'In-store routing' },
    { cat: 'Shopping', text: 'Add 2 bags of ice', desc: 'Add item by name' },
    { cat: 'Shopping', text: 'Add organic salsa', desc: 'Add snacks or decor' },
    { cat: 'Shopping', text: 'Increase ice quantity to 3', desc: 'Adjust quantities' },
    { cat: 'Shopping', text: 'Check off tortilla chips', desc: 'Check/uncheck item' },
    { cat: 'Shopping', text: 'Scale quantities by 20 percent', desc: 'Scale whole list' },
    { cat: 'Budget', text: 'What is my total?', desc: 'Audio budget breakdown' },
    { cat: 'Budget', text: 'Set budget to 250 dollars', desc: 'Update target budget' },
    { cat: 'Budget', text: 'Smart rebalance budget', desc: '1-click budget fit' },
    { cat: 'Aisles', text: 'Where is salsa?', desc: 'Find aisle & price' },
    { cat: 'Aisles', text: 'Check all in Aisle 3', desc: 'Batch check aisle' },
    { cat: 'Toolkit', text: 'Read signature recipe', desc: 'Audio cocktail instructions' },
    { cat: 'Toolkit', text: 'What are my prep tasks?', desc: 'Read upcoming timeline' },
    { cat: 'Checkout', text: 'Start checkout', desc: 'Open checkout modal' },
    { cat: 'Checkout', text: 'Select curbside pickup', desc: 'Choose pickup/delivery' },
    { cat: 'Checkout', text: 'Confirm order', desc: 'Place CymbalMart order' },
  ];

  return (
    <>
      {/* Floating Voice Control Capsule / HUD Button (Bottom Left) */}
      <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2">
        {/* Expanded Transcript Pill if active or recent speech */}
        {(isListening || transcript || lastResult) && (
          <div
            className={`bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl max-w-sm sm:max-w-md animate-in slide-in-from-bottom-2 duration-200 transition-all ${
              isExpandedHUD ? 'w-80 sm:w-96' : 'w-72 sm:w-80'
            }`}
          >
            {/* Header Strip */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span className="font-bold text-slate-200">
                  {isListening
                    ? isContinuousMode
                      ? 'Hands-Free (Always Listening)'
                      : 'Listening for Command...'
                    : 'Voice Assistant Standby'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVoiceFeedback(!voiceFeedback)}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    voiceFeedback ? 'text-teal-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
                  }`}
                  title={voiceFeedback ? 'Voice Responses Enabled' : 'Voice Responses Muted'}
                >
                  {voiceFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md cursor-pointer"
                  title="View all Voice Commands"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Interim / Recognized Speech */}
            <div className="py-2 min-h-[36px] flex flex-col justify-center text-xs">
              {interimText ? (
                <p className="text-teal-300 italic font-medium">"{interimText}..."</p>
              ) : transcript ? (
                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    You said:
                  </div>
                  <p className="text-white font-medium">"{transcript}"</p>
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] italic">
                  Say "Add 2 bags of ice", "Where is salsa?", or "Start checkout"...
                </p>
              )}
            </div>

            {/* Live Audio Waveform when listening */}
            {isListening && (
              <div className="flex items-center justify-center gap-1 py-1">
                {[40, 70, 90, 60, 100, 50, 80, 30].map((h, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-teal-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.max(6, (h * Math.sin(Date.now() / 200 + idx)) % 20 + 8)}px`,
                      animationDelay: `${idx * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Last Execution Feedback Box */}
            {lastResult && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] flex items-start gap-2 bg-slate-800/60 p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-emerald-300 block text-[10px] uppercase">
                    {lastResult.actionName}
                  </span>
                  <span className="text-slate-200">{lastResult.feedbackText}</span>
                </div>
              </div>
            )}

            {/* Quick Hands-Free Toggle Bar */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <button
                onClick={toggleContinuousHandsFree}
                className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  isContinuousMode
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>{isContinuousMode ? 'Always-On Listening' : 'Turn On Hands-Free Mode'}</span>
              </button>

              <button
                onClick={() => setShowGuideModal(true)}
                className="text-teal-300 hover:underline cursor-pointer font-semibold"
              >
                Command Guide →
              </button>
            </div>
          </div>
        )}

        {/* Main Microphone Capsule Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
            }`}
            title={isListening ? 'Click to pause voice control' : 'Click to start voice control'}
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 text-white animate-bounce" />
                <span>Listening (Tap to Pause)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-teal-100" />
                <span>Hands-Free Voice Control</span>
              </>
            )}
          </button>

          {/* Quick Voice Help button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="w-9 h-9 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-md flex items-center justify-center transition-colors cursor-pointer"
            title="Voice Commands Reference"
          >
            <HelpCircle className="w-4 h-4 text-teal-600" />
          </button>
        </div>
      </div>

      {/* Full Voice Command Reference Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Hands-Free Voice Control Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    Speak naturally to plan, shop, navigate aisles, check budget, and checkout.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Strip in Guide */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Hands-Free Mode:</span>
                <button
                  onClick={toggleContinuousHandsFree}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    isContinuousMode
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isContinuousMode ? '✓ Always Listening Enabled' : 'Enable Always-On Listening'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Spoken Feedback:</span>
                <button
                  onClick={() => setVoiceFeedback(!voiceFeedback)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    voiceFeedback
                      ? 'bg-teal-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {voiceFeedback ? 'Audio Responses On' : 'Muted'}
                </button>
              </div>
            </div>

            {/* Interactive Command Examples Grid */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sampleCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-2xl flex flex-col justify-between transition-colors group cursor-pointer"
                    onClick={() => {
                      handleRunSampleCommand(cmd.text);
                      setShowGuideModal(false);
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        <span>{cmd.cat}</span>
                        <span className="text-teal-600 group-hover:underline">Click to test →</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        "{cmd.text}"
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">{cmd.desc}</div>
                  </div>
                ))}
              </div>

              {/* Complete Voice Capabilities Summary */}
              <div className="mt-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 space-y-2">
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-teal-900">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Full Hands-Free End-to-End Voice Journey</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-teal-900">
                  <li><strong>Party Planning:</strong> Say <em>"Plan a Taco Fiesta for 20 guests with 150 dollar budget"</em> or <em>"Load BBQ preset"</em>.</li>
                  <li><strong>Shopping Manifest:</strong> Say <em>"Add 2 bags of ice"</em>, <em>"Remove chips"</em>, <em>"Check salsa"</em>, or <em>"Scale quantities by 25 percent"</em>.</li>
                  <li><strong>Budget Calculations:</strong> Say <em>"What is my total?"</em> or <em>"Set budget to 250 dollars"</em> to hear live variance and per-guest costs spoken back.</li>
                  <li><strong>Store Aisles:</strong> Ask <em>"Where is guacamole?"</em> or say <em>"Check all in Aisle 3"</em>.</li>
                  <li><strong>Host Toolkit:</strong> Say <em>"Read signature recipe"</em> or <em>"What are my prep tasks?"</em>.</li>
                  <li><strong>Checkout:</strong> Say <em>"Start checkout"</em>, <em>"Select delivery"</em>, and <em>"Confirm order"</em>.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
              <span className="text-[11px] text-slate-500">
                Tip: Turn on <strong>Always-On Listening</strong> while in the kitchen or store aisle.
              </span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
