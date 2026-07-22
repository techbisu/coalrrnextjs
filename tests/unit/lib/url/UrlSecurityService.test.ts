import { describe, it, expect } from 'vitest'
import { UrlSecurityService } from '@/lib/url/UrlSecurityService'

describe('UrlSecurityService - URL Parameter Encryption & Decryption', () => {
  it('should encrypt and decrypt a project code containing slashes', () => {
    const projectCode = 'ECL/4501/4501/2026/0001'
    const encrypted = UrlSecurityService.encryptUrlParam(projectCode)
    
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toContain('/')
    expect(typeof encrypted).toBe('string')

    const decrypted = UrlSecurityService.safeDecryptUrlParam(encrypted)
    expect(decrypted).toBe(projectCode)
  })

  it('should safely handle raw multi-segment path arrays from catch-all routes', () => {
    const pathSegments = ['ECL', '4501', '4501', '2026', '0001']
    const result = UrlSecurityService.safeDecryptUrlParam(pathSegments)
    expect(result).toBe('ECL/4501/4501/2026/0001')
  })

  it('should safely handle raw unencrypted single string IDs', () => {
    const rawId = 'PRJ-101'
    const result = UrlSecurityService.safeDecryptUrlParam(rawId)
    expect(result).toBe('PRJ-101')
  })
})
