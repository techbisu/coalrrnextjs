import { TransitionGuard } from '../types';
import { IChecklistContextResolver } from '@/core/checklist/interfaces/IChecklistContextResolver';

export interface ProcessConfig {
  moduleCode: string;
  processCode: string;
  name: string;
  guards?: Record<string, TransitionGuard>;
  checklistResolver?: IChecklistContextResolver;
  documentResolvers?: Record<string, unknown>;
  defaultWorkflowCode?: string;
}

export interface IProcessRegistry {
  register(config: ProcessConfig): void;
  getProcess(processCode: string): ProcessConfig | undefined;
  hasProcess(processCode: string): boolean;
  getAllProcesses(): ProcessConfig[];
}
