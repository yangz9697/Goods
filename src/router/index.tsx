import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import Pricing from '../pages/Pricing';
import Customers from '../pages/Customers';
import SupplyOrders from '../pages/SupplyOrders';
import CustomerOrders from '../pages/CustomerOrders';
import OrderDetail from '../pages/OrderDetail';
import Permissions from '../pages/Permissions';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: '/dashboard',
        element: <Dashboard />
      },
      {
        path: '/inventory',
        element: <Inventory />
      },
      {
        path: '/pricing',
        element: <Pricing />
      },
      {
        path: '/customers',
        element: <Customers />
      },
      {
        path: '/supply-orders',
        element: <SupplyOrders />
      },
      {
        path: '/customer-orders',
        element: <CustomerOrders />
      },
      {
        path: '/order/:id',
        element: <OrderDetail />
      },
      {
        path: '/permissions',
        element: <Permissions />
      }
    ]
  }
]); 