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

    // Calculate total spending
    const totalSpending = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

    // Group by category for pie chart
    const categoryStats = expenses.reduce((acc: Record<string, any>, expense: any) => {
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

    // Get monthly trend data for line chart
    const monthlyTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total
      FROM "Expense"
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
      categoryStats: Object.values(categoryStats),
      monthlyTrend,
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