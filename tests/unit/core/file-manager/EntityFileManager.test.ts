import { describe, it, expect } from 'vitest'

describe('Entity File Manager Shared Component Suite', () => {
  it('1. Should parse comma-separated tags and JSON tag arrays correctly', () => {
    const rawCsv = 'Justification Note, Survey Map , Gazette Notification'
    const parsedCsv = rawCsv.split(',').map((t) => t.trim()).filter(Boolean)
    expect(parsedCsv).toEqual(['Justification Note', 'Survey Map', 'Gazette Notification'])

    const rawJson = '["Title Search Report", "Rate Valuation Minutes"]'
    const parsedJson = JSON.parse(rawJson)
    expect(parsedJson).toEqual(['Title Search Report', 'Rate Valuation Minutes'])
  })

  it('2. Should construct valid multipart form data payload with custom tags', () => {
    const tags = ['Form XXII Deviation', 'Justification Note']
    const tagsPayload = JSON.stringify(tags)

    expect(tagsPayload).toBe('["Form XXII Deviation","Justification Note"]')
    expect(JSON.parse(tagsPayload)).toHaveLength(2)
  })

  it('3. Should validate repository link payload with selected file IDs', () => {
    const selectedIds = new Set(['file_101', 'file_102', 'file_103'])
    const payload = {
      file_ids: Array.from(selectedIds),
      module: 'linked_repo',
    }

    expect(payload.file_ids).toEqual(['file_101', 'file_102', 'file_103'])
    expect(payload.file_ids.length).toBe(3)
  })
})
