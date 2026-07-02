<?php

namespace App\Http\Controllers\Api\Lis;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function index(Request $request)
    {
        $bills = Bill::where('lab_id', $request->user()->lab_id)
            ->with('patient')
            ->latest()
            ->paginate(20);
            
        return response()->json($bills);
    }

    public function show(Request $request, string $id)
    {
        $bill = Bill::where('lab_id', $request->user()->lab_id)
            ->with('patient')
            ->findOrFail($id);
            
        return response()->json($bill);
    }

    public function update(Request $request, string $id)
    {
        $bill = Bill::where('lab_id', $request->user()->lab_id)->findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|string',
            'paid_amount' => 'sometimes|numeric',
        ]);

        $bill->update($validated);
        return response()->json($bill);
    }
}
