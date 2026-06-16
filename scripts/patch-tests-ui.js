const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dashboard/tests/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// SubTestState needs fieldType
content = content.replace(
  'refRangeMaxFemale: string;\n  subTests?: SubTestState[];\n}',
  'refRangeMaxFemale: string;\n  subTests?: SubTestState[];\n  fieldType?: string;\n}'
);

// Remove fieldType state from the top
content = content.replace(
  'const [category, setCategory] = useState("CBC");\n  const [fieldType, setFieldType] = useState("Single Field");',
  'const [category, setCategory] = useState("CBC");'
);

// In handleOpenAddDialog, remove setFieldType
content = content.replace(
  'setName(""); setCategory(standardCategories[0]); setCustomCategory(""); setFieldType("Single Field"); setType("Pathology");',
  'setName(""); setCategory(standardCategories[0]); setCustomCategory(""); setType("Pathology");'
);
content = content.replace(
  'setSubTests([{ name: "", unit: "", genderRefType: "BOTH", refRangeMin: "", refRangeMax: "", refRangeMinMale: "", refRangeMaxMale: "", refRangeMinFemale: "", refRangeMaxFemale: "" }]);',
  'setSubTests([{ name: "", unit: "", genderRefType: "BOTH", refRangeMin: "", refRangeMax: "", refRangeMinMale: "", refRangeMaxMale: "", refRangeMinFemale: "", refRangeMaxFemale: "", fieldType: "Single Field" }]);'
);

// In handleOpenEditDialog, remove setFieldType
content = content.replace(
  'setCustomCategory(standardCategories.includes(test.category) ? "" : test.category);\n    setFieldType(test.fieldType || "Single Field");\n    setType(test.type || "Pathology");',
  'setCustomCategory(standardCategories.includes(test.category) ? "" : test.category);\n    setType(test.type || "Pathology");'
);

// In mapping subTests in handleOpenEditDialog, set fieldType on the sub test
content = content.replace(
  'refRangeMinFemale: sub.refRangeMinFemale?.toString() || "",\n          refRangeMaxFemale: sub.refRangeMaxFemale?.toString() || "",\n          subTests:',
  'refRangeMinFemale: sub.refRangeMinFemale?.toString() || "",\n          refRangeMaxFemale: sub.refRangeMaxFemale?.toString() || "",\n          fieldType: sub.fieldType || "Single Field",\n          subTests:'
);

// handleAddSubTest should default fieldType to "Single Field"
content = content.replace(
  'refRangeMinMale: "", refRangeMaxMale: "", refRangeMinFemale: "", refRangeMaxFemale: ""\n    }]);',
  'refRangeMinMale: "", refRangeMaxMale: "", refRangeMinFemale: "", refRangeMaxFemale: "", fieldType: "Single Field"\n    }]);'
);

// Remove fieldType from handleSaveTest payload
content = content.replace(
  'name: name.trim(), category: finalCategory, fieldType, type, price: parseFloat(price),',
  'name: name.trim(), category: finalCategory, fieldType: "Group", type, price: parseFloat(price),'
);

// Update payload for subTests in handleSaveTest to include fieldType and check sub.fieldType
content = content.replace(
  'refRangeMaxFemale: sub.refRangeMaxFemale,\n            subTests: fieldType === "Multiple Field" && sub.subTests ? sub.subTests.map(ss => ({',
  'refRangeMaxFemale: sub.refRangeMaxFemale,\n            fieldType: sub.fieldType || "Single Field",\n            subTests: sub.fieldType === "Multiple Field" && sub.subTests ? sub.subTests.map(ss => ({'
);

// Remove the Field Type dropdown from the main form
content = content.replace(
  /<div className="grid grid-cols-3 gap-4">\s*<div className="space-y-1\.5">\s*<Label>Field Type<\/Label>[\s\S]*?<\/Select>\s*<\/div>\s*<div className="space-y-1\.5">\s*<Label>Category<\/Label>/,
  '<div className="grid grid-cols-2 gap-4">\n                <div className="space-y-1.5">\n                  <Label>Category</Label>'
);

// Now update the rendering of the sub tests to include the Field Type dropdown
const parameterHeaderOld = `<div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs">{index + 1}</div>
                        <h4 className="text-sm font-semibold text-foreground">Parameter Details</h4>
                      </div>
                      <button type="button" onClick={() => handleRemoveSubTest(index)} className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>`;

const parameterHeaderNew = `<div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs">{index + 1}</div>
                        <h4 className="text-sm font-semibold text-foreground">Parameter Details</h4>
                        <Select value={sub.fieldType || "Single Field"} onValueChange={(val) => updateSubTest(index, "fieldType", val)}>
                          <SelectTrigger className="ml-4 h-7 text-xs w-[140px] border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single Field">Single Field</SelectItem>
                            <SelectItem value="Multiple Field">Multiple Field</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <button type="button" onClick={() => handleRemoveSubTest(index)} className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>`;

content = content.replace(parameterHeaderOld, parameterHeaderNew);

// In the range UI, replace `fieldType === "Single Field"` with `sub.fieldType === "Single Field" || !sub.fieldType`
content = content.replace(
  '{fieldType === "Single Field" ? (',
  '{(!sub.fieldType || sub.fieldType === "Single Field") ? ('
);

fs.writeFileSync(filePath, content);
console.log('UI updated successfully!');
