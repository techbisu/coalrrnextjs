import { GenerationPayload } from './index'

export class DocumentWorker {
  static async processGeneration(payload: GenerationPayload & { instance_id: string }) {
    console.warn("DocumentWorker.processGeneration is deprecated/broken and needs refactoring.");
    return;
  }
}
