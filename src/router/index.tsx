import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import Layout from '../components/Layout';
import Inventory from '../pages/Inventory';
import Pricing from '../pages/Pricing';
import Customers from '../pages/Customers';
import SupplyOrders from '../pages/SupplyOrders';
import OrderByCustomers from '../pages/SupplyOrders/OrderByCustomers';
import OrderList from '../pages/SupplyOrders/OrderList';
import OrderDetail from '../pages/SupplyOrders/OrderDetail';
import Permissions from '../pages/Permissions';
import Login from '../pages/Login';
import Tenants from '../pages/Tenants';
import DashboardOverview from '@/pages/Dashboard/Overview';
import DashboardPayment from '@/pages/Dashboard/Payment';

// 创建一个需要认证的路由包装组件
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accountId = localStorage.getItem('accountId');
  
  if (!accountId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 创建一个需要管理员权限的路由包装组件
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = localStorage.getItem('role');
  
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// 创建一个需要管理员或经理权限的路由包装组件
const RequireManagerOrAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = localStorage.getItem('role');
  
  if (role !== 'admin' && role !== 'manager') {
    return <Navigate to="/" replace />;
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
        path: '',
        element: <Navigate to="/dashboard/overview" replace />
      },
      {
        path: 'dashboard',
        children: [
          {
            path: '',
            element: <Navigate to="/dashboard/overview" replace />
          },
          {
            path: 'overview',
            element: <DashboardOverview />
          },
          {
            path: 'payment',
            element: (
              <RequireAdmin>
                <DashboardPayment />
              </RequireAdmin>
            )
          }
        ]
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
            element: <OrderByCustomers />
          },
          {
            path: 'list',
            element: <OrderList />
          },
          {
            path: 'detail/:id',
            element: <OrderDetail />
          }
        ]
      },
      {
        path: '/permissions',
        element: (
          <RequireManagerOrAdmin>
            <Permissions />
          </RequireManagerOrAdmin>
        )
      },
      {
        path: '/tenants',
        element: (
          <RequireAdmin>
            <Tenants />
          </RequireAdmin>
        )
      }
    ]
  }
];

export const router = createBrowserRouter(routes); 