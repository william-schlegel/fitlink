export default function createLink(
  data: Record<string, string | undefined>,
  location?: string | null
) {
  const url = new URL(location ?? window.location.href);

  for (const d of Object.keys(data)) {
    url.searchParams.delete(d);
    url.searchParams.append(d, data[d] ?? "");
  }
  return url.href;
}
