export class TemplateEngine {
  /**
   * Extremely simple regex-based template compiler for MVP.
   * In a full implementation, this could use Handlebars or LiquidJS.
   * e.g., "Hello {{name}}" + { name: "John" } => "Hello John"
   */
  public static compile(template: string, data: Record<string, any>): string {
    if (!template) return ''
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
      // Handle dot notation (e.g., proposal.id)
      const keys = key.split('.')
      let value: any = data
      for (const k of keys) {
        if (value === undefined || value === null) break
        value = value[k]
      }
      return value !== undefined && value !== null ? String(value) : match
    })
  }
}
