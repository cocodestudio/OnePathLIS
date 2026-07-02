<?php

namespace App\Http\Controllers\Api\Lis;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Patient;
use App\Models\Bill;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $labId = $request->user()->lab_id;
        $today = Carbon::today();

        $totalPatients = Patient::where('lab_id', $labId)->count();
        $totalReports = Report::where('lab_id', $labId)->count();
        
        $todayReports = Report::where('lab_id', $labId)
            ->whereDate('created_at', $today)
            ->count();
            
        $completedReports = Report::where('lab_id', $labId)
            ->where('status', 'COMPLETED')
            ->count();
            
        $totalRevenue = Bill::where('lab_id', $labId)
            ->where('status', 'PAID')
            ->sum('total');

        return response()->json([
            'totalPatients' => $totalPatients,
            'totalReports' => $totalReports,
            'todayReports' => $todayReports,
            'completedReports' => $completedReports,
            'totalRevenue' => $totalRevenue,
        ]);
    }
}
