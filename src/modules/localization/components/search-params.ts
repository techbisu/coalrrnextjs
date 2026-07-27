import { parseAsString, parseAsInteger, createSearchParamsCache } from 'nuqs/server';

// We can define the keys here. If you want a prefix (e.g. "loc_search"), 
// you would just change the keys passed to useQueryState in the components, 
// and map them here.

export const searchParamsParsers = {
  module: parseAsString.withDefault('all'),
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
