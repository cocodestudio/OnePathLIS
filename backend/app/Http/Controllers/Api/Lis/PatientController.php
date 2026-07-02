<?php

namespace App\Http\Controllers\Api\Lis;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        return Patient::where('lab_id', $request->user()->lab_id)
            ->latest()
            ->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'designation' => 'nullable|string',
            'age' => 'required|integer',
            'gender' => 'required|string',
            'phone' => 'required|string',
            'ref_doctor' => 'nullable|string',
            'address' => 'nullable|string',
            'collected_at' => 'nullable|string',
        ]);

        $labId = $request->user()->lab_id;
        
        // Generate a custom ID safely
        $lastPatient = Patient::where('lab_id', $labId)->latest('created_at')->first();
        $nextNumber = 1;
        if ($lastPatient && preg_match('/-(\d+)$/', $lastPatient->custom_id, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        }
        $customId = 'LAB-' . date('Y') . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        $validated['lab_id'] = $labId;
        $validated['custom_id'] = $customId;

        $patient = Patient::create($validated);

        return response()->json($patient, 201);
    }

    public function show(Request $request, string $id)
    {
        $patient = Patient::where('lab_id', $request->user()->lab_id)->findOrFail($id);
        return response()->json($patient);
    }

    public function update(Request $request, string $id)
    {
        $patient = Patient::where('lab_id', $request->user()->lab_id)->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'age' => 'sometimes|integer',
            'gender' => 'sometimes|string',
            'phone' => 'sometimes|string',
        ]);

        $patient->update($validated);
        return response()->json($patient);
    }

    public function destroy(Request $request, string $id)
    {
        $patient = Patient::where('lab_id', $request->user()->lab_id)->findOrFail($id);
        $patient->delete();
        return response()->json(['success' => true]);
    }
}
