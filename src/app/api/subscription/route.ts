import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (!subscription) {
      // Create a default free subscription if none exists
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: 'FREE',
          status: 'ACTIVE'
        }
      })
      return NextResponse.json(newSubscription)
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd } = await request.json()

    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null
      },
      create: {
        userId: session.user.id,
        plan: plan || 'FREE',
        status: status || 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null
      }
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}