import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import BackupModal from '../../components/BackupModal';
import { dataManagementAPI } from '../../utils/api';
import { Database, Trash2, RefreshCw, Download, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DataManagement() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [backups, setBackups] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    } else if (user) {
      loadBackups();
    }
  }, [user, loading, router]);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const response = await dataManagementAPI.getAllBackups();
      setBackups(response.data.backups);
    } catch (error) {
      console.error('Load backups error:', error);
      // Don't show error toast, backups directory might not exist yet
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async (formData) => {
    setProcessing(true);
    try {
      const response = await dataManagementAPI.createBackup(formData);
      toast.success('Backup created successfully!');
      setShowBackupModal(false);
      
      // Download the backup automatically
      const downloadResponse = await dataManagementAPI.downloadBackup(response.data.backup.fileName);
      const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.data.backup.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      loadBackups();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create backup');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadBackup = async (fileName) => {
    try {
      const response = await dataManagementAPI.downloadBackup(fileName);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded!');
    } catch (error) {
      toast.error('Failed to download backup');
      console.error(error);
    }
  };

  const handleCleanupData = async () => {
    setProcessing(true);
    try {
      await dataManagementAPI.cleanupData();
      toast.success('All data cleaned up successfully!');
      setShowCleanupModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cleanup data');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRefreshData = async () => {
    setProcessing(true);
    const loadingToast = toast.loading('Refreshing data from Shopify...');
    try {
      const response = await dataManagementAPI.refreshData();
      toast.success('Data refreshed successfully!', { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to refresh data', { id: loadingToast });
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Data Management">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
          <p className="text-gray-600">Manage your system data, create backups, and cleanup.</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Create Backup */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Save className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Create Backup</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Create a full backup of all your data including sales, products, customers, and users.
            </p>
            <button
              onClick={() => setShowBackupModal(true)}
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create New Backup
            </button>
          </div>

          {/* Refresh Data */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Refresh Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Sync and refresh all data from Shopify to get the latest products, locations, and inventory.
            </p>
            <button
              onClick={handleRefreshData}
              disabled={processing}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
              Refresh Now
            </button>
          </div>

          {/* Clean Up Data */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Clean Up Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Permanently delete all sales, orders, customers, and non-admin users. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowCleanupModal(true)}
              disabled={processing}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clean Up Data
            </button>
          </div>
        </div>

        {/* Backups List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Recent Backups</h2>
          </div>

          <div className="p-6">
            {loadingBackups ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No backups found</p>
                <p className="text-sm text-gray-400 mt-1">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Backup Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Created By</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Statistics</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{backup.name}</td>
                        <td className="py-4 px-4 text-gray-600">{formatFileSize(backup.size)}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(backup.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-gray-600">{backup.createdBy}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {backup.statistics?.totalProducts || 0} Products
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {backup.statistics?.totalSales || 0} Sales
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDownloadBackup(backup.fileName)}
                            className="mx-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup Modal */}
      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onSubmit={handleCreateBackup}
      />

      {/* Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Data Cleanup</h3>
              </div>

              <p className="text-gray-600 mb-4">
                Are you sure you want to delete all data? This action will permanently remove:
              </p>

              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
                <li>All sales records</li>
                <li>All customer data</li>
                <li>All product inventory</li>
                <li>All non-admin users</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ This action cannot be undone. Please create a backup before proceeding.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCleanupModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCleanupData}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
                >
                  {processing ? 'Cleaning...' : 'Yes, Delete All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

