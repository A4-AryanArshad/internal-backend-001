import mongoose from 'mongoose'
import { Service } from '../src/models/Service'
import { connectDatabase } from '../src/config/database'

const seedServices = async () => {
  try {
    await connectDatabase()

    const services = [
      {
        name: 'Complete Brand Identity Package',
        description: 'Full logo design, color palette, typography, and brand guidelines document',
        price: 4500.00,
        is_active: true,
      },
      {
        name: 'Logo Design Only',
        description: 'Professional logo design with 2 revision rounds',
        price: 1200.00,
        is_active: true,
      },
      {
        name: 'Brand Guidelines Document',
        description: 'Complete brand guidelines documentation for existing identity',
        price: 2800.00,
        is_active: true,
      },
    ]

    // Clear existing services
    await Service.deleteMany({})

    // Insert new services
    await Service.insertMany(services)

    console.log('✅ Services seeded successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding services:', error)
    process.exit(1)
  }
}

seedServices()




















