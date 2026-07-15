export type ChangeType = "ADDED" | "UPDATED" | "DELETED" | "NO_CHANGE";

export interface FieldChange {
  field_name: string;
  old_value?: any;
  new_value?: any;
  change_type: ChangeType;
}

export function generateDiff(
  oldData: Record<string, any> | null | undefined,
  newData: Record<string, any> | null | undefined,
  ignoredFields: string[] = ["updt_ts", "updt_by", "entry_ts", "entry_by", "created_at", "updated_at"]
): FieldChange[] {
  const changes: FieldChange[] = [];
  const oldObj = oldData || {};
  const newObj = newData || {};
  
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  allKeys.forEach((key) => {
    if (ignoredFields.includes(key)) return;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (oldVal === undefined && newVal !== undefined) {
      changes.push({
        field_name: key,
        old_value: null,
        new_value: newVal,
        change_type: "ADDED",
      });
    } else if (oldVal !== undefined && newVal === undefined) {
      changes.push({
        field_name: key,
        old_value: oldVal,
        new_value: null,
        change_type: "DELETED",
      });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field_name: key,
        old_value: oldVal,
        new_value: newVal,
        change_type: "UPDATED",
      });
    }
  });

  return changes;
}
