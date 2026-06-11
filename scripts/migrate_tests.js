const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  const tests = await prisma.test.findMany({ where: { parentId: null } });
  
  // Group by category
  const groups = {};
  for (const t of tests) {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  }

  for (const [catName, subtests] of Object.entries(groups)) {
    // Check if parent already exists
    let parent = await prisma.test.findFirst({ where: { name: catName, parentId: null } });
    
    if (!parent) {
      // Calculate total price of all subtests for the parent package price
      const totalPrice = subtests.reduce((sum, t) => sum + (t.price || 0), 0);
      
      parent = await prisma.test.create({
        data: {
          id: `parent-${catName.replace(/\s+/g, '_')}-${Date.now()}`,
          labId: subtests[0].labId,
          name: catName,
          category: 'Pathology Packages', // generic
          type: subtests[0].type,
          price: totalPrice,
          genderRefType: 'BOTH'
        }
      });
      console.log('Created parent package:', catName);
    }
    
    // Attach subtests to parent
    for (const sub of subtests) {
      if (sub.name !== catName) {
        await prisma.test.update({
          where: { id: sub.id },
          data: { parentId: parent.id, price: 0 } // Price moves to parent
        });
        console.log('  Attached subtest:', sub.name);
      }
    }
  }
  
  // Create AEC for the user as an example
  const aecExists = await prisma.test.findFirst({ where: { name: 'AEC' } });
  if (!aecExists && tests.length > 0) {
    const parentAEC = await prisma.test.create({
      data: {
        id: `parent-AEC-${Date.now()}`, labId: tests[0].labId,
        name: 'AEC', category: 'Pathology Packages', type: 'Pathology', price: 400, genderRefType: 'BOTH',
        subTests: {
          create: [{
            id: `sub-AEC-Absolute_Eosinophils_Count-${Date.now()}`, labId: tests[0].labId,
            name: 'Absolute Eosinophils Count', category: 'Pathology Packages', type: 'Pathology', price: 0, genderRefType: 'BOTH'
          }]
        }
      }
    });
    console.log('Created AEC package specifically as requested.');
  }
  
  // Create ALP
  const alpExists = await prisma.test.findFirst({ where: { name: 'ALP' } });
  if (!alpExists && tests.length > 0) {
    const parentALP = await prisma.test.create({
      data: {
        id: `parent-ALP-${Date.now()}`, labId: tests[0].labId,
        name: 'ALP', category: 'Pathology Packages', type: 'Pathology', price: 600, genderRefType: 'BOTH',
        subTests: {
          create: [{
            id: `sub-ALP-Alkaline_phosphatase-${Date.now()}`, labId: tests[0].labId,
            name: 'Alkaline phosphatase', category: 'Pathology Packages', type: 'Pathology', price: 0, genderRefType: 'BOTH'
          }]
        }
      }
    });
    console.log('Created ALP package specifically as requested.');
  }
  
}
migrate().then(() => prisma.$disconnect()).catch(e => console.error(e));
