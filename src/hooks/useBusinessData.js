import { useState, useEffect } from "react"
import { productosAPI, ventasAPI } from "../services/api"
import { Alert } from "react-native"

export const useBusinessData = () => {
    const [products, setProducts] = useState([])
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [saleCart, setSaleCart] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        await Promise.all([fetchProducts(), fetchSales()])
        setLoading(false)
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
            setLoading(true)
            setError(null)
            const data = await productosAPI.getAll()
            setProducts(data)
        } catch (err) {
            setError(err.message)
            console.error("Error al cargar productos:", err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddProduct = async (newProduct) => {
        if (!newProduct.nombre || !newProduct.precio || newProduct.stock === undefined) {
            console.error("Error: Por favor completa todos los campos obligatorios")
            return { success: false, message: "Por favor completa todos los campos obligatorios" }
        }

        try {
            const producto = {
                nombre: newProduct.nombre,
                descripcion: newProduct.descripcion || "",
                precio: parseFloat(newProduct.precio),
                stock: parseInt(newProduct.stock),
                codigoBarras: newProduct.codigoBarras || null,
                marca: newProduct.marca || null,
            }

            await productosAPI.create(producto)
            await fetchProducts()
            return { success: true, message: "Producto agregado correctamente" }
        } catch (err) {
            return { success: false, message: `No se pudo agregar el producto: ${err.message}` }
        }
    }

    const handleUpdateProduct = async (id, updatedProduct) => {
        if (!updatedProduct.nombre || !updatedProduct.precio || updatedProduct.stock === undefined) {
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
            await Promise.all([fetchSales(), fetchProducts()])
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
            Alert.alert("Error", "Stock insuficiente")
            return false
        }

        const existingItem = saleCart.find(item => item.productId === product.id)
        if (existingItem) {
            const newQuantity = existingItem.quantity + qty
            if (newQuantity > product.stock) {
                Alert.alert("Error", "Stock insuficiente")
                return false
            }
            setSaleCart(saleCart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: newQuantity, subtotal: product.precio * newQuantity }
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
        setSaleCart(saleCart.filter(item => item.productId !== productId))
    }

    const handleUpdateCartQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(productId)
            return
        }

        const product = products.find(p => p.id === productId)
        if (newQuantity > product.stock) {
            Alert.alert("Error", "Stock insuficiente")
            return
        }

        setSaleCart(saleCart.map(item =>
            item.productId === productId
                ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
                : item
        ))
    }

    const clearCart = () => {
        setSaleCart([])
    }

    const addProductToCartByBarcode = (barcode) => {
        const product = products.find((p) => p.codigoBarras === barcode)
        if (product) {
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

    const handleCompleteSale = async (metodoPago = "efectivo", clienteId = null) => {
        if (saleCart.length === 0) {
            Alert.alert("Error", "Agrega productos a la venta")
            return { success: false, message: "El carrito está vacío" }
        }

        try {
            setLoading(true)
            const total = saleCart.reduce((sum, item) => sum + item.subtotal, 0)

            const ventaRequest = {
                fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                montoTotal: total,
                metodoPago: metodoPago,
                clienteId: clienteId,
                detalles: saleCart.map(item => ({
                    productoId: item.productId,
                    cantidad: item.quantity,
                    precioUnitario: item.price
                }))
            }

            await ventasAPI.create(ventaRequest)

            await Promise.all([fetchSales(), fetchProducts()])
            setSaleCart([])
            return { success: true, message: "Venta registrada correctamente" }
        } catch (err) {
            console.error("Error al completar venta:", err)
            return { success: false, message: `Error al registrar venta: ${err.message}` }
        } finally {
            setLoading(false)
        }
    }

    return {
        products,
        sales,
        saleCart,
        loading,
        error,
        fetchProducts,
        fetchSales,
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
    }
}
