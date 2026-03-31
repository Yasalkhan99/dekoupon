/** Renders JSON-LD for search engines (Schema.org). */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
