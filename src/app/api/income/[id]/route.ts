import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const income = await prisma.income.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        category: true
      }
    })

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    return NextResponse.json(income)
  } catch (error) {
    console.error('Get income error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, amount, description, categoryId, date, currency } = await request.json()

    // Verify income belongs to user
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    const income = await prisma.income.update({
      where: { id: params.id },
      data: {
        title,
        amount: parseFloat(amount),
        description,
        categoryId,
        date: date ? new Date(date) : undefined,
        currency: currency || existingIncome.currency
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error('Update income error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify income belongs to user
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    await prisma.income.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Income deleted successfully' })
  } catch (error) {
    console.error('Delete income error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}