/**
 * AcquisitionMode Value Object - Legal basis for land acquisition.
 */
import { ValueObject } from '@/core/base/ValueObject'
import { Result, Fail } from '@/core/result/Result'
import { ValidationException } from '@/core/errors'

export type AcquisitionModeType = 'cba_act' | 'direct_purchase' | 'rfctlarr' | 'patta'

export interface AcquisitionModeMetadata {
  label: string
  checklistCode: string
  description: string
}

export class AcquisitionMode extends ValueObject<AcquisitionModeType> {
  private static readonly METADATA: Record<AcquisitionModeType, AcquisitionModeMetadata> = {
    cba_act: {
      label: 'CBA Act, 1957',
      checklistCode: 'CL-1.1',
      description: 'Coal Bearing Areas (Acquisition and Development) Act, 1957',
    },
    direct_purchase: {
      label: 'Direct Purchase',
      checklistCode: 'CL-1.2',
      description: 'Direct negotiated purchase from landowners',
    },
    rfctlarr: {
      label: 'RFCTLARR Act, 2013',
      checklistCode: 'CL-1.3',
      description: 'Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013',
    },
    patta: {
      label: 'Patta Transfer',
      checklistCode: 'CL-1.4',
      description: 'Transfer of government patta land',
    },
  }

  private constructor(value: AcquisitionModeType) {
    super(value)
  }

  static CBA_ACT = new AcquisitionMode('cba_act')
  static DIRECT_PURCHASE = new AcquisitionMode('direct_purchase')
  static RFCTLARR = new AcquisitionMode('rfctlarr')
  static PATTA = new AcquisitionMode('patta')

  static tryCreate(value: string): Result<AcquisitionMode, ValidationException> {
    const validModes: AcquisitionModeType[] = ['cba_act', 'direct_purchase', 'rfctlarr', 'patta']
    
    if (!validModes.includes(value as AcquisitionModeType)) {
      return Fail(new ValidationException('Invalid Acquisition Mode', [
        { field: 'acquisitionMode', message: `Must be one of: ${validModes.join(', ')}` }
      ]))
    }

    return { isSuccess: true, isFailure: false, value: new AcquisitionMode(value as AcquisitionModeType), error: null }
  }

  static fromString(value: string): AcquisitionMode {
    return new AcquisitionMode(value as AcquisitionModeType)
  }

  get value(): AcquisitionModeType {
    return this._value
  }

  getMetadata(): AcquisitionModeMetadata {
    return AcquisitionMode.METADATA[this._value]
  }

  getLabel(): string {
    return this.getMetadata().label
  }

  getChecklistCode(): string {
    return this.getMetadata().checklistCode
  }

  getDescription(): string {
    return this.getMetadata().description
  }

  isCBA(): boolean {
    return this._value === 'cba_act'
  }

  isDirectPurchase(): boolean {
    return this._value === 'direct_purchase'
  }

  isRFCTLARR(): boolean {
    return this._value === 'rfctlarr'
  }

  isPatta(): boolean {
    return this._value === 'patta'
  }
}
