/** Map Laravel paginator JSON to ListPagination meta. */
export function listMetaFromResponse(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.meta && data.meta.total != null) return data.meta;
  if (data.total == null) return null;

  return {
    current_page: data.current_page,
    last_page: data.last_page,
    per_page: data.per_page,
    total: data.total,
    from: data.from,
    to: data.to,
  };
}
