"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  FlaskConical, ArrowLeft, Loader2, CheckCircle2, AlertTriangle,
  User, AlertCircle, TrendingUp, History, ExternalLink, ClipboardList,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Test { 
  id: string; name: string; category: string; price: number; unit: string; 
  genderRefType?: string; refRangeMin: number; refRangeMax: number; 
  refRangeMinMale?: number | null; refRangeMaxMale?: number | null; 
  refRangeMinFemale?: number | null; refRangeMaxFemale?: number | null;
  parent?: { name: string }; 
}
interface ReportTest { id: string; resultValue: string | null; isAbnormal: boolean; test: Test; }
interface Report {
  id: string; customId: string; status: string; createdAt: string; patientId: string;
  patient: { name: string; age: number; gender: string; phone: string; refDoctor: string; customId: string };
  bill: { customId: string; total: number; status: string };
  results: ReportTest[];
}

export default function ResultEntryPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;
  const toast = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<Report[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => { if (reportId) fetchReport(); }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const data: Report = await res.json();
        setReport(data);
        const initial: Record<string, string> = {};
        data.results.forEach((r) => { initial[r.id] = r.resultValue || ""; });
        setValues(initial);
        if (data.patientId) fetchHistory(data.patientId);
      } else setError("Failed to retrieve report data.");
    } catch {
      setError("A network error occurred while loading the report.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (patientId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data: Report[] = await res.json();
        setHistory(data.filter((r) => r.patientId === patientId && r.id !== reportId));
      }
    } catch (err) {
      console.error("Error fetching patient history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleValueChange = (id: string, val: string) => setValues((prev) => ({ ...prev, [id]: val }));

  const getRefRange = (test: Test, patientGender: string) => {
    if (test.genderRefType === "GENDER_SPECIFIC") {
      if (patientGender.toLowerCase() === "female") {
        return {
          min: test.refRangeMinFemale ?? test.refRangeMin,
          max: test.refRangeMaxFemale ?? test.refRangeMax
        };
      } else {
        return {
          min: test.refRangeMinMale ?? test.refRangeMin,
          max: test.refRangeMaxMale ?? test.refRangeMax
        };
      }
    }
    return { min: test.refRangeMin, max: test.refRangeMax };
  };

  const isValueAbnormal = (test: Test, currentVal: string) => {
    if (!currentVal || currentVal.trim() === "") return { abnormal: false, flag: "NORMAL" };
    const num = parseFloat(currentVal);
    if (isNaN(num)) return { abnormal: false, flag: "NORMAL" };
    const range = getRefRange(test, report?.patient.gender || "Male");
    if (num < range.min) return { abnormal: true, flag: "LOW" };
    if (num > range.max) return { abnormal: true, flag: "HIGH" };
    return { abnormal: false, flag: "NORMAL" };
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload = Object.entries(values).map(([id, resultValue]) => ({ id, resultValue: resultValue.trim() }));
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: payload }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Diagnostic results saved successfully.");
        setTimeout(() => { router.push(`/dashboard/reports`); router.refresh(); }, 900);
      } else { setError(data.error || "Failed to update results."); setSaving(false); }
    } catch {
      setError("A network error occurred while updating.");
      setSaving(false);
    }
  };

  const getClinicalInsight = () => {
    if (!report) return null;
    const abnormals = report.results.filter((r) => isValueAbnormal(r.test, values[r.id]).abnormal);
    if (abnormals.length === 0) return "All entered parameters are within standard reference ranges.";
    return `Flagged for: ${abnormals.map((r) => r.test.name).join(", ")}. Recommend correlation with clinical presentation.`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="border border-destructive/20 bg-destructive/5 max-w-lg mx-auto text-center p-8 rounded-xl mt-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <div><h2 className="font-display text-lg font-semibold text-foreground">Retrieval Error</h2><p className="text-sm text-muted-foreground mt-1">{error}</p></div>
        <Link href="/dashboard/reports"><Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to Reports</Button></Link>
      </div>
    );
  }
  if (!report) return null;

  const groupedResults: Record<string, ReportTest[]> = {};
  report.results.forEach((item) => { 
    const groupName = item.test.parent ? item.test.parent.name : item.test.name;
    (groupedResults[groupName] ||= []).push(item); 
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Main */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports"><Button variant="outline" size="sm" className="h-9"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button></Link>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Result Entry</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Values are auto-evaluated against reference ranges.</p>
          </div>
        </div>

        {/* Patient ribbon */}
        <div className="bg-card border border-border/70 rounded-xl p-5 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary"><User className="h-6 w-6" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-lg font-semibold text-foreground leading-none">{report.patient.name}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase">{report.patient.gender}, {report.patient.age}y</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                <span className="font-mono text-primary bg-accent px-1.5 py-0.5 rounded">{report.patient.customId}</span>
                <span>Ref: {report.patient.refDoctor}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col bg-muted/40 border border-border/60 px-3 py-1.5 rounded-lg flex-1 md:flex-none">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">Specimen</span>
              <span className="font-mono text-xs font-bold text-foreground mt-1">{report.customId}</span>
            </div>
            <Button onClick={handleSaveResults} disabled={saving} className="h-11">
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Compiling…</>) : (<><CheckCircle2 className="h-4 w-4" /> Save & Finalize</>)}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSaveResults} className="space-y-6">
          {error && <div className="flex items-center gap-3 rounded-xl bg-destructive/8 border border-destructive/20 p-4 text-sm text-destructive font-medium"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}
          {success && <div className="flex items-center gap-3 rounded-xl bg-accent border border-primary/20 p-4 text-sm text-primary font-medium"><CheckCircle2 className="h-5 w-5 shrink-0" /><p>{success}</p></div>}

          <div className="space-y-6">
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
                          <tr key={item.id} className={`border-b border-border/30 last:border-0 transition-colors ${abnormal ? "bg-destructive/[0.04]" : "hover:bg-muted/15"}`}>
                            <td className="px-6 py-3.5">
                              <span className={`text-sm font-semibold ${abnormal ? "text-destructive" : "text-foreground"}`}>{item.test.name}</span>
                            </td>
                            <td className="px-6 py-3.5">
                              <Input placeholder="—" value={val} onChange={(e) => handleValueChange(item.id, e.target.value)} disabled={saving}
                                className={`w-28 h-9 font-mono text-sm ${abnormal ? "text-destructive border-destructive/50 bg-destructive/8 font-bold focus:ring-destructive/20 focus:border-destructive" : ""}`} />
                            </td>
                            <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground">{item.test.unit}</td>
                            <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground font-semibold">
                              {(() => {
                                const range = getRefRange(item.test, report?.patient.gender || "Male");
                                return `${range.min} – ${range.max}`;
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-card border border-border/70 rounded-xl shadow-card space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><ClipboardList className="h-[18px] w-[18px] text-primary" /> Technician Observations</h4>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Record internal observations, sample status, or remarks…"
                className="w-full h-28 p-3 bg-background border border-border rounded-lg text-xs focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none resize-none placeholder:text-muted-foreground/40" />
            </div>
            <div className="p-5 bg-card border border-border/70 rounded-xl shadow-card flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="h-[18px] w-[18px] text-gold" /> Validation Summary</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{getClinicalInsight()}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button type="button" variant="outline" onClick={() => toast.success("Re-test requested", "The clinical chemistry team has been notified.")} className="flex-1 min-w-[120px] h-9 text-xs">Request Re-test</Button>
                <Button type="button" variant="outline" onClick={() => toast.info("Flagged for review", "Sent to the senior pathologist for verification.")} className="flex-1 min-w-[120px] h-9 text-xs">Flag for Review</Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/reports"><Button type="button" variant="outline" disabled={saving}>Cancel</Button></Link>
            <Button type="submit" disabled={saving}>
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Compiling…</>) : (<><CheckCircle2 className="h-4 w-4" /> Save & Authorize</>)}
            </Button>
          </div>
        </form>
      </div>

      {/* History sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-card border border-border/70 rounded-xl shadow-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border/60">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Previous Reports</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-[0.15em] mt-1">Patient History</p>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[420px]">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Scanning records…</div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">No previous records.</div>
            ) : (
              history.map((h) => {
                const isAbnormal = h.results.some((res) => res.isAbnormal);
                const testNames = h.results.map((res) => res.test.name).join(" + ");
                return (
                  <Link key={h.id} href={`/dashboard/reports/${h.id}`} target="_blank"
                    className="block bg-background hover:bg-accent/40 p-3 rounded-lg border border-border/60 hover:border-primary/40 transition-all group">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] text-primary font-semibold">{new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                    <h4 className="text-xs font-semibold text-foreground leading-tight truncate">{testNames}</h4>
                    <div className="flex items-center justify-between text-[9px] mt-2">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${isAbnormal ? "bg-destructive/12 text-destructive" : "bg-primary/10 text-primary"}`}>{isAbnormal ? "ABNORMAL" : "NORMAL"}</span>
                      <span className="text-muted-foreground font-mono">{h.customId}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          <div className="p-5 bg-muted/30 border-t border-border/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0"><TrendingUp className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold text-foreground">Trend Overview</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                {history.length > 0 ? `Compare against ${history.length} past ${history.length === 1 ? "report" : "reports"} to track progression.` : "This is the patient's first recorded report."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
