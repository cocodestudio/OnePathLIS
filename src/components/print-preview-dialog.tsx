"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, FileText, CheckCircle2, MessageCircle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { ReportSheet, PaginatedReportPreview } from "@/components/report-sheet";
import type { PrintSettings } from "@/components/report-sheet";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
}

const A4_W = 794;

export function PrintPreviewDialog({ open, onOpenChange, report }: PrintPreviewDialogProps) {
  const [useCustomLetterpad, setUseCustomLetterpad] = useState(false);
  const [excludedMainTests, setExcludedMainTests] = useState<string[]>([]);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [totalPages, setTotalPages] = useState(1);
  
  const [wpStatus, setWpStatus] = useState<'idle' | 'sending' | 'sent' | 'no_whatsapp' | 'error'>('idle');

  const containerRef = useRef<HTMLDivElement>(null);
  const printRef   = useRef<HTMLDivElement>(null);

  const handleWhatsAppShare = async () => {
    if (!report.patient?.phone) {
      setWpStatus("no_whatsapp");
      return;
    }
    setWpStatus("sending");

    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientPhone: report.patient.phone,
          patientName: report.patient.name,
          reportId: report.customId || report.id,
          reportDate: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          pdfUrl: "Pending Storage Upload" // Placeholder since we are skipping cloud storage
        })
      });

      const data = await res.json();
      if (data.success) {
        setWpStatus("sent");
      } else if (data.reason === "no_whatsapp") {
        setWpStatus("no_whatsapp");
      } else {
        setWpStatus("error");
      }
    } catch {
      setWpStatus("error");
    }
    
    setTimeout(() => setWpStatus("idle"), 5000);
  };

  /* ── reset on open ─────────────────────────────────── */
  useEffect(() => {
    if (open && report) {
      setUseCustomLetterpad(!!report.lab?.printBgImage);
      setExcludedMainTests([]);
    }
  }, [open, report]);

  /* ── scale to fit preview pane width ───────────────── */
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!containerRef.current) return;
      const availW = containerRef.current.clientWidth - 80;
      setPreviewScale(Math.min(1, availW / A4_W));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  /* ── derived data ───────────────────────────────────── */
  const availableMainTests = useMemo(() => {
    if (!report?.results) return [];
    const names = new Set<string>();
    report.results.forEach((item: any) => {
      let n = item.test.name;
      if (item.test.parent?.parent) n = item.test.parent.parent.name;
      else if (item.test.parent)    n = item.test.parent.name;
      names.add(n);
    });
    return Array.from(names);
  }, [report]);

  const filteredReport = useMemo(() => {
    if (!report?.results) return null;
    return {
      ...report,
      results: report.results.filter((item: any) => {
        let n = item.test.name;
        if (item.test.parent?.parent) n = item.test.parent.parent.name;
        else if (item.test.parent)    n = item.test.parent.name;
        return !excludedMainTests.includes(n);
      }),
    };
  }, [report, excludedMainTests]);

  const printSettings: PrintSettings | undefined = useMemo(() => {
    if (!report) return undefined;
    const lab = report.lab || {};
    return {
      bgImage:       useCustomLetterpad ? lab.printBgImage : null,
      headerHeight:  lab.printHeaderHeight ?? 40,
      footerHeight:  lab.printFooterHeight ?? 40,
      marginLeft:    lab.printMarginLeft  ?? 40,
      marginRight:   lab.printMarginRight ?? 40,
    };
  }, [report, useCustomLetterpad]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: report ? `Report_${report.customId}` : "Report",
  });

  if (!report || !filteredReport) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-screen h-screen max-h-screen p-0 m-0 border-0 rounded-none overflow-hidden flex flex-col bg-background">
        <DialogHeader className="sr-only">
          <DialogTitle>Print Preview</DialogTitle>
          <DialogDescription>Preview and select tests to print</DialogDescription>
        </DialogHeader>

        {/* ── Hidden print target ── */}
        <div className="sr-only" aria-hidden>
          <div ref={printRef}>
            <ReportSheet report={filteredReport} settings={printSettings} />
          </div>
        </div>

        {/* ── Top bar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-background border-b border-border shadow-sm z-10 shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-none mb-1">Print Preview</h2>
              <p className="text-xs text-muted-foreground">
                {totalPages} page{totalPages > 1 ? "s" : ""} · Adjust settings to update in real-time
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            
            <Button 
              variant="outline" 
              onClick={handleWhatsAppShare} 
              disabled={wpStatus === 'sending' || wpStatus === 'sent'}
              className={`gap-2 ${
                wpStatus === 'sent' 
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' 
                  : wpStatus === 'error' || wpStatus === 'no_whatsapp' 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                  : 'hover:bg-[#E8F8F0] hover:text-[#25D366] hover:border-[#25D366]'
              }`}
            >
              <MessageCircle className="h-4 w-4" /> 
              {wpStatus === 'idle' && 'Share to WhatsApp'}
              {wpStatus === 'sending' && 'Sending...'}
              {wpStatus === 'sent' && 'Report Sent!'}
              {wpStatus === 'no_whatsapp' && 'No WhatsApp on Number'}
              {wpStatus === 'error' && 'Failed to Send'}
            </Button>

            <Button onClick={() => handlePrint()} className="gap-2">
              <Printer className="h-4 w-4" /> Print Document
            </Button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* Sidebar */}
          <div className="w-full md:w-[300px] shrink-0 bg-background border-b md:border-b-0 md:border-r border-border flex flex-col overflow-y-auto custom-scrollbar max-h-[35vh] md:max-h-full md:h-full">
            <div className="p-6 space-y-8">
              {/* Appearance */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Appearance
                </h3>
                {report.lab?.printBgImage ? (
                  <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors bg-card shadow-sm">
                    <Checkbox
                      checked={useCustomLetterpad}
                      onCheckedChange={(v) => setUseCustomLetterpad(v as boolean)}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground leading-none">Custom Letterpad</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Print using the lab's configured background letterhead.
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="p-3 border border-border/50 bg-muted/20 rounded-lg">
                    <p className="text-[11px] text-muted-foreground">No background image configured.</p>
                  </div>
                )}
              </div>

              {/* Tests */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Include Tests
                </h3>
                <div className="space-y-1 border border-border rounded-lg bg-card shadow-sm overflow-hidden p-1">
                  {availableMainTests.map(testName => (
                    <label key={testName} className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors group">
                      <Checkbox
                        checked={!excludedMainTests.includes(testName)}
                        onCheckedChange={(checked) => {
                          if (checked) setExcludedMainTests(p => p.filter(t => t !== testName));
                          else         setExcludedMainTests(p => [...p, testName]);
                        }}
                      />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate select-none" title={testName}>
                        {testName}
                      </span>
                    </label>
                  ))}
                  {availableMainTests.length === 0 && (
                    <p className="text-xs text-muted-foreground italic p-3">No tests available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* ── Preview pane ── */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto bg-zinc-300 dark:bg-zinc-800 flex justify-center py-10 custom-scrollbar"
          >
            {printSettings && (
              <PaginatedReportPreview
                report={filteredReport}
                settings={printSettings}
                scale={previewScale}
                onPageCount={setTotalPages}
              />
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}


