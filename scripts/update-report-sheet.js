const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/report-sheet.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Test interface
content = content.replace(
  'interface Test { \n  id: string; name: string; category: string; price: number; unit: string; \n  genderRefType?: string; refRangeMin: number; refRangeMax: number; \n  refRangeMinMale?: number | null; refRangeMaxMale?: number | null; \n  refRangeMinFemale?: number | null; refRangeMaxFemale?: number | null;\n}',
  'interface Test { \n  id: string; name: string; category: string; price: number; unit: string; \n  genderRefType?: string; refRangeMin: number; refRangeMax: number; \n  refRangeMinMale?: number | null; refRangeMaxMale?: number | null; \n  refRangeMinFemale?: number | null; refRangeMaxFemale?: number | null;\n  parent?: { name: string; parent?: { name: string } };\n}'
);

// 2. Change grouping logic
const oldGrouping = `    const groupedTests: Record<string, ReportTest[]> = {};
    report.results.forEach((item) => { (groupedTests[item.test.category] ||= []).push(item); });`;

const newGrouping = `    const groupedTests: Record<string, Record<string, Record<string, ReportTest[]>>> = {};
    report.results.forEach((item) => {
      const cat = item.test.category;
      if (!groupedTests[cat]) groupedTests[cat] = {};
      
      let mainTestName = item.test.name;
      let paramName = "_default";

      if (item.test.parent) {
        if (item.test.parent.parent) {
          mainTestName = item.test.parent.parent.name;
          paramName = item.test.parent.name;
        } else {
          mainTestName = item.test.parent.name;
        }
      }
      
      if (!groupedTests[cat][mainTestName]) groupedTests[cat][mainTestName] = {};
      if (!groupedTests[cat][mainTestName][paramName]) groupedTests[cat][mainTestName][paramName] = [];
      
      groupedTests[cat][mainTestName][paramName].push(item);
    });`;

content = content.replace(oldGrouping, newGrouping);

// 3. Change rendering logic
const oldRender = `              Object.entries(groupedTests).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest border-b border-zinc-200 pb-1" style={{ color: EMERALD_DARK }}>{category} Report</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200">
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Test</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Result</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Flag</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Reference</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {items.map((item) => {
                        const flag = getFlag(item, report.patient.gender);
                        return (
                          <tr key={item.id} className={item.isAbnormal ? "bg-red-50/60" : ""}>
                            <td className="p-2.5 font-medium text-zinc-800">{item.test.name}</td>
                            <td className={\`p-2.5 \${item.isAbnormal ? "text-red-600 font-extrabold" : "text-zinc-800 font-bold"}\`}>{item.resultValue}</td>
                            <td className="p-2.5 font-bold">
                              {flag === "H" && <span className="inline-flex items-center gap-0.5 text-red-600"><ArrowUp className="h-3 w-3 stroke-[3]" /> H</span>}
                              {flag === "L" && <span className="inline-flex items-center gap-0.5 text-red-600"><ArrowDown className="h-3 w-3 stroke-[3]" /> L</span>}
                              {flag === "N" && <span className="inline-flex items-center gap-0.5" style={{ color: EMERALD_MID }}><Check className="h-3 w-3 stroke-[3]" /> N</span>}
                            </td>
                            <td className="p-2.5 text-zinc-500 font-semibold">{getRefRangeStr(item.test, report.patient.gender)}</td>
                            <td className="p-2.5 text-zinc-500 font-semibold">{item.test.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))`;

const newRender = `              Object.entries(groupedTests).map(([category, mainTests]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest border-b border-zinc-200 pb-1" style={{ color: EMERALD_DARK }}>{category} Report</h3>
                  {Object.entries(mainTests).map(([mainTestName, paramsObj]) => (
                    <div key={mainTestName} className="mb-4">
                      <h4 className="text-xs font-bold text-zinc-800 mb-2 uppercase">{mainTestName}</h4>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 border-b border-zinc-200">
                            <th className="p-2.5 font-bold text-zinc-800 uppercase">Test</th>
                            <th className="p-2.5 font-bold text-zinc-800 uppercase">Result</th>
                            <th className="p-2.5 font-bold text-zinc-800 uppercase">Flag</th>
                            <th className="p-2.5 font-bold text-zinc-800 uppercase">Reference</th>
                            <th className="p-2.5 font-bold text-zinc-800 uppercase">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {Object.entries(paramsObj).map(([paramName, items]) => (
                            <React.Fragment key={paramName}>
                              {paramName !== "_default" && (
                                <tr className="bg-zinc-50">
                                  <td colSpan={5} className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{paramName}</td>
                                </tr>
                              )}
                              {items.map((item) => {
                                const flag = getFlag(item, report.patient.gender);
                                return (
                                  <tr key={item.id} className={item.isAbnormal ? "bg-red-50/60" : ""}>
                                    <td className={\`p-2.5 font-medium text-zinc-800 \${paramName !== "_default" ? "pl-5" : ""}\`}>{item.test.name}</td>
                                    <td className={\`p-2.5 \${item.isAbnormal ? "text-red-600 font-extrabold" : "text-zinc-800 font-bold"}\`}>{item.resultValue}</td>
                                    <td className="p-2.5 font-bold">
                                      {flag === "H" && <span className="inline-flex items-center gap-0.5 text-red-600"><ArrowUp className="h-3 w-3 stroke-[3]" /> H</span>}
                                      {flag === "L" && <span className="inline-flex items-center gap-0.5 text-red-600"><ArrowDown className="h-3 w-3 stroke-[3]" /> L</span>}
                                      {flag === "N" && <span className="inline-flex items-center gap-0.5" style={{ color: EMERALD_MID }}><Check className="h-3 w-3 stroke-[3]" /> N</span>}
                                    </td>
                                    <td className="p-2.5 text-zinc-500 font-semibold">{getRefRangeStr(item.test, report.patient.gender)}</td>
                                    <td className="p-2.5 text-zinc-500 font-semibold">{item.test.unit}</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))`;

content = content.replace(oldRender, newRender);

fs.writeFileSync(filePath, content);
console.log('Report sheet updated');
EOF
