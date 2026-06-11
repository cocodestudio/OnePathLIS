"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Receipt, Edit2, Calendar, User, CheckCircle2, AlertTriangle,
  Loader2, ArrowRight, ChevronLeft, ChevronRight, FileDown, TrendingUp, Wallet,
} from "lucide-react";

interface Patient { name: string; customId: string; phone: string; }
interface Report { customId: string; }
interface Bill {
  id: string; customId: string; total: number; discount: number;
  status: string; createdAt: string; patient: Patient; reports: Report[];
}

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [discountVal, setDiscountVal] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchBills(); }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing");
      if (res.ok) setBills(await res.json());
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (bill: Bill) => {
    setEditingBill(bill);
    setDiscountVal(bill.discount.toString());
    setPaymentStatus(bill.status);
    setError(null);
    setSuccess(null);
    setIsEditDialogOpen(true);
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/billing/${editingBill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: parseFloat(discountVal) || 0, status: paymentStatus }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess("Invoice updated successfully."); fetchBills(); setTimeout(() => setIsEditDialogOpen(false), 900); }
      else setError(data.error || "Failed to update.");
    } catch {
      setError("Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      b.patient.customId.toLowerCase().includes(search.toLowerCase()) ||
      b.customId.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "ALL" || b.status === statusFilter);
  });

  const totalRows = filteredBills.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredBills.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const totalPaidRevenue = bills.filter((b) => b.status === "PAID").reduce((s, b) => s + b.total, 0);
  const totalOutstanding = bills.filter((b) => b.status === "UNPAID" || b.status === "PARTIAL").reduce((s, b) => s + b.total, 0);
  const pendingCount = bills.filter((b) => b.status === "UNPAID" || b.status === "PARTIAL").length;
  const paidCount = bills.filter((b) => b.status === "PAID").length;

  const statusPill = (status: string) =>
    status === "PAID" ? "bg-primary/10 text-primary"
    : status === "PARTIAL" ? "bg-gold/15 text-gold"
    : "bg-destructive/10 text-destructive";
  const statusDot = (status: string) =>
    status === "PAID" ? "bg-primary" : status === "PARTIAL" ? "bg-gold" : "bg-destructive";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] mb-1.5">Finance</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Track invoices, record payments, and manage adjustments.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/70 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Collected Revenue</p>
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent text-primary"><Wallet className="h-[18px] w-[18px]" /></span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-foreground mt-3 tnum">₹{totalPaidRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</h2>
          <p className="flex items-center gap-1.5 mt-2 text-primary font-medium text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> {paidCount} transactions finalized</p>
        </div>
        <div className="bg-card border border-border/70 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</p>
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold/12 text-gold"><AlertTriangle className="h-[18px] w-[18px]" /></span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-gold mt-3 tnum">₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</h2>
          <p className="flex items-center gap-1.5 mt-2 text-muted-foreground font-medium text-xs">{pendingCount} pending / partial invoices</p>
        </div>
        <div className="bg-card border border-border/70 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Invoices</p>
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground"><Receipt className="h-[18px] w-[18px]" /></span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-foreground mt-3 tnum">{bills.length}</h2>
          <p className="flex items-center gap-1.5 mt-2 text-primary font-medium text-xs"><TrendingUp className="h-3.5 w-3.5" /> Clinical invoice registry</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/70 rounded-xl p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input placeholder="Search patient, ID, or bill…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg border border-border/60">
          {["ALL", "PAID", "PARTIAL", "UNPAID"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`h-8 px-3.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "ALL" ? "All" : s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/70 rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3"><div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /><p className="text-sm font-medium">Loading invoices…</p></div>
          ) : filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2"><Receipt className="h-10 w-10 opacity-25" /><p className="text-sm font-medium">No invoices found.</p></div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border/60">
                  {["Bill ID", "Patient", "Date", "Subtotal", "Discount", "Total", "Status", ""].map((h, i) => (
                    <th key={h + i} className={`px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap ${i === 2 ? "hidden lg:table-cell" : ""} ${i === 3 || i === 4 ? "hidden md:table-cell text-right" : ""} ${i === 5 ? "text-right" : ""} ${i === 7 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((bill) => {
                  const subtotal = bill.total + bill.discount;
                  return (
                    <tr key={bill.id} className="border-b border-border/30 last:border-0 hover:bg-muted/25 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{bill.customId}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground text-sm">{bill.patient.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{bill.patient.customId}</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs hidden lg:table-cell whitespace-nowrap">{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">₹{subtotal.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-destructive hidden md:table-cell">{bill.discount > 0 ? `-₹${bill.discount.toFixed(2)}` : "—"}</td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-foreground">₹{bill.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusPill(bill.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(bill.status)}`} />{bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEditDialog(bill)} title="Edit invoice"><Edit2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalRows > 0 && (
          <div className="bg-muted/20 px-6 py-3.5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{indexOfFirstRow + 1}</span>–<span className="font-semibold text-foreground">{Math.min(indexOfLastRow, totalRows)}</span> of <span className="font-semibold text-foreground">{totalRows}</span> invoices
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows:</span>
                <Select value={rowsPerPage.toString()} onValueChange={(val) => { setRowsPerPage(Number(val)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 text-xs font-semibold w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <Button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs font-semibold text-foreground px-2">{currentPage} / {totalPages}</span>
                <Button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Concise compliance note */}
      <p className="text-xs text-muted-foreground/70 flex items-center gap-2 px-1">
        <Receipt className="h-3.5 w-3.5 shrink-0" /> Totals are inclusive of GST. Refunds and adjustments require administrator authorization. Reports are withheld while payment is unpaid.
      </p>

      {/* Edit modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-primary"><Receipt className="h-5 w-5" /></div>
              <div>
                <DialogTitle className="text-lg">Update Invoice</DialogTitle>
                <DialogDescription className="font-mono">{editingBill?.customId} · {editingBill?.patient.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveBill} className="space-y-4">
            {error && <div className="flex items-center gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 p-3 text-xs text-destructive font-semibold"><AlertTriangle className="h-4 w-4 shrink-0" /><p>{error}</p></div>}
            {success && <div className="flex items-center gap-2.5 rounded-lg bg-accent border border-primary/20 p-3 text-xs text-primary font-semibold"><CheckCircle2 className="h-4 w-4 shrink-0" /><p>{success}</p></div>}

            <div className="bg-muted/40 border border-border/60 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold text-foreground tnum">₹{editingBill && (editingBill.total + editingBill.discount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Current Total</span><span className="font-bold text-foreground tnum">₹{editingBill?.total.toFixed(2)}</span></div>
            </div>

            <div className="space-y-1.5"><Label>Apply Discount (₹)</Label><Input type="number" value={discountVal} onChange={(e) => setDiscountVal(e.target.value)} disabled={saving} required /></div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid in Full</SelectItem>
                  <SelectItem value="PARTIAL">Partial Payment</SelectItem>
                  <SelectItem value="UNPAID">Unpaid Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>) : (<>Save Invoice <ArrowRight className="h-4 w-4" /></>)}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
