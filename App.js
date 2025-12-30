import { useState } from "react"
import { View, Text, SafeAreaView } from "react-native"
import { Dashboard } from "./src/components/Dashboard"
import { Products } from "./src/components/Products" // Keep for safety if needed or remove but I'll replace usage
import { Inventory } from "./src/components/Inventory"
import { Sales } from "./src/components/Sales"
import { Debtors } from "./src/components/Debtors"
import { Analytics } from "./src/components/Analytics"
import { ProductModal } from "./src/components/ProductModal"
import { SaleModal } from "./src/components/SaleModal"
import { ClientModal } from "./src/components/ClientModal"
import { RestockModal } from "./src/components/RestockModal"
import { SaleDetailsModal } from "./src/components/SaleDetailsModal"
import { BarcodeScanner } from "./src/components/BarcodeScanner"
import { BottomNavigation } from "./src/components/BottomNavigation"
import { ConfirmDialog } from "./src/components/ConfirmDialog"
import { useBusinessData } from "./src/hooks/useBusinessData"

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showProductModal, setShowProductModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [scanMode, setScanMode] = useState("product")
  const [barcodeCallback, setBarcodeCallback] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, productId: null })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedSale, setSelectedSale] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" })

  const {
    products,
    sales,
    saleCart,
    restockCart,
    loading,
    fetchData,
    fetchProducts,
    fetchSales,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateCartQuantity,
    clearCart,
    addProductToCartByBarcode,
    handleCompleteSale,
    handleAddToRestockCart,
    handleRemoveFromRestockCart,
    handleCompleteRestock,
    clearRestockCart,
    clients,
    fetchClients,
    searchClients,
    handleAddClient,
    handleUpdateClient,
    handleRegistrarPago,
    movements
  } = useBusinessData()

  const handleShowProductModal = (product = null) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleShowClientModal = (client = null) => {
    setSelectedClient(client)
    setShowClientModal(true)
  }

  const handleShowSaleDetails = (sale) => {
    setSelectedSale(sale)
    setShowSaleDetailsModal(true)
  }

  const handleShowBarcodeScanner = (mode, callback = null) => {
    setScanMode(mode)
    setBarcodeCallback(() => callback)
    setShowBarcodeScanner(true)
  }

  const handleBarcodeScan = (scannedCode) => {
    if (scanMode === "product") {
      if (barcodeCallback) {
        barcodeCallback(scannedCode)
      } else {
        // Search if product exists to edit, otherwise open new
        const product = products.find(p => p.codigoBarras === scannedCode)
        handleShowProductModal(product || { codigoBarras: scannedCode })
      }
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

  const [deleteProcessing, setDeleteProcessing] = useState(false)

  const handleConfirmDelete = async () => {
    setDeleteProcessing(true)
    try {
      const result = await handleDeleteProduct(confirmDialog.productId)
      setConfirmDialog({ visible: false, productId: null })
      showToast(result.message, result.success ? "success" : "error")
    } finally {
      setDeleteProcessing(false)
    }
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

  const handleUpdateProductWrapper = async (id, product) => {
    const result = await handleUpdateProduct(id, product)
    if (result.success) {
      showToast(result.message, "success")
    }
    return result
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'System' }}>
          Kios<Text style={{ color: '#2563EB' }}>kito</Text>
        </Text>
      </View>
      {activeTab === "dashboard" && (
        <Dashboard
          products={products}
          sales={sales}
          onShowProductModal={() => setShowProductModal(true)}
          onShowSaleModal={() => setShowSaleModal(true)}
          onShowSaleDetails={handleShowSaleDetails}
          onRefresh={fetchData}
        />
      )}
      {activeTab === "inventory" && (
        <Inventory
          products={products}
          sales={sales}
          movements={movements}
          loading={loading}
          onShowProductModal={() => handleShowProductModal()}
          onEditProduct={handleShowProductModal}
          onDeleteProduct={handleDeleteProductRequest}
          onShowBarcodeScanner={() => handleShowBarcodeScanner("product")}
          onShowRestockModal={() => setShowRestockModal(true)}
          onRefresh={fetchProducts}
        />
      )}
      {activeTab === "sales" && (
        <Sales
          sales={sales}
          onShowSaleModal={() => setShowSaleModal(true)}
          onShowBarcodeScanner={(mode) => handleShowBarcodeScanner(mode)}
          onShowSaleDetails={handleShowSaleDetails}
          onRefresh={fetchSales}
        />
      )}
      {activeTab === "debtors" && (
        <Debtors
          clients={clients}
          sales={sales}
          onRegistrarPago={handleRegistrarPago}
          onShowSaleDetails={handleShowSaleDetails}
          onShowClientModal={handleShowClientModal}
          onRefresh={fetchClients}
          onShowToast={showToast}
          loading={loading}
        />
      )}
      {activeTab === "analytics" && (
        <Analytics
          products={products}
          sales={sales}
          clients={clients}
        />
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <ProductModal
        visible={showProductModal}
        onClose={() => {
          setShowProductModal(false)
          setSelectedProduct(null)
        }}
        onAddProduct={handleAddProductWrapper}
        onUpdateProduct={handleUpdateProductWrapper}
        onShowBarcodeScanner={handleShowBarcodeScanner}
        initialProduct={selectedProduct}
      />

      <ClientModal
        visible={showClientModal}
        onClose={() => setShowClientModal(false)}
        onAddClient={handleAddClient}
        onUpdateClient={handleUpdateClient}
        initialClient={selectedClient}
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
        onShowBarcodeScanner={handleShowBarcodeScanner}
        clients={clients}
      />

      <RestockModal
        visible={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        products={products}
        restockCart={restockCart}
        onAddToCart={handleAddToRestockCart}
        onRemoveFromCart={handleRemoveFromRestockCart}
        onUpdateCartQuantity={() => { }} // Not implemented for restock yet
        onCompleteRestock={handleCompleteRestock}
        onClearCart={clearRestockCart}
        onShowBarcodeScanner={handleShowBarcodeScanner}
      />

      <SaleDetailsModal
        visible={showSaleDetailsModal}
        onClose={() => {
          setShowSaleDetailsModal(false)
          setSelectedSale(null)
        }}
        sale={selectedSale}
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
        loading={deleteProcessing}
      />

      {toast.visible && (
        <View style={{
          position: 'absolute',
          top: 60,
          left: 16,
          right: 16,
          backgroundColor: toast.type === 'success' ? '#16A34A' : '#DC2626',
          padding: 14,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
          zIndex: 9999
        }}>
          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 14, fontFamily: 'System' }}>
            {toast.message}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

export default App
