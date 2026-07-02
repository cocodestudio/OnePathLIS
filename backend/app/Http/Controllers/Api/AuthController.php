<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller; 
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:15',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'labName' => 'required|string|max:255',
            'patientCount' => 'required|string',
            'plan_type' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'lab_name' => $request->labName,
                'patient_count' => $request->patientCount,
                'plan_type' => $request->plan_type ?? 'pro',
                'status' => 'pending',
                'trial_ends_at' => now()->addMonth(), 
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'User registered successfully. Waiting for admin approval.',
                'user' => $user
            ], 201);

        } catch (\Exception $e) {
            Log::error('Registration Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Something went wrong, please try again later.'
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();
            
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid email or password credentials.'
                ], 401);
            }

            if ($user->status === 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Your account is pending admin approval.'
                ], 403);
            }

            $user->tokens()->delete();
            $token = $user->createToken('onepath_auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Logged in successfully',
                'access_token' => $token,
                'user' => $user
            ], 200);

        } catch (\Exception $e) {
            Log::error('Login Error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Internal server error'], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['status' => 'success', 'user' => $request->user()], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['status' => 'success', 'message' => 'Logged out successfully.'], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Logout failed'], 500);
        }
    }
}