import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Store } from 'lucide-react';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
              {user?.assignedStore && (
                <div className="flex items-center gap-1 mt-1">
                  <Store className="w-3 h-3 text-gray-500" />
                  <p className="text-xs text-gray-500">{user.assignedStore.name}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-32 max-w-7xl">
        {children}
      </main>
    </div>
  );
}

