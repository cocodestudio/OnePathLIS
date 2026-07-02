<?php

namespace App\Http\Controllers\Api\Lis;

use App\Http\Controllers\Controller;
use App\Models\Test;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TestController extends Controller
{
    public function index(Request $request)
    {
        $tests = Test::where('lab_id', $request->user()->lab_id)
            ->whereNull('parent_id')
            ->with('subTests')
            ->get();
            
        return response()->json($tests);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'price' => 'numeric',
            'type' => 'nullable|string',
            'subTests' => 'array',
        ]);

        $labId = $request->user()->lab_id;

        DB::beginTransaction();
        try {
            $test = Test::create([
                'lab_id' => $labId,
                'name' => $validated['name'],
                'category' => $validated['category'],
                'price' => $validated['price'] ?? 0,
                'type' => $validated['type'] ?? 'Pathology',
            ]);

            if (!empty($validated['subTests'])) {
                foreach ($validated['subTests'] as $sub) {
                    Test::create(array_merge($sub, [
                        'lab_id' => $labId,
                        'parent_id' => $test->id,
                    ]));
                }
            }

            DB::commit();
            return response()->json($test->load('subTests'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, string $id)
    {
        $test = Test::where('lab_id', $request->user()->lab_id)
            ->with('subTests')
            ->findOrFail($id);
            
        return response()->json($test);
    }

    public function update(Request $request, string $id)
    {
        $test = Test::where('lab_id', $request->user()->lab_id)->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'price' => 'sometimes|numeric',
            'category' => 'sometimes|string',
        ]);

        $test->update($validated);
        return response()->json($test);
    }

    public function destroy(Request $request, string $id)
    {
        $test = Test::where('lab_id', $request->user()->lab_id)->findOrFail($id);
        $test->delete();
        return response()->json(['success' => true]);
    }
}
