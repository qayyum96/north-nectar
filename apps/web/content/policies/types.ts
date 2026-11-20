/**
 * A policy page. Replace the text in the matching file in this folder, then set `status` to
 * "final": the page becomes indexable and is added to the sitemap automatically.
 */
export interface PolicyDocument {
  /** URL path, e.g. "/privacy-policy". */
  path: string;
  title: string;
  /** Short name for breadcrumbs and links. */
  shortTitle: string;
  metaDescription: string;
  /** "draft" pages show a notice, are noindex and stay out of the sitemap. */
  status: "draft" | "final";
  /** ISO date (YYYY-MM-DD) shown as "Last updated". */
  lastUpdated: string;
  intro: string;
  sections: PolicySection[];
}

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}
