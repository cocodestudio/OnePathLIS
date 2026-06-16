const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dashboard/tests/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Test interface
content = content.replace(
  'interface Test {\n  id: string; name: string; category: string; type: string; price: number;',
  'interface Test {\n  id: string; name: string; category: string; fieldType: string; type: string; price: number;'
);

// 2. Update SubTestState interface
content = content.replace(
  'refRangeMaxFemale: string;\n}',
  'refRangeMaxFemale: string;\n  subTests?: SubTestState[];\n}'
);

// 3. Add fieldType state
content = content.replace(
  'const [category, setCategory] = useState("CBC");',
  'const [category, setCategory] = useState("CBC");\n  const [fieldType, setFieldType] = useState("Single Field");'
);

// 4. Update handleOpenAddDialog
content = content.replace(
  'setName(""); setCategory(standardCategories[0]); setCustomCategory(""); setType("Pathology");',
  'setName(""); setCategory(standardCategories[0]); setCustomCategory(""); setFieldType("Single Field"); setType("Pathology");'
);

// 5. Update handleOpenEditDialog
content = content.replace(
  'setCustomCategory(standardCategories.includes(test.category) ? "" : test.category);\n    setType(test.type || "Pathology");',
  'setCustomCategory(standardCategories.includes(test.category) ? "" : test.category);\n    setFieldType(test.fieldType || "Single Field");\n    setType(test.type || "Pathology");'
);

// 6. Map nested subTests in handleOpenEditDialog
content = content.replace(
  'refRangeMaxFemale: sub.refRangeMaxFemale?.toString() || "",\n      })));',
  'refRangeMaxFemale: sub.refRangeMaxFemale?.toString() || "",\n        subTests: sub.subTests ? sub.subTests.map(subsub => ({\n          id: subsub.id,\n          name: subsub.name,\n          unit: subsub.unit || "",\n          genderRefType: subsub.genderRefType || "BOTH",\n          refRangeMin: subsub.refRangeMin?.toString() || "",\n          refRangeMax: subsub.refRangeMax?.toString() || "",\n          refRangeMinMale: subsub.refRangeMinMale?.toString() || "",\n          refRangeMaxMale: subsub.refRangeMaxMale?.toString() || "",\n          refRangeMinFemale: subsub.refRangeMinFemale?.toString() || "",\n          refRangeMaxFemale: subsub.refRangeMaxFemale?.toString() || "",\n        })) : []\n      })));'
);

// 7. Add handleAddSubSubTest, handleRemoveSubSubTest, updateSubSubTest
const subSubTestLogic = `
  const handleAddSubSubTest = (index: number) => {
    const updated = [...subTests];
    if (!updated[index].subTests) updated[index].subTests = [];
    updated[index].subTests!.push({
      name: "", unit: "", genderRefType: "BOTH", refRangeMin: "", refRangeMax: "",
      refRangeMinMale: "", refRangeMaxMale: "", refRangeMinFemale: "", refRangeMaxFemale: ""
    });
    setSubTests(updated);
  };

  const handleRemoveSubSubTest = (index: number, subIndex: number) => {
    const updated = [...subTests];
    updated[index].subTests = updated[index].subTests!.filter((_, i) => i !== subIndex);
    setSubTests(updated);
  };

  const updateSubSubTest = (index: number, subIndex: number, field: keyof SubTestState, value: string) => {
    const updated = [...subTests];
    updated[index].subTests![subIndex] = { ...updated[index].subTests![subIndex], [field]: value };
    setSubTests(updated);
  };

  const handleSaveTest = async (e: React.FormEvent) => {`;

content = content.replace('  const handleSaveTest = async (e: React.FormEvent) => {', subSubTestLogic);

// 8. Update handleSaveTest to send fieldType and nested subTests
const postDataReplace = `body: JSON.stringify({ 
          name: name.trim(), category: finalCategory, type, price: parseFloat(price),
          subTests: subTests.map(sub => ({
            id: sub.id,
            name: sub.name.trim(),
            unit: sub.unit.trim(),
            genderRefType: sub.genderRefType,
            refRangeMin: sub.refRangeMin,
            refRangeMax: sub.refRangeMax,
            refRangeMinMale: sub.refRangeMinMale,
            refRangeMaxMale: sub.refRangeMaxMale,
            refRangeMinFemale: sub.refRangeMinFemale,
            refRangeMaxFemale: sub.refRangeMaxFemale,
          }))
        }),`;

const postDataReplacement = `body: JSON.stringify({ 
          name: name.trim(), category: finalCategory, fieldType, type, price: parseFloat(price),
          subTests: subTests.map(sub => ({
            id: sub.id,
            name: sub.name.trim(),
            unit: sub.unit.trim(),
            genderRefType: sub.genderRefType,
            refRangeMin: sub.refRangeMin,
            refRangeMax: sub.refRangeMax,
            refRangeMinMale: sub.refRangeMinMale,
            refRangeMaxMale: sub.refRangeMaxMale,
            refRangeMinFemale: sub.refRangeMinFemale,
            refRangeMaxFemale: sub.refRangeMaxFemale,
            subTests: fieldType === "Multiple Field" && sub.subTests ? sub.subTests.map(ss => ({
              id: ss.id,
              name: ss.name.trim(),
              unit: ss.unit.trim(),
              genderRefType: ss.genderRefType,
              refRangeMin: ss.refRangeMin,
              refRangeMax: ss.refRangeMax,
              refRangeMinMale: ss.refRangeMinMale,
              refRangeMaxMale: ss.refRangeMaxMale,
              refRangeMinFemale: ss.refRangeMinFemale,
              refRangeMaxFemale: ss.refRangeMaxFemale,
            })) : undefined
          }))
        }),`;

content = content.replace(postDataReplace, postDataReplacement);

// 9. Update the UI to include fieldType dropdown
const fieldTypeUI = `<div className="space-y-1.5">
                  <Label>Category</Label>`;
const fieldTypeUIReplacement = `<div className="space-y-1.5">
                  <Label>Field Type</Label>
                  <Select value={fieldType} onValueChange={setFieldType} disabled={!!editingTest}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Field">Single Field</SelectItem>
                    <SelectItem value="Multiple Field">Multiple Field</SelectItem>
                  </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>`;
content = content.replace(fieldTypeUI, fieldTypeUIReplacement);

// 10. Change grid-cols-2 to grid-cols-3 for the row above Category
content = content.replace('<div className="grid grid-cols-2 gap-4">\n                <div className="space-y-1.5">\n                  <Label>Category</Label>', '<div className="grid grid-cols-2 gap-4">\n                <div className="space-y-1.5">\n                  <Label>Field Type</Label>\n                  <Select value={fieldType} onValueChange={setFieldType} disabled={!!editingTest}>\n                  <SelectTrigger><SelectValue /></SelectTrigger>\n                  <SelectContent>\n                    <SelectItem value="Single Field">Single Field</SelectItem>\n                    <SelectItem value="Multiple Field">Multiple Field</SelectItem>\n                  </SelectContent>\n                  </Select>\n                </div>\n                <div className="space-y-1.5">\n                  <Label>Category</Label>');

// wait, the previous replace probably missed because of exact spacing, let's just use regex for the category row
content = content.replace(/<div className="grid grid-cols-2 gap-4">\s*<div className="space-y-1\.5">\s*<Label>Category<\/Label>/, `<div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Field Type</Label>
                  <Select value={fieldType} onValueChange={setFieldType} disabled={!!editingTest}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Field">Single Field</SelectItem>
                    <SelectItem value="Multiple Field">Multiple Field</SelectItem>
                  </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>`);

// 11. Replace the inner subtest rendering with logic for Multiple Field
const rangeUI = `                      <div className="bg-background rounded-lg border border-border/50 p-3">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-xs text-muted-foreground">Reference Range</Label>
                          <Select value={sub.genderRefType} onValueChange={(val) => updateSubTest(index, "genderRefType", val)}>
                            <SelectTrigger className="h-7 text-xs w-[130px] border-border"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BOTH">Universal</SelectItem>
                              <SelectItem value="GENDER_SPECIFIC">Gender Specific</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {sub.genderRefType === "BOTH" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-[10px]">Min</Label><Input type="number" step="0.0001" placeholder="12.0" value={sub.refRangeMin} onChange={(e) => updateSubTest(index, "refRangeMin", e.target.value)} className="h-7 text-xs font-mono" /></div>
                            <div className="space-y-1"><Label className="text-[10px]">Max</Label><Input type="number" step="0.0001" placeholder="16.0" value={sub.refRangeMax} onChange={(e) => updateSubTest(index, "refRangeMax", e.target.value)} className="h-7 text-xs font-mono" /></div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[10px] text-blue-500">Male Min</Label><Input type="number" step="0.0001" value={sub.refRangeMinMale} onChange={(e) => updateSubTest(index, "refRangeMinMale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                              <div className="space-y-1"><Label className="text-[10px] text-blue-500">Male Max</Label><Input type="number" step="0.0001" value={sub.refRangeMaxMale} onChange={(e) => updateSubTest(index, "refRangeMaxMale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[10px] text-pink-500">Female Min</Label><Input type="number" step="0.0001" value={sub.refRangeMinFemale} onChange={(e) => updateSubTest(index, "refRangeMinFemale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                              <div className="space-y-1"><Label className="text-[10px] text-pink-500">Female Max</Label><Input type="number" step="0.0001" value={sub.refRangeMaxFemale} onChange={(e) => updateSubTest(index, "refRangeMaxFemale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                            </div>
                          </div>
                        )}
                      </div>`;

const newRangeUI = `                      {fieldType === "Single Field" ? (
                      <div className="bg-background rounded-lg border border-border/50 p-3">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-xs text-muted-foreground">Reference Range</Label>
                          <Select value={sub.genderRefType} onValueChange={(val) => updateSubTest(index, "genderRefType", val)}>
                            <SelectTrigger className="h-7 text-xs w-[130px] border-border"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BOTH">Universal</SelectItem>
                              <SelectItem value="GENDER_SPECIFIC">Gender Specific</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {sub.genderRefType === "BOTH" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-[10px]">Min</Label><Input type="number" step="0.0001" placeholder="12.0" value={sub.refRangeMin} onChange={(e) => updateSubTest(index, "refRangeMin", e.target.value)} className="h-7 text-xs font-mono" /></div>
                            <div className="space-y-1"><Label className="text-[10px]">Max</Label><Input type="number" step="0.0001" placeholder="16.0" value={sub.refRangeMax} onChange={(e) => updateSubTest(index, "refRangeMax", e.target.value)} className="h-7 text-xs font-mono" /></div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[10px] text-blue-500">Male Min</Label><Input type="number" step="0.0001" value={sub.refRangeMinMale} onChange={(e) => updateSubTest(index, "refRangeMinMale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                              <div className="space-y-1"><Label className="text-[10px] text-blue-500">Male Max</Label><Input type="number" step="0.0001" value={sub.refRangeMaxMale} onChange={(e) => updateSubTest(index, "refRangeMaxMale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-[10px] text-pink-500">Female Min</Label><Input type="number" step="0.0001" value={sub.refRangeMinFemale} onChange={(e) => updateSubTest(index, "refRangeMinFemale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                              <div className="space-y-1"><Label className="text-[10px] text-pink-500">Female Max</Label><Input type="number" step="0.0001" value={sub.refRangeMaxFemale} onChange={(e) => updateSubTest(index, "refRangeMaxFemale", e.target.value)} className="h-7 text-xs font-mono" /></div>
                            </div>
                          </div>
                        )}
                      </div>
                      ) : (
                        <div className="mt-4 border-t border-border/50 pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <Label className="text-xs font-semibold text-muted-foreground">Sub-Parameters</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddSubSubTest(index)} className="h-6 text-[10px] px-2"><Plus className="h-3 w-3 mr-1"/> Add Sub-Parameter</Button>
                          </div>
                          <div className="space-y-3">
                            {sub.subTests && sub.subTests.map((subsub, sIdx) => (
                              <div key={sIdx} className="bg-background rounded-lg border border-border/50 p-3 relative group/sub">
                                <button type="button" onClick={() => handleRemoveSubSubTest(index, sIdx)} className="absolute right-2 top-2 p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover/sub:opacity-100 transition-all"><Trash2 className="h-3 w-3" /></button>
                                <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                                  <div className="space-y-1"><Label className="text-[10px]">Name</Label><Input placeholder="Sub Name" value={subsub.name} onChange={(e) => updateSubSubTest(index, sIdx, "name", e.target.value)} className="h-7 text-xs" required /></div>
                                  <div className="space-y-1"><Label className="text-[10px]">Unit</Label><Input placeholder="Unit" value={subsub.unit} onChange={(e) => updateSubSubTest(index, sIdx, "unit", e.target.value)} className="h-7 text-xs" /></div>
                                </div>
                                <div className="flex justify-between items-center mb-2 mt-2 border-t border-border/30 pt-2">
                                  <Label className="text-[10px] text-muted-foreground">Ref Range</Label>
                                  <Select value={subsub.genderRefType} onValueChange={(val) => updateSubSubTest(index, sIdx, "genderRefType", val)}>
                                    <SelectTrigger className="h-6 text-[10px] w-[110px] border-border"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="BOTH">Universal</SelectItem>
                                      <SelectItem value="GENDER_SPECIFIC">Gender</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {subsub.genderRefType === "BOTH" ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label className="text-[10px]">Min</Label><Input type="number" step="0.0001" value={subsub.refRangeMin} onChange={(e) => updateSubSubTest(index, sIdx, "refRangeMin", e.target.value)} className="h-6 text-xs font-mono" /></div>
                                    <div className="space-y-1"><Label className="text-[10px]">Max</Label><Input type="number" step="0.0001" value={subsub.refRangeMax} onChange={(e) => updateSubSubTest(index, sIdx, "refRangeMax", e.target.value)} className="h-6 text-xs font-mono" /></div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1"><Label className="text-[10px] text-blue-500">Male Min</Label><Input type="number" step="0.0001" value={subsub.refRangeMinMale} onChange={(e) => updateSubSubTest(index, sIdx, "refRangeMinMale", e.target.value)} className="h-6 text-xs font-mono" /></div>
                                      <div className="space-y-1"><Label className="text-[10px] text-blue-500">Male Max</Label><Input type="number" step="0.0001" value={subsub.refRangeMaxMale} onChange={(e) => updateSubSubTest(index, sIdx, "refRangeMaxMale", e.target.value)} className="h-6 text-xs font-mono" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1"><Label className="text-[10px] text-pink-500">Fem Min</Label><Input type="number" step="0.0001" value={subsub.refRangeMinFemale} onChange={(e) => updateSubSubTest(index, sIdx, "refRangeMinFemale", e.target.value)} className="h-6 text-xs font-mono" /></div>
                                      <div className="space-y-1"><Label className="text-[10px] text-pink-500">Fem Max</Label><Input type="number" step="0.0001" value={subsub.refRangeMaxFemale} onChange={(e) => updateSubSubTest(index, sIdx, "refRangeMaxFemale", e.target.value)} className="h-6 text-xs font-mono" /></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}`;

content = content.replace(rangeUI, newRangeUI);

fs.writeFileSync(filePath, content);
console.log('Update complete!');
