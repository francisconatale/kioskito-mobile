import { useState, useEffect } from "react"
import * as SplashScreen from 'expo-splash-screen'
import { View, Text, SafeAreaView, Platform, StatusBar, Image, Animated } from "react-native"
import { Dashboard } from "./src/components/Dashboard"
import { Products } from "./src/components/Products"
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

import { ErrorBoundary } from "./src/components/ErrorBoundary"
import { Menu } from "./src/components/Menu"
import { AuthProvider, useAuth } from "./src/contexts/AuthContext"
import LoginScreen from "./src/components/LoginScreen"
import { Account } from "./src/components/Account"

const MainAppContent = () => {
  const { user, loading: authLoading, logout } = useAuth()
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
    movements,
    appMode,
    toggleAppMode
  } = useBusinessData(user)

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync()
      } catch (e) {
        console.warn(e)
      } finally {
        await SplashScreen.hideAsync()
      }
    }
    prepare()
  }, [])

  // Logic handlers...
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
    if (barcodeCallback) {
      barcodeCallback(scannedCode)
      return
    }

    if (scanMode === "product") {
      const product = products.find(p => p.codigoBarras === scannedCode)
      handleShowProductModal(product || { codigoBarras: scannedCode })
    } else if (scanMode === "sale") {
      addProductToCartByBarcode(scannedCode)
    } else if (scanMode === "restock") {
      const product = products.find(p => p.codigoBarras === scannedCode)
      if (product) {
        handleAddToRestockCart(product.id, "1")
        showToast(`Agregado: ${product.nombre}`, "success")
      } else {
        showToast("Producto no encontrado", "error")
      }
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

  const handleAddProductWrapper = async (product, showSuccessToast = true) => {
    const result = await handleAddProduct(product)
    if (result.success && showSuccessToast) {
      showToast(result.message, "success")
    }
    return result
  }

  const handleUpdateProductWrapper = async (id, product) => {
    const result = await handleUpdateProduct(id, product)
    return result
  }

  // CONDITIONAL RENDER AFTER ALL HOOKS
  if (authLoading) return null; // Or a splash/loader
  if (!user) return <LoginScreen />

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: '#F9FAFB',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={true} />

      {/* Main App Content */}
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 4, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('./public/kioskito.png')}
            style={{ height: 60, width: 240 }}
            resizeMode="contain"
          />
        </View>

        {activeTab === "dashboard" && (
          <Dashboard
            products={products}
            sales={sales}
            onShowProductModal={() => setShowProductModal(true)}
            onShowSaleModal={() => setShowSaleModal(true)}
            onShowSaleDetails={handleShowSaleDetails}
            onRefresh={fetchData}
            appMode={appMode}
            onToggleMode={async () => {
              const newMode = await toggleAppMode()
              showToast(
                `Modo cambiado a ${newMode === 'ONLINE' ? 'ONLINE (Nube)' : 'OFFLINE (Local)'}`,
                newMode === 'ONLINE' ? 'success' : 'warning' // Reuse warning color logic if supported or just standard
              )
              // Since showToast supports success/error/warning?
            }}
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
            onBack={() => setActiveTab("menu")}
          />
        )}
        {activeTab === "analytics" && (
          <Analytics
            products={products}
            sales={sales}
            clients={clients}
            onRefresh={fetchData}
            onBack={() => setActiveTab("menu")}
          />
        )}
        {activeTab === "menu" && (
          <Menu
            onNavigate={setActiveTab}
            appMode={appMode}
            onToggleMode={toggleAppMode}
            onRefresh={fetchData}
            user={user}
            onLogout={logout}
          />
        )}
        {activeTab === "account" && (
          <Account onLogout={logout} onBack={() => setActiveTab("menu")} />
        )}

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </View>



      {/* Modals and Overlays */}
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
          backgroundColor: toast.type === 'success' ? '#16A34A' : toast.type === 'warning' ? '#D97706' : '#DC2626',
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

const MainApp = () => (
  <AuthProvider>
    <MainAppContent />
  </AuthProvider>
)

import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}

export default App
