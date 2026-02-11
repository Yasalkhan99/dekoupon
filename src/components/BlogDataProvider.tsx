"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { BlogPost } from "@/data/blog";
import type { NavDropdownPost } from "@/data/blog";

export type BlogDataContextValue = {
  heroPost: BlogPost;
  featuredPosts: BlogPost[];
  mostPopularPosts: BlogPost[];
  latestPosts: BlogPost[];
  trendingPosts: BlogPost[];
  heroFlowPosts: BlogPost[];
  footerCategories: { name: string; posts: BlogPost[] }[];
  navDropdownPosts: Record<string, NavDropdownPost[]>;
  allPosts: BlogPost[];
};

const BlogDataContext = createContext<BlogDataContextValue | null>(null);

export function useBlogData(): BlogDataContextValue {
  const value = useContext(BlogDataContext);
  if (!value) {
    throw new Error("useBlogData must be used within BlogDataProvider");
  }
  return value;
}

function BlogDataProvider({
  initialData,
  children,
}: {
  initialData: BlogDataContextValue;
  children: ReactNode;
}) {
  return (
    <BlogDataContext.Provider value={initialData}>
      {children}
    </BlogDataContext.Provider>
  );
}

export { BlogDataProvider };
export default BlogDataProvider;
