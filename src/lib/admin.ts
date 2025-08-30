import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

export async function isAdmin(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true }
  });

  return user?.role === "ADMIN";
}

export async function getAdminStats() {
  const [totalUsers, totalExpenses, totalSubscriptions, revenueData] = await Promise.all([
    prisma.user.count(),
    prisma.expense.count(),
    prisma.subscription.count(),
    prisma.subscription.findMany({
      where: {
        plan: "PRO",
        status: "ACTIVE"
      },
      select: {
        createdAt: true
      }
    })
  ]);

  const monthlyRevenue = revenueData.reduce((acc: Record<string, number>, sub: { createdAt: Date }) => {
    const month = sub.createdAt.toISOString().slice(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalUsers,
    totalExpenses,
    totalSubscriptions,
    activeProSubscriptions: revenueData.length,
    monthlyRevenue
  };
}

export async function getAllUsers(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      include: {
        subscription: true,
        _count: {
          select: {
            expenses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.count()
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN") {
  return await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
}

export async function deleteUser(userId: string) {
  // Delete user and all related data (cascading)
  return await prisma.user.delete({
    where: { id: userId }
  });
}