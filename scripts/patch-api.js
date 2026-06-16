const fs = require('fs');

// Patch tests POST route
let postRoute = fs.readFileSync('src/app/api/tests/route.ts', 'utf8');
postRoute = postRoute.replace(
  'const { name, category, type, price, unit, genderRefType, refRangeMin, refRangeMax, refRangeMinMale, refRangeMaxMale, refRangeMinFemale, refRangeMaxFemale, subTests, fieldType } = body;',
  'const { name, category, type, price, unit, genderRefType, refRangeMin, refRangeMax, refRangeMinMale, refRangeMaxMale, refRangeMinFemale, refRangeMaxFemale, subTests, fieldType, interpretation } = body;'
);
postRoute = postRoute.replace(
  'fieldType: fieldType || "Single Field",',
  'fieldType: fieldType || "Single Field",\n        interpretation: interpretation || null,'
);
postRoute = postRoute.replace(
  'fieldType: "Group",',
  'fieldType: "Group",\n        interpretation: interpretation || null,'
);
fs.writeFileSync('src/app/api/tests/route.ts', postRoute);

// Patch tests PUT route
let putRoute = fs.readFileSync('src/app/api/tests/[id]/route.ts', 'utf8');
putRoute = putRoute.replace(
  'const { name, category, type, price, unit, genderRefType, refRangeMin, refRangeMax, refRangeMinMale, refRangeMaxMale, refRangeMinFemale, refRangeMaxFemale, subTests, fieldType } = body;',
  'const { name, category, type, price, unit, genderRefType, refRangeMin, refRangeMax, refRangeMinMale, refRangeMaxMale, refRangeMinFemale, refRangeMaxFemale, subTests, fieldType, interpretation } = body;'
);
putRoute = putRoute.replace(
  'type: type !== undefined ? type : test.type,',
  'type: type !== undefined ? type : test.type,\n          interpretation: interpretation !== undefined ? interpretation : test.interpretation,'
);
fs.writeFileSync('src/app/api/tests/[id]/route.ts', putRoute);

// Patch reports PUT route
let reportPutRoute = fs.readFileSync('src/app/api/reports/[id]/route.ts', 'utf8');
reportPutRoute = reportPutRoute.replace(
  'const { results, isCompleted } = body;',
  'const { results, isCompleted, printedInterpretations } = body;'
);
reportPutRoute = reportPutRoute.replace(
  'status: "COMPLETED",',
  'status: "COMPLETED",\n        printedInterpretations: printedInterpretations !== undefined ? JSON.stringify(printedInterpretations) : undefined,'
);
reportPutRoute = reportPutRoute.replace(
  'status: "PENDING",',
  'status: "PENDING",\n        printedInterpretations: printedInterpretations !== undefined ? JSON.stringify(printedInterpretations) : undefined,'
);
fs.writeFileSync('src/app/api/reports/[id]/route.ts', reportPutRoute);

console.log('APIs patched.');
