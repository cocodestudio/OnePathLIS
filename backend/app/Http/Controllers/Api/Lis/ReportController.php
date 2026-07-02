<?php

namespace App\Http\Controllers\Api\Lis;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $reports = Report::where('lab_id', $request->user()->lab_id)
            ->with(['patient', 'bill', 'results.test'])
            ->latest()
            ->paginate(20);
            
        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'test_ids' => 'required|array',
            'test_ids.*' => 'uuid|exists:tests,id',
            'total' => 'required|numeric',
            'discount' => 'numeric',
            'paid_amount' => 'numeric',
        ]);

        $labId = $request->user()->lab_id;

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $labId) {
            // Generate Bill Custom ID Safely
            $lastBill = \App\Models\Bill::where('lab_id', $labId)->latest('created_at')->first();
            $nextBillNum = 1;
            if ($lastBill && preg_match('/-(\d+)$/', $lastBill->custom_id, $matches)) {
                $nextBillNum = intval($matches[1]) + 1;
            }
            $billCustomId = 'BILL-' . date('Y') . '-' . str_pad($nextBillNum, 4, '0', STR_PAD_LEFT);

            $bill = \App\Models\Bill::create([
                'custom_id' => $billCustomId,
                'lab_id' => $labId,
                'patient_id' => $validated['patient_id'],
                'total' => $validated['total'],
                'discount' => $validated['discount'] ?? 0,
                'paid_amount' => $validated['paid_amount'] ?? 0,
                'status' => ($validated['paid_amount'] ?? 0) >= $validated['total'] ? 'PAID' : 'UNPAID',
            ]);

            // Generate Report Custom ID Safely
            $lastReport = Report::where('lab_id', $labId)->latest('created_at')->first();
            $nextRepNum = 1;
            if ($lastReport && preg_match('/-(\d+)$/', $lastReport->custom_id, $matches)) {
                $nextRepNum = intval($matches[1]) + 1;
            }
            $reportCustomId = 'REP-' . date('Y') . '-' . str_pad($nextRepNum, 4, '0', STR_PAD_LEFT);

            $report = Report::create([
                'custom_id' => $reportCustomId,
                'lab_id' => $labId,
                'bill_id' => $bill->id,
                'patient_id' => $validated['patient_id'],
                'status' => 'PENDING',
            ]);

            // Create Report Tests
            $tests = \App\Models\Test::whereIn('id', $validated['test_ids'])->with('subTests')->get();
            
            foreach ($tests as $test) {
                // If it's a master test with subtests, add subtests
                if ($test->subTests->count() > 0) {
                    foreach ($test->subTests as $subTest) {
                        \App\Models\ReportTest::create([
                            'report_id' => $report->id,
                            'test_id' => $subTest->id,
                        ]);
                    }
                } else {
                    \App\Models\ReportTest::create([
                        'report_id' => $report->id,
                        'test_id' => $test->id,
                    ]);
                }
            }

            return response()->json($report->load(['patient', 'bill', 'results.test']), 201);
        });
    }

    public function show(Request $request, string $id)
    {
        $report = Report::where('lab_id', $request->user()->lab_id)
            ->with(['patient', 'bill', 'results.test.parent', 'lab'])
            ->findOrFail($id);
            
        return response()->json($report);
    }

    public function update(Request $request, string $id)
    {
        $report = Report::where('lab_id', $request->user()->lab_id)->findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|string',
            'results' => 'sometimes|array',
        ]);

        if (isset($validated['status'])) {
            $report->update(['status' => $validated['status']]);
        }

        if (isset($validated['results'])) {
            foreach ($validated['results'] as $resultData) {
                if (isset($resultData['id'])) {
                    $result = $report->results()->find($resultData['id']);
                    if ($result) {
                        $result->update([
                            'result_value' => $resultData['result_value'] ?? null,
                            'is_abnormal' => $resultData['is_abnormal'] ?? false,
                        ]);
                    }
                }
            }
        }

        return response()->json($report->load('results'));
    }
}
