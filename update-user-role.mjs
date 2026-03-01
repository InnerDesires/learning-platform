import { getPayload } from 'payload'
import config from './src/payload.config.ts'

async function updateUserRole() {
  const payload = await getPayload({ config })
  
  console.log('Updating user role to admin...')
  
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: 'admin@test.com' } },
    limit: 1,
  })
  
  if (users.docs[0]) {
    await payload.update({
      collection: 'users',
      id: users.docs[0].id,
      data: { role: ['admin'] },
    })
    console.log('User role updated successfully!')
  } else {
    console.log('User not found')
  }
  
  process.exit(0)
}

updateUserRole().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
