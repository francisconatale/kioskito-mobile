import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = 'https://kioskito-api-1.onrender.com/api'

let onUnauthorizedListener = null;

export const setOnUnauthorizedListener = (listener) => {
    onUnauthorizedListener = listener;
};

// Generic API request handler
export const apiRequest = async (endpoint, options = {}) => {
    try {
        // Get auth token from AsyncStorage
        const token = await AsyncStorage.getItem('auth_token')

        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...options.headers,
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options,
        })

        // Handle 204 No Content
        if (response.status === 204) {
            return null
        }

        const responseText = await response.text()
        let responseData = null
        try {
            responseData = responseText ? JSON.parse(responseText) : null
        } catch (e) {
            console.warn(`Failed to parse JSON for ${endpoint}:`, e.message)
        }

        // Handle errors
        if (!response.ok) {
            const status = response.status
            const errorMsg = responseData?.message || `HTTP ${status}: ${response.statusText}`

            if (status === 403 || status === 401) {
                console.warn(`Auth Error (${status}): Session may be invalid. Triggering logout...`)
                if (onUnauthorizedListener) {
                    onUnauthorizedListener();
                }
            }
            throw new Error(errorMsg)
        }

        return responseData
    } catch (error) {
        console.error('API Error:', error.message)
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

const mapVentaFromBackend = (venta) => {
    if (!venta) return null

    const mapSingleVenta = (v) => ({
        ...v,
        tipo: v.tipo || 'VENTA',
        total: v.montoTotal,
        date: v.fecha,
        items: (v.detalles || []).map(d => ({
            productId: d.productoId,
            productUuid: d.productoUuid,
            productName: d.productoNombre,
            productoMarca: d.productoMarca,
            productoDescripcion: d.productoDescripcion,
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
            uuid: producto.uuid,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            stock: 0, // Force 0 on creation, use movement for initial stock
            codigoBarra: producto.codigoBarras,
            marca: producto.marca,
        }

        const createdProduct = await apiRequest('/productos', {
            method: 'POST',
            body: JSON.stringify(backendProducto),
        })

        // If there's initial stock, create a movement
        if (producto.stock > 0 && createdProduct) {
            try {
                await movimientosStockAPI.create({
                    productoId: createdProduct.id,
                    tipo: 'ENTRADA',
                    cantidad: producto.stock,
                    motivo: 'Stock Inicial',
                    fecha: new Date().toISOString()
                })
                // Update the returned object to reflect the stock for the UI
                createdProduct.stock = producto.stock
            } catch (e) {
                console.error("Failed to create initial stock movement online:", e)
            }
        }

        return createdProduct
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

    // DELETE /api/productos/uuid/{uuid}
    deleteByUuid: async (uuid) => {
        return await apiRequest(`/productos/uuid/${uuid}`, {
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
            uuid: venta.uuid,
            fecha: venta.fecha,
            montoTotal: venta.montoTotal,
            metodoPago: venta.metodoPago,
            clienteId: venta.clienteId,
            clienteUuid: venta.clienteUuid,
            detalles: venta.detalles,
            tipo: venta.tipo || 'VENTA',
            ventaOriginalId: venta.ventaOriginalId,
            ventaOriginalUuid: venta.ventaOriginalUuid
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

    // DELETE /api/clientes/uuid/{uuid}
    deleteByUuid: async (uuid) => {
        return await apiRequest(`/clientes/uuid/${uuid}`, {
            method: 'DELETE',
        })
    },

    // POST /api/clientes/{id}/pagar
    registrarPago: async (id, monto) => {
        return await apiRequest(`/clientes/${id}/pagar`, {
            method: 'POST',
            body: JSON.stringify({ monto }),
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

// Movimientos de Stock API
export const movimientosStockAPI = {
    // GET /api/movimientos-stock
    getAll: async () => {
        return await apiRequest('/movimientos-stock')
    },

    // POST /api/movimientos-stock
    create: async (movimiento) => {
        return await apiRequest('/movimientos-stock', {
            method: 'POST',
            body: JSON.stringify(movimiento),
        })
    },
}

// Health Check
export const healthCheck = async () => {
    return await apiRequest('/health')
}

// Auth API
export const authAPI = {
    getSubscriptionStatus: async (username) => {
        return await apiRequest(`/auth/subscription-status?username=${username}`)
    },
    activateTrial: async (username) => {
        // Although the body is empty, user is identified by token
        return await apiRequest(`/auth/activate-trial`, {
            method: 'POST',
            body: JSON.stringify({})
        })
    }
}
