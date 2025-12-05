import AdminSetup from '@/components/AdminSetup';

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Setup
          </h1>
          <p className="text-gray-600">
            Configure admin access for ElectroDoctor platform
          </p>
        </div>
        <AdminSetup />
      </div>
    </div>
  );
}