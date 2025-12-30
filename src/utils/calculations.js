/**
 * Calculate total sales for today (Booked revenue, including FIADO)
 */
export const calculateTotalSalesToday = (sales) => {
    return sales
        .filter((s) => s.tipo === 'VENTA' && new Date(s.date).toDateString() === new Date().toDateString())
        .reduce((sum, s) => sum + s.total, 0)
}

/**
 * Calculate actual cash collected today (Cash sales + Debt payments)
 */
export const calculateRealCashToday = (sales) => {
    return sales
        .filter((s) =>
            (s.tipo === 'VENTA' && s.metodoPago?.toUpperCase() !== 'FIADO' || s.tipo === 'PAGO') &&
            new Date(s.date).toDateString() === new Date().toDateString()
        )
        .reduce((sum, s) => sum + s.total, 0)
}

/**
 * Calculate total sales for the month (Booked revenue)
 */
export const calculateTotalSalesMonth = (sales) => {
    const now = new Date();
    return sales
        .filter((s) => s.tipo === 'VENTA' &&
            new Date(s.date).getMonth() === now.getMonth() &&
            new Date(s.date).getFullYear() === now.getFullYear())
        .reduce((sum, s) => sum + s.total, 0)
}

/**
 * Calculate total outstanding debt to be collected
 */
export const calculateOutstandingDebt = (clients) => {
    return clients.reduce((sum, c) => sum + (c.deuda > 0 ? c.deuda : 0), 0)
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
    return sales
        .filter(s => s.tipo === 'VENTA')
        .reduce((acc, sale) => {
            if (!sale.items) return acc
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
 * Get all inventory movements (Sales and Restocks) flattened and sorted
 */
export const getInventoryMovements = (sales) => {
    const movements = []

    sales.forEach(sale => {
        if (sale.tipo === 'VENTA' || sale.tipo === 'RESTOCK') {
            sale.items?.forEach(item => {
                movements.push({
                    id: `${sale.id}-${item.productId}`,
                    saleId: sale.id,
                    productId: item.productId,
                    productName: item.productName,
                    productoMarca: item.productoMarca,
                    quantity: item.quantity,
                    type: sale.tipo, // 'VENTA' or 'RESTOCK'
                    date: sale.date
                })
            })
        }
    })

    return movements.sort((a, b) => new Date(b.date) - new Date(a.date))
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
