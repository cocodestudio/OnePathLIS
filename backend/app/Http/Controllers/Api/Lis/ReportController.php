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

    public function addTests(Request $request, string $id)
    {
        $validated = $request->validate([
            'testId' => 'required|uuid|exists:tests,id',
        ]);

        $report = Report::where('lab_id', $request->user()->lab_id)->with('results')->findOrFail($id);
        $test = \App\Models\Test::where('lab_id', $request->user()->lab_id)->with('subTests.subTests')->findOrFail($validated['testId']);

        $reportTestsData = [];
        if ($test->subTests->count() > 0) {
            foreach ($test->subTests as $param) {
                if ($param->field_type === 'Multiple Field' && $param->subTests->count() > 0) {
                    foreach ($param->subTests as $subParam) {
                        $reportTestsData[] = [
                            'report_id' => $report->id,
                            'test_id' => $subParam->id,
                            'result_value' => null,
                            'is_abnormal' => false,
                        ];
                    }
                } else {
                    $reportTestsData[] = [
                        'report_id' => $report->id,
                        'test_id' => $param->id,
                        'result_value' => $param->field_type === 'Custom Editor' ? $param->interpretation : null,
                        'is_abnormal' => false,
                    ];
                }
            }
        } else {
            $reportTestsData[] = [
                'report_id' => $report->id,
                'test_id' => $test->id,
                'result_value' => $test->field_type === 'Custom Editor' ? $test->interpretation : null,
                'is_abnormal' => false,
            ];
        }

        $existingTestIds = $report->results->pluck('test_id')->toArray();
        $toAdd = array_filter($reportTestsData, fn($rt) => !in_array($rt['test_id'], $existingTestIds));

        if (empty($toAdd)) {
            return response()->json(['error' => 'Test or its parameters already exist in this report.'], 400);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($toAdd, $report, $test) {
            foreach ($toAdd as $data) {
                \App\Models\ReportTest::create($data);
            }

            if ($report->bill_id) {
                $bill = \App\Models\Bill::find($report->bill_id);
                if ($bill) {
                    $newTotal = $bill->total + $test->price;
                    $balance = $newTotal - $bill->paid_amount;
                    $newStatus = 'UNPAID';
                    if ($balance <= 0) $newStatus = 'PAID';
                    elseif ($bill->paid_amount > 0) $newStatus = 'PARTIAL';

                    $bill->update(['total' => $newTotal, 'status' => $newStatus]);
                }
            }
        });

        return response()->json(['success' => true, 'addedCount' => count($toAdd)]);
    }

    public function removeTests(Request $request, string $id)
    {
        $validated = $request->validate([
            'mainTestId' => 'required|uuid|exists:tests,id',
        ]);

        $report = Report::where('lab_id', $request->user()->lab_id)
            ->with(['results.test.parent.parent'])
            ->findOrFail($id);

        $resultIdsToDelete = $report->results->filter(function ($r) use ($validated) {
            $mt = $r->test->parent?->parent ?? ($r->test->parent ?? $r->test);
            return $mt->id === $validated['mainTestId'];
        })->pluck('id')->toArray();

        if (empty($resultIdsToDelete)) {
            return response()->json(['error' => 'No tests found to remove.'], 404);
        }

        $test = \App\Models\Test::find($validated['mainTestId']);

        \Illuminate\Support\Facades\DB::transaction(function () use ($resultIdsToDelete, $report, $test) {
            \App\Models\ReportTest::whereIn('id', $resultIdsToDelete)->delete();

            if ($report->bill_id && $test) {
                $bill = \App\Models\Bill::find($report->bill_id);
                if ($bill) {
                    $newTotal = max(0, $bill->total - $test->price);
                    $balance = $newTotal - $bill->paid_amount;
                    $newStatus = 'UNPAID';
                    if ($balance <= 0) $newStatus = 'PAID';
                    elseif ($bill->paid_amount > 0) $newStatus = 'PARTIAL';

                    $bill->update(['total' => $newTotal, 'status' => $newStatus]);
                }
            }
        });

        return response()->json(['success' => true, 'deletedCount' => count($resultIdsToDelete)]);
    }
}
