"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";
import type { BlogPost, BlogNiche } from "@/data/blog";
import { categories as blogCategories, IMAGE_ASPECT_OPTIONS, type ImageAspectRatio } from "@/data/blog";

const BLOG_NICHES: { value: BlogNiche; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Popular" },
];
import { STORE_CATEGORY_NAMES } from "@/data/categories";
import { SPECIAL_EVENTS } from "@/data/events";
import { stripHtml, slugify } from "@/lib/slugify";
import { hasCouponData } from "@/lib/store-utils";
import RichTextEditor from "@/components/RichTextEditor";

type Section = "dashboard" | "coupons" | "stores" | "blog" | "analytics" | "tracking";

const SIDEBAR_LINKS: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "coupons", label: "Coupons", icon: "◇" },
  { id: "stores", label: "Stores", icon: "▣" },
  { id: "blog", label: "Blog", icon: "✎" },
  { id: "analytics", label: "Analytics", icon: "▤" },
  { id: "tracking", label: "Click Tracking", icon: "◈" },
];

/** Parse one CSV line; handles quoted fields with commas. */
function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let val = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          i++;
          if (line[i] === '"') { val += '"'; i++; }
          else break;
        } else { val += line[i]; i++; }
      }
      out.push(val.trim());
      if (line[i] === ",") i++;
    } else {
      let val = "";
      while (i < line.length && line[i] !== ",") { val += line[i]; i++; }
      out.push(val.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
      if (line[i] === ",") i++;
    }
  }
  return out;
}

export default function AdminPage() {
  const [section, setSection] = useState<Section>("dashboard");
  const [stores, setStores] = useState<Store[]>([]);
  const [couponsFromTable, setCouponsFromTable] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [storeStatusFilter, setStoreStatusFilter] = useState<"all" | "enable" | "disable">("all");
  const [storeSearch, setStoreSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    description: "",
    expiry: "Dec 31, 2026",
    link: "",
  });
  const [couponForm, setCouponForm] = useState({
    selectedStoreId: "",
    name: "",
    couponType: "deal" as "code" | "deal",
    couponCode: "",
    couponTitle: "",
    badgeLabel: "",
    badgeShipping: "",
    badgeOffer: "",
    logoMethod: "url" as "url" | "upload",
    logoUrl: "",
    description: "",
    link: "",
    expiry: "",
    imageAlt: "",
    priority: 0,
    active: true,
    trending: false,
    events: [] as string[],
  });
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponStatusFilter, setCouponStatusFilter] = useState<"all" | "enable" | "disable">("all");
  const [couponSearch, setCouponSearch] = useState("");
  const [couponPage, setCouponPage] = useState(1);
  const [couponPerPage, setCouponPerPage] = useState(25);
  const [storeForm, setStoreForm] = useState({
    name: "",
    subStoreName: "",
    storePageHeading: "",
    slug: "",
    slugAuto: true,
    logoMethod: "url" as "url" | "upload",
    logoUrl: "",
    logoAltText: "",
    description: "",
    trackingUrl: "",
    countryCodes: "",
    websiteUrl: "",
    category: "",
    whyTrustUs: "",
    moreInfo: "",
    codesAndCouponsContent: "",
    moreAboutContent: "",
    shoppingTipsTitle: "",
    shoppingTips: [] as string[],
    seoTitle: "",
    seoMetaDesc: "",
    trending: false,
    faqs: [] as { q: string; a: string }[],
  });
  const [showStoresCreateForm, setShowStoresCreateForm] = useState(false);
  const [showCouponsCreateForm, setShowCouponsCreateForm] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [storePage, setStorePage] = useState(1);
  const [storePerPage, setStorePerPage] = useState(25);
  const [showUploadStoresModal, setShowUploadStoresModal] = useState(false);
  const [showUploadLogosModal, setShowUploadLogosModal] = useState(false);
  const [uploadStoresFile, setUploadStoresFile] = useState<File | null>(null);
  const [uploadStoresPreview, setUploadStoresPreview] = useState<Record<string, string>[] | null>(null);
  const [uploadStoresSubmitting, setUploadStoresSubmitting] = useState(false);
  const [uploadLogoStoreId, setUploadLogoStoreId] = useState("");
  const [uploadLogoUrl, setUploadLogoUrl] = useState("");
  const [uploadLogoSubmitting, setUploadLogoSubmitting] = useState(false);
  const [showUploadCouponsModal, setShowUploadCouponsModal] = useState(false);
  const [uploadCouponsFile, setUploadCouponsFile] = useState<File | null>(null);
  const [uploadCouponsPreview, setUploadCouponsPreview] = useState<Record<string, string>[] | null>(null);
  const [uploadCouponsSubmitting, setUploadCouponsSubmitting] = useState(false);
  const [showAddCouponForStore, setShowAddCouponForStore] = useState(false);

  const [blogPosts, setBlogPosts] = useState<(BlogPost & { content?: string; createdAt?: string; publishedDate?: string })[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<{
    title: string;
    slug: string;
    category: (typeof blogCategories)[number];
    excerpt: string;
    image: string;
    imageAspectRatio: ImageAspectRatio;
    featured: boolean;
    niche: BlogNiche[];
    content: string;
    publishedDate: string;
  }>({
    title: "",
    slug: "",
    category: blogCategories[0],
    excerpt: "",
    image: "",
    imageAspectRatio: "16/9",
    featured: false,
    niche: [],
    content: "",
    publishedDate: "",
  });
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const excerptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const visualImageUploadInputRef = useRef<HTMLInputElement>(null);
  const featuredImageUploadInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [contentViewMode, setContentViewMode] = useState<"html" | "preview">("preview");

  const [analytics, setAnalytics] = useState<{
    totalClicks: number;
    clicksToday: number;
    clicksThisWeek: number;
    byStore: { storeId: string; storeName: string; count: number }[];
    topCoupons: { storeId: string; code: string; uses: number; pct: string }[];
    totalCoupons: number;
    codesCount: number;
    dealsCount: number;
    avgUsageRate: string;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchStores = async () => {
    try {
      const [storesRes, couponsRes] = await Promise.all([
        fetch("/api/stores", { cache: "no-store" }),
        fetch("/api/coupons", { cache: "no-store" }),
      ]);
      const storesData = await storesRes.json();
      const couponsData = await couponsRes.json();
      setStores(Array.isArray(storesData) ? storesData : []);
      setCouponsFromTable(Array.isArray(couponsData) ? couponsData : []);
    } catch {
      setStores([]);
      setCouponsFromTable([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setAnalytics({
        totalClicks: data.totalClicks ?? 0,
        clicksToday: data.clicksToday ?? 0,
        clicksThisWeek: data.clicksThisWeek ?? 0,
        byStore: Array.isArray(data.byStore) ? data.byStore : [],
        topCoupons: Array.isArray(data.topCoupons) ? data.topCoupons : [],
        totalCoupons: data.totalCoupons ?? 0,
        codesCount: data.codesCount ?? 0,
        dealsCount: data.dealsCount ?? 0,
        avgUsageRate: data.avgUsageRate ?? "0.0",
      });
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (section === "analytics") fetchAnalytics();
  }, [section]);

  const fetchBlogs = async () => {
    setBlogLoading(true);
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      setBlogPosts(Array.isArray(data) ? data : []);
    } catch {
      setBlogPosts([]);
    } finally {
      setBlogLoading(false);
    }
  };

  useEffect(() => {
    if (section === "blog") fetchBlogs();
  }, [section]);

  // When switching to Normal (preview) tab, load HTML into the contentEditable
  useEffect(() => {
    if (contentViewMode === "preview" && contentEditableRef.current) {
      contentEditableRef.current.innerHTML = blogForm.content?.trim() || "<p><br></p>";
    }
  }, [contentViewMode]);

  const execVisual = (command: string, value?: string) => {
    contentEditableRef.current?.focus();
    document.execCommand(command, false, value ?? undefined);
    if (contentEditableRef.current) setBlogForm((f) => ({ ...f, content: contentEditableRef.current!.innerHTML }));
  };
  const insertVisualLink = () => {
    const url = window.prompt("Link URL:");
    if (url == null || !url.trim()) return;
    const fullUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : "https://" + url.trim();
    execVisual("createLink", fullUrl);
  };

  const execVisualFontSize = (px: number) => {
    const el = contentEditableRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
    if (!range || range.collapsed) return;
    try {
      const fragment = range.extractContents();
      const span = document.createElement("span");
      span.style.fontSize = `${Math.min(100, Math.max(1, px))}px`;
      span.appendChild(fragment);
      range.insertNode(span);
      setBlogForm((f) => ({ ...f, content: el.innerHTML }));
    } catch {
      // fallback: insertHTML with plain text
      const text = range.toString();
      if (text) {
        range.deleteContents();
        const span = document.createElement("span");
        span.style.fontSize = `${Math.min(100, Math.max(1, px))}px`;
        span.textContent = text;
        range.insertNode(span);
        setBlogForm((f) => ({ ...f, content: el.innerHTML }));
      }
    }
  };

  const insertVisualImageFromUrl = (src: string, alt = "") => {
    const el = contentEditableRef.current;
    if (!el) return;
    el.focus();
    const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const altAttr = alt ? ` alt="${escapeAttr(alt)}"` : "";
    const imgTag = `<img src="${escapeAttr(src)}"${altAttr} class="max-w-full h-auto rounded-lg my-4" />`;
    document.execCommand("insertHTML", false, imgTag);
    setBlogForm((f) => ({ ...f, content: el.innerHTML }));
  };

  const insertVisualImage = () => {
    const url = window.prompt("Image URL (full link, e.g. https://yoursite.com/image.jpg or /image.jpg):");
    if (url == null || url.trim() === "") return;
    const alt = window.prompt("Alt text (for accessibility, optional):")?.trim() ?? "";
    insertVisualImageFromUrl(url.trim(), alt);
  };

  const handleVisualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", credentials: "include", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.url as string;
      if (url) insertVisualImageFromUrl(url, file.name.replace(/\.[^.]+$/, "") || "Image");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
    const slug =
      blogForm.slug.trim() !== ""
        ? blogForm.slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : slugify(stripHtml(blogForm.title));
      if (editingBlogId) {
        const res = await fetch("/api/blog", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBlogId,
            title: blogForm.title.trim(),
            slug: slug || undefined,
            category: blogForm.category,
            excerpt: blogForm.excerpt.trim(),
            image: blogForm.image.trim(),
            imageAspectRatio: blogForm.imageAspectRatio,
            featured: blogForm.featured,
            niche: blogForm.niche,
            content: blogForm.content.trim(),
            publishedDate: blogForm.publishedDate.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to update post");
        }
        setMessage({ type: "success", text: "Blog post updated successfully." });
        setEditingBlogId(null);
      } else {
        const res = await fetch("/api/blog", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: blogForm.title.trim(),
            slug: slug || undefined,
            category: blogForm.category,
            excerpt: blogForm.excerpt.trim(),
            image: blogForm.image.trim(),
            imageAspectRatio: blogForm.imageAspectRatio,
            featured: blogForm.featured,
            niche: blogForm.niche,
            content: blogForm.content.trim(),
            publishedDate: blogForm.publishedDate.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create post");
        }
        setMessage({ type: "success", text: "Blog post created successfully." });
      }
      setBlogForm({
        title: "",
        slug: "",
        category: blogCategories[0],
        excerpt: "",
        image: "",
        imageAspectRatio: "16/9",
        featured: false,
        niche: [],
        content: "",
        publishedDate: "",
      });
      setShowBlogForm(false);
      await fetchBlogs();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  /** Sanitize pasted HTML so bold, lists, links etc. are kept; script/style removed */
  const sanitizePastedHtml = (html: string): string => {
    if (typeof document === "undefined") return html;
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const allowed = new Set(["p", "div", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "a", "span", "img"]);
      const sanitizeNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
        if (node.nodeType !== Node.ELEMENT_NODE) return "";
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (!allowed.has(tag)) return Array.from(el.childNodes).map(sanitizeNode).join("");
        if (tag === "br") return "<br>";
        if (tag === "img") {
          const src = el.getAttribute("src");
          if (!src) return "";
          const alt = el.getAttribute("alt") ?? "";
          const safe = (s: string) => String(s).replace(/"/g, "&quot;");
          return `<img src="${safe(src)}" alt="${safe(alt)}" class="max-w-full h-auto rounded-lg my-4" />`;
        }
        const attrs: string[] = [];
        if (tag === "a") {
          const href = el.getAttribute("href");
          if (href) attrs.push(`href="${String(href).replace(/"/g, "&quot;")}"`);
        }
        const inner = Array.from(el.childNodes).map(sanitizeNode).join("");
        const attrStr = attrs.length ? " " + attrs.join(" ") : "";
        return `<${tag}${attrStr}>${inner}</${tag}>`;
      };
      return Array.from(doc.body.childNodes).map(sanitizeNode).join("");
    } catch {
      return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
    }
  };

  const handleContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData?.getData("text/html");
    if (!html || !contentTextareaRef.current) return;
    e.preventDefault();
    const ta = contentTextareaRef.current;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = ta.value;
    const pasted = sanitizePastedHtml(html);
    const newVal = val.slice(0, start) + pasted + val.slice(end);
    const newCursor = start + pasted.length;
    setBlogForm((f) => ({ ...f, content: newVal }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const insertContentHtml = (openTag: string, closeTag: string) => {
    const ta = contentTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = ta.value;
    const before = val.slice(0, start);
    const sel = val.slice(start, end);
    const after = val.slice(end);
    let newVal: string;
    let newCursor: number;
    if (sel) {
      newVal = before + openTag + sel + closeTag + after;
      newCursor = start + openTag.length + sel.length;
    } else {
      newVal = before + openTag + closeTag + after;
      newCursor = start + openTag.length;
    }
    setBlogForm((f) => ({ ...f, content: newVal }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const insertContentHtmlForField = (field: "title" | "excerpt", openTag: string, closeTag: string) => {
    const el = field === "title" ? titleInputRef.current : excerptTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const val = el.value;
    const before = val.slice(0, start);
    const sel = val.slice(start, end);
    const after = val.slice(end);
    let newVal: string;
    let newCursor: number;
    if (sel) {
      newVal = before + openTag + sel + closeTag + after;
      newCursor = start + openTag.length + sel.length;
    } else {
      newVal = before + openTag + closeTag + after;
      newCursor = start + openTag.length;
    }
    setBlogForm((f) => ({ ...f, [field]: newVal }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const insertLinkForField = (field: "title" | "excerpt") => {
    const url = window.prompt("Link URL (e.g. google.com or https://example.com):");
    if (url == null || url.trim() === "") return;
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) fullUrl = "https://" + fullUrl;
    const el = field === "title" ? titleInputRef.current : excerptTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const val = el.value;
    const rawSel = val.slice(start, end) || "link text";
    const before = val.slice(0, start);
    const after = val.slice(end);
    const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const newVal = before + `<a href="${escapeAttr(fullUrl)}" target="_blank" rel="noopener noreferrer">${escapeText(rawSel)}</a>` + after;
    setBlogForm((f) => ({ ...f, [field]: newVal }));
    setTimeout(() => el.focus(), 0);
  };

  const insertLink = () => {
    const url = window.prompt("Link URL (e.g. google.com or https://example.com):");
    if (url == null || url.trim() === "") return;
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = "https://" + fullUrl;
    }
    const ta = contentTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = ta.value;
    const rawSel = val.slice(start, end) || "link text";
    const before = val.slice(0, start);
    const after = val.slice(end);
    const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const safeUrl = escapeAttr(fullUrl);
    const safeText = escapeText(rawSel);
    const newVal = before + `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>` + after;
    setBlogForm((f) => ({ ...f, content: newVal }));
    setTimeout(() => ta.focus(), 0);
  };

  const insertImgAtCursor = (src: string, alt = "") => {
    const ta = contentTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = ta.value;
    const before = val.slice(0, start);
    const after = val.slice(end);
    const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const altAttr = alt ? ` alt="${escapeAttr(alt)}"` : "";
    const imgTag = `<img src="${escapeAttr(src)}"${altAttr} class="max-w-full h-auto rounded-lg my-4" />`;
    const newVal = before + imgTag + after;
    setBlogForm((f) => ({ ...f, content: newVal }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + imgTag.length, start + imgTag.length);
    }, 0);
  };

  const insertImageContent = () => {
    const url = window.prompt("Image URL (full link, e.g. https://yoursite.com/image.jpg or /image.jpg):");
    if (url == null || url.trim() === "") return;
    const alt = window.prompt("Alt text (for accessibility, optional):")?.trim() ?? "";
    insertImgAtCursor(url.trim(), alt);
  };

  const handleImageUploadContent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", credentials: "include", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.url as string;
      if (url) insertImgAtCursor(url, file.name.replace(/\.[^.]+$/, "") || "Image");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", credentials: "include", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.url as string;
      if (url) setBlogForm((f) => ({ ...f, image: url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          logoUrl: form.logoUrl.trim() || undefined,
          description: form.description.trim(),
          expiry: form.expiry.trim() || "Dec 31, 2026",
          link: form.link.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to add store");
      }
      setMessage({ type: "success", text: "Store / coupon added successfully." });
      setForm({ name: "", logoUrl: "", description: "", expiry: "Dec 31, 2026", link: "" });
      await fetchStores();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStores =
    storeFilter === "all" ? stores : stores.filter((s) => s.name === storeFilter);
  const couponRowsOnly = [
    ...stores.filter(hasCouponData),
    ...couponsFromTable.filter(hasCouponData),
  ];
  const totalCoupons = couponRowsOnly.length;
  const activeCoupons = couponRowsOnly.filter((s) => s.status !== "disable").length;

  const storeRowsOnly = stores.filter((s) => !hasCouponData(s));
  const storesByStatus =
    storeStatusFilter === "all"
      ? storeRowsOnly
      : storeStatusFilter === "enable"
        ? storeRowsOnly.filter((s) => s.status !== "disable")
        : storeRowsOnly.filter((s) => s.status === "disable");
  const storesFilteredBySearch =
    !storeSearch.trim()
      ? storesByStatus
      : storesByStatus.filter((s) =>
          s.name.toLowerCase().includes(storeSearch.trim().toLowerCase())
        );
  const storeTotal = storesFilteredBySearch.length;
  const storePaginated = storesFilteredBySearch.slice(
    (storePage - 1) * storePerPage,
    storePage * storePerPage
  );

  const couponFiltered =
    couponStatusFilter === "all"
      ? couponRowsOnly
      : couponStatusFilter === "enable"
        ? couponRowsOnly.filter((s) => s.status !== "disable")
        : couponRowsOnly.filter((s) => s.status === "disable");
  const couponSearched = !couponSearch.trim()
    ? couponFiltered
    : couponFiltered.filter(
        (s) =>
          s.name.toLowerCase().includes(couponSearch.trim().toLowerCase()) ||
          s.id.toLowerCase().includes(couponSearch.trim().toLowerCase())
      );
  const couponTotal = couponSearched.length;
  const couponPaginated = couponSearched.slice(
    (couponPage - 1) * couponPerPage,
    couponPage * couponPerPage
  );

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      if (editingCouponId) {
        const res = await fetch("/api/stores", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCouponId,
            name: couponForm.name.trim(),
            description: couponForm.description.trim(),
            expiry: couponForm.expiry.trim() || "Dec 31, 2026",
            link: couponForm.link.trim() || undefined,
            logoUrl: couponForm.logoUrl.trim() || undefined,
            couponType: couponForm.couponType,
            couponCode: couponForm.couponCode.trim() || undefined,
            couponTitle: couponForm.couponTitle.trim() || undefined,
            badgeLabel: couponForm.badgeLabel || undefined,
            badgeShipping: couponForm.badgeShipping || undefined,
            badgeOffer: couponForm.badgeOffer?.trim() || undefined,
            priority: couponForm.priority,
            active: couponForm.active,
            imageAlt: couponForm.imageAlt.trim() || undefined,
            trending: couponForm.trending,
            events: Array.isArray(couponForm.events) ? couponForm.events : undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to update coupon");
        }
        setMessage({ type: "success", text: "Coupon updated successfully." });
        setEditingCouponId(null);
        setShowCouponsCreateForm(false);
        setShowAddCouponForStore(false);
      } else {
        const selectedStore = couponForm.selectedStoreId
          ? stores.find((s) => s.id === couponForm.selectedStoreId)
          : null;
        const slugToUse =
          selectedStore != null
            ? (selectedStore.slug ?? slugify(selectedStore.name))
            : undefined;
        const nameToUse =
          selectedStore != null ? selectedStore.name : couponForm.name.trim();
        const res = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameToUse,
            description: couponForm.description.trim(),
            expiry: couponForm.expiry.trim() || "Dec 31, 2026",
            link: couponForm.link.trim() || undefined,
            logoUrl: couponForm.logoUrl.trim() || undefined,
            couponType: couponForm.couponType,
            couponCode: couponForm.couponCode.trim() || undefined,
            couponTitle: couponForm.couponTitle.trim() || undefined,
            badgeLabel: couponForm.badgeLabel || undefined,
            badgeShipping: couponForm.badgeShipping || undefined,
            badgeOffer: couponForm.badgeOffer?.trim() || undefined,
            priority: couponForm.priority,
            active: couponForm.active,
            imageAlt: couponForm.imageAlt.trim() || undefined,
            trending: couponForm.trending,
            status: couponForm.active ? "enable" : "disable",
            ...(Array.isArray(couponForm.events) && couponForm.events.length > 0 && { events: couponForm.events }),
            ...(slugToUse != null && slugToUse !== "" && { slug: slugToUse }),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create coupon");
        }
        setMessage({ type: "success", text: "Coupon created successfully." });
        setShowCouponsCreateForm(false);
        setShowAddCouponForStore(false);
      }
      setCouponForm({
        selectedStoreId: "",
        name: "",
        couponType: "deal",
        couponCode: "",
        couponTitle: "",
        badgeLabel: "",
        badgeShipping: "",
        badgeOffer: "",
        logoMethod: "url",
        logoUrl: "",
        description: "",
        link: "",
        expiry: "",
        imageAlt: "",
        priority: 0,
        active: true,
        trending: false,
        events: [],
      });
      await fetchStores();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`/api/stores?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchStores();
      if (editingCouponId === id) {
        setEditingCouponId(null);
        setShowCouponsCreateForm(false);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete coupon." });
    }
  };

  const handleDeleteAllCoupons = async () => {
    if (!confirm("Delete ALL coupons? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/stores?all=true", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete all");
      await fetchStores();
      setShowCouponsCreateForm(false);
      setEditingCouponId(null);
      setMessage({ type: "success", text: "All coupons deleted." });
    } catch {
      setMessage({ type: "error", text: "Failed to delete all coupons." });
    }
  };

  const startEditCoupon = (store: Store) => {
    setEditingCouponId(store.id);
    setCouponForm({
      selectedStoreId: "",
      name: store.name,
      couponType: (store.couponType as "code" | "deal") || "deal",
      couponCode: store.couponCode ?? "",
      couponTitle: store.couponTitle ?? "",
      badgeLabel: store.badgeLabel ?? "",
      badgeShipping: store.badgeShipping ?? "",
      badgeOffer: store.badgeOffer ?? "",
      logoMethod: "url",
      logoUrl: store.logoUrl ?? "",
      description: store.description ?? "",
      link: store.link ?? "",
      expiry: store.expiry ?? "",
      imageAlt: store.imageAlt ?? store.logoAltText ?? "",
      priority: store.priority ?? 0,
      active: store.active !== false,
      trending: store.trending ?? false,
      events: Array.isArray(store.events) ? [...store.events] : [],
    });
    setSection("coupons");
    setShowCouponsCreateForm(true);
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const slug = storeForm.slugAuto
        ? storeForm.name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
        : storeForm.slug.trim();
      if (editingStoreId) {
        const res = await fetch("/api/stores", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStoreId,
            name: storeForm.name.trim(),
            description: storeForm.description.trim() || storeForm.name.trim(),
            subStoreName: storeForm.subStoreName.trim() || undefined,
            storePageHeading: storeForm.storePageHeading.trim() || undefined,
            slug: slug || undefined,
            logoUrl: storeForm.logoUrl.trim() || undefined,
            logoAltText: storeForm.logoAltText.trim() || undefined,
            logoMethod: storeForm.logoMethod,
            trackingUrl: storeForm.trackingUrl.trim() || undefined,
            link: storeForm.trackingUrl.trim() || undefined,
            countryCodes: storeForm.countryCodes.trim() || undefined,
            websiteUrl: storeForm.websiteUrl.trim() || undefined,
            category: storeForm.category.trim() || undefined,
            whyTrustUs: storeForm.whyTrustUs.trim() || undefined,
            moreInfo: storeForm.moreInfo.trim() || undefined,
            codesAndCouponsContent: storeForm.codesAndCouponsContent?.trim() || undefined,
            moreAboutContent: storeForm.moreAboutContent?.trim() || undefined,
            shoppingTipsTitle: storeForm.shoppingTipsTitle?.trim() || undefined,
            shoppingTips: Array.isArray(storeForm.shoppingTips) && storeForm.shoppingTips.length > 0 ? storeForm.shoppingTips.filter((t) => (t ?? "").trim() !== "").map((t) => t.trim()) : undefined,
            seoTitle: storeForm.seoTitle.trim() || undefined,
            seoMetaDesc: storeForm.seoMetaDesc.trim() || undefined,
            trending: storeForm.trending,
            faqs: Array.isArray(storeForm.faqs) && storeForm.faqs.length > 0 ? storeForm.faqs.filter((f) => (f.q ?? "").trim() || (f.a ?? "").trim()) : undefined,
            status: "enable",
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to update store");
        }
        setMessage({ type: "success", text: "Store updated successfully." });
        setEditingStoreId(null);
      } else {
        const res = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: storeForm.name.trim(),
            description: storeForm.description.trim() || storeForm.name.trim(),
            expiry: "Dec 31, 2026",
            subStoreName: storeForm.subStoreName.trim() || undefined,
            storePageHeading: storeForm.storePageHeading.trim() || undefined,
            slug: slug || undefined,
            logoUrl: storeForm.logoUrl.trim() || undefined,
            logoAltText: storeForm.logoAltText.trim() || undefined,
            logoMethod: storeForm.logoMethod,
            trackingUrl: storeForm.trackingUrl.trim() || undefined,
            link: storeForm.trackingUrl.trim() || undefined,
            countryCodes: storeForm.countryCodes.trim() || undefined,
            websiteUrl: storeForm.websiteUrl.trim() || undefined,
            category: storeForm.category.trim() || undefined,
            whyTrustUs: storeForm.whyTrustUs.trim() || undefined,
            moreInfo: storeForm.moreInfo.trim() || undefined,
            codesAndCouponsContent: storeForm.codesAndCouponsContent?.trim() || undefined,
            moreAboutContent: storeForm.moreAboutContent?.trim() || undefined,
            shoppingTipsTitle: storeForm.shoppingTipsTitle?.trim() || undefined,
            shoppingTips: Array.isArray(storeForm.shoppingTips) && storeForm.shoppingTips.length > 0 ? storeForm.shoppingTips.filter((t) => (t ?? "").trim() !== "").map((t) => t.trim()) : undefined,
            seoTitle: storeForm.seoTitle.trim() || undefined,
            seoMetaDesc: storeForm.seoMetaDesc.trim() || undefined,
            trending: storeForm.trending,
            faqs: Array.isArray(storeForm.faqs) && storeForm.faqs.length > 0 ? storeForm.faqs.filter((f) => (f.q ?? "").trim() || (f.a ?? "").trim()) : undefined,
            status: "enable",
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create store");
        }
        setMessage({ type: "success", text: "Store created successfully." });
      }
      setStoreForm({
        name: "",
        subStoreName: "",
        storePageHeading: "",
        slug: "",
        slugAuto: true,
        logoMethod: "url",
        logoUrl: "",
        logoAltText: "",
        description: "",
        trackingUrl: "",
        countryCodes: "",
        websiteUrl: "",
        category: "",
        whyTrustUs: "",
        moreInfo: "",
        codesAndCouponsContent: "",
        moreAboutContent: "",
        shoppingTipsTitle: "",
        shoppingTips: [],
        seoTitle: "",
        seoMetaDesc: "",
        trending: false,
        faqs: [],
      });
      await fetchStores();
      if (editingStoreId) setShowStoresCreateForm(false);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-900">
      {/* Sidebar - classical dark */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-stone-300 bg-stone-800 text-stone-100">
        <div className="border-b border-stone-600 px-4 py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {SIDEBAR_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                section === item.id
                  ? "border-amber-600/60 bg-amber-900/30 text-amber-200"
                  : "border-transparent text-stone-300 hover:border-stone-600 hover:bg-stone-700/50 hover:text-white"
              }`}
            >
              <span className="text-base opacity-80">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-stone-600 p-3">
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
            className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left text-sm font-medium text-stone-400 transition-colors hover:border-stone-600 hover:bg-stone-700/50 hover:text-white"
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b border-stone-300 bg-stone-50/95 px-6 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">Welcome back</p>
            <Link
              href="/promotions"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-50"
            >
              View Promotions Page →
            </Link>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard */}
          {section === "dashboard" && (
            <>
              <h1 className="mb-6 font-serif text-2xl font-bold text-stone-900">Dashboard</h1>

              <section className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
                  <span>⚡</span> Quick Actions
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Bulk import stores & coupons", sub: "Import Excel", onClick: () => {} },
                    { label: "View & edit all stores", sub: "Manage Stores", onClick: () => setSection("stores") },
                    { label: "View & edit all coupons", sub: "Manage Coupons", onClick: () => setSection("coupons") },
                    { label: "Edit blog posts (WordPress-style)", sub: "Manage Blog", onClick: () => setSection("blog") },
                    { label: "Track coupon clicks by location", sub: "Click Analytics", onClick: () => setSection("analytics") },
                  ].map((action, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={action.onClick}
                      className="rounded-lg border-2 border-stone-300 bg-white p-4 text-left shadow-sm transition hover:border-amber-500/50 hover:bg-amber-50/30 hover:shadow"
                    >
                      <span className="block text-xs font-medium uppercase tracking-wide text-stone-500">
                        {action.sub}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-stone-800">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="mb-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
                  Search Coupons by Store
                </h2>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                >
                  <option value="all">All Stores</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </section>

              <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Coupons", value: totalCoupons, color: "text-blue-700" },
                  { label: "Active Coupons", value: activeCoupons, color: "text-emerald-700" },
                  { label: "Total Uses", value: "0", color: "text-violet-700" },
                  { label: "Avg Discount", value: "0.00%", color: "text-emerald-700" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      {stat.label}
                    </p>
                    <p className={`mt-1 font-serif text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </section>

              <section>
                <h2 className="mb-3 font-serif text-lg font-semibold text-stone-900">
                  Recent Coupons
                </h2>
                <div className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
                  {loading ? (
                    <div className="p-8 text-center text-sm text-stone-500">Loading...</div>
                  ) : filteredStores.length === 0 ? (
                    <div className="p-8 text-center text-sm text-stone-500">
                      No coupons yet. Add one from Coupons.
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="px-4 py-3 text-left font-semibold text-stone-700">
                            Store Name
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-stone-700">
                            Code / Deal
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-stone-700">
                            Discount
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-stone-700">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-stone-700">
                            Expiry
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStores.slice(0, 10).map((store) => (
                          <tr
                            key={store.id}
                            className="border-b border-stone-100 hover:bg-stone-50/50"
                          >
                            <td className="px-4 py-3 font-medium text-stone-900">{store.name}</td>
                            <td className="px-4 py-3 text-stone-600">{store.description}</td>
                            <td className="px-4 py-3 text-stone-500">—</td>
                            <td className="px-4 py-3">
                              <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                Active
                              </span>
                            </td>
                            <td className="px-4 py-3 text-stone-500">{store.expiry}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Coupons - Manage Coupons page */}
          {section === "coupons" && (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-serif text-2xl font-bold text-stone-900">Manage Coupons</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ["Store Name", "Row ID", "Title", "Code", "Description", "Expiry Date", "Status"];
                      const rows = couponSearched.map((s) => [
                        s.name,
                        s.id,
                        s.couponTitle ?? "",
                        s.couponCode ?? "",
                        s.description ?? "",
                        s.expiry ?? "",
                        s.status === "disable" ? "Disable" : "Active",
                      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
                      const csv = [headers.join(","), ...rows].join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `coupons-export-${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                    className="rounded border border-stone-300 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                  >
                    Export Coupons (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadCouponsModal(true)}
                    className="rounded border border-stone-300 bg-amber-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
                  >
                    Upload Coupons
                  </button>
                  {showCouponsCreateForm ? (
                    <button
                      type="button"
                      onClick={() => { setShowCouponsCreateForm(false); setEditingCouponId(null); setMessage(null); }}
                      className="rounded border border-stone-300 bg-stone-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-stone-700"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCouponsCreateForm(true)}
                      className="rounded border border-stone-300 bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
                    >
                      Create New Coupon
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteAllCoupons}
                    className="rounded border border-stone-300 bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                  >
                    Delete All Coupons
                  </button>
                  {stores.filter(hasCouponData).length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Move all coupon rows from stores table to coupons table? Run once after creating the coupons table in Supabase.")) return;
                        setMessage(null);
                        try {
                          const res = await fetch("/api/coupons/migrate", { method: "POST" });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(data.error ?? "Migration failed");
                          setMessage({ type: "success", text: `Migrated ${data.migrated ?? 0} coupon(s) to coupons table.` });
                          await fetchStores();
                        } catch (e) {
                          setMessage({ type: "error", text: e instanceof Error ? e.message : "Migration failed." });
                        }
                      }}
                      className="rounded border border-stone-300 bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
                    >
                      Migrate to coupons table
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-6 rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Store name or Row ID (e.g. eFlorist or e425c30f)..."
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    className="w-full rounded border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
                <fieldset className="flex items-center gap-4">
                  <span className="text-sm font-medium text-stone-600">Status Filter:</span>
                  {(["all", "enable", "disable"] as const).map((status) => (
                    <label key={status} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="couponStatus"
                        checked={couponStatusFilter === status}
                        onChange={() => setCouponStatusFilter(status)}
                        className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm capitalize text-stone-700">{status}</span>
                    </label>
                  ))}
                </fieldset>
              </div>

              {!showCouponsCreateForm && (
                <>
                  <p className="mb-2 text-xs text-stone-500">Each coupon has its own Row ID; one store can have multiple coupons (same Store Name).</p>
                  <div className="overflow-x-auto rounded-lg border border-stone-300 bg-white shadow-sm">
                    {loading ? (
                      <div className="p-8 text-center text-sm text-stone-500">Loading…</div>
                    ) : couponPaginated.length === 0 ? (
                      <div className="p-8 text-center text-sm text-stone-500">No coupons yet. Create one or import.</div>
                    ) : (
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-stone-200 bg-stone-50">
                            <th className="w-10 px-3 py-2 text-left font-semibold text-stone-700">
                              <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500" aria-label="Select all" />
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Store Name</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Row ID</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Title</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Code</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Description</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Expiry Date</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Status</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {couponPaginated.map((row) => (
                            <tr key={row.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                              <td className="w-10 px-3 py-2">
                                <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500" aria-label={`Select ${row.name}`} />
                              </td>
                              <td className="px-3 py-2 font-medium text-stone-900">{row.name}</td>
                              <td className="px-3 py-2 font-mono text-xs text-stone-500" title={row.id}>{row.id.slice(0, 8)}</td>
                              <td className="px-3 py-2 text-stone-700">{row.couponTitle ?? "—"}</td>
                              <td className="px-3 py-2 font-medium text-stone-700">{row.couponCode ?? "N/A"}</td>
                              <td className="max-w-[180px] truncate px-3 py-2 text-stone-600" title={row.description ?? ""}>{row.description?.trim() || "—"}</td>
                              <td className="px-3 py-2 text-stone-500">{row.expiry}</td>
                              <td className="px-3 py-2">
                                <span className={`rounded border px-2 py-0.5 text-xs font-medium ${row.status === "disable" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
                                  {row.status === "disable" ? "Disable" : "Active"}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => startEditCoupon(row)}
                                  className="rounded border border-sky-600 bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCoupon(row.id)}
                                  className="ml-1 rounded border border-red-600 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {couponTotal > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-stone-600">
                          Items per page
                          <select
                            value={couponPerPage}
                            onChange={(e) => {
                              setCouponPerPage(Number(e.target.value));
                              setCouponPage(1);
                            }}
                            className="rounded border border-stone-300 px-2 py-1 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </label>
                        <span className="text-sm text-stone-500">
                          Showing {(couponPage - 1) * couponPerPage + 1}-{Math.min(couponPage * couponPerPage, couponTotal)} of {couponTotal}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={couponPage <= 1}
                          onClick={() => setCouponPage((p) => p - 1)}
                          className="rounded border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={couponPage * couponPerPage >= couponTotal}
                          onClick={() => setCouponPage((p) => p + 1)}
                          className="rounded border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {showCouponsCreateForm && (
              <section className="mb-8 rounded-lg border border-stone-300 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-serif text-lg font-semibold text-stone-900">{editingCouponId ? "Edit Coupon" : "Create New Coupon"}</h2>
                {message && section === "coupons" && (
                  <div
                    className={`mb-4 rounded border px-4 py-3 text-sm ${
                      message.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleCouponSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Select Store (Optional)</label>
                    <select
                      value={couponForm.selectedStoreId ?? ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        setCouponForm((f) => ({
                          ...f,
                          selectedStoreId: id,
                          name: id ? (stores.find((s) => s.id === id)?.name ?? f.name) : f.name,
                        }));
                      }}
                      className="w-full max-w-xs rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    >
                      <option value="">— Add new store —</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">Coupon Type</label>
                    <div className="flex gap-4">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="couponType"
                          checked={couponForm.couponType === "code"}
                          onChange={() => setCouponForm((f) => ({ ...f, couponType: "code" }))}
                          className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-stone-700">Code</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="couponType"
                          checked={couponForm.couponType === "deal"}
                          onChange={() => setCouponForm((f) => ({ ...f, couponType: "deal" }))}
                          className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-stone-700">Deal</span>
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">Select whether this is a coupon code or a deal. Frontend will show &quot;Get Code&quot; for codes and &quot;Get Deal&quot; for deals.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Store Name *</label>
                      <input
                        type="text"
                        required
                        value={couponForm.name ?? ""}
                        onChange={(e) => setCouponForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Nike, Walmart"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">
                        Coupon Code {couponForm.couponType === "code" ? "*" : "(Optional)"}
                      </label>
                      <input
                        type="text"
                        required={couponForm.couponType === "code"}
                        value={couponForm.couponCode ?? ""}
                        onChange={(e) => setCouponForm((f) => ({ ...f, couponCode: e.target.value }))}
                        placeholder="e.g. SAVE20"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Coupon Title (Optional)</label>
                    <input
                      type="text"
                      value={couponForm.couponTitle ?? ""}
                      onChange={(e) => setCouponForm((f) => ({ ...f, couponTitle: e.target.value }))}
                      placeholder="e.g. 20% Off Sitewide"
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Badge – Free Shipping/Delivery (optional)</label>
                      <input
                        type="text"
                        value={couponForm.badgeShipping ?? ""}
                        onChange={(e) => setCouponForm((f) => ({ ...f, badgeShipping: e.target.value }))}
                        placeholder="e.g. Free Shipping, Free Delivery"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Badge – Percentage or amount (optional)</label>
                      <input
                        type="text"
                        value={couponForm.badgeOffer ?? ""}
                        onChange={(e) => setCouponForm((f) => ({ ...f, badgeOffer: e.target.value }))}
                        placeholder="e.g. 20% OFF, $10 OFF"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-stone-500">Both can show in the orange circle. Leave both empty for default (percentage or store region).</p>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">Logo Upload Method</label>
                    <div className="flex gap-4">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="couponLogoMethod"
                          checked={couponForm.logoMethod === "upload"}
                          onChange={() => setCouponForm((f) => ({ ...f, logoMethod: "upload" }))}
                          className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-stone-700">File Upload</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="couponLogoMethod"
                          checked={couponForm.logoMethod === "url"}
                          onChange={() => setCouponForm((f) => ({ ...f, logoMethod: "url" }))}
                          className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-stone-700">URL (Cloudinary)</span>
                      </label>
                    </div>
                    {couponForm.logoMethod === "url" && (
                      <input
                        type="url"
                        value={couponForm.logoUrl ?? ""}
                        onChange={(e) => setCouponForm((f) => ({ ...f, logoUrl: e.target.value }))}
                        placeholder="https://..."
                        className="mt-2 w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Description *</label>
                    <textarea
                      required
                      value={couponForm.description ?? ""}
                      onChange={(e) => setCouponForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Coupon or deal description"
                      rows={3}
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Coupon URL (Where user is redirected when clicking &quot;Get Deal&quot;)</label>
                    <input
                      type="url"
                      value={couponForm.link ?? ""}
                      onChange={(e) => setCouponForm((f) => ({ ...f, link: e.target.value }))}
                      placeholder="https://example.com/coupon-page"
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Expiry Date (Optional)</label>
                      <input
                        type="text"
                        value={couponForm.expiry ?? ""}
                        onChange={(e) => setCouponForm((f) => ({ ...f, expiry: e.target.value }))}
                        placeholder="mm/dd/yyyy or Dec 31, 2026"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Coupon Image Alt</label>
                      <input
                        type="text"
                        value={couponForm.imageAlt ?? ""}
                        onChange={(e) => setCouponForm((f) => ({ ...f, imageAlt: e.target.value }))}
                        placeholder="Alt text for accessibility and SEO"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Coupon Priority</label>
                      <input
                        type="number"
                        min={0}
                        value={couponForm.priority ?? 0}
                        onChange={(e) => setCouponForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
                        className="w-24 rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <p className="mt-1 text-xs text-stone-500">Higher priority shown first.</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={couponForm.active}
                        onChange={(e) => setCouponForm((f) => ({ ...f, active: e.target.checked }))}
                        className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-stone-700">Active</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={couponForm.trending}
                        onChange={(e) => setCouponForm((f) => ({ ...f, trending: e.target.checked }))}
                        className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-stone-700">Mark as Trending</span>
                    </label>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">Show on event pages</label>
                    <p className="mb-2 text-xs text-stone-500">Select which special event pages (e.g. Black Friday, Christmas) should display this coupon.</p>
                    <div className="flex flex-wrap gap-4">
                      {SPECIAL_EVENTS.map((ev) => (
                        <label key={ev.slug} className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={couponForm.events?.includes(ev.slug) ?? false}
                            onChange={(e) => {
                              const prev = couponForm.events ?? [];
                              if (e.target.checked) setCouponForm((f) => ({ ...f, events: [...prev, ev.slug] }));
                              else setCouponForm((f) => ({ ...f, events: prev.filter((s) => s !== ev.slug) }));
                            }}
                            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-stone-700">{ev.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded border-2 border-sky-600 bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
                  >
                    {submitting
                      ? (editingCouponId ? "Updating..." : "Creating...")
                      : editingCouponId
                        ? "Update Coupon"
                        : "Create Coupon"}
                  </button>
                  {editingCouponId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCouponId(null);
                        setCouponForm({
                          selectedStoreId: "",
                          name: "",
                          couponType: "deal",
                          couponCode: "",
                          couponTitle: "",
                          badgeLabel: "",
                          badgeShipping: "",
                          badgeOffer: "",
                          logoMethod: "url",
                          logoUrl: "",
                          description: "",
                          link: "",
                          expiry: "",
                          imageAlt: "",
                          priority: 0,
                          active: true,
                          trending: false,
                          events: [],
                        });
                      }}
                      className="ml-3 rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              </section>
              )}

              {/* Upload Coupons Modal */}
              {showUploadCouponsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4" onClick={() => !uploadCouponsSubmitting && setShowUploadCouponsModal(false)}>
                  <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-stone-300 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="mb-4 font-serif text-xl font-bold text-stone-900">Upload Coupons (CSV)</h3>
                    <p className="mb-4 text-sm text-stone-600">Upload a CSV with columns: <strong>name</strong> (Store Name), <strong>description</strong>, <strong>type</strong> (code or deal), <strong>couponCode</strong> / <strong>code</strong>, <strong>couponTitle</strong> / <strong>title</strong>, <strong>expiry</strong>, <strong>link</strong>, <strong>logoUrl</strong>. First row = headers.</p>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-stone-700">Choose CSV file</label>
                      <input
                        type="file"
                        accept=".csv"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 file:mr-2 file:rounded file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-amber-800"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setUploadCouponsFile(f);
                          const text = await f.text();
                          const lines = text.split(/\r?\n/).filter(Boolean);
                          const rawHeaders = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
                          const norm = (k: string) => k.toLowerCase().replace(/\s+/g, "");
                          const headerMap: Record<string, string> = { name: "name", storename: "name", description: "description", desc: "description", details: "description", type: "couponType", coupontype: "couponType", couponcode: "couponCode", code: "couponCode", coupontitle: "couponTitle", title: "couponTitle", expiry: "expiry", link: "link", logourl: "logoUrl", logo: "logoUrl" };
                          const headers = rawHeaders.map((h) => headerMap[norm(h)] ?? norm(h));
                          const start = 1;
                          const preview: Record<string, string>[] = [];
                          for (let i = start; i < Math.min(lines.length, start + 6); i++) {
                            const vals = parseCSVLine(lines[i]);
                            const row: Record<string, string> = {};
                            headers.forEach((h, j) => { if (h) row[h] = (vals[j] || "").trim(); });
                            preview.push(row);
                          }
                          setUploadCouponsPreview(preview);
                        }}
                      />
                    </div>
                    {uploadCouponsPreview && uploadCouponsPreview.length > 0 && (
                      <div className="mb-4 overflow-x-auto rounded border border-stone-200 bg-stone-50 p-2 text-xs">
                        <p className="mb-2 font-medium text-stone-700">Preview (first rows)</p>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-stone-300">
                              {Object.keys(uploadCouponsPreview[0]).map((k) => <th key={k} className="px-2 py-1 text-left font-medium text-stone-600">{k}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {uploadCouponsPreview.map((row, i) => (
                              <tr key={i} className="border-b border-stone-100">
                                {Object.values(row).map((v, j) => <td key={j} className="max-w-[120px] truncate px-2 py-1 text-stone-700" title={String(v)}>{String(v)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowUploadCouponsModal(false); setUploadCouponsFile(null); setUploadCouponsPreview(null); }} className="rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Cancel</button>
                      <button
                        type="button"
                        disabled={!uploadCouponsFile || uploadCouponsSubmitting}
                        className="rounded border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                        onClick={async () => {
                          if (!uploadCouponsFile) return;
                          setUploadCouponsSubmitting(true);
                          setMessage(null);
                          try {
                            const text = await uploadCouponsFile.text();
                            const lines = text.split(/\r?\n/).filter(Boolean);
                            const rawHeaders = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
                            const norm = (k: string) => k.toLowerCase().replace(/\s+/g, "");
                            const headerMap: Record<string, string> = { name: "name", storename: "name", description: "description", desc: "description", details: "description", type: "couponType", coupontype: "couponType", couponcode: "couponCode", code: "couponCode", coupontitle: "couponTitle", title: "couponTitle", expiry: "expiry", link: "link", logourl: "logoUrl", logo: "logoUrl" };
                            const headers = rawHeaders.map((h) => headerMap[norm(h)] ?? norm(h));
                            const start = 1;
                            const stores: Record<string, string>[] = [];
                            for (let i = start; i < lines.length; i++) {
                              const vals = parseCSVLine(lines[i]);
                              const row: Record<string, string> = {};
                              headers.forEach((h, j) => { if (h) row[h] = (vals[j] || "").trim(); });
                              const desc = (row.description || row.desc || row.details || row.name || "").trim();
                              const typeVal = (row.couponType || "").toLowerCase();
                              const couponType = typeVal === "code" ? "code" : typeVal === "deal" ? "deal" : "";
                              if (row.name) stores.push({ ...row, description: desc || row.name, ...(couponType && { couponType }) });
                            }
                            const res = await fetch("/api/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stores }) });
                            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error ?? "Import failed"); }
                            const data = await res.json();
                            setMessage({ type: "success", text: `Imported ${data.imported ?? stores.length} coupon(s).` });
                            setShowUploadCouponsModal(false);
                            setUploadCouponsFile(null);
                            setUploadCouponsPreview(null);
                            await fetchStores();
                          } catch (e) {
                            setMessage({ type: "error", text: e instanceof Error ? e.message : "Import failed." });
                          } finally {
                            setUploadCouponsSubmitting(false);
                          }
                        }}
                      >
                        {uploadCouponsSubmitting ? "Importing…" : "Import Coupons"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Stores - Manage Stores page */}
          {section === "stores" && (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-serif text-2xl font-bold text-stone-900">Manage Stores</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ["Store Name", "Description", "Logo URL", "Slug", "Tracking URL", "Country Codes", "Website URL", "Category"];
                      const rows = storesFilteredBySearch.map((s) => [
                        s.name,
                        s.description ?? "",
                        s.logoUrl ?? "",
                        s.slug ?? "",
                        s.trackingUrl ?? "",
                        s.countryCodes ?? "",
                        s.websiteUrl ?? "",
                        s.category ?? "",
                      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
                      const csv = [headers.join(","), ...rows].join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `stores-export-${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                    className="rounded border border-stone-300 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                  >
                    Export Stores (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadLogosModal(true)}
                    className="rounded border border-stone-300 bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
                  >
                    Upload Logos
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadStoresModal(true)}
                    className="rounded border border-stone-300 bg-amber-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
                  >
                    Upload Stores
                  </button>
                  {showStoresCreateForm ? (
                    <button
                      type="button"
                      onClick={() => { setShowStoresCreateForm(false); setEditingStoreId(null); setShowAddCouponForStore(false); setMessage(null); }}
                      className="rounded border border-stone-300 bg-stone-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-stone-700"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowStoresCreateForm(true)}
                      className="rounded border border-stone-300 bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
                    >
                      Create New Store
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Delete ALL ${stores.length} store(s)? This cannot be undone.`)) return;
                      setMessage(null);
                      try {
                        const res = await fetch("/api/stores?all=true", { method: "DELETE" });
                        if (!res.ok) throw new Error("Failed");
                        const data = await res.json().catch(() => ({}));
                        setMessage({ type: "success", text: `Deleted ${data.deleted ?? stores.length} store(s).` });
                        setShowStoresCreateForm(false);
                        setEditingStoreId(null);
                        await fetchStores();
                      } catch {
                        setMessage({ type: "error", text: "Failed to delete all stores." });
                      }
                    }}
                    disabled={stores.length === 0}
                    className="rounded border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete All Stores
                  </button>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-6 rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
                <fieldset className="flex items-center gap-4">
                  <span className="text-sm font-medium text-stone-600">Status:</span>
                  {(["all", "enable", "disable"] as const).map((status) => (
                    <label key={status} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="storeStatus"
                        checked={storeStatusFilter === status}
                        onChange={() => setStoreStatusFilter(status)}
                        className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm capitalize text-stone-700">{status}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Enter store name"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="w-full rounded border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              {!showStoresCreateForm && (
                <>
                  <div className="overflow-x-auto rounded-lg border border-stone-300 bg-white shadow-sm">
                    {loading ? (
                      <div className="p-8 text-center text-sm text-stone-500">Loading stores…</div>
                    ) : storePaginated.length === 0 ? (
                      <div className="p-8 text-center text-sm text-stone-500">No stores yet. Create one or upload a CSV.</div>
                    ) : (
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-stone-200 bg-stone-50">
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Store ID</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Logo</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Store Name</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Slug</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Country</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Category</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Tracking Link</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Coupons</th>
                            <th className="px-3 py-2 text-left font-semibold text-stone-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storePaginated.map((s) => (
                            <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                              <td className="px-3 py-2 font-mono text-xs text-stone-600">{s.id.slice(0, 8)}</td>
                              <td className="px-3 py-2">
                                {s.logoUrl ? (
                                  <img src={s.logoUrl} alt={s.logoAltText ?? s.name} className="h-8 w-8 rounded object-contain" />
                                ) : (
                                  <span className="text-stone-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 font-medium text-stone-900">{s.name}</td>
                              <td className="px-3 py-2 text-stone-600">{s.slug ?? "—"}</td>
                              <td className="px-3 py-2 text-stone-600">{s.countryCodes ?? "—"}</td>
                              <td className="px-3 py-2 text-stone-600">{s.category ?? "—"}</td>
                              <td className="max-w-[140px] truncate px-3 py-2 text-stone-600" title={s.trackingUrl ?? ""}>
                                {s.trackingUrl ? <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{String(s.trackingUrl).slice(0, 24)}…</a> : "—"}
                              </td>
                              <td className="px-3 py-2 text-stone-600">
                                Total: 1, Active: {s.status === "disable" ? 0 : 1}, Inactive: {s.status === "disable" ? 1 : 0}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStoreId(s.id);
                                    setShowAddCouponForStore(false);
                                    setStoreForm({
                                      name: s.name,
                                      subStoreName: s.subStoreName ?? "",
                                      storePageHeading: s.storePageHeading ?? "",
                                      slug: s.slug ?? "",
                                      slugAuto: !s.slug,
                                      logoMethod: s.logoMethod ?? "url",
                                      logoUrl: s.logoUrl ?? "",
                                      logoAltText: s.logoAltText ?? "",
                                      description: s.description ?? "",
                                      trackingUrl: s.trackingUrl ?? "",
                                      countryCodes: s.countryCodes ?? "",
                                      websiteUrl: s.websiteUrl ?? "",
                                      category: s.category ?? "",
                                      whyTrustUs: s.whyTrustUs ?? "",
                                      moreInfo: s.moreInfo ?? "",
                                      codesAndCouponsContent: s.codesAndCouponsContent ?? "",
                                      moreAboutContent: s.moreAboutContent ?? "",
                                      shoppingTipsTitle: s.shoppingTipsTitle ?? "",
                                      shoppingTips: Array.isArray(s.shoppingTips) && s.shoppingTips.length > 0 ? s.shoppingTips : [],
                                      seoTitle: s.seoTitle ?? "",
                                      seoMetaDesc: s.seoMetaDesc ?? "",
                                      trending: s.trending ?? false,
                                      faqs: Array.isArray(s.faqs) && s.faqs.length > 0 ? s.faqs : [],
                                    });
                                    setShowStoresCreateForm(true);
                                  }}
                                  className="rounded border border-sky-600 bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm("Delete this store?")) return;
                                    try {
                                      const res = await fetch(`/api/stores?id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
                                      if (!res.ok) throw new Error("Failed");
                                      await fetchStores();
                                    } catch {
                                      setMessage({ type: "error", text: "Failed to delete store." });
                                    }
                                  }}
                                  className="ml-1 rounded border border-red-600 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {storeTotal > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-stone-600">
                          Items per page
                          <select
                            value={storePerPage}
                            onChange={(e) => { setStorePerPage(Number(e.target.value)); setStorePage(1); }}
                            className="rounded border border-stone-300 px-2 py-1 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </label>
                        <span className="text-sm text-stone-500">
                          Showing {(storePage - 1) * storePerPage + 1}-{Math.min(storePage * storePerPage, storeTotal)} of {storeTotal}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={storePage <= 1}
                          onClick={() => setStorePage((p) => p - 1)}
                          className="rounded border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={storePage * storePerPage >= storeTotal}
                          onClick={() => setStorePage((p) => p + 1)}
                          className="rounded border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {showStoresCreateForm && (
                <>
              <div className="mb-4">
                <h2 className="font-serif text-lg font-semibold text-stone-900">{editingStoreId ? "Edit Store" : "Create New Store"}</h2>
              </div>

              {message && section === "stores" && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/50 p-4"
                  onClick={() => setMessage(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="store-message-title"
                >
                  <div
                    className={`max-w-sm rounded-xl border-2 px-6 py-5 shadow-xl ${
                      message.type === "success"
                        ? "border-emerald-300 bg-white text-emerald-800"
                        : "border-red-300 bg-white text-red-800"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p id="store-message-title" className="mb-4 text-center font-semibold">
                      {message.type === "success" ? "Success" : "Error"}
                    </p>
                    <p className="mb-5 text-center text-sm">{message.text}</p>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setMessage(null)}
                        className={`rounded-lg px-5 py-2 text-sm font-medium ${
                          message.type === "success"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleStoreSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left: Store Details & Information */}
                  <div className="space-y-4 rounded-lg border border-stone-300 bg-white p-5 shadow-sm">
                    <h3 className="border-b border-stone-200 pb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
                      Store Details &amp; Information
                    </h3>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Store Name *</label>
                      <input
                        type="text"
                        required
                        value={storeForm.name ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Store Name (e.g., Nike)"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Sub Store Name (Displayed on store page)</label>
                      <input
                        type="text"
                        value={storeForm.subStoreName ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, subStoreName: e.target.value }))}
                        placeholder="e.g., Nike Official Store"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <p className="mt-1 text-xs text-stone-500">This name will be displayed on the store page when visiting the store.</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Store Page Heading (above coupons)</label>
                      <input
                        type="text"
                        value={storeForm.storePageHeading ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, storePageHeading: e.target.value }))}
                        placeholder="e.g., Valvoline Synthetic Oil Change Discount Code"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <p className="mt-1 text-xs text-stone-500">Main heading on the store page, above the coupon list. If blank, &quot;Sub Store Name + Discount Code&quot; is used.</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Slug (URL-friendly name)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={storeForm.slugAuto ? ((storeForm.name ?? "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) : (storeForm.slug ?? "")}
                          onChange={(e) => setStoreForm((f) => ({ ...f, slug: e.target.value, slugAuto: false }))}
                          placeholder="auto-generated"
                          disabled={storeForm.slugAuto}
                          className="flex-1 rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:bg-stone-100"
                        />
                        <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-stone-600">
                          <input
                            type="checkbox"
                            checked={storeForm.slugAuto}
                            onChange={(e) => setStoreForm((f) => ({ ...f, slugAuto: e.target.checked }))}
                            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          Auto-generate from name
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">URL will be: /promotions/slug</p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-stone-700">Logo Upload Method</label>
                      <div className="flex gap-4">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="logoMethod"
                            checked={storeForm.logoMethod === "url"}
                            onChange={() => setStoreForm((f) => ({ ...f, logoMethod: "url" }))}
                            className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-stone-700">URL / Extract from Website</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="logoMethod"
                            checked={storeForm.logoMethod === "upload"}
                            onChange={() => setStoreForm((f) => ({ ...f, logoMethod: "upload" }))}
                            className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-stone-700">Upload File (Max 1 MB)</span>
                        </label>
                      </div>
                    </div>
                    {storeForm.logoMethod === "url" ? (
                      <div className="flex gap-2">
                        <input
                          key="store-logo-url"
                          type="url"
                          value={String(storeForm.logoUrl ?? "")}
                          onChange={(e) => setStoreForm((f) => ({ ...f, logoUrl: e.target.value }))}
                          placeholder="Cloudinary URL, direct image URL, or website URL"
                          className="flex-1 rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                        />
                        <button type="button" className="shrink-0 rounded border border-sky-600 bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
                          Extract Logo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-stone-600 file:mr-3 file:rounded file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-amber-700"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1024 * 1024) {
                              setMessage({ type: "error", text: "Logo must be 1 MB or smaller." });
                              e.target.value = "";
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => setStoreForm((f) => ({ ...f, logoUrl: String(reader.result) }));
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                        <p className="mt-1 text-xs text-stone-500">Choose an image (max 1 MB). It will be stored as a data URL.</p>
                        {storeForm.logoUrl && storeForm.logoUrl.startsWith("data:") && (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={storeForm.logoUrl} alt="Logo preview" className="h-12 w-12 rounded border border-stone-200 object-contain" />
                            <span className="text-xs text-stone-600">Logo selected</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Logo Alt Text (Optional)</label>
                      <input
                        type="text"
                        value={storeForm.logoAltText ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, logoAltText: e.target.value }))}
                        placeholder="Store logo"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <p className="mt-1 text-xs text-stone-500">Alt text for the store logo (for accessibility and SEO). If left blank, store name will be used.</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Description (Optional)</label>
                      <textarea
                        value={storeForm.description ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Store Description"
                        rows={3}
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                  </div>

                  {/* Right: Technical & Affiliate Information */}
                  <div className="space-y-4 rounded-lg border border-stone-300 bg-white p-5 shadow-sm">
                    <h3 className="border-b border-stone-200 pb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
                      Technical &amp; Affiliate Information
                    </h3>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Tracking URL</label>
                      <input
                        type="url"
                        value={storeForm.trackingUrl ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, trackingUrl: e.target.value }))}
                        placeholder="https://example.com/tracking-url"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <p className="mt-1 text-xs text-stone-500">Tracking/affiliate URL for this store. Used for redirecting users to the store.</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Country Codes</label>
                      <input
                        type="text"
                        value={storeForm.countryCodes ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, countryCodes: e.target.value }))}
                        placeholder="US, GB, DE, FR (comma-separated)"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <p className="mt-1 text-xs text-stone-500">Enter country codes for this store (e.g., US, GB). Use comma to separate.</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">Store Website URL (Display)</label>
                      <input
                        type="url"
                        value={storeForm.websiteUrl ?? ""}
                        onChange={(e) => setStoreForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <p className="mt-1 text-xs text-stone-500">Actual website URL of the store. You can edit it or use Auto-Fetch to guess from store name.</p>
                    </div>
                  </div>
                </div>

                {/* Full width: Category, Why Trust Us, More Info, FAQs, SEO, Trending */}
                <div className="rounded-lg border border-stone-300 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 border-b border-stone-200 pb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
                    Category &amp; Content
                  </h3>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-stone-700">Category</label>
                    <select
                      value={storeForm.category ?? ""}
                      onChange={(e) => setStoreForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full max-w-xs rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    >
                      <option value="">No Category</option>
                      {STORE_CATEGORY_NAMES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-stone-500">Assign this store to a category.</p>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-stone-700">Why Trust Us Section (Optional)</label>
                    <textarea
                      value={storeForm.whyTrustUs ?? ""}
                      onChange={(e) => setStoreForm((f) => ({ ...f, whyTrustUs: e.target.value }))}
                      placeholder="Why should customers trust this store? Enter custom content here..."
                      rows={2}
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <p className="mt-1 text-xs text-stone-500">This will appear in the sidebar &quot;Why Trust Us?&quot; section. Leave blank to use default content.</p>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-stone-700">More Information Section (Optional)</label>
                    <textarea
                      value={storeForm.moreInfo ?? ""}
                      onChange={(e) => setStoreForm((f) => ({ ...f, moreInfo: e.target.value }))}
                      placeholder="Enter detailed information about the store, coupons, how to use them, etc. You can use HTML tags for formatting."
                      rows={3}
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <p className="mt-1 text-xs text-stone-500">Supports HTML formatting. Leave blank to use default content.</p>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-stone-700">Sidebar: &quot;[Store name] Codes and Coupons&quot; (Optional)</label>
                    <RichTextEditor
                      value={storeForm.codesAndCouponsContent ?? ""}
                      onChange={(html) => setStoreForm((f) => ({ ...f, codesAndCouponsContent: html }))}
                      placeholder="Content for the sidebar box below About Store. HTML allowed."
                      minHeight="140px"
                    />
                    <p className="mt-1 text-xs text-stone-500">Use the toolbar for bold, italic, lists, link. Appears in the sidebar below About Store.</p>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-stone-700">More About [store name] (Optional)</label>
                    <RichTextEditor
                      value={storeForm.moreAboutContent ?? ""}
                      onChange={(html) => setStoreForm((f) => ({ ...f, moreAboutContent: html }))}
                      placeholder="Content for the section below the coupon list. Same toolbar: bold, italic, lists, link."
                      minHeight="140px"
                    />
                    <p className="mt-1 text-xs text-stone-500">Shows below the last coupon, above Shopping Tips. Use toolbar for formatting.</p>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-stone-700">Shopping Tips Section – Title (Optional)</label>
                    <input
                      type="text"
                      value={storeForm.shoppingTipsTitle ?? ""}
                      onChange={(e) => setStoreForm((f) => ({ ...f, shoppingTipsTitle: e.target.value }))}
                      placeholder="e.g. Touchtunes Coupon Code Shopping Tips"
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <p className="mt-1 text-xs text-stone-500">Heading for the Shopping Tips block on the store page. Leave blank for default.</p>
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-stone-700">Shopping Tips – Bullet points (Optional)</label>
                    <p className="mb-2 text-xs text-stone-500">One tip per line. Leave empty to use default tips.</p>
                    {(storeForm.shoppingTips ?? []).map((tip, i) => (
                      <div key={i} className="mb-2 flex gap-2">
                        <input
                          type="text"
                          value={tip}
                          onChange={(e) => setStoreForm((f) => ({
                            ...f,
                            shoppingTips: (f.shoppingTips ?? []).map((t, j) => (j === i ? e.target.value : t)),
                          }))}
                          placeholder="Tip text"
                          className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                        />
                        <button type="button" onClick={() => setStoreForm((f) => ({ ...f, shoppingTips: (f.shoppingTips ?? []).filter((_, j) => j !== i) }))} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setStoreForm((f) => ({ ...f, shoppingTips: [...(f.shoppingTips ?? []), ""] }))} className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50">Add tip</button>
                  </div>
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-stone-700">FAQs (shown on store page)</label>
                    <p className="mb-3 text-xs text-stone-500">Add question/answer pairs. These will appear in the FAQ section on the store page. Leave empty to use default FAQs.</p>
                    {(storeForm.faqs ?? []).map((faq, i) => (
                      <div key={i} className="mb-3 flex flex-col gap-2 rounded border border-stone-200 bg-stone-50 p-3">
                        <input
                          type="text"
                          value={faq.q ?? ""}
                          onChange={(e) => setStoreForm((f) => ({
                            ...f,
                            faqs: (f.faqs ?? []).map((item, j) => j === i ? { ...item, q: e.target.value } : item),
                          }))}
                          placeholder="Question"
                          className="rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                        />
                        <textarea
                          value={faq.a ?? ""}
                          onChange={(e) => setStoreForm((f) => ({
                            ...f,
                            faqs: (f.faqs ?? []).map((item, j) => j === i ? { ...item, a: e.target.value } : item),
                          }))}
                          placeholder="Answer"
                          rows={2}
                          className="rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                        />
                        <button
                          type="button"
                          onClick={() => setStoreForm((f) => ({ ...f, faqs: (f.faqs ?? []).filter((_, j) => j !== i) }))}
                          className="self-start text-xs text-red-600 hover:underline"
                        >
                          Remove FAQ
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setStoreForm((f) => ({ ...f, faqs: [...(f.faqs ?? []), { q: "", a: "" }] }))}
                      className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Add FAQ
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 rounded-lg border border-stone-300 bg-white p-5 shadow-sm lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">SEO Page Title (Optional)</label>
                    <input
                      type="text"
                      value={storeForm.seoTitle ?? ""}
                      onChange={(e) => setStoreForm((f) => ({ ...f, seoTitle: e.target.value }))}
                      placeholder="{store_name} Coupons & Deals {month_year} - Save"
                      maxLength={100}
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <p className="mt-1 text-xs text-stone-500">Shown in browser tab. Max 100 characters.</p>
                    <p className="mt-2 text-xs text-stone-600"><strong>Placeholders:</strong> {"{store_name}"}, {"{month_year}"}, {"{active_coupons}"}, {"{highest_offer}"}. Leave blank to use default template.</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">SEO Meta Description (Optional)</label>
                    <textarea
                      value={storeForm.seoMetaDesc ?? ""}
                      onChange={(e) => setStoreForm((f) => ({ ...f, seoMetaDesc: e.target.value }))}
                      placeholder="Get the latest Nike coupons & save up to 70%!"
                      maxLength={160}
                      rows={2}
                      className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <p className="mt-1 text-xs text-stone-500">Shown in search results. Max 160 characters.</p>
                  </div>
                </div>

                <div className="rounded-lg border border-stone-300 bg-white p-5 shadow-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={storeForm.trending}
                      onChange={(e) => setStoreForm((f) => ({ ...f, trending: e.target.checked }))}
                      className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-stone-700">Mark as Trending</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded border-2 border-sky-600 bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting ? (editingStoreId ? "Updating…" : "Creating Store…") : (editingStoreId ? "Update Store" : "Create Store")}
                </button>
              </form>

              {/* Coupons for this store — create coupon inside Stores page */}
              {editingStoreId && (
                <div className="mt-8 rounded-lg border border-stone-300 bg-stone-50 p-6 shadow-sm">
                  <h3 className="mb-3 font-serif text-base font-semibold text-stone-900">Coupons for this store</h3>
                  {(() => {
                    const storeKeyForm = (storeForm.slug || slugify(storeForm.name ?? "")).toLowerCase().trim() || (storeForm.name ?? "").toLowerCase().trim();
                    const couponsForThisStore = [
                      ...stores.filter((row) => {
                        const key = (row.slug || slugify(row.name)).toLowerCase().trim() || row.name.toLowerCase().trim();
                        return key === storeKeyForm && hasCouponData(row);
                      }),
                      ...couponsFromTable.filter((row) => {
                        const key = (row.slug || slugify(row.name ?? "")).toLowerCase().trim() || (row.name ?? "").toLowerCase().trim();
                        return key === storeKeyForm && hasCouponData(row);
                      }),
                    ];
                    return (
                      <>
                        {couponsForThisStore.length > 0 && (
                          <div className="mb-4 overflow-x-auto rounded border border-stone-200 bg-white">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-stone-200 bg-stone-100">
                                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Title / Code</th>
                                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Expiry</th>
                                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Status</th>
                                  <th className="px-3 py-2 text-left font-semibold text-stone-700">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {couponsForThisStore.map((row) => (
                                  <tr key={row.id} className="border-b border-stone-100">
                                    <td className="px-3 py-2 text-stone-700">{row.couponTitle || row.couponCode || "—"}</td>
                                    <td className="px-3 py-2 text-stone-600">{row.expiry ?? "—"}</td>
                                    <td className="px-3 py-2 text-stone-600">{row.status ?? "enable"}</td>
                                    <td className="px-3 py-2">
                                      <button type="button" onClick={() => { startEditCoupon(row); setSection("coupons"); setShowCouponsCreateForm(true); }} className="rounded border border-sky-600 bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700">Edit</button>
                                      <button type="button" onClick={() => handleDeleteCoupon(row.id)} className="ml-1 rounded border border-red-600 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700">Delete</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {!showAddCouponForStore ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCouponForStore(true);
                              setCouponForm((f) => ({ ...f, selectedStoreId: editingStoreId, name: storeForm.name ?? "", description: storeForm.description ?? "" }));
                              setEditingCouponId(null);
                            }}
                            className="rounded border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                          >
                            Add coupon for this store
                          </button>
                        ) : (
                          <div className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
                            <h4 className="mb-3 font-serif text-sm font-semibold text-stone-800">New coupon for: {storeForm.name}</h4>
                            <form onSubmit={handleCouponSubmit} className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-stone-600">Coupon Type</label>
                                  <div className="flex gap-3">
                                    <label className="flex cursor-pointer items-center gap-2">
                                      <input type="radio" name="couponTypeStore" checked={couponForm.couponType === "code"} onChange={() => setCouponForm((f) => ({ ...f, couponType: "code" }))} className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500" />
                                      <span className="text-sm text-stone-700">Code</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2">
                                      <input type="radio" name="couponTypeStore" checked={couponForm.couponType === "deal"} onChange={() => setCouponForm((f) => ({ ...f, couponType: "deal" }))} className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500" />
                                      <span className="text-sm text-stone-700">Deal</span>
                                    </label>
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-stone-600">Coupon Code {couponForm.couponType === "code" ? "*" : "(Optional)"}</label>
                                  <input type="text" required={couponForm.couponType === "code"} value={couponForm.couponCode ?? ""} onChange={(e) => setCouponForm((f) => ({ ...f, couponCode: e.target.value }))} placeholder="e.g. SAVE20" className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600" />
                                </div>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-stone-600">Coupon Title (Optional)</label>
                                <input type="text" value={couponForm.couponTitle ?? ""} onChange={(e) => setCouponForm((f) => ({ ...f, couponTitle: e.target.value }))} placeholder="e.g. 20% Off" className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600" />
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-stone-600">Badge – Shipping/Delivery</label>
                                  <input
                                    type="text"
                                    value={couponForm.badgeShipping ?? ""}
                                    onChange={(e) => setCouponForm((f) => ({ ...f, badgeShipping: e.target.value }))}
                                    placeholder="e.g. Free Shipping, Free Delivery"
                                    className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-stone-600">Badge – % or amount</label>
                                  <input type="text" value={couponForm.badgeOffer ?? ""} onChange={(e) => setCouponForm((f) => ({ ...f, badgeOffer: e.target.value }))} placeholder="e.g. 20% OFF, $10 OFF" className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600" />
                                </div>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-stone-600">Description *</label>
                                <textarea required value={couponForm.description ?? ""} onChange={(e) => setCouponForm((f) => ({ ...f, description: e.target.value }))} placeholder="Coupon or deal description" rows={2} className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-stone-600">Coupon URL (optional)</label>
                                <input type="url" value={couponForm.link ?? ""} onChange={(e) => setCouponForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://..." className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-stone-600">Expiry (optional)</label>
                                <input type="text" value={couponForm.expiry ?? ""} onChange={(e) => setCouponForm((f) => ({ ...f, expiry: e.target.value }))} placeholder="Dec 31, 2026" className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600" />
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <button type="submit" disabled={submitting} className="rounded border-2 border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                                  {submitting ? "Creating…" : "Create Coupon"}
                                </button>
                                <button type="button" onClick={() => { setShowAddCouponForStore(false); setCouponForm((f) => ({ ...f, couponCode: "", couponTitle: "", badgeLabel: "", badgeShipping: "", badgeOffer: "", description: storeForm.description ?? "" })); }} className="rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
                </>
              )}

              {/* Upload Stores Modal */}
              {showUploadStoresModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4" onClick={() => !uploadStoresSubmitting && setShowUploadStoresModal(false)}>
                  <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-stone-300 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="mb-4 font-serif text-xl font-bold text-stone-900">Upload Stores (CSV)</h3>
                    <p className="mb-4 text-sm text-stone-600">Upload a CSV. Use headers: <strong>name</strong>, <strong>description</strong>, <strong>logoUrl</strong>, <strong>slug</strong>, <strong>trackingUrl</strong>, <strong>countryCodes</strong>, <strong>websiteUrl</strong>, <strong>category</strong> (or &quot;Store Name&quot; for name). First row = headers.</p>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-stone-700">Choose CSV file</label>
                      <input
                        type="file"
                        accept=".csv"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 file:mr-2 file:rounded file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-amber-800"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setUploadStoresFile(f);
                          const text = await f.text();
                          const lines = text.split(/\r?\n/).filter(Boolean);
                          const rawHeaders = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
                          const norm = (k: string) => k.toLowerCase().replace(/\s+/g, "");
                          const headerMap: Record<string, string> = { name: "name", storename: "name", description: "description", logo: "logoUrl", logourl: "logoUrl", logo_url: "logoUrl", slug: "slug", merchantid: "merchantId", networkid: "networkId", trackingurl: "trackingUrl", tracking_url: "trackingUrl", countrycodes: "countryCodes", websiteurl: "websiteUrl", website_url: "websiteUrl", category: "category" };
                          const headers = rawHeaders.map((h) => headerMap[norm(h)] ?? norm(h));
                          const start = 1;
                          const preview: Record<string, string>[] = [];
                          for (let i = start; i < Math.min(lines.length, start + 6); i++) {
                            const vals = parseCSVLine(lines[i]);
                            const row: Record<string, string> = {};
                            headers.forEach((h, j) => { if (h) row[h] = (vals[j] || "").trim(); });
                            preview.push(row);
                          }
                          setUploadStoresPreview(preview);
                        }}
                      />
                    </div>
                    {uploadStoresPreview && uploadStoresPreview.length > 0 && (
                      <div className="mb-4 overflow-x-auto rounded border border-stone-200 bg-stone-50 p-2 text-xs">
                        <p className="mb-2 font-medium text-stone-700">Preview (first rows)</p>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-stone-300">
                              {Object.keys(uploadStoresPreview[0]).map((k) => <th key={k} className="px-2 py-1 text-left font-medium text-stone-600">{k}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {uploadStoresPreview.map((row, i) => (
                              <tr key={i} className="border-b border-stone-100">
                                {Object.values(row).map((v, j) => <td key={j} className="max-w-[120px] truncate px-2 py-1 text-stone-700" title={String(v)}>{String(v)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowUploadStoresModal(false); setUploadStoresFile(null); setUploadStoresPreview(null); }} className="rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Cancel</button>
                      <button
                        type="button"
                        disabled={!uploadStoresFile || uploadStoresSubmitting}
                        className="rounded border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                        onClick={async () => {
                          if (!uploadStoresFile) return;
                          setUploadStoresSubmitting(true);
                          setMessage(null);
                          try {
                            const text = await uploadStoresFile.text();
                            const lines = text.split(/\r?\n/).filter(Boolean);
                            const rawHeaders = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
                            const norm = (k: string) => k.toLowerCase().replace(/\s+/g, "");
                            const headerMap: Record<string, string> = { name: "name", storename: "name", description: "description", logo: "logoUrl", logourl: "logoUrl", logo_url: "logoUrl", slug: "slug", merchantid: "merchantId", networkid: "networkId", trackingurl: "trackingUrl", tracking_url: "trackingUrl", countrycodes: "countryCodes", websiteurl: "websiteUrl", website_url: "websiteUrl", category: "category" };
                            const headers = rawHeaders.map((h) => headerMap[norm(h)] ?? norm(h));
                            const start = 1;
                            const stores: Record<string, string>[] = [];
                            for (let i = start; i < lines.length; i++) {
                              const vals = parseCSVLine(lines[i]);
                              const row: Record<string, string> = {};
                              headers.forEach((h, j) => { if (h) row[h] = (vals[j] || "").trim(); });
                              if (row.name) stores.push(row);
                            }
                            const res = await fetch("/api/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stores }) });
                            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error ?? "Import failed"); }
                            const data = await res.json();
                            setMessage({ type: "success", text: `Imported ${data.imported ?? stores.length} store(s).` });
                            setShowUploadStoresModal(false);
                            setUploadStoresFile(null);
                            setUploadStoresPreview(null);
                            await fetchStores();
                          } catch (e) {
                            setMessage({ type: "error", text: e instanceof Error ? e.message : "Import failed." });
                          } finally {
                            setUploadStoresSubmitting(false);
                          }
                        }}
                      >
                        {uploadStoresSubmitting ? "Importing…" : "Import Stores"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Logos Modal */}
              {showUploadLogosModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4" onClick={() => !uploadLogoSubmitting && setShowUploadLogosModal(false)}>
                  <div className="w-full max-w-md rounded-xl border border-stone-300 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="mb-4 font-serif text-xl font-bold text-stone-900">Upload Logos</h3>
                    <p className="mb-4 text-sm text-stone-600">Set logo for a store by selecting the store and entering a logo URL (or upload later via Create/Edit store).</p>
                    <div className="mb-4">
                      <label className="mb-1 block text-sm font-medium text-stone-700">Store</label>
                      <select
                        value={uploadLogoStoreId ?? ""}
                        onChange={(e) => setUploadLogoStoreId(e.target.value)}
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      >
                        <option value="">Select store…</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="mb-1 block text-sm font-medium text-stone-700">Logo URL</label>
                      <input
                        type="url"
                        value={uploadLogoUrl ?? ""}
                        onChange={(e) => setUploadLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowUploadLogosModal(false); setUploadLogoStoreId(""); setUploadLogoUrl(""); }} className="rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Cancel</button>
                      <button
                        type="button"
                        disabled={!uploadLogoStoreId || !uploadLogoUrl.trim() || uploadLogoSubmitting}
                        className="rounded border border-violet-600 bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                        onClick={async () => {
                          setUploadLogoSubmitting(true);
                          setMessage(null);
                          try {
                            const res = await fetch("/api/stores", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: uploadLogoStoreId, logoUrl: uploadLogoUrl.trim() }),
                            });
                            if (!res.ok) throw new Error("Update failed");
                            setMessage({ type: "success", text: "Logo URL updated." });
                            setShowUploadLogosModal(false);
                            setUploadLogoStoreId("");
                            setUploadLogoUrl("");
                            await fetchStores();
                          } catch {
                            setMessage({ type: "error", text: "Failed to update logo." });
                          } finally {
                            setUploadLogoSubmitting(false);
                          }
                        }}
                      >
                        {uploadLogoSubmitting ? "Updating…" : "Update Logo"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Blog - Manage Blog posts (WordPress-style) */}
          {section === "blog" && (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-serif text-2xl font-bold text-stone-900">Manage Blog</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {showBlogForm ? (
                    <button
                      type="button"
                      onClick={() => { setShowBlogForm(false); setEditingBlogId(null); setMessage(null); }}
                      className="rounded border border-stone-300 bg-stone-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-stone-700"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBlogForm(true)}
                      className="rounded border border-stone-300 bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
                    >
                      Create New Post
                    </button>
                  )}
                </div>
              </div>

              {message && section === "blog" && (
                <div
                  className={`mb-4 rounded border px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {!showBlogForm && (
                <div className="overflow-x-auto rounded-lg border border-stone-300 bg-white shadow-sm">
                  {blogLoading ? (
                    <div className="p-8 text-center text-sm text-stone-500">Loading posts…</div>
                  ) : blogPosts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-stone-500">No blog posts yet. Create one above.</div>
                  ) : (
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="px-3 py-2 text-left font-semibold text-stone-700">Title</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-700">Slug</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-700">Category</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-700">Niche</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-700">Featured</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogPosts.map((p) => {
                          const nicheList = (p as { niche?: BlogNiche[] }).niche ?? (p.featured ? ["featured"] : []);
                          return (
                          <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                            <td className="px-3 py-2 font-medium text-stone-900">{p.title}</td>
                            <td className="px-3 py-2 text-stone-600">{p.slug}</td>
                            <td className="px-3 py-2 text-stone-600">{p.category}</td>
                            <td className="px-3 py-2 text-stone-600">{nicheList.length ? nicheList.join(", ") : "—"}</td>
                            <td className="px-3 py-2">{p.featured ? "✓" : "—"}</td>
                            <td className="px-3 py-2">
                              <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="mr-2 text-sky-600 hover:underline">View</a>
                              <button
                                type="button"
                                onClick={() => {
                                  const niche = (p as { niche?: BlogNiche[] }).niche ?? (p.featured ? (["featured"] as BlogNiche[]) : []);
                                  setEditingBlogId(p.id);
                                  setBlogForm({
                                    title: p.title,
                                    slug: p.slug,
                                    category: (blogCategories as readonly string[]).includes(p.category) ? (p.category as (typeof blogCategories)[number]) : blogCategories[0],
                                    excerpt: p.excerpt ?? "",
                                    image: p.image ?? "",
                                    imageAspectRatio: (p as { imageAspectRatio?: ImageAspectRatio }).imageAspectRatio ?? "16/9",
                                    featured: p.featured ?? false,
                                    niche,
                                    content: (p as { content?: string }).content ?? "",
                                    publishedDate: (p as { publishedDate?: string }).publishedDate ?? "",
                                  });
                                  setShowBlogForm(true);
                                }}
                                className="rounded border border-sky-600 bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm("Delete this post?")) return;
                                  try {
                                    const res = await fetch(`/api/blog?id=${encodeURIComponent(p.id)}`, { method: "DELETE", credentials: "include" });
                                    if (!res.ok) throw new Error("Failed");
                                    await fetchBlogs();
                                  } catch {
                                    setMessage({ type: "error", text: "Failed to delete post." });
                                  }
                                }}
                                className="ml-1 rounded border border-red-600 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ); })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {showBlogForm && (
                <>
                  <h2 className="mb-4 font-serif text-lg font-semibold text-stone-900">{editingBlogId ? "Edit Post" : "Create New Post"}</h2>
                  <form onSubmit={handleBlogSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4 rounded-lg border border-stone-300 bg-white p-5 shadow-sm">
                        <h3 className="border-b border-stone-200 pb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">Post details</h3>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Title *</label>
                          <div className="mb-1 flex flex-wrap items-center gap-1 rounded border border-stone-200 bg-stone-50 p-1">
                            <span className="mr-1 text-xs text-stone-500">Format:</span>
                            <button type="button" onClick={() => insertContentHtmlForField("title", "<b>", "</b>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs font-bold text-stone-800 hover:bg-stone-100" title="Bold">B</button>
                            <button type="button" onClick={() => insertContentHtmlForField("title", "<i>", "</i>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs italic text-stone-800 hover:bg-stone-100" title="Italic">I</button>
                            <button type="button" onClick={() => insertContentHtmlForField("title", "<u>", "</u>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-800 underline hover:bg-stone-100" title="Underline">U</button>
                            <button type="button" onClick={() => insertLinkForField("title")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-800 hover:bg-stone-100" title="Link">Link</button>
                          </div>
                          <input
                            ref={titleInputRef}
                            type="text"
                            required
                            value={blogForm.title ?? ""}
                            onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Post title"
                            className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Slug (URL)</label>
                          <input
                            type="text"
                            value={blogForm.slug ?? ""}
                            onChange={(e) => setBlogForm((f) => ({ ...f, slug: e.target.value }))}
                            placeholder="auto from title if empty"
                            className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Category</label>
                          <select
                            value={blogForm.category ?? ""}
                            onChange={(e) => setBlogForm((f) => ({ ...f, category: e.target.value as (typeof blogCategories)[number] }))}
                            className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          >
                            {blogCategories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-stone-700">Niche (hero: Featured / Trending / Popular)</label>
                          <div className="flex flex-wrap gap-4">
                            {BLOG_NICHES.map(({ value, label }) => (
                              <label key={value} className="flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={blogForm.niche?.includes(value) ?? false}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...(blogForm.niche ?? []), value]
                                      : (blogForm.niche ?? []).filter((n) => n !== value);
                                    setBlogForm((f) => ({ ...f, niche: next }));
                                  }}
                                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Excerpt</label>
                          <div className="mb-1 flex flex-wrap items-center gap-1 rounded border border-stone-200 bg-stone-50 p-1">
                            <span className="mr-1 text-xs text-stone-500">Format:</span>
                            <button type="button" onClick={() => insertContentHtmlForField("excerpt", "<b>", "</b>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs font-bold text-stone-800 hover:bg-stone-100" title="Bold">B</button>
                            <button type="button" onClick={() => insertContentHtmlForField("excerpt", "<i>", "</i>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs italic text-stone-800 hover:bg-stone-100" title="Italic">I</button>
                            <button type="button" onClick={() => insertContentHtmlForField("excerpt", "<u>", "</u>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-800 underline hover:bg-stone-100" title="Underline">U</button>
                            <button type="button" onClick={() => insertContentHtmlForField("excerpt", "<h2>", "</h2>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-100" title="H2">H2</button>
                            <button type="button" onClick={() => insertContentHtmlForField("excerpt", "<h3>", "</h3>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-100" title="H3">H3</button>
                            <button type="button" onClick={() => insertContentHtmlForField("excerpt", "<p>", "</p>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-800 hover:bg-stone-100" title="Paragraph">P</button>
                            <button type="button" onClick={() => insertContentHtmlForField("excerpt", "<ul><li>", "</li></ul>")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-800 hover:bg-stone-100" title="List">• List</button>
                            <button type="button" onClick={() => insertLinkForField("excerpt")} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-800 hover:bg-stone-100" title="Link">Link</button>
                          </div>
                          <textarea
                            ref={excerptTextareaRef}
                            value={blogForm.excerpt ?? ""}
                            onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))}
                            placeholder="Short summary (HTML allowed)"
                            rows={3}
                            className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Featured image URL</label>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={blogForm.image ?? ""}
                              onChange={(e) => setBlogForm((f) => ({ ...f, image: e.target.value }))}
                              placeholder="https://... or upload below"
                              className="min-w-0 flex-1 rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                            />
                            <input
                              ref={featuredImageUploadInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              onChange={handleFeaturedImageUpload}
                            />
                            <button
                              type="button"
                              disabled={imageUploading}
                              onClick={() => featuredImageUploadInputRef.current?.click()}
                              className="shrink-0 rounded border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
                              title="Upload featured image"
                            >
                              {imageUploading ? "…" : "Upload"}
                            </button>
                          </div>
                          <div className="mt-2">
                            <label className="mb-1 block text-xs font-medium text-stone-600">Aspect ratio (display)</label>
                            <select
                              value={blogForm.imageAspectRatio ?? "16/9"}
                              onChange={(e) => setBlogForm((f) => ({ ...f, imageAspectRatio: e.target.value as ImageAspectRatio }))}
                              className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              {IMAGE_ASPECT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">Published date (display)</label>
                          <input
                            type="text"
                            value={blogForm.publishedDate ?? ""}
                            onChange={(e) => setBlogForm((f) => ({ ...f, publishedDate: e.target.value }))}
                            placeholder="e.g. JANUARY 2, 2026"
                            className="w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={blogForm.featured}
                            onChange={(e) => setBlogForm((f) => ({ ...f, featured: e.target.checked }))}
                            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm font-medium text-stone-700">Featured</span>
                        </label>
                      </div>
                      <div className="space-y-4 rounded-lg border border-stone-300 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Content (HTML)</h3>
                          <div className="flex rounded border border-stone-200 bg-stone-50 p-0.5">
                            <button
                              type="button"
                              onClick={() => setContentViewMode("html")}
                              className={`rounded px-3 py-1.5 text-xs font-medium transition ${contentViewMode === "html" ? "bg-amber-500 text-white" : "text-stone-600 hover:bg-stone-200"}`}
                            >
                              HTML
                            </button>
                            <button
                              type="button"
                              onClick={() => setContentViewMode("preview")}
                              className={`rounded px-3 py-1.5 text-xs font-medium transition ${contentViewMode === "preview" ? "bg-amber-500 text-white" : "text-stone-600 hover:bg-stone-200"}`}
                            >
                              Normal
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-stone-500">Normal = edit as plain English (formatted). HTML = edit raw code.</p>
                        {contentViewMode === "html" && (
                          <>
                            <div className="flex flex-wrap items-center gap-1 rounded border border-stone-200 bg-stone-50 p-1.5">
                              <span className="mr-2 text-xs font-medium text-stone-500">Format:</span>
                              <button type="button" onClick={() => insertContentHtml("<b>", "</b>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm font-bold text-stone-800 hover:bg-stone-100" title="Bold">B</button>
                              <button type="button" onClick={() => insertContentHtml("<i>", "</i>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm italic text-stone-800 hover:bg-stone-100" title="Italic">I</button>
                              <button type="button" onClick={() => insertContentHtml("<u>", "</u>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800 underline hover:bg-stone-100" title="Underline">U</button>
                              <span className="mx-1 w-px self-stretch bg-stone-300" />
                              <button type="button" onClick={() => insertContentHtml("<h2>", "</h2>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100" title="Heading 2">H2</button>
                              <button type="button" onClick={() => insertContentHtml("<h3>", "</h3>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100" title="Heading 3">H3</button>
                              <button type="button" onClick={() => insertContentHtml("<p>", "</p>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-800 hover:bg-stone-100" title="Paragraph">P</button>
                              <span className="mx-1 w-px self-stretch bg-stone-300" />
                              <button type="button" onClick={() => insertContentHtml("<ul>\n  <li>", "</li>\n</ul>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-800 hover:bg-stone-100" title="Bullet list">• List</button>
                              <button type="button" onClick={() => insertContentHtml("<ol>\n  <li>", "</li>\n</ol>")} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-800 hover:bg-stone-100" title="Numbered list">1. List</button>
                              <span className="mx-1 w-px self-stretch bg-stone-300" />
                              <span className="mr-1 text-xs text-stone-500">Size:</span>
                              <select
                                className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                title="Font size (px)"
                                onChange={(e) => {
                                  const n = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(n)) insertContentHtml(`<span style="font-size: ${n}px">`, "</span>");
                                  e.target.value = "";
                                }}
                              >
                                <option value="">1–100</option>
                                {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                              <span className="mx-1 w-px self-stretch bg-stone-300" />
                              <button type="button" onClick={insertLink} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-800 hover:bg-stone-100" title="Insert link">Link</button>
                              <button type="button" onClick={insertImageContent} className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-800 hover:bg-stone-100" title="Insert image by URL">Img</button>
                              <input
                                ref={imageUploadInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={handleImageUploadContent}
                              />
                              <button
                                type="button"
                                disabled={imageUploading}
                                onClick={() => imageUploadInputRef.current?.click()}
                                className="rounded border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-800 hover:bg-stone-100 disabled:opacity-50"
                                title="Upload image (saves to /uploads)"
                              >
                                {imageUploading ? "…" : "Upload"}
                              </button>
                            </div>
                            <textarea
                              ref={contentTextareaRef}
                              value={blogForm.content ?? ""}
                              onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))}
                              onPaste={handleContentPaste}
                              placeholder="<p>Your content here...</p>"
                              rows={16}
                              className="w-full rounded border border-stone-300 px-3 py-2 font-mono text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                            />
                          </>
                        )}
                        {contentViewMode === "preview" && (
                          <div className="min-h-[280px] max-h-[75vh] overflow-y-auto rounded-lg border border-stone-200 bg-white">
                            {/* Sticky bar: label + toolbar — sticks inside this scroll container */}
                            <div className="sticky top-0 z-30 border-b border-stone-200 bg-white px-4 pb-2 pt-4 shadow-md">
                              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Normal English — edit here; links show in blue</p>
                              <div className="flex flex-wrap items-center gap-1 rounded border border-stone-200 bg-stone-100 p-1.5">
                                <button type="button" onClick={() => execVisual("bold")} className="rounded border border-stone-300 bg-white px-2 py-1 text-sm font-bold text-stone-800 hover:bg-stone-100" title="Bold">B</button>
                                <button type="button" onClick={() => execVisual("italic")} className="rounded border border-stone-300 bg-white px-2 py-1 text-sm italic text-stone-800 hover:bg-stone-100" title="Italic">I</button>
                                <button type="button" onClick={() => execVisual("underline")} className="rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-800 underline hover:bg-stone-100" title="Underline">U</button>
                                <span className="mx-1 w-px self-stretch bg-stone-300" />
                                <button type="button" onClick={() => execVisual("formatBlock", "h2")} className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-100">H2</button>
                                <button type="button" onClick={() => execVisual("formatBlock", "h3")} className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-100">H3</button>
                                <button type="button" onClick={() => execVisual("insertUnorderedList")} className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 hover:bg-stone-100">• List</button>
                                <button type="button" onClick={() => execVisual("insertOrderedList")} className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 hover:bg-stone-100">1. List</button>
                                <span className="mx-1 w-px self-stretch bg-stone-300" />
                                <span className="mr-1 text-xs text-stone-500">Size:</span>
                                <select
                                  className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  title="Font size (px) – select text first"
                                  onChange={(e) => {
                                    const n = parseInt(e.target.value, 10);
                                    if (!Number.isNaN(n)) execVisualFontSize(n);
                                    e.target.value = "";
                                  }}
                                >
                                  <option value="">1–100</option>
                                  {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </select>
                                <span className="mx-1 w-px self-stretch bg-stone-300" />
                                <button type="button" onClick={insertVisualLink} className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 hover:bg-stone-100">Link</button>
                                <button type="button" onClick={insertVisualImage} className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 hover:bg-stone-100" title="Insert image by URL">Img</button>
                                <input
                                  ref={visualImageUploadInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp"
                                  className="hidden"
                                  onChange={handleVisualImageUpload}
                                />
                                <button
                                  type="button"
                                  disabled={imageUploading}
                                  onClick={() => visualImageUploadInputRef.current?.click()}
                                  className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 hover:bg-stone-100 disabled:opacity-50"
                                  title="Upload image (saves to /uploads)"
                                >
                                  {imageUploading ? "…" : "Upload"}
                                </button>
                              </div>
                            </div>
                            <div
                              ref={contentEditableRef}
                              contentEditable
                              suppressContentEditableWarning
                              onInput={(e) => {
                                const html = (e.currentTarget as HTMLDivElement).innerHTML;
                                setBlogForm((f) => ({ ...f, content: html }));
                              }}
                              className="admin-normal-editor min-h-[240px] max-w-none rounded border border-stone-200 bg-stone-50/50 p-4 text-left text-stone-700 outline-none focus:ring-2 focus:ring-amber-500 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-0.5 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_p]:my-2"
                              style={{ overflowWrap: "break-word" } as React.CSSProperties}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                      >
                        {submitting ? "Saving…" : (editingBlogId ? "Update Post" : "Create Post")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowBlogForm(false); setEditingBlogId(null); setMessage(null); }}
                        className="rounded border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}

          {/* Analytics & Click Tracking - placeholders */}
          {section === "analytics" && (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </span>
                  <h1 className="font-serif text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fetchAnalytics()}
                    disabled={analyticsLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <svg className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {analyticsLoading ? "Loading…" : "Refresh"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export CSV
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    Check Clicks
                  </button>
                </div>
              </div>

              {/* Coupon Click Tracking hero card */}
              {analyticsLoading ? (
                <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading analytics…</div>
              ) : (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-violet-700">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      <h2 className="text-lg font-semibold">Coupon Click Tracking</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Track every coupon click with location, device &amp; more</p>
                    <div className="mt-4 flex flex-wrap gap-6">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{analytics?.totalClicks ?? 0}</p>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Clicks</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{analytics?.clicksToday ?? 0}</p>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Today</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{analytics?.clicksThisWeek ?? 0}</p>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">This Week</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">—</p>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Countries</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection("tracking")}
                    className="shrink-0 rounded-xl border-2 border-red-500/80 bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
                  >
                    View Detailed Click Analytics →
                  </button>
                </div>
              </div>
              )}

              {/* 4 KPI cards */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Avg Usage Rate", value: `${analytics?.avgUsageRate ?? "0.0"}%`, accent: "text-sky-600" },
                  { label: "Percentage Coupons", value: String(analytics?.totalCoupons ?? stores.length), accent: "text-violet-600" },
                  { label: "Expiring Soon (7 days)", value: "—", accent: "text-amber-600" },
                  { label: "Total Coupons", value: String(analytics?.totalCoupons ?? stores.length), accent: "text-slate-800" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{kpi.label}</p>
                    <p className={`mt-1 text-xl font-bold ${kpi.accent}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Grid: Clicks by Device, Codes vs Deals, Top Countries, Top Stores, Top Coupons, Type Distribution */}
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {/* Clicks by Device */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    Clicks by Device
                  </h3>
                  <p className="text-xs text-slate-500">Device breakdown when tracked.</p>
                  <div className="mt-2 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Total tracked</span>
                        <span className="font-medium text-slate-900">{analytics?.totalClicks ?? 0}</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full max-w-full rounded-full bg-indigo-500" style={{ width: analytics?.totalClicks ? "100%" : "0%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Codes vs Deals */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </span>
                    Codes vs Deals
                  </h3>
                  <div className="flex items-center justify-around gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                        {analytics?.codesCount ?? stores.filter((s) => s.couponType === "code").length}
                      </div>
                      <span className="mt-2 text-xs font-medium text-slate-600">Codes</span>
                    </div>
                    <span className="text-sm font-bold text-slate-400">VS</span>
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                        {analytics?.dealsCount ?? (stores.filter((s) => s.couponType !== "code").length || stores.length)}
                      </div>
                      <span className="mt-2 text-xs font-medium text-slate-600">Deals</span>
                    </div>
                  </div>
                </div>

                {/* Top Countries */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    Top Countries
                  </h3>
                  <p className="text-xs text-slate-500">Country data when tracked.</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {([] as { country: string; clicks: number }[]).length === 0 ? (
                      <li className="rounded-lg bg-slate-50/80 px-3 py-4 text-center text-slate-500">No country data yet</li>
                    ) : (
                      ([] as { country: string; clicks: number }[]).map((row, i) => (
                        <li key={row.country} className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                          <span className="font-medium text-slate-500">#{i + 1}</span>
                          <span className="flex-1 truncate px-2 text-slate-800">{row.country}</span>
                          <span className="font-semibold text-slate-900">{row.clicks}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Top Clicked Stores */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </span>
                    Top Clicked Stores
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {(analytics?.byStore ?? []).slice(0, 8).length === 0 ? (
                      <li className="rounded-lg bg-slate-50/80 px-3 py-4 text-center text-slate-500">Clicks will show when users click &quot;Read More&quot; on coupons</li>
                    ) : (
                      (analytics?.byStore ?? []).slice(0, 8).map((row, i) => (
                        <li key={row.storeId} className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                          <span className="font-medium text-slate-500">#{i + 1}</span>
                          <span className="flex-1 truncate px-2 text-slate-800">{row.storeName}</span>
                          <span className="font-semibold text-slate-900">{row.count} clicks</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Top 5 Most Used Coupons */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="rounded-lg bg-amber-100 p-1.5 text-amber-600">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </span>
                    Top 5 Most Used Coupons
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {(analytics?.topCoupons ?? []).length > 0
                      ? (analytics?.topCoupons ?? []).map((row, i) => (
                          <li key={row.storeId} className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                            <span className="font-medium text-slate-500">{i + 1}</span>
                            <span className="flex-1 truncate px-2 font-mono text-slate-800">{row.code}</span>
                            <span className="text-slate-600">{row.uses} uses, {row.pct}</span>
                          </li>
                        ))
                      : stores.length > 0
                        ? stores.slice(0, 5).map((s, i) => (
                            <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
                              <span className="font-medium text-slate-500">{i + 1}</span>
                              <span className="flex-1 truncate px-2 font-mono text-slate-800">{s.couponCode || s.name.slice(0, 12).toUpperCase()}</span>
                              <span className="text-slate-600">0 uses, 0.0%</span>
                            </li>
                          ))
                        : <li className="rounded-lg bg-slate-50/80 px-3 py-4 text-center text-slate-500">No coupons yet</li>
                    }
                  </ul>
                </div>

                {/* Coupon Type Distribution - real data only */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /></svg>
                    </span>
                    Coupon Type Distribution
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const total = analytics?.totalCoupons ?? stores.length;
                      const pctPercent = total > 0 ? "100.0" : "0.0";
                      const barWidth = total > 0 ? "100%" : "0%";
                      return (
                        <>
                          <div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Percentage Coupons</span>
                              <span className="font-medium text-slate-900">{total} ({pctPercent}%)</span>
                            </div>
                            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: barWidth }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Fixed Amount Coupons</span>
                              <span className="font-medium text-slate-900">0 (0.0%)</span>
                            </div>
                            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full w-0 rounded-full bg-slate-300" />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}

          {section === "tracking" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="font-serif text-2xl font-bold text-slate-900">Click Tracking</h1>
                <button
                  type="button"
                  onClick={() => setSection("analytics")}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ← Back to Analytics
                </button>
              </div>
              <p className="text-sm text-slate-600">
                Detailed click analytics (by location, device, time) can be wired to your tracking backend here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
