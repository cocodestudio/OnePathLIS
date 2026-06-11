const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testData = [
  {
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    type: "Pathology",
    price: 400,
    subTests: [
      { name: "Hemoglobin", unit: "g/dL", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 13.0, refRangeMaxMale: 17.0, refRangeMinFemale: 12.0, refRangeMaxFemale: 15.0 },
      { name: "Total Leucocyte Count (WBC)", unit: "cells/c.mm", genderRefType: "BOTH", refRangeMin: 4000, refRangeMax: 11000 },
      { name: "Red Blood Cell Count (RBC)", unit: "mill/c.mm", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 4.5, refRangeMaxMale: 5.5, refRangeMinFemale: 3.8, refRangeMaxFemale: 4.8 },
      { name: "Platelet Count", unit: "lacs/c.mm", genderRefType: "BOTH", refRangeMin: 1.5, refRangeMax: 4.5 },
      { name: "Packed Cell Volume (PCV)", unit: "%", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 40, refRangeMaxMale: 50, refRangeMinFemale: 36, refRangeMaxFemale: 46 },
      { name: "Mean Corpuscular Volume (MCV)", unit: "fL", genderRefType: "BOTH", refRangeMin: 83, refRangeMax: 101 },
      { name: "Mean Corpuscular Hemoglobin (MCH)", unit: "pg", genderRefType: "BOTH", refRangeMin: 27, refRangeMax: 32 },
      { name: "MCHC", unit: "g/dL", genderRefType: "BOTH", refRangeMin: 31.5, refRangeMax: 34.5 },
    ]
  },
  {
    name: "Liver Function Test (LFT)",
    category: "Biochemistry",
    type: "Pathology",
    price: 600,
    subTests: [
      { name: "Bilirubin Total", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0.2, refRangeMax: 1.2 },
      { name: "Bilirubin Direct", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0.0, refRangeMax: 0.3 },
      { name: "Bilirubin Indirect", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0.2, refRangeMax: 0.8 },
      { name: "SGOT (AST)", unit: "U/L", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 0, refRangeMaxMale: 40, refRangeMinFemale: 0, refRangeMaxFemale: 32 },
      { name: "SGPT (ALT)", unit: "U/L", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 0, refRangeMaxMale: 41, refRangeMinFemale: 0, refRangeMaxFemale: 33 },
      { name: "Alkaline Phosphatase (ALP)", unit: "U/L", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 40, refRangeMaxMale: 129, refRangeMinFemale: 35, refRangeMaxFemale: 104 },
      { name: "Total Protein", unit: "g/dL", genderRefType: "BOTH", refRangeMin: 6.4, refRangeMax: 8.3 },
      { name: "Albumin", unit: "g/dL", genderRefType: "BOTH", refRangeMin: 3.5, refRangeMax: 5.2 },
      { name: "Globulin", unit: "g/dL", genderRefType: "BOTH", refRangeMin: 2.0, refRangeMax: 3.5 },
      { name: "A:G Ratio", unit: "Ratio", genderRefType: "BOTH", refRangeMin: 1.1, refRangeMax: 2.2 },
    ]
  },
  {
    name: "Kidney Function Test (KFT)",
    category: "Biochemistry",
    type: "Pathology",
    price: 700,
    subTests: [
      { name: "Blood Urea", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 15, refRangeMax: 40 },
      { name: "Serum Creatinine", unit: "mg/dL", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 0.9, refRangeMaxMale: 1.3, refRangeMinFemale: 0.6, refRangeMaxFemale: 1.1 },
      { name: "Uric Acid", unit: "mg/dL", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 3.4, refRangeMaxMale: 7.0, refRangeMinFemale: 2.4, refRangeMaxFemale: 5.7 },
      { name: "Sodium (Na+)", unit: "mEq/L", genderRefType: "BOTH", refRangeMin: 136, refRangeMax: 145 },
      { name: "Potassium (K+)", unit: "mEq/L", genderRefType: "BOTH", refRangeMin: 3.5, refRangeMax: 5.1 },
      { name: "Chloride (Cl-)", unit: "mEq/L", genderRefType: "BOTH", refRangeMin: 98, refRangeMax: 107 },
    ]
  },
  {
    name: "Thyroid Profile (T3, T4, TSH)",
    category: "Hormones",
    type: "Pathology",
    price: 800,
    subTests: [
      { name: "Total Triiodothyronine (T3)", unit: "ng/dL", genderRefType: "BOTH", refRangeMin: 80, refRangeMax: 200 },
      { name: "Total Thyroxine (T4)", unit: "µg/dL", genderRefType: "BOTH", refRangeMin: 5.1, refRangeMax: 14.1 },
      { name: "Thyroid Stimulating Hormone (TSH)", unit: "µIU/mL", genderRefType: "BOTH", refRangeMin: 0.27, refRangeMax: 4.2 },
    ]
  },
  {
    name: "Lipid Profile",
    category: "Biochemistry",
    type: "Pathology",
    price: 650,
    subTests: [
      { name: "Total Cholesterol", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0, refRangeMax: 200 },
      { name: "Triglycerides", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0, refRangeMax: 150 },
      { name: "HDL Cholesterol", unit: "mg/dL", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 40, refRangeMaxMale: 60, refRangeMinFemale: 50, refRangeMaxFemale: 70 },
      { name: "LDL Cholesterol", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 0, refRangeMax: 100 },
      { name: "VLDL Cholesterol", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 5, refRangeMax: 40 },
      { name: "TC/HDL Ratio", unit: "Ratio", genderRefType: "BOTH", refRangeMin: 3.3, refRangeMax: 4.4 },
    ]
  },
  {
    name: "Iron Studies",
    category: "Biochemistry",
    type: "Pathology",
    price: 900,
    subTests: [
      { name: "Total Iron", unit: "µg/dL", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 65, refRangeMaxMale: 175, refRangeMinFemale: 50, refRangeMaxFemale: 170 },
      { name: "Total Iron Binding Capacity (TIBC)", unit: "µg/dL", genderRefType: "BOTH", refRangeMin: 250, refRangeMax: 450 },
      { name: "Transferrin Saturation", unit: "%", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 20, refRangeMaxMale: 50, refRangeMinFemale: 15, refRangeMaxFemale: 50 },
    ]
  },
  {
    name: "Diabetes Profile",
    category: "Biochemistry",
    type: "Pathology",
    price: 550,
    subTests: [
      { name: "Fasting Blood Sugar (FBS)", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 70, refRangeMax: 100 },
      { name: "Post Prandial Blood Sugar (PPBS)", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 70, refRangeMax: 140 },
      { name: "HbA1c (Glycosylated Hemoglobin)", unit: "%", genderRefType: "BOTH", refRangeMin: 4.0, refRangeMax: 5.6 },
      { name: "Estimated Average Glucose (eAG)", unit: "mg/dL", genderRefType: "BOTH", refRangeMin: 68, refRangeMax: 114 },
    ]
  },
  {
    name: "Absolute Eosinophils Count (AEC)",
    category: "Hematology",
    type: "Pathology",
    price: 250,
    subTests: [
      { name: "Absolute Eosinophils Count", unit: "cells/c.mm", genderRefType: "BOTH", refRangeMin: 40, refRangeMax: 400 },
    ]
  },
  {
    name: "Alkaline Phosphatase (ALP)",
    category: "Biochemistry",
    type: "Pathology",
    price: 300,
    subTests: [
      { name: "Alkaline Phosphatase (ALP)", unit: "U/L", genderRefType: "GENDER_SPECIFIC", refRangeMinMale: 40, refRangeMaxMale: 129, refRangeMinFemale: 35, refRangeMaxFemale: 104 },
    ]
  },
  {
    name: "Beta Human Chorionic Gonadotropin (HCG)",
    category: "Hormones",
    type: "Pathology",
    price: 800,
    subTests: [
      { name: "Beta HCG (Non-pregnant)", unit: "mIU/mL", genderRefType: "BOTH", refRangeMin: 0, refRangeMax: 5 },
    ]
  },
  {
    name: "Vitamin Profile",
    category: "Vitamins",
    type: "Pathology",
    price: 1500,
    subTests: [
      { name: "Vitamin B12", unit: "pg/mL", genderRefType: "BOTH", refRangeMin: 211, refRangeMax: 911 },
      { name: "Vitamin D (25-OH)", unit: "ng/mL", genderRefType: "BOTH", refRangeMin: 30, refRangeMax: 100 },
    ]
  }
];

async function seed() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found to assign tests to.");
  
  const labId = user.labId;

  // Cleanup old tests first to avoid clutter
  await prisma.reportTest.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.test.deleteMany({}); // Delete all existing tests so we have a clean slate

  for (const pkg of testData) {
    const parentId = `parent-${pkg.name.replace(/\s+/g, '_')}-${Date.now()}`;
    
    await prisma.test.create({
      data: {
        id: parentId,
        labId,
        name: pkg.name,
        category: pkg.category,
        type: pkg.type,
        price: pkg.price,
        genderRefType: "BOTH",
        subTests: {
          create: pkg.subTests.map((sub, idx) => ({
            id: `sub-${parentId}-${idx}`,
            labId,
            name: sub.name,
            category: pkg.category,
            type: pkg.type,
            price: 0,
            unit: sub.unit,
            genderRefType: sub.genderRefType,
            refRangeMin: sub.refRangeMin || null,
            refRangeMax: sub.refRangeMax || null,
            refRangeMinMale: sub.refRangeMinMale || null,
            refRangeMaxMale: sub.refRangeMaxMale || null,
            refRangeMinFemale: sub.refRangeMinFemale || null,
            refRangeMaxFemale: sub.refRangeMaxFemale || null,
          }))
        }
      }
    });
    console.log(`Created Main Test Package: ${pkg.name} with ${pkg.subTests.length} parameters`);
  }
}

seed().then(() => prisma.$disconnect()).catch(e => console.error(e));
