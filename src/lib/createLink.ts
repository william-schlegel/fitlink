export default function createLink(
  searchParams: Record<string, string | undefined>,
  location?: string | null,
  pathname?: string | null,
) {
  // Build query string from search params
  const params = new URLSearchParams();
  for (const key of Object.keys(searchParams)) {
    if (searchParams[key] !== undefined && searchParams[key] !== null) {
      params.set(key, searchParams[key] ?? "");
    }
  }
  const queryString = params.toString();

  // If location is provided, use it as base
  if (location) {
    try {
      const url = new URL(location);
      // Clear existing search params and set new ones
      url.search = queryString;
      return url.href;
    } catch {
      // If location is not a valid URL, treat it as a path
      return queryString ? `${location}?${queryString}` : location;
    }
  }

  // Use provided pathname or get from window (client-side only)
  const currentPathname =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");

  // Return consistent format: pathname + query string
  // This ensures same output on server and client
  if (queryString) {
    return currentPathname
      ? `${currentPathname}?${queryString}`
      : `?${queryString}`;
  }
  return currentPathname || "";
}

export function createHref(
  href: string | null,
  params: string[],
  searchParams: Record<string, string | undefined>,
) {
  let newUrl = "/";
  if (href) {
    const url = new URL(href);
    newUrl = `${url.protocol}//${url.host}`;
  }
  for (const d of params) {
    newUrl += `/${d}`;
  }
  if (!searchParams) return newUrl;
  return createLink(searchParams, newUrl);
}
