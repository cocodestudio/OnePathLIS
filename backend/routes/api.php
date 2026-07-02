<?php

use App\Http\Controllers\Api\AuthController;  
use App\Http\Controllers\Api\AdminController; 
use App\Http\Controllers\BlogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/admin/login', [AdminController::class, 'login']);
Route::get('/blogs/public', [BlogController::class, 'getPublicBlogs']);

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/pending-users', [AdminController::class, 'getPendingUsers']);
    Route::get('/approved-users', [AdminController::class, 'getApprovedUsers']);
    Route::post('/approve-user', [AdminController::class, 'approveUser']);
    Route::post('/suspend-user', [AdminController::class, 'suspendUser']);
    Route::post('/reject-user', [AdminController::class, 'rejectUser']); 
    Route::get('/blogs', [BlogController::class, 'index']);
    Route::post('/blogs', [BlogController::class, 'store']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // --- LIS Routes ---
    Route::prefix('lis')->middleware(\App\Http\Middleware\SnakeCaseRequests::class)->group(function () {
        Route::post('lab', [\App\Http\Controllers\Api\Lis\LabController::class, 'store']);
        Route::get('lab', [\App\Http\Controllers\Api\Lis\LabController::class, 'show']);
        Route::put('lab', [\App\Http\Controllers\Api\Lis\LabController::class, 'update']);
        Route::apiResource('patients', \App\Http\Controllers\Api\Lis\PatientController::class);
        Route::apiResource('tests', \App\Http\Controllers\Api\Lis\TestController::class);
        Route::post('reports/{report}/tests', [\App\Http\Controllers\Api\Lis\ReportController::class, 'addTests']);
        Route::delete('reports/{report}/tests', [\App\Http\Controllers\Api\Lis\ReportController::class, 'removeTests']);
        Route::apiResource('reports', \App\Http\Controllers\Api\Lis\ReportController::class);
        Route::apiResource('bills', \App\Http\Controllers\Api\Lis\BillController::class);
        Route::get('analytics', [\App\Http\Controllers\Api\Lis\AnalyticsController::class, 'index']);
    });
});