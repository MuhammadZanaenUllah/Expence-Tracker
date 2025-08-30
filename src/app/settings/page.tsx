'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { User, Mail, Calendar, Shield, DollarSign } from 'lucide-react'
import { getCurrencyOptions, Currency } from '@/lib/currency'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userCurrency, setUserCurrency] = useState<Currency>('USD')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Fetch user's current currency preference
    fetchUserCurrency()
  }, [session, status, router])

  const fetchUserCurrency = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      if (data.user?.defaultCurrency) {
        setUserCurrency(data.user.defaultCurrency)
      }
    } catch (error) {
      console.error('Failed to fetch user currency:', error)
    }
  }

  const updateCurrency = async (newCurrency: Currency) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/currency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency: newCurrency }),
      })

      if (response.ok) {
        setUserCurrency(newCurrency)
        // Show success message (you could add a toast notification here)
      } else {
        throw new Error('Failed to update currency')
      }
    } catch (error) {
      console.error('Error updating currency:', error)
      // Show error message (you could add a toast notification here)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">{session.user?.name || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md border">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-900">{session.user?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900 font-mono text-sm">{session.user?.id}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">Standard User</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
              </div>
              <button
                onClick={() => router.push('/subscription')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Subscription
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-blue-800">
                Visit the subscription page to view your current plan and manage billing.
              </p>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
            </div>
            
            <div className="space-y-6">
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Currency
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Choose your preferred currency for displaying expenses and reports
                </p>
                <div className="flex items-center space-x-3">
                  <select
                    value={userCurrency}
                    onChange={(e) => updateCurrency(e.target.value as Currency)}
                    disabled={isSaving}
                    className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    aria-label="Select default currency"
                  >
                    {getCurrencyOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isSaving && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive email updates about your expenses</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked aria-label="Enable email notifications" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Monthly Reports</h3>
                  <p className="text-sm text-gray-500">Get monthly spending summaries</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked aria-label="Enable monthly reports" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
            
            <div className="p-4 bg-red-50 rounded-md border border-red-200">
              <h3 className="text-sm font-medium text-red-900 mb-2">Delete Account</h3>
              <p className="text-sm text-red-700 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={() => alert('Account deletion is not implemented in this demo.')}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}