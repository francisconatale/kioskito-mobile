import { useState, useEffect } from "react"
import { productosAPI } from "../services/api"

export const useBusinessData = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [sales, setSales] = useState([
        {
            id: "1",
            items: [
                { productId: "1", productName: "Producto A", price: 100, quantity: 2, subtotal: 200 }
            ],
            total: 200,
            date: new Date()
        },
    ])

    const [saleCart, setSaleCart] = useState([])

    useEffect(() => {
        fetchProducts()
    }, [])

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
            }

            await productosAPI.create(producto)
            await fetchProducts()
            return { success: true, message: "Producto agregado correctamente" }
        } catch (err) {
            return { success: false, message: `No se pudo agregar el producto: ${err.message}` }
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
        const product = products.find((p) => p.barcode === barcode)
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

    const handleCompleteSale = () => {
        if (saleCart.length === 0) {
            Alert.alert("Error", "Agrega productos a la venta")
            return false
        }

        for (const item of saleCart) {
            const product = products.find(p => p.id === item.productId)
            if (item.quantity > product.stock) {
                Alert.alert("Error", `Stock insuficiente para ${item.productName}`)
                return false
            }
        }

        const sale = {
            id: Date.now().toString(),
            items: saleCart,
            total: saleCart.reduce((sum, item) => sum + item.subtotal, 0),
            date: new Date(),
        }

        setSales([...sales, sale])

        // Update stock for all products
        setProducts(products.map((p) => {
            const cartItem = saleCart.find(item => item.productId === p.id)
            return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p
        }))

        setSaleCart([])
        Alert.alert("Éxito", "Venta registrada correctamente")
        return true
    }

    return {
        products,
        sales,
        saleCart,
        loading,
        error,
        fetchProducts,
        handleAddProduct,
        handleDeleteProduct,
        handleAddToCart,
        handleRemoveFromCart,
        handleUpdateCartQuantity,
        clearCart,
        addProductToCartByBarcode,
        handleCompleteSale,
    }
}
