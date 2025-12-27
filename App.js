import { useState } from "react"
import { View, Text, SafeAreaView } from "react-native"
import { Dashboard } from "./src/components/Dashboard"
import { Products } from "./src/components/Products"
import { Sales } from "./src/components/Sales"
import { Analytics } from "./src/components/Analytics"
import { ProductModal } from "./src/components/ProductModal"
import { SaleModal } from "./src/components/SaleModal"
import { BarcodeScanner } from "./src/components/BarcodeScanner"
import { BottomNavigation } from "./src/components/BottomNavigation"
import { ConfirmDialog } from "./src/components/ConfirmDialog"
import { useBusinessData } from "./src/hooks/useBusinessData"

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showProductModal, setShowProductModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [scanMode, setScanMode] = useState("product")
  const [barcodeCallback, setBarcodeCallback] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, productId: null })
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" })

  const {
    products,
    sales,
    saleCart,
    loading,
    handleAddProduct,
    handleDeleteProduct,
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateCartQuantity,
    clearCart,
    addProductToCartByBarcode,
    handleCompleteSale,
  } = useBusinessData()

  const handleShowBarcodeScanner = (mode, callback = null) => {
    setScanMode(mode)
    setBarcodeCallback(() => callback)
    setShowBarcodeScanner(true)
  }

  const handleBarcodeScan = (scannedCode) => {
    if (scanMode === "product" && barcodeCallback) {
      barcodeCallback(scannedCode)
    } else if (scanMode === "sale") {
      addProductToCartByBarcode(scannedCode)
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000)
  }

  const handleDeleteProductRequest = (productId) => {
    setConfirmDialog({ visible: true, productId })
  }

  const handleConfirmDelete = async () => {
    const result = await handleDeleteProduct(confirmDialog.productId)
    setConfirmDialog({ visible: false, productId: null })
    showToast(result.message, result.success ? "success" : "error")
  }

  const handleCancelDelete = () => {
    setConfirmDialog({ visible: false, productId: null })
  }

  const handleAddProductWrapper = async (product) => {
    const result = await handleAddProduct(product)
    if (result.success) {
      showToast(result.message, "success")
    }
    return result
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ backgroundColor: 'white', padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Mi Negocio</Text>
            <Text style={{ color: '#6b7280' }}>Sistema de gestión</Text>
          </View>
          <View style={{ width: 48, height: 48, backgroundColor: '#3b82f6', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>MN</Text>
          </View>
        </View>
      </View>

      {activeTab === "dashboard" && (
        <Dashboard
          products={products}
          sales={sales}
          onShowProductModal={() => setShowProductModal(true)}
          onShowSaleModal={() => setShowSaleModal(true)}
        />
      )}
      {activeTab === "products" && (
        <Products
          products={products}
          loading={loading}
          onShowProductModal={() => setShowProductModal(true)}
          onDeleteProduct={handleDeleteProductRequest}
        />
      )}
      {activeTab === "sales" && (
        <Sales
          sales={sales}
          onShowSaleModal={() => setShowSaleModal(true)}
          onShowBarcodeScanner={() => handleShowBarcodeScanner("sale")}
        />
      )}
      {activeTab === "analytics" && (
        <Analytics
          products={products}
          sales={sales}
        />
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <ProductModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        onAddProduct={handleAddProductWrapper}
        onShowBarcodeScanner={handleShowBarcodeScanner}
      />

      <SaleModal
        visible={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        products={products}
        saleCart={saleCart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onCompleteSale={handleCompleteSale}
        onClearCart={clearCart}
      />

      <BarcodeScanner
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        mode={scanMode}
        onScan={handleBarcodeScan}
      />

      <ConfirmDialog
        visible={confirmDialog.visible}
        title="Confirmar eliminación"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {toast.visible && (
        <View style={{
          position: 'absolute',
          top: 80,
          left: 16,
          right: 16,
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          padding: 16,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 1000,
          zIndex: 9999
        }}>
          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
            {toast.message}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

export default App
