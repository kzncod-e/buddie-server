/* eslint-disable prettier/prettier */

import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from 'generated/prisma/client'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  // ... you will write your Prisma ORM queries here
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })