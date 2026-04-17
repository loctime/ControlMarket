export const LOW_STOCK_THRESHOLD = 5

export function isLowStock(stock) {
  return stock <= LOW_STOCK_THRESHOLD
}

export function getStockLevel(stock) {
  if (stock <= 2) return 'critical'
  if (stock <= LOW_STOCK_THRESHOLD) return 'low'
  return 'ok'
}

export function filterLowStockProducts(products) {
  return products.filter((p) => isLowStock(p.stock) && p.active !== false)
}
