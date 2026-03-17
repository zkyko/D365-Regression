/**
 * Stub — returns a minimal flow config so podchannel.spec.ts
 * can call FLOW.displayName and FLOW.tags without throwing.
 */
export interface FlowConfig {
  displayName: string;
  tags: string[];
}

export function getFlowConfig(entityType: string): FlowConfig {
  return { displayName: entityType, tags: [] };
}
