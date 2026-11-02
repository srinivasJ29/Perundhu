/**
 * PERUNDHU (பேருந்து) — AI Copilot Drawer Component
 * Sleek glassmorphic slide-out drawer featuring LangGraph State Machine & LangChain Tools.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Compass,
  Layers,
  Wrench,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useAiCopilot } from '../context/AiCopilotContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { LangGraphVisualizer } from './LangGraphVisualizer';
import { ToolTraceStream } from './ToolTraceStream';
import '../styles/ai-copilot.css';

const QUICK_PROMPTS = [
  {
    en: 'Where is Bus 77 right now and when does it reach Goripalayam?',
    ta: 'தடம் 77 பேருந்து இப்போது எங்கே உள்ளது? கோரிப்பாளையம் எப்போது வரும்?'
  },
  {
    en: 'Fastest route from Mattuthavani to Periyar Bus Stand',
    ta: 'மாட்டுத்தாவணியிலிருந்து பெரியார் செல்ல விரைவான வழி'
  },
  {
    en: 'How to reach Madurai Airport by bus (Route 10A)?',
    ta: 'மதுரை விமான நிலையம் செல்ல 10A பேருந்து விபரம்'
  },
  {
    en: 'Which routes offer free travel for women (மகளிர் விடியல் பயணம்)?',
    ta: 'மகளிர் விடியல் பயணம் இலவச பேருந்துகள் எவை?'
  },
  {
    en: 'Live status of Madurai bus fleet (36 active buses)',
    ta: 'மதுரை 36 பேருந்துகளின் தற்போதைய நேரலை வேகம்'
  }
];

export const AiCopilotDrawer: React.FC = () => {
  const { language } = useLanguage();
  const {
    isOpen,
    closeCopilot,
    messages,
    isThinking,
    activeGraphNodes,
    lastToolTraces,
    sendQuery,
    clearConversation,
    handleActionClick
  } = useAiCopilot();

  const [inputVal, setInputVal] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'graph' | 'tools'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isThinking) return;
    const query = inputVal.trim();
    setInputVal('');
    void sendQuery(query);
  };

  const handlePromptClick = (prompt: { en: string; ta: string }) => {
    const text = language === 'ta' ? prompt.ta : prompt.en;
    void sendQuery(text);
  };

  // Simple Markdown renderer for bolding, bullet points, and emojis
  const renderFormattedMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const content = line.slice(2);
        return (
          <li key={idx} className="copilot-bullet-item">
            {renderInlineMarkdown(content)}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="copilot-spacer" />;
      }
      return (
        <p key={idx} className="copilot-text-p">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (str: string) => {
    // Basic bold parsing: **text**
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-cyan font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="copilot-drawer-overlay" onClick={closeCopilot} role="dialog" aria-modal="true">
      <div className="copilot-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="copilot-drawer-header">
          <div className="copilot-brand-title">
            <div className="copilot-icon-halo">
              <Brain size={20} className="copilot-header-brain" />
            </div>
            <div>
              <div className="copilot-title-text">
                <span>PERUNDHU AI Copilot</span>
                <span className="copilot-tamil-sub">செயற்கை நுண்ணறிவு வழிகாட்டி</span>
              </div>
              <div className="copilot-tech-badge">
                <Sparkles size={11} />
                <span>LangGraph State Graph • LangChain Tools</span>
              </div>
            </div>
          </div>

          <div className="copilot-header-actions">
            <button
              type="button"
              className="copilot-icon-btn"
              onClick={clearConversation}
              title={language === 'ta' ? 'அரட்டையை அழிக்கவும்' : 'Clear Chat'}
              aria-label="Clear Chat"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              className="copilot-close-btn"
              onClick={closeCopilot}
              aria-label="Close AI Copilot"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="copilot-tab-bar">
          <button
            type="button"
            className={`copilot-tab-btn ${activeTab === 'chat' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Bot size={15} />
            <span>{language === 'ta' ? 'உரையாடல்' : 'Chat & Guidance'}</span>
          </button>

          <button
            type="button"
            className={`copilot-tab-btn ${activeTab === 'graph' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <Layers size={15} />
            <span>{language === 'ta' ? 'LangGraph வரைபடம்' : 'LangGraph Visualizer'}</span>
          </button>

          <button
            type="button"
            className={`copilot-tab-btn ${activeTab === 'tools' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            <Wrench size={15} />
            <span>{language === 'ta' ? 'கருவிகள் பதிவுகள்' : 'Tool Traces'}</span>
            {lastToolTraces.length > 0 && (
              <span className="copilot-tools-pill">{lastToolTraces.length}</span>
            )}
          </button>
        </div>

        {/* Tab 1: Chat Stream */}
        {activeTab === 'chat' && (
          <div className="copilot-chat-body">
            {/* Quick Suggestion Chips */}
            <div className="copilot-suggestions-tray">
              <div className="copilot-suggestions-label">
                <Sparkles size={12} className="text-cyan" />
                <span>{language === 'ta' ? 'பரிந்துரைக்கப்பட்ட கேள்விகள்' : 'Suggested Inquiries'}:</span>
              </div>
              <div className="copilot-chips-scroll">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="copilot-prompt-chip"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    <span>{language === 'ta' ? prompt.ta : prompt.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Stream */}
            <div className="copilot-messages-container">
              {messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const displayText = language === 'ta' ? msg.textTa : msg.textEn;

                return (
                  <div
                    key={msg.id}
                    className={`copilot-message-row ${isAgent ? 'row-agent' : 'row-user'}`}
                  >
                    <div className="copilot-avatar">
                      {isAgent ? <Bot size={18} /> : <User size={18} />}
                    </div>

                    <div className="copilot-bubble-card">
                      {isAgent && (
                        <div className="copilot-agent-badge">
                          <span className="copilot-ping-dot" />
                          <span>TNSTC Transit Agent</span>
                          {msg.intent && (
                            <span className="copilot-intent-pill">{msg.intent}</span>
                          )}
                        </div>
                      )}

                      <div className="copilot-bubble-text">
                        {renderFormattedMessage(displayText)}
                      </div>

                      {/* Action buttons if attached */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="copilot-actions-tray">
                          {msg.suggestedActions.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              className="copilot-action-pill"
                              onClick={() => handleActionClick(action)}
                            >
                              <Compass size={14} className="text-cyan" />
                              <span>{language === 'ta' ? action.labelTa : action.labelEn}</span>
                              <ExternalLink size={12} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="copilot-message-row row-agent">
                  <div className="copilot-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="copilot-bubble-card thinking-bubble">
                    <div className="copilot-thinking-row">
                      <span className="thinking-pulse-dot" />
                      <span className="thinking-pulse-dot" />
                      <span className="thinking-pulse-dot" />
                      <span className="thinking-status-text">
                        {language === 'ta'
                          ? 'LangGraph முகவர் வழித்தட தகவல்களை பகுப்பாய்வு செய்கிறது...'
                          : 'LangGraph agent evaluating spatial corridor graph & live telemetry...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="copilot-input-bar">
              <input
                type="text"
                className="copilot-input-field"
                placeholder={
                  language === 'ta'
                    ? 'கேளுங்கள் (எ.கா. தடம் 77 எங்கே? விமான நிலையம் செல்ல வழி?)'
                    : 'Ask transit copilot (e.g., Where is Bus 77? Fastest route to Airport?)'
                }
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isThinking}
              />
              <button
                type="submit"
                className="copilot-send-btn"
                disabled={!inputVal.trim() || isThinking}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: LangGraph State Machine Visualization */}
        {activeTab === 'graph' && (
          <div className="copilot-tab-scroll-body">
            <LangGraphVisualizer
              nodes={activeGraphNodes}
              language={language as 'en' | 'ta'}
            />
          </div>
        )}

        {/* Tab 3: Tool Call Traces */}
        {activeTab === 'tools' && (
          <div className="copilot-tab-scroll-body">
            <ToolTraceStream
              traces={lastToolTraces}
              language={language as 'en' | 'ta'}
            />
          </div>
        )}
      </div>
    </div>
  );
};
