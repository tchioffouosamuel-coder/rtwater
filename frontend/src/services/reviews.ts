import api from './api';

export interface Review {
  id: number;
  product_id: number;
  rating: number;
  title: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  is_verified_purchase: boolean;
  author: string;
  product?: { id: number; name: string };
  created_at: string;
}

export interface ReviewStats {
  count: number;
  avg_rating: number;
  breakdown: number[]; // [5★, 4★, 3★, 2★, 1★]
}

export async function fetchProductReviews(productId: string | number, page = 1) {
  return api.request(`/products/${productId}/reviews?page=${page}`);
}

export async function createReview(
  productId: string | number,
  payload: { rating: number; title?: string; content: string }
) {
  return api.request(`/products/${productId}/reviews`, {
    method: 'POST',
    body: payload,
  });
}

export async function fetchAdminReviews(params: {
  status?: string;
  product_id?: number;
  page?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (params.status)     qs.set('status', params.status);
  if (params.product_id) qs.set('product_id', String(params.product_id));
  if (params.page)       qs.set('page', String(params.page));
  const query = qs.toString() ? `?${qs}` : '';
  return api.request(`/admin/reviews${query}`);
}

export async function updateReviewStatus(
  reviewId: number,
  status: 'pending' | 'approved' | 'rejected'
) {
  return api.request(`/admin/reviews/${reviewId}`, {
    method: 'PUT',
    body: { status },
  });
}

export async function deleteReview(reviewId: number) {
  return api.request(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
}
