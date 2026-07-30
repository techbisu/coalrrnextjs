export interface IChecklistContextResolver {
  /**
   * Returns a key-value map representing the current state of the entity.
   * This is used to evaluate the `show_if` JSON rules and handle `inherit_from`.
   */
  resolve(entityId: string): Promise<Record<string, any>>;
}
