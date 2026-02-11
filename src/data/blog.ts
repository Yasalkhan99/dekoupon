/** Niche for hero/home: show in Featured, Trending, or Popular sections */
export type BlogNiche = "featured" | "trending" | "popular";

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  image: string;
  featured?: boolean;
  /** Which hero sections to show this in (admin-editable). Backward compat: featured=true => niche includes "featured" */
  niche?: BlogNiche[];
  /** Full article HTML – editable in Admin → Blog */
  content?: string;
  createdAt?: string;
  publishedDate?: string;
};

/** Blog categories – used on home page (sidebar) and footer */
export const categories = [
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
] as const;

// Picsum Photos – reliable, no auth. Format: /id/{id}/{width}/{height}
const img = (id: number, w: number, h: number) =>
  `https://picsum.photos/id/${id}/${w}/${h}`;

export const heroPost: BlogPost = {
  id: "1",
  title: "Is Najell Worth the Price? Current Deals on SleepCarriers and Babywear",
  excerpt:
    "Discover the best Najell offers and whether their sleep carriers deliver value for money.",
  category: "Trending Blogs",
  slug: "najell-sleepcarriers-babywear-deals",
  image: img(10, 1200, 600),
  featured: true,
};

// Category tags shown below hero headline (white boxes, red text)
export const heroCategoryTags = [
  { label: "Sleep & Wellness", href: "/category/sleep-wellness" },
  { label: "Baby & Toddler", href: "/category/baby-toddler" },
  { label: "Parenting", href: "/category/parenting" },
];

export const featuredPosts: BlogPost[] = [
  {
    id: "2",
    title: "Unlock Exclusive Discounts on Your Safe Swimwear Of SwimZUp",
    category: "Fashion",
    excerpt: "Get the best deals on quality swimwear this season.",
    slug: "swimzup-swimwear-discounts",
    image: img(43, 400, 300),
  },
  {
    id: "3",
    title: "Affordable Christmas Gift Ideas Paired With Fresh Flowers",
    category: "Lifestyle",
    excerpt: "Budget-friendly gift combos that look premium.",
    slug: "christmas-gift-ideas-flowers",
    image: img(29, 400, 300),
  },
  {
    id: "4",
    title: "The Ultimate Skincare Sale Guide: Save Big on Science-Backed Beauty",
    category: "Fashion",
    excerpt: "Don't miss these limited-time skincare deals.",
    slug: "skincare-sale-guide-deals",
    image: img(26, 400, 300),
  },
];

export const mostPopularPosts: BlogPost[] = [
  {
    id: "5",
    title: "Unlock Exclusive Discounts on Your Safe Swimwear Of SwimZUp",
    category: "Fashion",
    excerpt: "Get the best deals on quality swimwear this season. Limited time offers on premium brands.",
    slug: "swimzup-swimwear-discounts",
    image: img(43, 600, 400),
  },
  {
    id: "6",
    title: "Affordable Christmas Gift Ideas Paired With Fresh Flowers",
    category: "Home & Garden",
    excerpt: "Budget-friendly gift combos that look premium. Perfect for the holiday season.",
    slug: "christmas-gift-ideas-flowers",
    image: img(29, 600, 400),
  },
  {
    id: "7",
    title: "Unveiling The Style Legacy Of Jack Archer",
    category: "Fashion",
    excerpt: "A deep dive into timeless fashion and what makes Jack Archer a household name.",
    slug: "jack-archer-style-legacy",
    image: img(65, 600, 400),
  },
  {
    id: "8",
    title: "The Ultimate Murad Sale Guide: Save Big on Science-Backed Skincare",
    category: "Fashion",
    excerpt: "Your complete guide to scoring the best Murad skincare deals.",
    slug: "murad-sale-guide-skincare",
    image: img(26, 600, 400),
  },
  {
    id: "9",
    title: "Cupcake Reviews",
    category: "Lifestyle",
    excerpt: "Honest reviews of the trendiest cupcake spots and home recipes.",
    slug: "cupcake-reviews",
    image: img(292, 600, 400),
  },
  {
    id: "10",
    title: "This Week's Hottest Women's Fashion Sales",
    category: "Fashion",
    excerpt: "Curated list of the best women's fashion deals you can't miss.",
    slug: "womens-fashion-sales-week",
    image: img(1084, 600, 400),
  },
  {
    id: "11",
    title: "Unraveling the Luxury: The Top 10 Most Expensive Necklaces Ever Sold",
    category: "Trending Blogs",
    excerpt: "From rare gems to iconic pieces—explore the world of luxury jewelry.",
    slug: "most-expensive-necklaces",
    image: img(113, 600, 400),
  },
  {
    id: "12",
    title: "Up to 60% Off Deals on Little Love Bag You Can't Miss",
    category: "Trending Blogs",
    excerpt: "Massive savings on handbags and accessories. Limited stock.",
    slug: "little-love-bag-deals",
    image: img(83, 600, 400),
  },
];

export const latestPosts: BlogPost[] = [
  {
    id: "1",
    title: "Is Najell Worth the Price? Current Deals on SleepCarriers and Babywear",
    category: "Trending Blogs",
    excerpt: "Discover the best Najell offers and whether their sleep carriers deliver value.",
    slug: "najell-sleepcarriers-babywear-deals",
    image: img(10, 600, 400),
  },
  {
    id: "13",
    title: "10 Smart Ways to Save Money at Home",
    category: "Lifestyle",
    excerpt: "Practical tips to cut costs without sacrificing comfort.",
    slug: "save-money-at-home",
    image: img(42, 600, 400),
  },
  {
    id: "14",
    title: "4 Portable Christmas Gift Ideas Paired With Fresh Flowers",
    category: "Home & Garden",
    excerpt: "Travel-friendly gift ideas that still feel special.",
    slug: "portable-christmas-gifts-flowers",
    image: img(149, 600, 400),
  },
  {
    id: "15",
    title: "Najell Offers You Can't Miss",
    category: "Trending Blogs",
    excerpt: "Latest Najell promotions and bundle deals for parents.",
    slug: "najell-offers",
    image: img(10, 600, 400),
  },
  {
    id: "16",
    title: "Top 5 Ways to Get the Best Savings at Philips",
    category: "Technology",
    excerpt: "How to maximize discounts on Philips electronics and appliances.",
    slug: "philips-savings-guide",
    image: img(1, 600, 400),
  },
  {
    id: "17",
    title: "Huda Beauty® Christmas Sale Deals Include",
    category: "Fashion",
    excerpt: "Everything you need to know about the Huda Beauty holiday sale.",
    slug: "huda-beauty-christmas-sale",
    image: img(26, 600, 400),
  },
];

export const trendingPosts: BlogPost[] = [
  mostPopularPosts[0],
  mostPopularPosts[1],
  latestPosts[1],
  mostPopularPosts[3],
  latestPosts[4],
  mostPopularPosts[5],
];

export const footerCategories = [
  { name: "Fashion", posts: mostPopularPosts.filter((p) => p.category === "Fashion").slice(0, 4) },
  { name: "Home & Garden", posts: mostPopularPosts.filter((p) => p.category === "Home & Garden").slice(0, 4) },
  { name: "Lifestyle", posts: latestPosts.filter((p) => p.category === "Lifestyle").slice(0, 4) },
  { name: "Trending Blogs", posts: mostPopularPosts.filter((p) => p.category === "Trending Blogs").slice(0, 4) },
];

// Nav dropdown: 4 posts per menu (Fashion, Lifestyle, Featured) with date for display
export type NavDropdownPost = BlogPost & { date: string };
const withDate = (post: BlogPost, date: string): NavDropdownPost => ({ ...post, date });

export const navDropdownPosts: Record<string, NavDropdownPost[]> = {
  fashion: [
    withDate(mostPopularPosts[0], "JANUARY 2, 2026"),
    withDate(mostPopularPosts[2], "DECEMBER 6, 2025"),
    withDate(mostPopularPosts[4], "DECEMBER 2, 2025"),
    withDate(mostPopularPosts[5], "NOVEMBER 17, 2025"),
  ],
  lifestyle: [
    withDate(mostPopularPosts[1], "JANUARY 5, 2026"),
    withDate(mostPopularPosts[4], "DECEMBER 2, 2025"),
    withDate(latestPosts[1], "DECEMBER 28, 2025"),
    withDate(latestPosts[2], "DECEMBER 20, 2025"),
  ],
  featured: [
    withDate(mostPopularPosts[0], "JANUARY 2, 2026"),
    withDate(mostPopularPosts[3], "DECEMBER 10, 2025"),
    withDate(latestPosts[0], "JANUARY 1, 2026"),
    withDate(latestPosts[4], "DECEMBER 15, 2025"),
  ],
};
