/**
 * Calculate total sales for today
 */
export const calculateTotalSalesToday = (sales) => {
    return sales
        .filter((s) => new Date(s.date).toDateString() === new Date().toDateString())
        .reduce((sum, s) => sum + s.total, 0)
}

/**
 * Calculate total sales for the month
 */
export const calculateTotalSalesMonth = (sales) => {
    return sales.reduce((sum, s) => sum + s.total, 0)
}

/**
 * Calculate total inventory value
 */
export const calculateTotalInventoryValue = (products) => {
    return products.reduce((sum, p) => sum + p.precio * p.stock, 0)
}

/**
 * Aggregate product sales data from all sales
 */
export const aggregateProductSales = (sales) => {
    return sales.reduce((acc, sale) => {
        sale.items.forEach(item => {
            const existing = acc.find((p) => p.productId === item.productId)
            if (existing) {
                existing.quantity += item.quantity
                existing.total += item.subtotal
            } else {
                acc.push({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    total: item.subtotal,
                })
            }
        })
        return acc
    }, [])
}

/**
 * Get top selling products
 */
export const getTopProducts = (sales, limit = 5) => {
    const productsSold = aggregateProductSales(sales)
    return productsSold.sort((a, b) => b.total - a.total).slice(0, limit)
}

/**
 * Count products with low stock
 */
export const countLowStockProducts = (products, threshold = 10) => {
    return products.filter((p) => p.stock < threshold).length
}
