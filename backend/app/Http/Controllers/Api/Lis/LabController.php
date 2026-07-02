<?php

namespace App\Http\Controllers\Api\Lis;

use App\Http\Controllers\Controller;
use App\Models\Lab;
use Illuminate\Http\Request;

class LabController extends Controller
{
    public function store(Request $request)
    {
        if ($request->user()->lab_id) {
            return response()->json(['error' => 'Lab already exists for this user.'], 400);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:labs,email',
            'address' => 'required|string',
        ]);

        $lab = Lab::create($validated);
        
        // Link the lab to the authenticated user
        $request->user()->update(['lab_id' => $lab->id, 'role' => 'ADMIN']);

        return response()->json($lab, 201);
    }

    public function show(Request $request)
    {
        $lab = Lab::findOrFail($request->user()->lab_id);
        return response()->json($lab);
    }

    public function update(Request $request)
    {
        $lab = Lab::findOrFail($request->user()->lab_id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email',
            'address' => 'sometimes|string',
            'logo_url' => 'nullable|string',
            'print_bg_image' => 'nullable|string',
            'print_header_height' => 'sometimes|integer',
            'print_footer_height' => 'sometimes|integer',
            'print_margin_left' => 'sometimes|integer',
            'print_margin_right' => 'sometimes|integer',
        ]);

        $lab->update($validated);
        
        return response()->json($lab);
    }
}
