import { Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import './App.css'
import PrivateRoute from './components/PrivateRoute'
import MainLayout from './components/layout/MainLayout'
import CategoryList from './pages/Category/CategoryList'
import ClientList from './pages/Client/ClientList'
import EmployeeList from './pages/Employee/EmployeeList'
import LoginPage from './pages/Login/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ProductList from './pages/Product/ProductList'
import PurchaseDetail from './pages/Purchase/PurchaseDetail'
import PurchaseForm from './pages/Purchase/PurchaseForm'
import PurchaseList from './pages/Purchase/PurchaseList'
import SaleDetail from './pages/Sale/SaleDetail'
import SaleForm from './pages/Sale/SaleForm'
import SaleList from './pages/Sale/SaleList'
import StockList from './pages/Stock/StockList'
import StockMovements from './pages/Stock/StockMovements'
import SupplierList from './pages/Supplier/SupplierList'

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/stock" element={<StockList />} />
          <Route path="/stock/movements" element={<StockMovements />} />
          <Route path="/purchases" element={<PurchaseList />} />
          <Route path="/purchases/new" element={<PurchaseForm />} />
          <Route path="/purchases/:id" element={<PurchaseDetail />} />
          <Route path="/sales" element={<SaleList />} />
          <Route path="/sales/new" element={<SaleForm />} />
          <Route path="/sales/:id" element={<SaleDetail />} />
        </Route>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Navigate to="/" replace />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster richColors position="top-right" theme="dark" />
    </>
  )
}

export default App
