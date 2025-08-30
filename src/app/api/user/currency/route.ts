import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidCurrency } from '@/lib/currency'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currency } = await request.json()

    if (!currency || !isValidCurrency(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency code' },
        { status: 400 }
      )
    }

    // Update user's default currency
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        defaultCurrency: currency
      },
      select: {
        id: true,
        defaultCurrency: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user currency:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}