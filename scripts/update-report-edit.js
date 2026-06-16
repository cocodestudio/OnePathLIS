const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dashboard/reports/[id]/edit/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldGrouping = `  const groupedResults: Record<string, ReportTest[]> = {};
  report.results.forEach((item) => { 
    const groupName = item.test.parent ? item.test.parent.name : item.test.name;
    (groupedResults[groupName] ||= []).push(item); 
  });`;

const newGrouping = `  const groupedResults: Record<string, { [paramName: string]: ReportTest[] }> = {};
  report.results.forEach((item) => {
    let mainTestName = item.test.name;
    let paramName = "_default";

    if (item.test.parent) {
      if (item.test.parent.parent) {
        // Multiple field: item is sub-param, parent is param, parent.parent is main test
        mainTestName = item.test.parent.parent.name;
        paramName = item.test.parent.name;
      } else {
        // Single field: item is param, parent is main test
        mainTestName = item.test.parent.name;
        // Keep paramName as "_default" so they render flat
      }
    }
    
    if (!groupedResults[mainTestName]) groupedResults[mainTestName] = {};
    if (!groupedResults[mainTestName][paramName]) groupedResults[mainTestName][paramName] = [];
    groupedResults[mainTestName][paramName].push(item);
  });`;

content = content.replace(oldGrouping, newGrouping);

const oldRender = `          <div className="space-y-6">
            {Object.entries(groupedResults).map(([category, items]) => (
              <div key={category} className="bg-card border border-border/70 rounded-xl shadow-card overflow-hidden">
                <div className="bg-muted/30 px-6 py-3.5 border-b border-border/60 flex items-center gap-2.5">
                  <FlaskConical className="h-[18px] w-[18px] text-primary shrink-0" />
                  <h3 className="text-sm font-bold tracking-wider uppercase text-foreground">{category}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/15 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border-b border-border/60">
                        <th className="px-6 py-3 w-2/5">Parameter</th><th className="px-6 py-3">Value</th>
                        <th className="px-6 py-3">Unit</th><th className="px-6 py-3">Reference</th><th className="px-6 py-3 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const val = values[item.id] || "";
                        const { abnormal, flag } = isValueAbnormal(item.test, val);
                        return (
                          <tr key={item.id} className={\`border-b border-border/30 last:border-0 transition-colors \${abnormal ? "bg-destructive/[0.04]" : "hover:bg-muted/15"}\`}>
                            <td className="px-6 py-3.5">
                              <span className={\`text-sm font-semibold \${abnormal ? "text-destructive" : "text-foreground"}\`}>{item.test.name}</span>
                            </td>
                            <td className="px-6 py-3.5">
                              <Input placeholder="—" value={val} onChange={(e) => handleValueChange(item.id, e.target.value)} disabled={saving}
                                className={\`w-28 h-9 font-mono text-sm \${abnormal ? "text-destructive border-destructive/50 bg-destructive/8 font-bold focus:ring-destructive/20 focus:border-destructive" : ""}\`} />
                            </td>
                            <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground">{item.test.unit}</td>
                            <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground font-semibold">
                              {(() => {
                                const range = getRefRange(item.test, report?.patient.gender || "Male");
                                return \`\${range.min} – \${range.max}\`;
                              })()}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {abnormal ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-destructive text-destructive-foreground">{flag}</span>
                              ) : val ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">NORMAL</span>
                              ) : (
                                <span className="text-xs text-muted-foreground/45 italic">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>`;

const newRender = `          <div className="space-y-6">
            {Object.entries(groupedResults).map(([mainTestName, paramsObj]) => (
              <div key={mainTestName} className="bg-card border border-border/70 rounded-xl shadow-card overflow-hidden">
                <div className="bg-muted/30 px-6 py-3.5 border-b border-border/60 flex items-center gap-2.5">
                  <FlaskConical className="h-[18px] w-[18px] text-primary shrink-0" />
                  <h3 className="text-sm font-bold tracking-wider uppercase text-foreground">{mainTestName}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/15 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border-b border-border/60">
                        <th className="px-6 py-3 w-2/5">Parameter</th><th className="px-6 py-3">Value</th>
                        <th className="px-6 py-3">Unit</th><th className="px-6 py-3">Reference</th><th className="px-6 py-3 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(paramsObj).map(([paramName, items]) => (
                        <React.Fragment key={paramName}>
                          {paramName !== "_default" && (
                            <tr className="bg-muted/5 border-b border-border/30">
                              <td colSpan={5} className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-zinc-50">{paramName}</td>
                            </tr>
                          )}
                          {items.map((item) => {
                            const val = values[item.id] || "";
                            const { abnormal, flag } = isValueAbnormal(item.test, val);
                            return (
                              <tr key={item.id} className={\`border-b border-border/30 last:border-0 transition-colors \${abnormal ? "bg-destructive/[0.04]" : "hover:bg-muted/15"}\`}>
                                <td className="px-6 py-3.5">
                                  <span className={\`text-sm \${paramName !== "_default" ? "pl-4" : ""} font-semibold \${abnormal ? "text-destructive" : "text-foreground"}\`}>{item.test.name}</span>
                                </td>
                                <td className="px-6 py-3.5">
                                  <Input placeholder="—" value={val} onChange={(e) => handleValueChange(item.id, e.target.value)} disabled={saving}
                                    className={\`w-28 h-9 font-mono text-sm \${abnormal ? "text-destructive border-destructive/50 bg-destructive/8 font-bold focus:ring-destructive/20 focus:border-destructive" : ""}\`} />
                                </td>
                                <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground">{item.test.unit}</td>
                                <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground font-semibold">
                                  {(() => {
                                    const range = getRefRange(item.test, report?.patient.gender || "Male");
                                    return \`\${range.min} – \${range.max}\`;
                                  })()}
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  {abnormal ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-destructive text-destructive-foreground">{flag}</span>
                                  ) : val ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">NORMAL</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/45 italic">Pending</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>`;

content = content.replace(oldRender, newRender);

const oldParentInterface = `  parent?: { name: string };`;
const newParentInterface = `  parent?: { name: string; parent?: { name: string } };`;
content = content.replace(oldParentInterface, newParentInterface);

fs.writeFileSync(filePath, content);
console.log('Update edit page complete!');
EOF
