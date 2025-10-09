export default function createLink(
  searchParams: Record<string, string | undefined>,
  location?: string | null,
) {
  const url = new URL(location ?? window.location.href);

  for (const d of Object.keys(searchParams)) {
    url.searchParams.delete(d);
    url.searchParams.append(d, searchParams[d] ?? "");
  }
  return url.href;
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
