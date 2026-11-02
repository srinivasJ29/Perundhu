/**
 * PERUNDHU (பேருந்து) — AI Copilot Floating Action Button
 * Persistent luminous launcher floating in viewport corner.
 */

import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { useAiCopilot } from '../context/AiCopilotContext';
import { useLanguage } from '../../../hooks/useLanguage';

export const AiCopilotFloatingButton: React.FC = () => {
  const { toggleCopilot, isOpen } = useAiCopilot();
  const { language } = useLanguage();

  if (isOpen) return null;

  return (
    <button
      type="button"
      className="copilot-floating-fab"
      onClick={toggleCopilot}
      aria-label="Open PERUNDHU AI Transit Copilot"
      title={language === 'ta' ? 'செயற்கை நுண்ணறிவு வழிகாட்டியைத் திற' : 'Open AI Transit Copilot (LangGraph)'}
    >
      <div className="copilot-fab-pulse" />
      <div className="copilot-fab-icon-box">
        <Brain size={22} className="copilot-fab-brain" />
      </div>

      <div className="copilot-fab-text">
        <div className="copilot-fab-title">
          <span>AI Copilot</span>
          <Sparkles size={12} className="copilot-fab-sparkle" />
        </div>
        <div className="copilot-fab-sub">
          <span>LangGraph Agent</span>
        </div>
      </div>
    </button>
  );
};
