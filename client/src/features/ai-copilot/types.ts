/**
 * PERUNDHU (பேருந்து) — AI Transit Copilot Types
 * LangGraph State Machine & LangChain Tool Schemas
 */

export type AgentNodeId =
  | 'input_node'
  | 'intent_classifier'
  | 'madurai_knowledge_rag'
  | 'langchain_tools'
  | 'predictive_eta_engine'
  | 'response_synthesizer';

export interface GraphNodeState {
  id: AgentNodeId;
  labelEn: string;
  labelTa: string;
  status: 'idle' | 'active' | 'completed' | 'skipped';
  durationMs?: number;
  outputSummary?: string;
}

export type QueryIntent =
  | 'LIVE_BUS_TRACKING'
  | 'OPTIMAL_ROUTE_PLAN'
  | 'TIMETABLE_QUERY'
  | 'FLEET_TELEMETRY'
  | 'FARE_AND_SERVICE'
  | 'TRANSIT_ADVISORY'
  | 'GENERAL_QUERY';

export interface ExtractedEntities {
  routeNumber?: string;
  busRegistration?: string;
  originStand?: string;
  destinationStand?: string;
  targetStop?: string;
  serviceCategory?: string;
}

export interface ToolCallTrace {
  id: string;
  toolName: string;
  descriptionEn: string;
  descriptionTa: string;
  parameters: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  confidence: number;
}

export interface SuggestedAction {
  id: string;
  type: 'NAVIGATE_MAP' | 'TRACK_BUS' | 'SELECT_ROUTE' | 'OPEN_TIMETABLE';
  labelEn: string;
  labelTa: string;
  payload: {
    routeId?: string;
    routeNumber?: string;
    busId?: string;
    registrationNumber?: string;
    coordinates?: [number, number];
  };
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  textEn: string;
  textTa: string;
  intent?: QueryIntent;
  entities?: ExtractedEntities;
  graphNodes?: GraphNodeState[];
  toolTraces?: ToolCallTrace[];
  suggestedActions?: SuggestedAction[];
  isStreaming?: boolean;
}

export interface LangGraphExecutionState {
  currentQuery: string;
  intent?: QueryIntent;
  entities: ExtractedEntities;
  activeNode: AgentNodeId | null;
  nodes: GraphNodeState[];
  toolTraces: ToolCallTrace[];
  isThinking: boolean;
}
