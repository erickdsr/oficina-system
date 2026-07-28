import { Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import './App.css'
import PrivateRoute from './components/PrivateRoute'
import MainLayout from './components/layout/MainLayout'
import CategoryList from './pages/Category/CategoryList'
import ClientList from './pages/Client/ClientList'
import EmployeeList from './pages/Employee/EmployeeList'
import LoginPage from './pages/Login/LoginPage'
import HomePage from './pages/Home/HomePage'
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
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/categories" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER"]}><CategoryList /></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "STOCK"]}><SupplierList /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "SALESPERSON"]}><ClientList /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute allowedRoles={["ADMIN"]}><EmployeeList /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "SALESPERSON", "STOCK"]}><ProductList /></PrivateRoute>} />
          <Route path="/stock" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "STOCK"]}><StockList /></PrivateRoute>} />
          <Route path="/stock/movements" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "STOCK"]}><StockMovements /></PrivateRoute>} />
          <Route path="/purchases" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "STOCK"]}><PurchaseList /></PrivateRoute>} />
          <Route path="/purchases/new" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "STOCK"]}><PurchaseForm /></PrivateRoute>} />
          <Route path="/purchases/:id" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "STOCK"]}><PurchaseDetail /></PrivateRoute>} />
          <Route path="/sales" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "SALESPERSON"]}><SaleList /></PrivateRoute>} />
          <Route path="/sales/new" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "SALESPERSON"]}><SaleForm /></PrivateRoute>} />
          <Route path="/sales/:id" element={<PrivateRoute allowedRoles={["ADMIN", "MANAGER", "SALESPERSON"]}><SaleDetail /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster richColors position="top-right" theme="dark" />
    </>
  )
}

export default App
