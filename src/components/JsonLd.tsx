/**
 * Emits structured data. Kept as one component so every block on the site is
 * serialised the same way, with `<` escaped so a stray character in copy can
 * never close the script tag early.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
