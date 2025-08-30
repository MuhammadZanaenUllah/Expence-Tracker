import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, year, all
    
    let startDate: Date
    const endDate = new Date()
    
    switch (period) {
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0) // All time
    }

    // Get expenses for the period
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      }
    })

    // Get income for the period
    const incomes = await prisma.income.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      }
    })

    // Calculate total spending and income
    const totalSpending = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)
    const totalIncome = incomes.reduce((sum: number, income: any) => sum + income.amount, 0)

    // Group expenses by category for pie chart
    const expenseCategoryStats = expenses.reduce((acc: Record<string, any>, expense: any) => {
      const categoryName = expense.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          amount: 0,
          color: expense.category.color,
          icon: expense.category.icon
        }
      }
      acc[categoryName].amount += expense.amount
      return acc
    }, {} as Record<string, any>)

    // Group income by category for pie chart
    const incomeCategoryStats = incomes.reduce((acc: Record<string, any>, income: any) => {
      const categoryName = income.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          amount: 0,
          color: income.category.color,
          icon: income.category.icon
        }
      }
      acc[categoryName].amount += income.amount
      return acc
    }, {} as Record<string, any>)

    // Get monthly trend data for line chart (expenses and income)
    const expenseMonthlyTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total
      FROM "Expense"
      WHERE "userId" = ${session.user.id}
        AND date >= ${new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1)}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `

    const incomeMonthlyTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total
      FROM "Income"
      WHERE "userId" = ${session.user.id}
        AND date >= ${new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1)}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `

    // Get recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 5
    })

    // Get subscription info
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    const expenseCount = await prisma.expense.count({
      where: { userId: session.user.id }
    })

    return NextResponse.json({
      totalSpending,
      totalIncome,
      expenseCategoryStats: Object.values(expenseCategoryStats),
      incomeCategoryStats: Object.values(incomeCategoryStats),
      expenseMonthlyTrend,
      incomeMonthlyTrend,
      recentExpenses,
      subscription: {
        plan: subscription?.plan || 'FREE',
        expenseCount,
        limit: subscription?.plan === 'PRO' ? null : 50
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}