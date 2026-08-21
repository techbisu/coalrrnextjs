import { z } from 'zod';

export function createDynamicZodSchema(fields: Array<{ field_key: string; field_type?: string; is_required: boolean }>) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  
  fields.forEach(field => {
    if (field.field_type === 'file') {
      let fileSchema: z.ZodTypeAny = z.any();
      if (field.is_required) {
        fileSchema = z.any().refine(val => val != null && val !== '', 'File attachment is required');
      } else {
        fileSchema = z.any().optional();
      }
      schemaShape[field.field_key] = fileSchema;
    } else {
      let fieldSchema: z.ZodTypeAny = z.string();
      if (field.is_required) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, 'This field is required');
      } else {
        fieldSchema = fieldSchema.optional();
      }
      schemaShape[field.field_key] = fieldSchema;
    }
  });
  
  return z.object(schemaShape);
}

export function evaluateConditions(formData: Record<string, any>, rules: Record<string, any> | string | null): boolean {
  if (!rules) return true;

  let parsedRules = rules;
  if (typeof rules === 'string') {
    try {
      parsedRules = JSON.parse(rules);
    } catch (e) {
      return true;
    }
  }

  if (typeof parsedRules !== 'object' || parsedRules === null) return true;
  const form = formData || {};
  
  const evaluate = (rule: any): boolean => {
    if (typeof rule !== 'object' || rule === null) return true;

    if (rule.$and && Array.isArray(rule.$and)) {
      return rule.$and.every((subRule: any) => evaluate(subRule));
    }
    if (rule.$or && Array.isArray(rule.$or)) {
      return rule.$or.some((subRule: any) => evaluate(subRule));
    }
    
    for (const [key, condition] of Object.entries(rule)) {
      if (key === '$and' || key === '$or') continue;
      
      const value = form[key];
      
      // Handle simple string/primitive equality: e.g. { "CompetentApprovalStatus": "Yes" }
      if (typeof condition !== 'object' || condition === null) {
        if (value !== condition) return false;
        continue;
      }
      
      const cond = condition as Record<string, any>;
      const eqVal = cond.$eq !== undefined ? cond.$eq : cond[''];
      if (eqVal !== undefined) {
        if (value !== eqVal) return false;
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
    return evaluate(parsedRules);
  } catch (e) {
    console.error('Condition evaluation error', e);
    return true;
  }
}
