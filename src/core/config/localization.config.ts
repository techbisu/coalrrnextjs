export const localizationConfig = {
  defaultPageSize: Number(process.env.LOCALIZATION_DEFAULT_PAGE_SIZE ?? 15),
  useCasePageSize: Number(process.env.LOCALIZATION_USECASE_PAGE_SIZE ?? 50),
  searchDebounceMs: Number(process.env.LOCALIZATION_SEARCH_DEBOUNCE_MS ?? 500),
} as const;
