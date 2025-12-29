const API_BASE_URL = 'http://192.168.100.232:8080/api'

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        })

        // Handle 204 No Content
        if (response.status === 204) {
            return null
        }

        // Handle errors
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('API Error:', error)
        throw error
    }
}

// Map backend producto format to frontend format
const mapProductoFromBackend = (producto) => {
    if (!producto) return null

    // Handle both single object and array
    if (Array.isArray(producto)) {
        return producto.map(p => ({
            ...p,
            codigoBarras: p.codigoBarra || p.codigoBarras,
        }))
    }

    return {
        ...producto,
        codigoBarras: producto.codigoBarra || producto.codigoBarras,
    }
}

// Map backend venta format to frontend format
const mapVentaFromBackend = (venta) => {
    if (!venta) return null

    const mapSingleVenta = (v) => ({
        ...v,
        total: v.montoTotal,
        date: v.fecha,
        items: (v.detalles || []).map(d => ({
            productId: d.productoId,
            productName: d.productoNombre,
            price: d.precioUnitario,
            quantity: d.cantidad,
            subtotal: d.subtotal
        }))
    })

    if (Array.isArray(venta)) {
        return venta.map(mapSingleVenta)
    }

    return mapSingleVenta(venta)
}

// Products API
export const productosAPI = {
    // GET /api/productos
    getAll: async () => {
        const productos = await apiRequest('/productos')
        return mapProductoFromBackend(productos)
    },

    // GET /api/productos/{id}
    getById: async (id) => {
        const producto = await apiRequest(`/productos/${id}`)
        return mapProductoFromBackend(producto)
    },

    // GET /api/productos/buscar?q={search}
    search: async (query) => {
        const productos = await apiRequest(`/productos/buscar?q=${encodeURIComponent(query)}`)
        return mapProductoFromBackend(productos)
    },

    // GET /api/productos/stock-bajo?threshold={number}
    getLowStock: async (threshold = 10) => {
        const productos = await apiRequest(`/productos/stock-bajo?threshold=${threshold}`)
        return mapProductoFromBackend(productos)
    },

    // POST /api/productos
    create: async (producto) => {
        // Map frontend field names to backend field names
        const backendProducto = {
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            stock: producto.stock,
            codigoBarra: producto.codigoBarras, // Spring Boot Jackson format
            marca: producto.marca,
        }

        return await apiRequest('/productos', {
            method: 'POST',
            body: JSON.stringify(backendProducto),
        })
    },

    // PUT /api/productos/{id}
    update: async (id, producto) => {
        // Map frontend field names to backend field names
        const backendProducto = {
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            stock: producto.stock,
            codigoBarra: producto.codigoBarras, // Spring Boot Jackson format
            marca: producto.marca,
        }

        return await apiRequest(`/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(backendProducto),
        })
    },

    // DELETE /api/productos/{id}
    delete: async (id) => {
        return await apiRequest(`/productos/${id}`, {
            method: 'DELETE',
        })
    },

    // GET /api/productos/codigo-barra/{codigoBarra}
    getByBarcode: async (codigoBarra) => {
        const producto = await apiRequest(`/productos/codigo-barra/${codigoBarra}`)
        return mapProductoFromBackend(producto)
    },

    // GET /api/productos/barcode-lookup/{code}
    lookupBarcode: async (code) => {
        return await apiRequest(`/productos/barcode-lookup/${code}`)
    },
}

// Ventas API
export const ventasAPI = {
    // GET /api/ventas
    getAll: async () => {
        const data = await apiRequest('/ventas')
        return mapVentaFromBackend(data)
    },

    // GET /api/ventas/{id}
    getById: async (id) => {
        const data = await apiRequest(`/ventas/${id}`)
        return mapVentaFromBackend(data)
    },

    // GET /api/ventas/fecha?inicio={date}&fin={date}
    getByDateRange: async (inicio, fin) => {
        return await apiRequest(`/ventas/fecha?inicio=${inicio}&fin=${fin}`)
    },

    // GET /api/ventas/cliente/{clienteId}
    getByCliente: async (clienteId) => {
        return await apiRequest(`/ventas/cliente/${clienteId}`)
    },

    // POST /api/ventas
    create: async (venta) => {
        const backendVenta = {
            fecha: venta.fecha,
            montoTotal: venta.montoTotal,
            metodoPago: venta.metodoPago,
            clienteId: venta.clienteId,
            detalles: venta.detalles // Expecting { productoId, cantidad, precioUnitario }
        }
        return await apiRequest('/ventas', {
            method: 'POST',
            body: JSON.stringify(backendVenta),
        })
    },

    // PUT /api/ventas/{id}
    update: async (id, venta) => {
        const backendVenta = {
            fecha: venta.fecha,
            montoTotal: venta.montoTotal,
            metodoPago: venta.metodoPago,
            clienteId: venta.clienteId,
            detalles: venta.detalles
        }
        return await apiRequest(`/ventas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(backendVenta),
        })
    },

    // DELETE /api/ventas/{id}
    delete: async (id) => {
        return await apiRequest(`/ventas/${id}`, {
            method: 'DELETE',
        })
    },
}

// Clientes API
export const clientesAPI = {
    // GET /api/clientes
    getAll: async () => {
        return await apiRequest('/clientes')
    },

    // GET /api/clientes/{id}
    getById: async (id) => {
        return await apiRequest(`/clientes/${id}`)
    },

    // GET /api/clientes/buscar?q={search}
    search: async (query) => {
        return await apiRequest(`/clientes/buscar?q=${encodeURIComponent(query)}`)
    },

    // POST /api/clientes
    create: async (cliente) => {
        return await apiRequest('/clientes', {
            method: 'POST',
            body: JSON.stringify(cliente),
        })
    },

    // PUT /api/clientes/{id}
    update: async (id, cliente) => {
        return await apiRequest(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(cliente),
        })
    },

    // DELETE /api/clientes/{id}
    delete: async (id) => {
        return await apiRequest(`/clientes/${id}`, {
            method: 'DELETE',
        })
    },
}

// Cierres de Caja API
export const cierresAPI = {
    // GET /api/cierres
    getAll: async () => {
        return await apiRequest('/cierres')
    },

    // GET /api/cierres/{id}
    getById: async (id) => {
        return await apiRequest(`/cierres/${id}`)
    },

    // GET /api/cierres/fecha?inicio={date}&fin={date}
    getByDateRange: async (inicio, fin) => {
        return await apiRequest(`/cierres/fecha?inicio=${inicio}&fin=${fin}`)
    },

    // POST /api/cierres
    create: async (cierre) => {
        return await apiRequest('/cierres', {
            method: 'POST',
            body: JSON.stringify(cierre),
        })
    },

    // PUT /api/cierres/{id}
    update: async (id, cierre) => {
        return await apiRequest(`/cierres/${id}`, {
            method: 'PUT',
            body: JSON.stringify(cierre),
        })
    },

    // DELETE /api/cierres/{id}
    delete: async (id) => {
        return await apiRequest(`/cierres/${id}`, {
            method: 'DELETE',
        })
    },
}

// Health Check
export const healthCheck = async () => {
    return await apiRequest('/health')
}
