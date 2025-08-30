import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists and is not an admin
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
    }

    // Delete user and all related data
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete user's expenses
      await tx.expense.deleteMany({
        where: { userId }
      });

      // Delete user's subscription
      await tx.subscription.deleteMany({
        where: { userId }
      });

      // Delete user's accounts
      await tx.account.deleteMany({
        where: { userId }
      });

      // Delete user's sessions
      await tx.session.deleteMany({
        where: { userId }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}