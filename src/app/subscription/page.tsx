'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Check, Crown, Zap, Shield, Star } from 'lucide-react'

interface Subscription {
  id: string
  plan: 'FREE' | 'PRO'
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE'
  currentPeriodEnd?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

interface UserStats {
  totalExpenses: number
  currentMonthExpenses: number
  totalIncome: number
  currentMonthIncome: number
}

interface ExpenseData {
  date: string
}

export default function Subscription() {
  const { data: session, status } = useSession()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (session) {
      fetchSubscriptionData()
      fetchUserStats()
    }
  }, [session])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        
        // Calculate current month expenses and income
        const now = new Date()
        const currentMonthExpenses = data.recentExpenses?.filter((expense: ExpenseData) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear()
        }).length || 0
        
        setUserStats({
          totalExpenses: data.subscription?.expenseCount || 0,
          currentMonthExpenses,
          totalIncome: data.totalIncome || 0,
          currentMonthIncome: data.totalIncome || 0 // Using total for now since we don't have recent income data
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('An error occurred while processing your request')
    } finally {
      setUpgrading(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        alert('Failed to access billing portal')
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error)
      alert('An error occurred while accessing the billing portal')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  const isFreePlan = subscription?.plan === 'FREE'
  const expenseLimit = isFreePlan ? 50 : Infinity
  const usagePercentage = isFreePlan ? Math.min((userStats?.totalExpenses || 0) / 50 * 100, 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-600">Manage your subscription and billing preferences</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {isFreePlan ? (
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-gray-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {subscription?.plan || 'FREE'} Plan
                </h2>
                <p className="text-gray-600">
                  {isFreePlan ? 'Basic expense tracking' : 'Unlimited expense tracking'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {isFreePlan ? 'Free' : '$9.99'}
              </p>
              {!isFreePlan && <p className="text-gray-600">per month</p>}
            </div>
          </div>

          {/* Usage Stats */}
          {isFreePlan && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Expense Usage</span>
                <span className="text-sm text-gray-600">
                  {userStats?.totalExpenses || 0} / {expenseLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usagePercentage >= 90 ? 'bg-red-500' : 
                    usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              {usagePercentage >= 90 && (
                <p className="text-sm text-red-600 mt-2">
                  You&apos;re approaching your expense limit. Consider upgrading to Pro.
                </p>
              )}
            </div>
          )}

          {/* Plan Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                subscription?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                Status: {subscription?.status || 'ACTIVE'}
              </span>
            </div>
            {subscription?.currentPeriodEnd && (
              <span className="text-sm text-gray-600">
                {isFreePlan ? 'Free forever' : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
              </span>
            )}
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className={`bg-white rounded-lg shadow p-6 border-2 ${
            isFreePlan ? 'border-blue-500' : 'border-gray-200'
          }`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Free Plan</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">$0</p>
              <p className="text-gray-600">per month</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Up to 50 expenses</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Basic dashboard</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Category management</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Basic charts</span>
              </li>
            </ul>
            
            {isFreePlan && (
              <div className="text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Current Plan
                </span>
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className={`bg-white rounded-lg shadow p-6 border-2 relative ${
            !isFreePlan ? 'border-purple-500' : 'border-gray-200'
          }`}>
            {!isFreePlan && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Pro Plan</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">$9.99</p>
              <p className="text-gray-600">per month</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Unlimited expenses</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Advanced dashboard</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Export data</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Advanced analytics</span>
              </li>
            </ul>
            
            <div className="text-center">
              {isFreePlan ? (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>{upgrading ? 'Processing...' : 'Upgrade to Pro'}</span>
                </button>
              ) : (
                <button
                  onClick={handleManageSubscription}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
                >
                  Manage Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}