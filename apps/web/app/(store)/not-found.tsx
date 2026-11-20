import { NotFoundContent } from "@/components/layout/not-found-content";

/**
 * notFound() inside store pages (unknown or draft product, empty category). The (store) layout
 * already renders the header and footer, so only the body is returned here.
 */
export default function StoreNotFound() {
  return <NotFoundContent />;
}
