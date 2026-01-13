import React, { useState, useEffect, useRef } from "react"
import { productosAPI, ventasAPI, clientesAPI, movimientosStockAPI, setMode, getMode, initService } from "../services/factory"
import { syncService } from "../services/sync"
import { Alert } from "react-native"
import * as Crypto from 'expo-crypto'

export const useBusinessData = (user) => {
    const [products, setProducts] = useState([])
    const [sales, setSales] = useState([])

    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [saleCart, setSaleCart] = useState([])
    const [restockCart, setRestockCart] = useState([])
    const [movements, setMovements] = useState([])

    const [appMode, setAppMode] = useState('OFFLINE')
    const syncingRef = useRef(false)

    useEffect(() => {
        const init = async () => {
            try {
                await initService()
                setAppMode(getMode())
                await fetchData()
            } catch (e) {
                console.error("Initialization error:", e)
            }
        }
        init()

        const NetInfo = require('@react-native-community/netinfo');
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected === false) {
                const currentMode = getMode();
                if (currentMode === 'ONLINE') {
                    console.log("Internet connection lost. Switching to OFFLINE mode automatically.");
                    setMode('OFFLINE');
                    setAppMode('OFFLINE');
                }
            }
        });

        return () => unsubscribe();
    }, [])

    const toggleAppMode = async () => {
        if (syncingRef.current) {
            console.log("Sync already in progress, skipping toggle...")
            return appMode
        }

        const newMode = appMode === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
        console.log(`Switching mode to ${newMode}...`)

        syncingRef.current = true
        setLoading(true)
        try {
            await syncService.syncAll()
        } catch (e) {
            console.warn("Auto-sync failed during mode toggle:", e)
        }

        await setMode(newMode)
        setAppMode(newMode)
        await fetchData()
        setLoading(false)
        syncingRef.current = false
        return newMode
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            await fetchProducts()
            await fetchSales()
            await fetchClients()
            await fetchMovements()
        } catch (e) {
            console.error("Fetch data error:", e)
        } finally {
            setLoading(false)
        }
    }

    const fetchSales = async () => {
        try {
            const data = await ventasAPI.getAll()
            setSales(data)
        } catch (err) {
            console.error("Error al cargar ventas:", err.message)
        }
    }

    const fetchProducts = async () => {
        try {
            setError(null)
            const data = await productosAPI.getAll()
            setProducts(data)
        } catch (err) {
            setError(err.message)
            console.error("Error al cargar productos:", err.message)
        }
    }

    const fetchClients = async () => {
        try {
            const data = await clientesAPI.getAll()
            setClients(data)
        } catch (err) {
            console.error("Error al cargar clientes:", err.message)
        }
    }

    const fetchMovements = async () => {
        try {
            const data = await movimientosStockAPI.getAll()
            setMovements(data)
        } catch (err) {
            console.error("Error al cargar movimientos:", err.message)
        }
    }

    const searchClients = async (q) => {
        try {
            return await clientesAPI.search(q)
        } catch (err) {
            console.error("Error al buscar clientes:", err.message)
            return []
        }
    }

    const handleAddProduct = async (newProduct) => {
        if (!newProduct.nombre || !newProduct.precio) {
            console.error("Error: Por favor completa todos los campos obligatorios")
            return { success: false, message: "Por favor completa todos los campos obligatorios" }
        }

        try {
            const producto = {
                nombre: newProduct.nombre,
                descripcion: newProduct.descripcion || "",
                precio: parseFloat(newProduct.precio),
                stock: parseInt(newProduct.stock) || 0,
                codigoBarras: newProduct.codigoBarras || null,
                marca: newProduct.marca || null,
            }

            const createdProduct = await productosAPI.create(producto)
            await fetchProducts()
            return { success: true, message: "Producto agregado correctamente", product: createdProduct }
        } catch (err) {
            return { success: false, message: `No se pudo agregar el producto: ${err.message}` }
        }
    }

    const handleUpdateProduct = async (id, updatedProduct) => {
        if (!updatedProduct.nombre || !updatedProduct.precio) {
            return { success: false, message: "Por favor completa todos los campos obligatorios" }
        }

        try {
            const producto = {
                nombre: updatedProduct.nombre,
                descripcion: updatedProduct.descripcion || "",
                precio: parseFloat(updatedProduct.precio),
                stock: parseInt(updatedProduct.stock),
                codigoBarras: updatedProduct.codigoBarras || null,
                marca: updatedProduct.marca || null,
            }

            await productosAPI.update(id, producto)
            await fetchProducts()
            return { success: true, message: "Producto actualizado correctamente" }
        } catch (err) {
            return { success: false, message: `No se pudo actualizar el producto: ${err.message}` }
        }
    }

    const handleDeleteProduct = async (id) => {
        try {
            await productosAPI.delete(id)
            await fetchProducts()
            return { success: true, message: "Producto eliminado correctamente" }
        } catch (err) {
            return { success: false, message: `No se pudo eliminar el producto: ${err.message}` }
        }
    }

    const handleDeleteSale = async (id) => {
        try {
            await ventasAPI.delete(id)
            await Promise.all([fetchSales(), fetchProducts(), fetchClients()])
            return { success: true, message: "Venta eliminada correctamente" }
        } catch (err) {
            return { success: false, message: `No se pudo eliminar la venta: ${err.message}` }
        }
    }

    const handleAddToCart = (productId, quantity) => {
        if (!productId || !quantity) {
            Alert.alert("Error", "Por favor selecciona un producto y cantidad")
            return false
        }

        const product = products.find((p) => p.id === productId)
        if (!product) return false

        const qty = parseInt(quantity)
        if (qty > product.stock) {
            Alert.alert("Error", `Stock insuficiente. Solo quedan ${product.stock}`)
            return false
        }

        // Update Products Stock (Memory)
        setProducts(products.map(p =>
            p.id === productId ? { ...p, stock: p.stock - qty } : p
        ))

        const existingItem = saleCart.find(item => item.productId === product.id)
        if (existingItem) {
            // Logic handled by memory stock check now, but just to be safe in async state, trust the memory stock check above
            setSaleCart(saleCart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: existingItem.quantity + qty, subtotal: product.precio * (existingItem.quantity + qty) }
                    : item
            ))
        } else {
            setSaleCart([...saleCart, {
                productId: product.id,
                productName: product.nombre,
                price: product.precio,
                quantity: qty,
                subtotal: product.precio * qty
            }])
        }

        return true
    }

    const handleRemoveFromCart = (productId) => {
        const itemToRemove = saleCart.find(item => item.productId === productId)
        if (itemToRemove) {
            setProducts(products.map(p =>
                p.id === productId ? { ...p, stock: p.stock + itemToRemove.quantity } : p
            ))
            setSaleCart(saleCart.filter(item => item.productId !== productId))
        }
    }

    const handleUpdateCartQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(productId)
            return
        }

        const existingItem = saleCart.find(item => item.productId === productId)
        if (!existingItem) return

        const product = products.find(p => p.id === productId)
        // difference > 0 means adding more, so check stock. product.stock here is "remaining stock"
        const qtyDifference = newQuantity - existingItem.quantity

        if (qtyDifference > 0 && qtyDifference > product.stock) {
            Alert.alert("Error", `Stock insuficiente. Solo puedes agregar ${product.stock} más.`)
            return
        }

        // Update Products Stock
        setProducts(products.map(p =>
            p.id === productId ? { ...p, stock: p.stock - qtyDifference } : p
        ))

        setSaleCart(saleCart.map(item =>
            item.productId === productId
                ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
                : item
        ))
    }

    const clearCart = () => {
        // Restore stock for all items
        const pendingStock = {} // map id -> qty
        saleCart.forEach(item => {
            pendingStock[item.productId] = item.quantity
        })

        setProducts(products.map(p =>
            pendingStock[p.id] ? { ...p, stock: p.stock + pendingStock[p.id] } : p
        ))

        setSaleCart([])
    }

    const addProductToCartByBarcode = (barcode) => {
        const product = products.find((p) => p.codigoBarras === barcode)
        if (product) {
            if (product.stock < 1) {
                Alert.alert("Error", "Stock insuficiente")
                return false
            }

            // Update Products Stock
            setProducts(products.map(p =>
                p.id === product.id ? { ...p, stock: p.stock - 1 } : p
            ))

            const existingItem = saleCart.find(item => item.productId === product.id)
            if (existingItem) {
                setSaleCart(saleCart.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1, subtotal: product.precio * (item.quantity + 1) }
                        : item
                ))
            } else {
                setSaleCart([...saleCart, {
                    productId: product.id,
                    productName: product.nombre,
                    price: product.precio,
                    quantity: 1,
                    subtotal: product.precio
                }])
            }
            Alert.alert("Producto agregado", `${product.nombre} - $${product.precio}`)
            return true
        } else {
            Alert.alert("Error", "Producto no encontrado con ese código de barras")
            return false
        }
    }

    const handleCompleteSale = async (metodoPago = "efectivo", clienteId = null, recargo = 0) => {
        if (saleCart.length === 0) {
            Alert.alert("Error", "Agrega productos a la venta")
            return { success: false, message: "El carrito está vacío" }
        }

        try {
            setLoading(true)
            const subtotal = saleCart.reduce((sum, item) => sum + item.subtotal, 0)
            const total = subtotal + recargo

            const uuid = Crypto.randomUUID()
            const ventaRequest = {
                uuid: uuid,
                fecha: new Date().toISOString(),
                montoTotal: subtotal,
                metodoPago: metodoPago,
                clienteId: clienteId,
                usuarioId: user?.id, // Use the user passed to the hook
                tipo: 'VENTA',
                detalles: saleCart.map(item => ({
                    productoId: item.productId,
                    cantidad: item.quantity,
                    precioUnitario: item.price
                }))
            }

            await ventasAPI.create(ventaRequest)

            await Promise.all([fetchSales(), fetchProducts(), fetchClients(), fetchMovements()])
            setSaleCart([])
            return { success: true, message: "Venta registrada correctamente" }
        } catch (err) {
            console.error("Error al completar venta:", err)
            return { success: false, message: `Error al registrar venta: ${err.message}` }
        } finally {
            setLoading(false)
        }
    }

    const handleAddToRestockCart = (productId, quantity) => {
        if (!productId || !quantity) return false
        const product = products.find(p => p.id === productId)
        if (!product) return false

        const qty = parseInt(quantity)
        const existingItem = restockCart.find(item => item.productId === productId)

        if (existingItem) {
            setRestockCart(restockCart.map(item =>
                item.productId === productId
                    ? { ...item, quantity: item.quantity + qty }
                    : item
            ))
        } else {
            setRestockCart([...restockCart, {
                productId: product.id,
                productName: product.nombre,
                quantity: qty,
                price: 0 // Restock usually doesn't focus on price here, or we could add it
            }])
        }
        return true
    }

    const handleRemoveFromRestockCart = (productId) => {
        setRestockCart(restockCart.filter(item => item.productId !== productId))
    }

    const handleCompleteRestock = async (productId = null, quantity = null) => {
        // Support for single item restock (manual design) or cart restock
        let itemsToProcess = []
        if (productId && quantity) {
            itemsToProcess = [{ productId, quantity }]
        } else {
            itemsToProcess = restockCart
        }

        if (itemsToProcess.length === 0) return { success: false, message: "No hay items para ingresar" }

        try {
            setLoading(true)

            const promises = itemsToProcess.map(item => {
                const movRequest = {
                    productoId: item.productId,
                    tipo: 'ENTRADA',
                    cantidad: item.quantity,
                    motivo: 'RESTOCK',
                    fecha: new Date().toISOString()
                }
                return movimientosStockAPI.create(movRequest)
            })

            await Promise.all(promises)
            await Promise.all([fetchMovements(), fetchProducts()])

            setRestockCart([])
            return { success: true, message: "Stock actualizado correctamente" }
        } catch (err) {
            console.error("Error al completar restock:", err)
            return { success: false, message: err.message }
        } finally {
            setLoading(false)
        }
    }

    const handleAddClient = async (newClient) => {
        if (!newClient.nombre) {
            return { success: false, message: "El nombre es obligatorio" }
        }
        try {
            setLoading(true)
            await clientesAPI.create(newClient)
            await fetchClients()
            return { success: true, message: "Cliente registrado correctamente" }
        } catch (err) {
            console.error("Error al registrar cliente:", err)
            return { success: false, message: `Error: ${err.message}` }
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateClient = async (id, updatedClient) => {
        if (!updatedClient.nombre) {
            return { success: false, message: "El nombre es obligatorio" }
        }
        try {
            setLoading(true)
            await clientesAPI.update(id, updatedClient)
            await fetchClients()
            return { success: true, message: "Cliente actualizado correctamente" }
        } catch (err) {
            console.error("Error al actualizar cliente:", err)
            return { success: false, message: `Error: ${err.message}` }
        } finally {
            setLoading(false)
        }
    }

    const handleRegistrarPago = async (clienteId, monto) => {
        try {
            setLoading(true)
            await clientesAPI.registrarPago(clienteId, monto)
            await Promise.all([fetchClients(), fetchSales(), fetchMovements()])
            return { success: true, message: "Pago registrado correctamente" }
        } catch (err) {
            console.error("Error al registrar pago:", err)
            return { success: false, message: `Error: ${err.message}` }
        } finally {
            setLoading(false)
        }
    }

    const handleReturnSale = async (originalSale) => {
        try {
            setLoading(true)
            const returnRequest = {
                fecha: new Date().toISOString(),
                montoTotal: originalSale.total,
                metodoPago: originalSale.metodoPago || 'EFECTIVO',
                clienteId: originalSale.clienteId,
                usuarioId: user?.id,
                tipo: 'DEVOLUCION',
                ventaOriginalId: originalSale.id, // Referencia para actualizar la venta original
                detalles: originalSale.items.map(item => ({
                    productoId: item.productId,
                    productoUuid: item.productoUuid,
                    cantidad: item.quantity,
                    precioUnitario: item.price
                }))
            }
            await ventasAPI.create(returnRequest)
            await Promise.all([fetchSales(), fetchProducts(), fetchClients(), fetchMovements()])
            return { success: true, message: "Devolución registrada correctamente" }
        } catch (err) {
            console.error("Error al registrar devolución:", err)
            return { success: false, message: `Error: ${err.message}` }
        } finally {
            setLoading(false)
        }
    }

    return {
        products,
        sales,
        saleCart,
        restockCart,
        loading,
        error,
        fetchData,
        fetchProducts,
        fetchSales,
        handleReturnSale,
        handleAddProduct,
        handleUpdateProduct,
        handleDeleteProduct,
        handleDeleteSale,
        handleAddToCart,
        handleRemoveFromCart,
        handleUpdateCartQuantity,
        clearCart,
        addProductToCartByBarcode,
        handleCompleteSale,
        handleAddToRestockCart,
        handleRemoveFromRestockCart,
        handleCompleteRestock,
        clearRestockCart: () => setRestockCart([]),
        clients,
        fetchClients,
        searchClients,
        handleAddClient,
        handleUpdateClient,
        handleRegistrarPago,
        movements,
        fetchMovements,
        appMode,
        toggleAppMode
    }
}
