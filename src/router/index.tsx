import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
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
import Login from '../pages/Login';

// 创建一个需要认证的路由包装组件
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accountId = localStorage.getItem('accountId');
  
  if (!accountId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
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
];

export const router = createBrowserRouter(routes); 