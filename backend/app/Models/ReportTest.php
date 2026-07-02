<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportTest extends Model
{
    use HasFactory, HasUuids, CamelCaseApi;

    protected $fillable = [
        'report_id',
        'test_id',
        'result_value',
        'is_abnormal',
    ];

    protected $casts = [
        'is_abnormal' => 'boolean',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function test()
    {
        return $this->belongsTo(Test::class);
    }
}
