import * as React from "react";
import Image from "next/image";
import { MapPin, Mail, FileText, AlertTriangle, Check } from "lucide-react";

interface Test { 
  id: string; name: string; category: string; price: number; unit: string; 
  genderRefType?: string; refRangeMin: number; refRangeMax: number; 
  refRangeMinMale?: number | null; refRangeMaxMale?: number | null; 
  refRangeMinFemale?: number | null; refRangeMaxFemale?: number | null;
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
  lab: { name: string; email: string; address: string; logoUrl: string | null };
}

const EMERALD = "hsl(160 58% 27%)";
const EMERALD_DARK = "hsl(160 58% 22%)";
const EMERALD_MID = "hsl(160 58% 30%)";

/** A4-styled printable clinical report. Always white for paper output. */
export const ReportSheet = React.forwardRef<HTMLDivElement, { report: ReportSheetData; settings?: PrintSettings }>(
  ({ report, settings }, ref) => {
    const groupedTests: Record<string, ReportTest[]> = {};
    report.results.forEach((item) => { (groupedTests[item.test.category] ||= []).push(item); });

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
          <img src={settings.bgImage} alt="Report Background" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-100" />
        )}
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          <div>
          {/* Letterhead */}
          {!settings?.bgImage && (
            <div className="flex items-start justify-between border-b-2 pb-5 mb-6" style={{ borderColor: EMERALD }}>
              <div className="flex items-center gap-4">
                {report.lab.logoUrl && (
                  <div className="relative h-12 w-44"><Image src={report.lab.logoUrl} alt="Lab Logo" fill sizes="176px" className="object-contain" /></div>
                )}
              </div>
              <div className="text-right text-xs text-zinc-600 space-y-0.5">
                <h1 className="text-lg font-extrabold tracking-tight" style={{ color: EMERALD_DARK }}>{report.lab.name}</h1>
                <p className="flex items-center justify-end gap-1"><MapPin className="h-3 w-3" style={{ color: EMERALD_MID }} /> {report.lab.address}</p>
                <p className="flex items-center justify-end gap-1"><Mail className="h-3 w-3" style={{ color: EMERALD_MID }} /> {report.lab.email}</p>
              </div>
            </div>
          )}

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
              Object.entries(groupedTests).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest border-b border-zinc-200 pb-1" style={{ color: EMERALD_DARK }}>{category} Report</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200">
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Test Parameter</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Observed</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Unit</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase">Reference</th>
                        <th className="p-2.5 font-bold text-zinc-800 uppercase text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {items.map((item) => (
                        <tr key={item.id} className={item.isAbnormal ? "bg-red-50/60" : ""}>
                          <td className="p-2.5 font-medium text-zinc-800">{item.test.name}</td>
                          <td className={`p-2.5 ${item.isAbnormal ? "text-red-600 font-extrabold" : "text-zinc-800 font-bold"}`}>{item.resultValue}</td>
                          <td className="p-2.5 text-zinc-500 font-semibold">{item.test.unit}</td>
                          <td className="p-2.5 text-zinc-500 font-semibold">{getRefRangeStr(item.test, report.patient.gender)}</td>
                          <td className="p-2.5 text-right font-bold">
                            {item.isAbnormal ? (
                              <span className="text-red-600 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 stroke-[2.5]" /> H</span>
                            ) : (
                              <span className="inline-flex items-center gap-1" style={{ color: EMERALD_MID }}><Check className="h-3 w-3 stroke-[2.5]" /> Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        {/* Footer */}
        {!settings?.bgImage && (
          <div className="border-t border-zinc-200 pt-6 flex justify-between items-end text-[10px] text-zinc-500">
            <div>
              <p>*** END OF CLINICAL DIAGNOSTIC REPORT ***</p>
              <p className="mt-1">Generated by OnePath LIMS on behalf of the clinic.</p>
            </div>
            <div className="flex gap-8 text-center">
              <div className="space-y-4">
                <div className="h-10 w-24 border-b border-dashed border-zinc-300" />
                <p className="font-semibold text-zinc-700">Lab Technician</p><p className="text-[9px]">Verified By</p>
              </div>
              <div className="space-y-4">
                <div className="h-10 w-24 border-b border-dashed border-zinc-300" />
                <p className="font-semibold text-zinc-700">Dr. S. K. Sen</p><p className="text-[9px]">MD Pathologist</p>
              </div>
            </div>
          </div>
        )}
        </div>
        </div>
      </>
    );
  }
);
ReportSheet.displayName = "ReportSheet";
