const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const report = await prisma.report.findFirst({
      include: {
        results: {
          include: {
            test: {
              include: {
                parent: {
                  include: {
                    parent: true
                  }
                }
              }
            }
          }
        }
      }
    });
    console.log(report ? 'Success' : 'No report found');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
