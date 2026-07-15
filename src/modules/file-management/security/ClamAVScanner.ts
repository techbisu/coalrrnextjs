import NodeClam from 'clamscan';
import { IVirusScanner } from './IVirusScanner';
import { Readable } from 'stream';

export class ClamAVScanner implements IVirusScanner {
  private clamscanPromise: Promise<NodeClam | null>;
  private isEnabled: boolean = process.env.ENABLE_CLAMAV !== 'false';

  constructor() {
    if (!this.isEnabled) {
      this.clamscanPromise = Promise.resolve(null);
      return;
    }

    this.clamscanPromise = new NodeClam().init({
      removeInfected: false,
      clamdscan: {
        host: process.env.CLAMAV_HOST || '127.0.0.1',
        port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
        timeout: 60000,
        localFallback: false,
      },
      preference: 'clamdscan',
    }).catch(error => {
      console.warn('ClamAV initialization failed, scanning will be bypassed:', error.message);
      return null;
    });
  }

  async scanBuffer(buffer: Buffer): Promise<boolean> {
    try {
      const clamscan = await this.clamscanPromise;
      if (!clamscan) {
        // Scanner unavailable or bypassed
        return true;
      }
      const stream = Readable.from(buffer);
      
      const { isInfected, viruses } = await clamscan.scanStream(stream);
      
      if (isInfected) {
        console.warn('Virus detected:', viruses);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('ClamAV scan failed:', error);
      // Fail-secure: if scanner is down, we might reject or accept depending on policy.
      // For enterprise, usually we throw or return false.
      throw new Error('Virus scanning service unavailable');
    }
  }
}
