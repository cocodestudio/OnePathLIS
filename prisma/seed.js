const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create a Default Lab
  const lab = await prisma.lab.upsert({
    where: { email: "info@onepathlab.com" },
    update: {},
    create: {
      name: "OnePath Lab Main",
      email: "info@onepathlab.com",
      address: "123 Healthcare Blvd, Medical District, Delhi",
      logoUrl: "/onepath-logo.png", // Will copy the logo to public directory
    },
  });
  console.log("Lab created:", lab.name, "ID:", lab.id);

  // 2. Hash Password for Users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@onepath.com" },
    update: {},
    create: {
      email: "admin@onepath.com",
      password: hashedPassword,
      name: "Admin Owner",
      role: "ADMIN",
      labId: lab.id,
    },
  });
  console.log("Admin User created:", admin.email);

  // 4. Create Staff User
  const staff = await prisma.user.upsert({
    where: { email: "staff@onepath.com" },
    update: {},
    create: {
      email: "staff@onepath.com",
      password: hashedPassword,
      name: "Staff Assistant",
      role: "STAFF",
      labId: lab.id,
    },
  });
  console.log("Staff User created:", staff.email);

  // 5. Create Default Tests for the Lab
  const defaultTests = [
    // Complete Blood Count (CBC)
    { name: "Hemoglobin", category: "CBC", type: "Pathology", price: 350.0, unit: "g/dL", genderRefType: "GENDER_SPECIFIC", refRangeMin: 12.0, refRangeMax: 17.0, refRangeMinMale: 13.8, refRangeMaxMale: 17.2, refRangeMinFemale: 12.1, refRangeMaxFemale: 15.1 },
    { name: "Total Leucocyte Count (WBC)", category: "CBC", type: "Pathology", price: 350.0, unit: "10^3/µL", genderRefType: "BOTH", refRangeMin: 4.0, refRangeMax: 11.0 },
    { name: "Platelet Count", category: "CBC", type: "Pathology", price: 350.0, unit: "10^3/µL", genderRefType: "BOTH", refRangeMin: 150.0, refRangeMax: 450.0 },

    // Liver Function Test (LFT)
    { name: "Bilirubin Total", category: "LFT", type: "Pathology", price: 600.0, unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0.2, refRangeMax: 1.2 },
    { name: "SGOT (AST)", category: "LFT", type: "Pathology", price: 600.0, unit: "U/L", genderRefType: "GENDER_SPECIFIC", refRangeMin: 5.0, refRangeMax: 40.0, refRangeMinMale: 10.0, refRangeMaxMale: 40.0, refRangeMinFemale: 9.0, refRangeMaxFemale: 32.0 },
    { name: "SGPT (ALT)", category: "LFT", type: "Pathology", price: 600.0, unit: "U/L", genderRefType: "GENDER_SPECIFIC", refRangeMin: 5.0, refRangeMax: 45.0, refRangeMinMale: 10.0, refRangeMaxMale: 40.0, refRangeMinFemale: 7.0, refRangeMaxFemale: 35.0 },

    // Kidney Function Test (KFT)
    { name: "Blood Urea", category: "KFT", type: "Pathology", price: 700.0, unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 15.0, refRangeMax: 45.0 },
    { name: "Serum Creatinine", category: "KFT", type: "Pathology", price: 700.0, unit: "mg/dL", genderRefType: "GENDER_SPECIFIC", refRangeMin: 0.6, refRangeMax: 1.3, refRangeMinMale: 0.7, refRangeMaxMale: 1.3, refRangeMinFemale: 0.6, refRangeMaxFemale: 1.1 },
    { name: "Uric Acid", category: "KFT", type: "Pathology", price: 700.0, unit: "mg/dL", genderRefType: "GENDER_SPECIFIC", refRangeMin: 3.5, refRangeMax: 7.2, refRangeMinMale: 4.0, refRangeMaxMale: 8.5, refRangeMinFemale: 2.7, refRangeMaxFemale: 7.3 },

    // Thyroid Profile
    { name: "Total Triiodothyronine (T3)", category: "Thyroid", type: "Pathology", price: 900.0, unit: "ng/dL", genderRefType: "BOTH", refRangeMin: 80.0, refRangeMax: 200.0 },
    { name: "Total Thyroxine (T4)", category: "Thyroid", type: "Pathology", price: 900.0, unit: "µg/dL", genderRefType: "BOTH", refRangeMin: 5.1, refRangeMax: 14.1 },
    { name: "Thyroid Stimulating Hormone (TSH)", category: "Thyroid", type: "Pathology", price: 900.0, unit: "µIU/mL", genderRefType: "BOTH", refRangeMin: 0.5, refRangeMax: 5.0 },

    // Cardiology (Lipid Profile)
    { name: "Cholesterol Total", category: "Lipid Profile", type: "Cardiology", price: 500.0, unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0.0, refRangeMax: 200.0 },
    { name: "HDL Cholesterol", category: "Lipid Profile", type: "Cardiology", price: 500.0, unit: "mg/dL", genderRefType: "GENDER_SPECIFIC", refRangeMin: 40.0, refRangeMax: 60.0, refRangeMinMale: 40.0, refRangeMaxMale: 60.0, refRangeMinFemale: 50.0, refRangeMaxFemale: 70.0 },

    // Radiology
    { name: "Chest X-Ray (PA View)", category: "X-Ray", type: "Radiology", price: 400.0, unit: "N/A", genderRefType: "BOTH", refRangeMin: 0.0, refRangeMax: 0.0 },
    { name: "Ultrasound Whole Abdomen", category: "USG", type: "Radiology", price: 1200.0, unit: "N/A", genderRefType: "BOTH", refRangeMin: 0.0, refRangeMax: 0.0 },
  ];

  for (const t of defaultTests) {
    await prisma.test.upsert({
      where: {
        id: `${lab.id}-${t.category}-${t.name}`.replace(/\s+/g, "_"), 
      },
      update: {
        type: t.type,
        genderRefType: t.genderRefType || "BOTH",
        refRangeMinMale: t.refRangeMinMale || null,
        refRangeMaxMale: t.refRangeMaxMale || null,
        refRangeMinFemale: t.refRangeMinFemale || null,
        refRangeMaxFemale: t.refRangeMaxFemale || null,
      },
      create: {
        id: `${lab.id}-${t.category}-${t.name}`.replace(/\s+/g, "_"),
        labId: lab.id,
        name: t.name,
        category: t.category,
        type: t.type,
        price: t.price,
        unit: t.unit,
        genderRefType: t.genderRefType || "BOTH",
        refRangeMin: t.refRangeMin,
        refRangeMax: t.refRangeMax,
        refRangeMinMale: t.refRangeMinMale || null,
        refRangeMaxMale: t.refRangeMaxMale || null,
        refRangeMinFemale: t.refRangeMinFemale || null,
        refRangeMaxFemale: t.refRangeMaxFemale || null,
      },
    });
  }
  console.log("Default Tests seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
