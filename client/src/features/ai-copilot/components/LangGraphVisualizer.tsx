/**
 * PERUNDHU (பேருந்து) — LangGraph Visual State Machine Component
 * Renders the real-time execution graph of the agentic workflow.
 */

import React from 'react';
import { CheckCircle2, Clock, Zap, ArrowRight, Brain, Database, Wrench, Activity, MessageSquare } from 'lucide-react';
import { GraphNodeState, AgentNodeId } from '../types';

interface LangGraphVisualizerProps {
  nodes: GraphNodeState[];
  activeNodeId?: AgentNodeId | null;
  language: 'en' | 'ta';
}

const NODE_ICONS: Record<AgentNodeId, React.ReactNode> = {
  input_node: <MessageSquare size={16} />,
  intent_classifier: <Brain size={16} />,
  madurai_knowledge_rag: <Database size={16} />,
  langchain_tools: <Wrench size={16} />,
  predictive_eta_engine: <Activity size={16} />,
  response_synthesizer: <Zap size={16} />
};

export const LangGraphVisualizer: React.FC<LangGraphVisualizerProps> = ({
  nodes,
  language
}) => {
  return (
    <div className="langgraph-visualizer-card">
      <div className="langgraph-header">
        <div className="langgraph-header-title">
          <Brain size={18} className="langgraph-header-icon" />
          <span>{language === 'ta' ? 'LangGraph முகவர் நிலை வரைபடம்' : 'LangGraph Agent State Machine'}</span>
        </div>
        <div className="langgraph-badge">
          <span className="langgraph-dot" />
          <span>Active Graph Flow</span>
        </div>
      </div>

      <div className="langgraph-flow-container">
        {nodes.map((node, index) => {
          const isCompleted = node.status === 'completed';
          const isActive = node.status === 'active';

          return (
            <React.Fragment key={node.id}>
              <div
                className={`langgraph-node ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
                title={node.outputSummary || node.labelEn}
              >
                <div className="langgraph-node-icon">
                  {NODE_ICONS[node.id]}
                </div>
                <div className="langgraph-node-body">
                  <div className="langgraph-node-label">
                    {language === 'ta' ? node.labelTa : node.labelEn}
                  </div>
                  {node.durationMs !== undefined && (
                    <div className="langgraph-node-meta">
                      <Clock size={11} />
                      <span>{node.durationMs}ms</span>
                    </div>
                  )}
                  {node.outputSummary && (
                    <div className="langgraph-node-summary">
                      {node.outputSummary}
                    </div>
                  )}
                </div>

                <div className="langgraph-node-status">
                  {isCompleted && <CheckCircle2 size={16} className="text-emerald" />}
                  {isActive && <span className="langgraph-pulse-ring" />}
                </div>
              </div>

              {index < nodes.length - 1 && (
                <div className={`langgraph-edge ${isCompleted ? 'edge-completed' : ''}`}>
                  <div className="langgraph-edge-line" />
                  <ArrowRight size={14} className="langgraph-edge-arrow" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
