const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/reports/[id]/edit/page.tsx', 'utf8');

// 1. Add printedInterpretations state
if (!content.includes('const [printedInterpretations')) {
  content = content.replace(
    'const [isCompleted, setIsCompleted] = useState(false);',
    'const [isCompleted, setIsCompleted] = useState(false);\n  const [printedInterpretations, setPrintedInterpretations] = useState<string[]>([]);'
  );
}

// 2. Parse printedInterpretations when report loads
if (!content.includes('setPrintedInterpretations(parsed)')) {
  content = content.replace(
    'setIsCompleted(data.status === "COMPLETED");',
    'setIsCompleted(data.status === "COMPLETED");\n          if (data.printedInterpretations) {\n            try {\n              const parsed = JSON.parse(data.printedInterpretations);\n              setPrintedInterpretations(Array.isArray(parsed) ? parsed : []);\n            } catch(e) {}\n          }'
  );
}

// 3. Add toggle function
if (!content.includes('toggleInterpretation')) {
  content = content.replace(
    'const handleSave = async () => {',
    `const toggleInterpretation = (testId: string) => {\n    setPrintedInterpretations(prev => \n      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]\n    );\n  };\n\n  const handleSave = async () => {`
  );
}

// 4. Update save payload
content = content.replace(
  'isCompleted,',
  'isCompleted,\n          printedInterpretations,'
);

// 5. Add checkbox in UI
if (!content.includes('Add Interpretation')) {
  content = content.replace(
    /<h3 className="text-sm font-semibold text-primary uppercase tracking-wider">\{mainTestName\}<\/h3>/g,
    `<h3 className="text-sm font-semibold text-primary uppercase tracking-wider">{mainTestName}</h3>
                  {groupedResults[mainTestName]["_default"] && groupedResults[mainTestName]["_default"][0] && groupedResults[mainTestName]["_default"][0].test.parent && groupedResults[mainTestName]["_default"][0].test.parent.interpretation && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Checkbox id={\`interp-\${groupedResults[mainTestName]["_default"][0].test.parentId}\`} checked={printedInterpretations.includes(groupedResults[mainTestName]["_default"][0].test.parentId)} onCheckedChange={() => toggleInterpretation(groupedResults[mainTestName]["_default"][0].test.parentId)} />
                      <Label htmlFor={\`interp-\${groupedResults[mainTestName]["_default"][0].test.parentId}\`} className="text-xs text-muted-foreground font-normal">Add Interpretation</Label>
                    </div>
                  )}`
  );
}

fs.writeFileSync('src/app/dashboard/reports/[id]/edit/page.tsx', content);
console.log('Report edit UI patched');
