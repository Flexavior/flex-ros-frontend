/** Normalize list API response (paginated Laravel envelope or legacy array). */
export function productsFromListResponse(res) {
  const body = res?.data;
  if (Array.isArray(body)) {
    return body;
  }

  return body?.data ?? [];
}

/** Load full catalogue for pickers (paginated API, capped pages). */
export async function fetchAllProductsForPicker(api, maxPages = 20) {
  const items = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await api.get('/products-services', { params: { page, per_page: 50 } });
    items.push(...productsFromListResponse(res));
    lastPage = res.data?.last_page ?? 1;
    page += 1;
  } while (page <= lastPage && page <= maxPages);

  return items;
}
