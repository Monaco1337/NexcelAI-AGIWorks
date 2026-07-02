/**
 * Renders one or more JSON-LD schema objects as <script type="application/ld+json">.
 *
 * Pure, dependency-free component (safe in both server and client trees).
 * Pass factual schema objects built via lib/seo/jsonld.ts only.
 */

type JsonLdObject = Record<string, unknown>;

interface SeoJsonLdProps {
  schema: JsonLdObject | JsonLdObject[];
}

export default function SeoJsonLd({ schema }: SeoJsonLdProps) {
  const items = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify output is safe: no user input, escaped angle brackets
          // to defend against any accidental </script> in string values.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
