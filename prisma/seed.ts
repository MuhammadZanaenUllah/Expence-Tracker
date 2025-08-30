import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminEmail = 'zanaenullah75@gmail.com'
  const adminPassword = 'Perfectone1!'
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      defaultCurrency: 'USD'
    }
  })

  // Create subscription for admin user
  await prisma.subscription.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      plan: 'PRO',
      status: 'ACTIVE'
    }
  })

  console.log('Admin user created:')
  console.log('Email:', adminEmail)
  console.log('Password:', adminPassword)
  console.log('Role: ADMIN')
  console.log('')

  // Create default categories
  const categories = [
    { name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️' },
    { name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
    { name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
    { name: 'Entertainment', color: '#96CEB4', icon: '🎬' },
    { name: 'Bills & Utilities', color: '#FFEAA7', icon: '💡' },
    { name: 'Healthcare', color: '#DDA0DD', icon: '🏥' },
    { name: 'Travel', color: '#98D8C8', icon: '✈️' },
    { name: 'Education', color: '#F7DC6F', icon: '📚' },
    { name: 'Personal Care', color: '#BB8FCE', icon: '💄' },
    { name: 'Other', color: '#85C1E9', icon: '📝' }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }

  // Create default income categories
  const incomeCategories = [
    { name: 'Salary', color: '#10B981', icon: '💼' },
    { name: 'Freelance', color: '#059669', icon: '💻' },
    { name: 'Business', color: '#047857', icon: '🏢' },
    { name: 'Investment', color: '#065F46', icon: '📈' },
    { name: 'Rental', color: '#064E3B', icon: '🏠' },
    { name: 'Bonus', color: '#6EE7B7', icon: '🎁' },
    { name: 'Commission', color: '#34D399', icon: '💰' },
    { name: 'Other Income', color: '#A7F3D0', icon: '💵' }
  ]

  for (const category of incomeCategories) {
    await prisma.incomeCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })