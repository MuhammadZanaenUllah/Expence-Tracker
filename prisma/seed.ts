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