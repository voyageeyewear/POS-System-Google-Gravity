import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';
import { productAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function ShopifySync() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/pos');
      }
    }
  }, [user, loading, isAdmin, router]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults(null);

    try {
      const response = await productAPI.syncFromShopify();
      const results = response.data.results;
      
      setSyncResults(results);
      
      // Add to sync history
      const newHistory = {
        timestamp: new Date().toISOString(),
        ...results
      };
      setSyncHistory([newHistory, ...syncHistory].slice(0, 10)); // Keep last 10

      if (results.created > 0 || results.updated > 0) {
        toast.success(`Sync completed! ${results.created} created, ${results.updated} updated`);
      } else {
        toast.success('Sync completed! No changes needed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to sync from Shopify');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Shopify Sync">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Sync Products from Shopify
              </h2>
              <p className="text-gray-600">
                Import and update products from your Shopify store. This will sync product
                details, pricing, and categories.
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <RefreshCw className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className={`
              w-full md:w-auto px-6 py-3 rounded-lg font-semibold transition
              flex items-center justify-center gap-2
              ${syncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
              }
            `}
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Start Sync'}
          </button>
        </div>

        {/* Sync Results */}
        {syncResults && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sync Results</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {syncResults.created}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Updated</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {syncResults.updated}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-600">Errors</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {syncResults.errors?.length || 0}
                </p>
              </div>
            </div>

            {syncResults.errors && syncResults.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                <ul className="space-y-1">
                  {syncResults.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">
                      <strong>{error.product}:</strong> {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Sync History */}
        {syncHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Syncs</h3>
            
            <div className="space-y-3">
              {syncHistory.map((sync, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(sync.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {sync.created} created, {sync.updated} updated
                        {sync.errors && sync.errors.length > 0 && (
                          <span className="text-red-600">
                            {' '}• {sync.errors.length} errors
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {sync.created > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        +{sync.created}
                      </span>
                    )}
                    {sync.updated > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        ↻{sync.updated}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How Sync Works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Fetches all products from your Shopify store</li>
                <li>Creates new products that don't exist in POS</li>
                <li>Updates existing products with latest info</li>
                <li>Categories are mapped based on product type/tags</li>
                <li>Inventory levels are not synced (managed per store)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

