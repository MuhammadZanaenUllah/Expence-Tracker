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
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      userId: session.user.id
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.expense.count({ where })

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (subscription?.plan === 'FREE') {
      const expenseCount = await prisma.expense.count({
        where: { userId: session.user.id }
      })

      if (expenseCount >= 50) {
        return NextResponse.json(
          { error: 'Free plan limit reached. Upgrade to Pro for unlimited expenses.' },
          { status: 403 }
        )
      }
    }

    const { title, amount, description, categoryId, date, currency } = await request.json()

    if (!title || !amount || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        description,
        categoryId,
        date: date ? new Date(date) : new Date(),
        currency: currency || 'USD',
        userId: session.user.id
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}