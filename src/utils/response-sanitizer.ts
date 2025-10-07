export function sanitizeCategory(category: any) {
  const { id, ...sanitized } = category;
  return {
    ...sanitized,
    slug: category.slug
  };
}

export function sanitizeVideo(video: any) {
  const { id, categoryId, ...sanitized } = video;
  return {
    ...sanitized,
    slug: video.slug || null
  };
}

export function sanitizeCustomer(customer: any) {
  const { id, password, ...sanitized } = customer;
  return sanitized;
}

export function sanitizePurchase(purchase: any) {
  const { id, customerId, ...sanitized } = purchase;
  return sanitized;
}

export function sanitizeCategories(categories: any[]) {
  return categories.map(sanitizeCategory);
}

export function sanitizeVideos(videos: any[]) {
  return videos.map(sanitizeVideo);
}

export function sanitizeCustomers(customers: any[]) {
  return customers.map(sanitizeCustomer);
}

export function sanitizePurchases(purchases: any[]) {
  return purchases.map(sanitizePurchase);
}
