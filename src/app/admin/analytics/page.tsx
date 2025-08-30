import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get analytics data
  const [users, expenses, subscriptions, categories] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        role: true
      }
    }),
    prisma.expense.findMany({
      select: {
        id: true,
        amount: true,
        createdAt: true,
        category: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.subscription.findMany({
      select: {
        id: true,
        plan: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            expenses: true
          }
        }
      }
    })
  ]);

  // Calculate user growth by month
  const userGrowth = users.reduce((acc: Record<string, number>, user: any) => {
    const month = new Date(user.createdAt).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  // Calculate expense trends by month
  const expensesByMonth = expenses.reduce((acc: Record<string, { count: number; total: number }>, expense: any) => {
    const month = new Date(expense.createdAt).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = { count: 0, total: 0 };
    }
    acc[month].count += 1;
    acc[month].total += expense.amount;
    return acc;
  }, {});

  // Calculate category usage
  const categoryStats = categories.map((category: any) => ({
    name: category.name,
    count: category._count.expenses
  })).sort((a: any, b: any) => b.count - a.count);

  // Calculate subscription conversion rate
  const totalUsers = users.length;
  const proSubscriptions = subscriptions.filter((sub: any) => sub.plan === 'PRO').length;
  const conversionRate = totalUsers > 0 ? (proSubscriptions / totalUsers * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="mt-2 text-sm text-gray-600">
          Detailed analytics and insights about your SaaS application.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">U</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">E</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                  <dd className="text-lg font-medium text-gray-900">{expenses.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{conversionRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">MRR</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${(proSubscriptions * 9.99).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Growth by Month</h3>
          <div className="space-y-2">
            {Object.entries(userGrowth)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-12) // Last 12 months
              .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((count as number) / Math.max(...Object.values(userGrowth).map(v => Number(v))) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count as number}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Expense Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenses */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Monthly Expense Trends</h3>
            <div className="space-y-2">
              {Object.entries(expensesByMonth)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-6) // Last 6 months
                .map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {(data as any).count} expenses
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency((data as any).total, 'USD')} total
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Category Usage */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Popular Categories</h3>
            <div className="space-y-2">
              {categoryStats.slice(0, 8).map((category: any) => (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(category.count / Math.max(...categoryStats.map((c: any) => c.count)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{category.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}