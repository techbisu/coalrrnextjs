'use server'

import { UrlSecurityService } from '@/lib/url/UrlSecurityService'

/**
 * Server Action to encrypt a URL parameter so it can be safely used in a Client Component.
 * @param param The raw string to encrypt (e.g. an entity ID)
 * @returns The AES-256-GCM URL-safe Base64 token
 */
export async function encryptUrlParamAction(param: string): Promise<string> {
  if (!param) return ''
  return UrlSecurityService.encryptUrlParam(param)
}
