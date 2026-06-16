import * as React from "react";
import Image from "next/image";
import { MapPin, Mail, FileText, AlertTriangle, Check, ArrowUp, ArrowDown } from "lucide-react";

interface Test { 
  id: string; name: string; category: string; price: number; unit: string; 
  interpretation?: string | null; fieldType?: string;
  genderRefType?: string; refRangeMin: number; refRangeMax: number; 
  refRangeMinMale?: number | null; refRangeMaxMale?: number | null; 
  refRangeMinFemale?: number | null; refRangeMaxFemale?: number | null;
  parent?: { id: string; name: string; interpretation?: string; parent?: { id: string; name: string; interpretation?: string } };
}
interface ReportTest { id: string; resultValue: string | null; isAbnormal: boolean; test: Test; }
export interface PrintSettings {
  bgImage: string | null;
  headerHeight: number;
  footerHeight: number;
  marginLeft: number;
  marginRight: number;
}

export interface ReportSheetData {
  id: string; customId: string; status: string; createdAt: string;
  patient: { name: string; age: number; gender: string; phone: string; refDoctor: string; customId: string; address: string | null };
  results: ReportTest[];
  lab: { name: string; email: string; address: string; logoUrl: string | null; printBgImage?: string | null };
  printedInterpretations?: string | null;
}

const EMERALD = "hsl(160 58% 27%)";
const EMERALD_DARK = "hsl(160 58% 22%)";
const EMERALD_MID = "hsl(160 58% 30%)";

/** A4-styled printable clinical report. Always white for paper output. */
export const ReportSheet = React.forwardRef<HTMLDivElement, { report: ReportSheetData; settings?: PrintSettings }>(
  ({ report, settings }, ref) => {
    const groupedTests: Record<string, Record<string, Record<string, ReportTest[]>>> = {};
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
    });

    const getRefRangeStr = (test: Test, patientGender: string) => {
      if (test.genderRefType === "GENDER_SPECIFIC") {
        if (patientGender.toLowerCase() === "female") {
          return `${test.refRangeMinFemale ?? test.refRangeMin} - ${test.refRangeMaxFemale ?? test.refRangeMax}`;
        } else {
          return `${test.refRangeMinMale ?? test.refRangeMin} - ${test.refRangeMaxMale ?? test.refRangeMax}`;
        }
      }
      return `${test.refRangeMin} - ${test.refRangeMax}`;
    };

    const getFlag = (item: ReportTest, patientGender: string) => {
      if (!item.resultValue) return null;
      const val = parseFloat(item.resultValue);
      if (isNaN(val)) return item.isAbnormal ? "H" : "N"; // fallback for non-numeric

      let minRange = item.test.refRangeMin;
      let maxRange = item.test.refRangeMax;
      
      if (item.test.genderRefType === "GENDER_SPECIFIC") {
        const gender = patientGender.toLowerCase();
        if (gender === "female") {
          minRange = item.test.refRangeMinFemale ?? minRange;
          maxRange = item.test.refRangeMaxFemale ?? maxRange;
        } else {
          minRange = item.test.refRangeMinMale ?? minRange;
          maxRange = item.test.refRangeMaxMale ?? maxRange;
        }
      }
      
      if (val < minRange) return "L";
      if (val > maxRange) return "H";
      return "N";
    };

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />
        <div 
          ref={ref} 
        className="w-[794px] min-h-[1123px] bg-white text-zinc-900 flex flex-col justify-between mx-auto relative overflow-hidden" 
        style={{ 
          boxSizing: "border-box",
          paddingTop: settings ? `${settings.headerHeight}px` : '40px',
          paddingBottom: settings ? `${settings.footerHeight}px` : '40px',
          paddingLeft: settings ? `${settings.marginLeft}px` : '40px',
          paddingRight: settings ? `${settings.marginRight}px` : '40px',
        }}
      >
        {settings?.bgImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={settings.bgImage} alt="Report Background" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-100" />
        )}
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          <div>
          {/* Letterhead removed per user request */}

          {/* Patient block */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6 text-xs text-zinc-700">
            <div className="space-y-1.5 border-r border-zinc-200 pr-4">
              <p><strong>Patient Name:</strong> <span className="text-sm font-extrabold text-zinc-900">{report.patient.name}</span></p>
              <p><strong>Age / Gender:</strong> {report.patient.age} Y / {report.patient.gender}</p>
              <p><strong>Phone:</strong> {report.patient.phone}</p>
              {report.patient.address && <p className="truncate"><strong>Address:</strong> {report.patient.address}</p>}
            </div>
            <div className="space-y-1.5 pl-4">
              <p><strong>Patient ID:</strong> <span className="font-bold text-zinc-900">{report.patient.customId}</span></p>
              <p><strong>Report Ref:</strong> <span className="font-bold text-zinc-900">{report.customId}</span></p>
              <p><strong>Referred By:</strong> {report.patient.refDoctor}</p>
              <p><strong>Received:</strong> {new Date(report.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {report.status !== "COMPLETED" ? (
              <div className="text-center py-10 border border-dashed border-zinc-300 rounded-lg text-zinc-400">
                <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                <p className="text-sm font-semibold">Results pending compilation…</p>
              </div>
            ) : (
              Object.entries(groupedTests).map(([category, mainTests]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest border-b border-zinc-200 pb-1" style={{ color: EMERALD_DARK }}>{category} Report</h3>
                  {Object.entries(mainTests).map(([mainTestName, paramsObj]) => {
                    const firstParamKey = Object.keys(paramsObj)[0];
                    const firstTestObj = paramsObj[firstParamKey][0].test;
                    const mainTestObj = firstTestObj.parent?.parent ? firstTestObj.parent.parent : (firstTestObj.parent ? firstTestObj.parent : firstTestObj);
                    
                    let printedInterps: string[] = [];
                    try {
                      if (report.printedInterpretations) {
                        const parsed = JSON.parse(report.printedInterpretations);
                        printedInterps = Array.isArray(parsed) ? parsed : [];
                      }
                    } catch(e) {}

                    return (
                    <div key={mainTestName} className="mb-4">
                      <h4 className="text-xs font-bold text-zinc-800 mb-2 uppercase">{mainTestName}</h4>
                      <table className="w-full text-left text-xs border-collapse">
                        {!Object.values(paramsObj).flat().every(item => item.test.fieldType === "Custom Editor") && (
                          <thead>
                            <tr className="bg-zinc-100 border-b border-zinc-200">
                              <th className="p-2.5 font-bold text-zinc-800 uppercase">Test</th>
                              <th className="p-2.5 font-bold text-zinc-800 uppercase">Result</th>
                              <th className="p-2.5 font-bold text-zinc-800 uppercase">Flag</th>
                              <th className="p-2.5 font-bold text-zinc-800 uppercase">Reference</th>
                              <th className="p-2.5 font-bold text-zinc-800 uppercase">Unit</th>
                            </tr>
                          </thead>
                        )}
                        <tbody className="divide-y divide-zinc-100">
                          {Object.entries(paramsObj).map(([paramName, items]) => (
                            <React.Fragment key={paramName}>
                              {paramName !== "_default" && paramName !== "Report Template" && (
                                <tr className="bg-zinc-50">
                                  <td colSpan={5} className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{paramName}</td>
                                </tr>
                              )}
                              {items.map((item) => {
                                if (item.test.fieldType === "Custom Editor") {
                                  return (
                                    <tr key={item.id}>
                                      <td colSpan={5} className="py-3">
                                        {item.test.name !== "Report Template" && (
                                          <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{item.test.name}</h5>
                                        )}
                                        <div className="text-xs text-zinc-800 leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_table]:my-3 [&_td]:border-[1.5px] [&_td]:border-zinc-500 [&_td]:p-2 [&_th]:border-[1.5px] [&_th]:border-zinc-500 [&_th]:p-2 [&_th]:bg-zinc-100" dangerouslySetInnerHTML={{ __html: item.resultValue || '' }} />
                                      </td>
                                    </tr>
                                  );
                                }
                                const flag = getFlag(item, report.patient.gender);
                                return (
                                  <tr key={item.id} className={item.isAbnormal ? "bg-red-50/60" : ""}>
                                    <td className={`p-2.5 font-medium text-zinc-800 ${paramName !== "_default" ? "pl-5" : ""}`}>{item.test.name}</td>
                                    <td className={`p-2.5 ${item.isAbnormal ? "text-red-600 font-extrabold" : "text-zinc-800 font-bold"}`}>{item.resultValue}</td>
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
                      
                      {printedInterps.includes(mainTestObj.id) && mainTestObj.interpretation && (
                        <div className="mt-4 pt-3 border-t border-dashed border-zinc-300">
                          <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Interpretation: {mainTestName}</h5>
                          <div className="text-xs text-zinc-700 leading-relaxed [&_table]:border-collapse [&_table]:w-full [&_table]:my-3 [&_td]:border-[2px] [&_td]:border-black [&_td]:p-1.5 [&_th]:border-[3px] [&_th]:border-black [&_th]:p-1.5 [&_th]:bg-zinc-100" dangerouslySetInnerHTML={{ __html: mainTestObj.interpretation }} />
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer removed per user request */}
        </div>
        </div>
      </>
    );
  }
);
ReportSheet.displayName = "ReportSheet";
