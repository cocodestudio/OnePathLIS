<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $secureEmail = env('ADMIN_EMAIL', 'admin@onepath.in');
        $securePassword = env('ADMIN_PASSWORD', 'OnePathSecure2026!');

        // Check if credentials match admin credentials
        if ($request->email === $secureEmail && $request->password === $securePassword) {
            
            // PURE GOLD FIX: Sanctum requires a valid User record in the database.
            // Hum yahan check karenge ki admin user DB mein hai ya nahi.
            $adminUser = User::where('email', $secureEmail)->first();

            // Agar DB mein "admin@onepath.in" nahi hai, toh ek create kardo on the fly!
            if (!$adminUser) {
                $adminUser = User::create([
                    'name' => 'Super Admin',
                    'email' => $secureEmail,
                    'password' => bcrypt($securePassword), // Hash is necessary for DB constraints usually
                    'phone' => '0000000000',
                    'lab_name' => 'OnePath System Admin',
                    'patient_count' => '0',
                    'status' => 'active', 
                    'plan_type' => 'admin'
                ]);
            }

            // Purane token delete karo aur fresh Sanctum token generate karo
            $adminUser->tokens()->where('name', 'admin_secure_token')->delete();
            $token = $adminUser->createToken('admin_secure_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Access Authorized',
                'token' => $token
            ], 200);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Access Denied: Invalid Admin Credentials.'
        ], 401);
    }

    public function getPendingUsers(): JsonResponse
    {
        try {
            $pendingUsers = User::where('status', 'pending')
                                ->orderBy('created_at', 'desc')
                                ->get();
            return response()->json($pendingUsers, 200);
        } catch (\Exception $e) {
            Log::error('Admin Pending Users Fetch Error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Failed to fetch pending requests.'], 500);
        }
    }

    public function getApprovedUsers(): JsonResponse
    {
        try {
            // Updated query: Fetch both active and suspended users for the approved dashboard
            $approvedUsers = User::whereIn('status', ['active', 'suspended'])
                                 ->where('email', '!=', env('ADMIN_EMAIL', 'admin@onepath.in')) // Filter out admin user from list
                                 ->orderBy('created_at', 'desc')
                                 ->get();
            return response()->json($approvedUsers, 200);
        } catch (\Exception $e) {
            Log::error('Admin Approved Users Fetch Error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Failed to fetch approved labs.'], 500);
        }
    }

    public function approveUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), ['id' => 'required|exists:users,id']);
        if ($validator->fails()) { 
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422); 
        }

        try {
            $user = User::findOrFail($request->id);
            $user->status = 'active';
            $user->save();
            return response()->json(['status' => 'success', 'message' => 'Laboratory setup approved.'], 200);
        } catch (\Exception $e) {
            Log::error('Admin Approve Action Error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'System error during approval.'], 500);
        }
    }

    public function suspendUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), ['id' => 'required|exists:users,id']);
        if ($validator->fails()) { 
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422); 
        }

        try {
            $user = User::findOrFail($request->id);
            
            if ($user->status === 'suspended') {
                $user->status = 'active';
                $msg = 'Laboratory account activated.';
            } else {
                $user->status = 'suspended';
                $msg = 'Laboratory account suspended.';
            }
            
            $user->save();
            return response()->json(['status' => 'success', 'message' => $msg], 200);
        } catch (\Exception $e) {
            Log::error('Admin Suspend Action Error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'System error during suspension.'], 500);
        }
    }

    public function rejectUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), ['id' => 'required|exists:users,id']);
        
        if ($validator->fails()) { 
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422); 
        }

        try {
            $user = User::findOrFail($request->id);
            $user->delete(); 
            
            return response()->json(['status' => 'success', 'message' => 'Laboratory registration rejected and deleted.'], 200);
        } catch (\Exception $e) {
            Log::error('Admin Reject Action Error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'System error during rejection.'], 500);
        }
    }
}