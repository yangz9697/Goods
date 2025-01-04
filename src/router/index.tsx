import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import Pricing from '../pages/Pricing';
import Customers from '../pages/Customers';
import SupplyOrders from '../pages/SupplyOrders';
import SupplyOrderList from '../pages/SupplyOrders/List';
import CustomerOrders from '../pages/SupplyOrders/CustomerOrders';
import OrderDetail from '../pages/SupplyOrders/OrderDetail';
import Permissions from '../pages/Permissions';
import PriceManagement from '../pages/PriceManagement';

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
        element: <SupplyOrders />,
        children: [
          {
            path: '',
            element: <SupplyOrderList />
          },
          {
            path: 'customer/:id',
            element: <CustomerOrders />
          },
          {
            path: 'order/:id',
            element: <OrderDetail />
          }
        ]
      },
      {
        path: '/permissions',
        element: <Permissions />
      },
      {
        path: '/price-management',
        element: <PriceManagement />,
      }
    ]
  }
]); 