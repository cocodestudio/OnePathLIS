import * as React from "react";
import Image from "next/image";
import { format } from "date-fns";

import { PrintSettings } from "./report-sheet";

interface Lab {
  name: string;
  email: string;
  address: string;
  logoUrl: string | null;
}

interface Patient {
  name: string;
  phone: string;
  customId: string;
  age: number;
  gender: string;
  refDoctor: string;
}

interface TestItem {
  id: string;
  name: string;
  price: number;
  parent?: any;
}

interface InvoiceData {
  customId: string;
  createdAt: string;
  total: number;
  discount: number;
  paidAmount: number;
  status: string;
  patient: Patient;
  lab: Lab;
  tests: TestItem[];
}

export const InvoiceSheet = React.forwardRef<HTMLDivElement, { invoice: InvoiceData; settings?: PrintSettings }>(
  ({ invoice, settings }, ref) => {
    const balance = invoice.total + invoice.discount - invoice.paidAmount;

    const groupedTests = React.useMemo(() => {
      const map = new Map<string, { mainTest: any, subTests: any[] }>();
      invoice.tests.forEach(test => {
        let mainTest = test;
        if (test.parent) {
          if (test.parent.parent) {
            mainTest = test.parent.parent;
          } else {
            mainTest = test.parent;
          }
        }
        
        const key = mainTest.id;
        if (!map.has(key)) {
          map.set(key, { mainTest, subTests: [] });
        }
        
        // If it's a sub-test, push it
        if (test.id !== mainTest.id && test.name !== "Report Template") {
          map.get(key)!.subTests.push(test);
        }
      });
      return Array.from(map.values());
    }, [invoice.tests]);

    return (
      <div>
        <div ref={ref} className="bg-white text-black mx-auto relative print-container w-full max-w-[794px] min-h-[1123px] print:max-w-none print:w-full print:min-h-0 shadow-sm" style={{ boxSizing: "border-box", fontFamily: "sans-serif" }}>
          
          {settings?.bgImage && (
            <div 
              className="absolute inset-0 z-0 pointer-events-none opacity-100 print:fixed print:inset-0"
              style={{
                backgroundImage: `url('${settings.bgImage}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}

          <table className="w-full relative z-10 h-[1123px] print:h-auto" style={{ borderCollapse: "collapse" }}>
            <thead className="table-header-group">
              <tr>
                <td>
                  <div style={{ height: settings ? `${settings.headerHeight}px` : '40px' }} />
                </td>
              </tr>
            </thead>
            <tbody className="table-row-group">
              <tr>
                <td style={{ 
                  paddingLeft: settings ? `${settings.marginLeft}px` : '40px', 
                  paddingRight: settings ? `${settings.marginRight}px` : '40px',
                  verticalAlign: "top"
                }}>
                  <div className="flex-1 flex flex-col justify-between h-full">

                    {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
            <div className="flex items-center gap-4">
              {invoice.lab.logoUrl && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white">
                  <Image src={invoice.lab.logoUrl} alt="Lab Logo" fill className="object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{invoice.lab.name}</h1>
                <p className="text-sm text-gray-600 mt-1">{invoice.lab.address}</p>
                <p className="text-sm text-gray-600">{invoice.lab.email}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-light text-gray-400 tracking-widest uppercase mb-2">Invoice</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-semibold text-gray-500 mr-2">Invoice No:</span> {invoice.customId}</p>
                <p><span className="font-semibold text-gray-500 mr-2">Date:</span> {format(new Date(invoice.createdAt), "dd MMM yyyy")}</p>
                <p>
                  <span className="font-semibold text-gray-500 mr-2">Status:</span> 
                  <span className={`font-semibold ${invoice.status === "PAID" ? "text-green-600" : invoice.status === "PARTIAL" ? "text-amber-600" : "text-red-600"}`}>
                    {invoice.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200 flex justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Bill To</p>
              <h3 className="text-lg font-semibold text-gray-900">{invoice.patient.name}</h3>
              <p className="text-sm text-gray-600 mt-1">ID: {invoice.patient.customId}</p>
              <p className="text-sm text-gray-600">Ph: {invoice.patient.phone}</p>
              <p className="text-sm text-gray-600">{invoice.patient.age} Yrs / {invoice.patient.gender}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Referred By</p>
              <p className="text-sm font-medium text-gray-800">Dr. {invoice.patient.refDoctor}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="py-3 px-2 font-semibold text-gray-900 w-16">Sl No.</th>
                  <th className="py-3 px-2 font-semibold text-gray-900">Test / Profile Name</th>
                  <th className="py-3 px-2 font-semibold text-gray-900 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groupedTests.map((group, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-2 text-sm text-gray-600 align-top">{idx + 1}</td>
                    <td className="py-4 px-2 text-sm font-medium text-gray-900 align-top">
                      <div>{group.mainTest.name}</div>
                      {group.subTests.length > 0 && (
                        <ul className="list-disc list-inside text-gray-500 mt-1 pl-1 text-xs font-normal">
                          {group.subTests.map((sub, i) => (
                            <li key={i}>{sub.name}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-4 px-2 text-sm text-gray-900 text-right align-top">₹{(group.mainTest.price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-72 bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{(invoice.total + invoice.discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-red-600 border-b border-gray-200 mb-2">
                <span>Discount</span>
                <span>- ₹{invoice.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-semibold text-lg">
                <span className="text-gray-900">Grand Total</span>
                <span className="text-gray-900">₹{invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-green-600 border-b border-gray-200 mb-2">
                <span>Paid Amount</span>
                <span>- ₹{invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg text-gray-900">
                <span>Balance Due</span>
                <span className={balance > 0 ? "text-red-600" : ""}>₹{balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
                      <p>Thank you for choosing {invoice.lab.name}.</p>
                      <p className="mt-1">This is a computer generated invoice and does not require a signature.</p>
                    </div>

                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot className="table-footer-group">
              <tr>
                <td className="align-bottom">
                  <div style={{ height: settings ? `${settings.footerHeight}px` : '40px' }} />
                </td>
              </tr>
            </tfoot>
          </table>
          
        </div>
      </div>
    );
  }
);
InvoiceSheet.displayName = "InvoiceSheet";
