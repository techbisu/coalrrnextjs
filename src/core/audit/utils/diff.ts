import { auditConfig } from '@/core/config/audit.config';

export function generateDiff(oldData: any, newData: any, ignoreFields: readonly string[] = auditConfig.ignoreFields): { field: string, old: any, new: any }[] {
  const diff: { field: string, old: any, new: any }[] = []
  
  if (!oldData && newData) {
    for (const key of Object.keys(newData)) {
      if (!ignoreFields.includes(key)) {
        diff.push({ field: key, old: null, new: newData[key] })
      }
    }
    return diff
  }

  if (oldData && !newData) {
    for (const key of Object.keys(oldData)) {
      if (!ignoreFields.includes(key)) {
        diff.push({ field: key, old: oldData[key], new: null })
      }
    }
    return diff
  }

  // Both exist, compare them
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])

  for (const key of allKeys) {
    if (ignoreFields.includes(key)) continue

    const oldVal = oldData[key]
    const newVal = newData[key]

    // Simple comparison
    if (oldVal !== newVal && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff.push({ field: key, old: oldVal, new: newVal })
    }
  }

  return diff
}
