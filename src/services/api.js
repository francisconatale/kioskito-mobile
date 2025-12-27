const API_BASE_URL = 'http://localhost:8080/api'

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

// Products API
export const productosAPI = {
    // GET /api/productos
    getAll: async () => {
        return await apiRequest('/productos')
    },

    // GET /api/productos/{id}
    getById: async (id) => {
        return await apiRequest(`/productos/${id}`)
    },

    // GET /api/productos/buscar?q={search}
    search: async (query) => {
        return await apiRequest(`/productos/buscar?q=${encodeURIComponent(query)}`)
    },

    // GET /api/productos/stock-bajo?threshold={number}
    getLowStock: async (threshold = 10) => {
        return await apiRequest(`/productos/stock-bajo?threshold=${threshold}`)
    },

    // POST /api/productos
    create: async (producto) => {
        return await apiRequest('/productos', {
            method: 'POST',
            body: JSON.stringify(producto),
        })
    },

    // PUT /api/productos/{id}
    update: async (id, producto) => {
        return await apiRequest(`/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(producto),
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
        return await apiRequest(`/productos/codigo-barra/${codigoBarra}`)
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
        return await apiRequest('/ventas')
    },

    // GET /api/ventas/{id}
    getById: async (id) => {
        return await apiRequest(`/ventas/${id}`)
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
        return await apiRequest('/ventas', {
            method: 'POST',
            body: JSON.stringify(venta),
        })
    },

    // PUT /api/ventas/{id}
    update: async (id, venta) => {
        return await apiRequest(`/ventas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(venta),
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
