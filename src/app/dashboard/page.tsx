'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { DollarSign, TrendingUp, Receipt, CreditCard } from 'lucide-react'
import { formatCurrency, type Currency } from '@/lib/currency'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface DashboardStats {
  totalSpending: number
  totalIncome: number
  expenseCategoryStats: Array<{
    name: string
    amount: number
    color: string
    icon: string
  }>
  incomeCategoryStats: Array<{
    name: string
    amount: number
    color: string
    icon: string
  }>
  expenseMonthlyTrend: Array<{
    month: string
    total: number
  }>
  incomeMonthlyTrend: Array<{
    month: string
    total: number
  }>
  recentExpenses: Array<{
    id: string
    title: string
    amount: number
    date: string
    category: {
      name: string
      color: string
      icon: string
    }
  }>
  subscription: {
    plan: string
    expenseCount: number
    limit: number | null
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCurrency, setUserCurrency] = useState<string>('USD')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (session) {
      fetchDashboardStats()
      fetchUserCurrency()
    }
  }, [session])

  const fetchUserCurrency = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserCurrency(data.defaultCurrency || 'USD')
      }
    } catch (error) {
      console.error('Error fetching user currency:', error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
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

  // Prepare expense chart data
  const expensePieChartData = {
    labels: stats?.expenseCategoryStats.map((cat: any) => cat.name) || [],
    datasets: [
      {
        data: stats?.expenseCategoryStats.map((cat: any) => cat.amount) || [],
        backgroundColor: stats?.expenseCategoryStats.map((cat: any) => cat.color) || [],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  }

  // Prepare income chart data
  const incomePieChartData = {
    labels: stats?.incomeCategoryStats.map((cat: any) => cat.name) || [],
    datasets: [
      {
        data: stats?.incomeCategoryStats.map((cat: any) => cat.amount) || [],
        backgroundColor: stats?.incomeCategoryStats.map((cat: any) => cat.color) || [],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value, userCurrency as Currency)} (${percentage}%)`;
          }
        }
      }
    },
  }

  const lineChartData = {
    labels: stats?.expenseMonthlyTrend.map(item => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Monthly Spending',
        data: stats?.expenseMonthlyTrend.map(item => item.total) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Monthly Income',
        data: stats?.incomeMonthlyTrend.map(item => item.total) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Spending: ${formatCurrency(context.parsed.y, userCurrency as Currency)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalSpending || 0, userCurrency as Currency)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.totalIncome || 0, userCurrency as Currency)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.subscription.expenseCount || 0}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Plan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.subscription.plan || 'FREE'}
                </p>
                {stats?.subscription.limit && (
                  <p className="text-xs text-gray-500">
                    {stats.subscription.expenseCount}/{stats.subscription.limit}
                  </p>
                )}
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
            <div className="h-64">
              {stats?.expenseCategoryStats.length ? (
                <Pie data={expensePieChartData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No expenses yet
                </div>
              )}
            </div>
          </div>

          {/* Income Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
            <div className="h-64">
              {stats?.incomeCategoryStats.length ? (
                <Pie data={incomePieChartData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No income yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h3>
          <div className="h-64">
            {(stats?.expenseMonthlyTrend.length || stats?.incomeMonthlyTrend.length) ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats?.recentExpenses.length ? (
              stats.recentExpenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{expense.category.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                      <p className="text-xs text-gray-500">{expense.category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount, userCurrency as Currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No expenses yet. Start by adding your first expense!
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}