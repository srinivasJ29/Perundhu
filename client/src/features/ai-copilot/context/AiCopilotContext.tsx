/**
 * PERUNDHU (பேருந்து) — AI Copilot Global Context
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CopilotMessage, GraphNodeState, ToolCallTrace } from '../types';
import { TransitAgentGraph } from '../services/transitAgentGraph';
import { useLanguage } from '../../../hooks/useLanguage';

interface AiCopilotContextValue {
  isOpen: boolean;
  isThinking: boolean;
  messages: CopilotMessage[];
  activeGraphNodes: GraphNodeState[];
  lastToolTraces: ToolCallTrace[];
  openCopilot: (initialQuery?: string) => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  sendQuery: (query: string) => Promise<void>;
  clearConversation: () => void;
  handleActionClick: (action: any) => void;
}

const AiCopilotContext = createContext<AiCopilotContextValue | undefined>(undefined);

const WELCOME_MESSAGE: CopilotMessage = {
  id: 'msg-welcome-0',
  sender: 'agent',
  timestamp: new Date(),
  textEn: `வணக்கம்! Welcome to **PERUNDHU AI Transit Copilot**.\n\n` +
    `I am an agentic transit assistant built with **LangGraph** & **LangChain Tools** for Tamil Nadu State Transport (TNSTC).\n\n` +
    `Ask me anything about **live Madurai bus locations, route recommendations, arrival ETAs, timetables, or fares**!`,
  textTa: `வணக்கம்! **பேருந்து செயற்கை நுண்ணறிவு வழிகாட்டிக்கு (PERUNDHU AI Copilot)** நல்வரவு.\n\n` +
    `தமிழ்நாடு அரசுப் போக்குவரத்துக் கழகத்தின் (TNSTC) நிகழ்நேரப் பேருந்துகளைக் கண்காணிக்க **LangGraph** மற்றும் **LangChain** தொழில்நுட்பத்துடன் உருவாக்கப்பட்ட அறிவார்ந்த முகவர்.\n\n` +
    `**பேருந்து நேரலை இருப்பிடம், விரைவுப் பயண வழிகள், வருகை நேரம், கால அட்டவணை அல்லது கட்டண விபரங்கள்** குறித்து என்னிடம் கேட்கலாம்!`,
  graphNodes: TransitAgentGraph.getInitialNodes()
};

export const AiCopilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([WELCOME_MESSAGE]);
  const [activeGraphNodes, setActiveGraphNodes] = useState<GraphNodeState[]>(TransitAgentGraph.getInitialNodes());
  const [lastToolTraces, setLastToolTraces] = useState<ToolCallTrace[]>([]);

  const openCopilot = useCallback((initialQuery?: string) => {
    setIsOpen(true);
    if (initialQuery) {
      void sendQuery(initialQuery);
    }
  }, []);

  const closeCopilot = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCopilot = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setActiveGraphNodes(TransitAgentGraph.getInitialNodes());
    setLastToolTraces([]);
  }, []);

  const sendQuery = useCallback(async (query: string) => {
    if (!query.trim() || isThinking) return;

    const userMsg: CopilotMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date(),
      textEn: query,
      textTa: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await TransitAgentGraph.execute(
        query,
        language as 'en' | 'ta',
        (updatedNodes) => {
          setActiveGraphNodes(updatedNodes);
        }
      );

      setMessages((prev) => [...prev, response]);
      if (response.graphNodes) setActiveGraphNodes(response.graphNodes);
      if (response.toolTraces) setLastToolTraces(response.toolTraces);
    } catch (err) {
      console.error('AI Copilot execution error:', err);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, language]);

  const handleActionClick = useCallback((action: any) => {
    if (action.type === 'NAVIGATE_MAP') {
      closeCopilot();
      navigate('/map');
    }
  }, [closeCopilot, navigate]);

  const value = useMemo(
    () => ({
      isOpen,
      isThinking,
      messages,
      activeGraphNodes,
      lastToolTraces,
      openCopilot,
      closeCopilot,
      toggleCopilot,
      sendQuery,
      clearConversation,
      handleActionClick
    }),
    [
      isOpen,
      isThinking,
      messages,
      activeGraphNodes,
      lastToolTraces,
      openCopilot,
      closeCopilot,
      toggleCopilot,
      sendQuery,
      clearConversation,
      handleActionClick
    ]
  );

  return (
    <AiCopilotContext.Provider value={value}>
      {children}
    </AiCopilotContext.Provider>
  );
};

const fallbackContext: AiCopilotContextValue = {
  isOpen: false,
  isThinking: false,
  messages: [WELCOME_MESSAGE],
  activeGraphNodes: [],
  lastToolTraces: [],
  openCopilot: () => {},
  closeCopilot: () => {},
  toggleCopilot: () => {},
  sendQuery: async () => {},
  clearConversation: () => {},
  handleActionClick: () => {}
};

export const useAiCopilot = (): AiCopilotContextValue => {
  const context = useContext(AiCopilotContext);
  return context ?? fallbackContext;
};
