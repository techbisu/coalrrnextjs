import { IProcessRegistry, ProcessConfig } from './interfaces/IProcessRegistry';

export class ProcessRegistry implements IProcessRegistry {
  private processes = new Map<string, ProcessConfig>();

  register(config: ProcessConfig): void {
    if (!config.processCode) {
      throw new Error('ProcessConfig must include a valid processCode');
    }
    this.processes.set(config.processCode, config);
  }

  getProcess(processCode: string): ProcessConfig | undefined {
    return this.processes.get(processCode);
  }

  hasProcess(processCode: string): boolean {
    return this.processes.has(processCode);
  }

  getAllProcesses(): ProcessConfig[] {
    return Array.from(this.processes.values());
  }
}

export const processRegistry = new ProcessRegistry();
