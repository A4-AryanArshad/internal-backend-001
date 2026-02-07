import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Project } from '../src/models/Project'
import { connectDatabase } from '../src/config/database'

dotenv.config()

const createTestProject = async () => {
  try {
    await connectDatabase()

    // Create a test project
    const testProject = await Project.create({
      name: 'Brand Identity Redesign Project',
      client_name: 'Acme Corporation',
      client_email: 'contact@acme.com',
      status: 'pending',
      payment_status: 'pending',
    })

    console.log('✅ Test project created successfully!')
    console.log('\n📋 Project Details:')
    console.log(`   ID: ${testProject._id}`)
    console.log(`   Name: ${testProject.name}`)
    console.log(`   Client: ${testProject.client_name}`)
    console.log(`   Status: ${testProject.status}`)
    console.log(`\n🔗 Client Link:`)
    console.log(`   http://localhost:5173/client/${testProject._id}`)
    console.log(`\n📡 API Endpoint:`)
    console.log(`   http://localhost:3001/api/projects/${testProject._id}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating test project:', error)
    process.exit(1)
  }
}

createTestProject()




















