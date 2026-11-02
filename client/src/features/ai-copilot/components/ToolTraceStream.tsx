/**
 * PERUNDHU (பேருந்து) — LangChain Tool Call Trace Stream Component
 * Displays structured tool calls with collapsible JSON parameters & latency metrics.
 */

import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, CheckCircle2, Clock, Code2 } from 'lucide-react';
import { ToolCallTrace } from '../types';

interface ToolTraceStreamProps {
  traces: ToolCallTrace[];
  language: 'en' | 'ta';
}

export const ToolTraceStream: React.FC<ToolTraceStreamProps> = ({ traces, language }) => {
  const [expandedId, setExpandedId] = useState<string | null>(traces[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!traces || traces.length === 0) {
    return (
      <div className="tool-traces-empty">
        <Wrench size={24} className="tool-empty-icon" />
        <p>{language === 'ta' ? 'கருவி பதிவுகள் எதுவும் இல்லை' : 'No tool traces available yet.'}</p>
      </div>
    );
  }

  return (
    <div className="tool-traces-stream">
      <div className="tool-traces-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={16} className="text-cyan" />
          <span>{language === 'ta' ? 'LangChain கருவிகள் அழைப்பு பதிவுகள்' : 'LangChain Tool Execution Stream'}</span>
        </div>
        <span className="tool-traces-count">{traces.length} Tools Invoked</span>
      </div>

      <div className="tool-traces-list">
        {traces.map((trace) => {
          const isExpanded = expandedId === trace.id;

          return (
            <div key={trace.id} className="tool-trace-card">
              <button
                type="button"
                className="tool-trace-summary-btn"
                onClick={() => toggleExpand(trace.id)}
                aria-expanded={isExpanded}
              >
                <div className="tool-trace-left">
                  <div className="tool-trace-icon-box">
                    <Wrench size={13} />
                  </div>
                  <div className="tool-trace-name-group">
                    <span className="tool-trace-name">{trace.toolName}()</span>
                    <span className="tool-trace-desc">
                      {language === 'ta' ? trace.descriptionTa : trace.descriptionEn}
                    </span>
                  </div>
                </div>

                <div className="tool-trace-right">
                  <div className="tool-trace-badge">
                    <Clock size={11} />
                    <span>{trace.durationMs}ms</span>
                  </div>
                  <div className="tool-trace-confidence">
                    <CheckCircle2 size={12} className="text-emerald" />
                    <span>{Math.round(trace.confidence * 100)}% Conf.</span>
                  </div>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {isExpanded && (
                <div className="tool-trace-details">
                  <div className="tool-trace-section">
                    <div className="tool-trace-section-label">INPUT PARAMETERS</div>
                    <pre className="tool-trace-json">
                      {JSON.stringify(trace.parameters, null, 2)}
                    </pre>
                  </div>

                  <div className="tool-trace-section">
                    <div className="tool-trace-section-label">TOOL OUTPUT RESULT</div>
                    <pre className="tool-trace-json text-emerald">
                      {JSON.stringify(trace.output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
