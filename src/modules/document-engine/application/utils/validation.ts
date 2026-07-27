import { z } from 'zod';

export function createDynamicZodSchema(fields: Array<{ field_key: string; is_required: boolean }>) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny = z.string();
    if (field.is_required) {
      fieldSchema = (fieldSchema as z.ZodString).min(1, 'This field is required');
    } else {
      fieldSchema = fieldSchema.optional();
    }
    schemaShape[field.field_key] = fieldSchema;
  });
  
  return z.object(schemaShape);
}

export function evaluateConditions(formData: Record<string, any>, rules: Record<string, any> | null): boolean {
  if (!rules) return true;
  
  // Basic MongoDB-style condition evaluator
  const evaluate = (rule: any): boolean => {
    if (rule.$and && Array.isArray(rule.$and)) {
      return rule.$and.every((subRule: any) => evaluate(subRule));
    }
    if (rule.$or && Array.isArray(rule.$or)) {
      return rule.$or.some((subRule: any) => evaluate(subRule));
    }
    
    // Field-level evaluation e.g. { "ModeGovtTransfer": { "$eq": "1" } }
    for (const [key, condition] of Object.entries(rule)) {
      if (key === '$and' || key === '$or') continue;
      
      const value = formData[key];
      const cond = condition as Record<string, any>;
      
      if (cond.$eq !== undefined) {
        if (value !== cond.$eq) return false;
      }
      if (cond.$neq !== undefined) {
        if (value === cond.$neq) return false;
      }
      if (cond.$gt !== undefined) {
        if (Number(value) <= Number(cond.$gt)) return false;
      }
      if (cond.$lt !== undefined) {
        if (Number(value) >= Number(cond.$lt)) return false;
      }
      if (cond.$gte !== undefined) {
        if (Number(value) < Number(cond.$gte)) return false;
      }
      if (cond.$lte !== undefined) {
        if (Number(value) > Number(cond.$lte)) return false;
      }
      if (cond.$in !== undefined && Array.isArray(cond.$in)) {
        if (!cond.$in.includes(value)) return false;
      }
      if (cond.$notIn !== undefined && Array.isArray(cond.$notIn)) {
        if (cond.$notIn.includes(value)) return false;
      }
    }
    return true;
  };

  try {
    return evaluate(rules);
  } catch (e) {
    console.error('Condition evaluation error', e);
    return true; // default to showing if rules are broken
  }
}
