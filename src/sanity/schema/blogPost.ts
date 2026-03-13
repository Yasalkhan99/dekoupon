import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 120 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          "Fashion",
          "Lifestyle",
          "Food & Beverage",
          "Travel",
          "Home & Garden",
          "Health & Fitness",
          "Technology",
          "Entertainment",
          "Clothing & Accessories",
          "Baby & Kids",
          "Top Brand Blogs",
          "Featured",
          "Beauty",
          "Automotive",
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Featured Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "imageAspectRatio",
      title: "Image Aspect Ratio",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "1:1 (Square)", value: "1/1" },
          { title: "4:3", value: "4/3" },
          { title: "3:2", value: "3/2" },
          { title: "16:9", value: "16/9" },
          { title: "21:9 (Ultrawide)", value: "21/9" },
        ],
      },
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H1", value: "h1" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
              { title: "Underline", value: "underline" },
              { title: "Strike", value: "strike-through" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "URL",
                    validation: (r) =>
                      r.uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
                  },
                  { name: "blank", type: "boolean", title: "Open in new tab" },
                ],
              },
            ],
          },
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", type: "string", title: "Alt Text" },
            { name: "caption", type: "string", title: "Caption" },
          ],
        },
      ],
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "niche",
      title: "Niche (Home Page Sections)",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Featured", value: "featured" },
          { title: "Trending", value: "trending" },
          { title: "Popular", value: "popular" },
        ],
      },
    }),
    defineField({
      name: "publishedDate",
      title: "Published Date",
      type: "datetime",
    }),
    defineField({
      name: "metaTitle",
      title: "SEO Meta Title",
      type: "string",
    }),
    defineField({
      name: "metaDescription",
      title: "SEO Meta Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "storeSlug",
      title: "Store Slug (for CTA)",
      type: "string",
      description: 'e.g. "phones-direct" → links to /promotions/phones-direct',
    }),
    defineField({
      name: "storeCtaLabel",
      title: "Store CTA Label",
      type: "string",
      description: 'e.g. "Get The Latest Sales On Phones Direct"',
    }),
  ],
  orderings: [
    {
      title: "Published Date (New → Old)",
      name: "publishedDateDesc",
      by: [{ field: "publishedDate", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "image",
    },
  },
});
