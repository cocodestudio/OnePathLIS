<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory, HasUuids, CamelCaseApi;

    protected $fillable = [
        'custom_id',
        'lab_id',
        'bill_id',
        'patient_id',
        'status',
        'printed_interpretations',
    ];

    protected $casts = [
        'printed_interpretations' => 'array',
    ];

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function results()
    {
        return $this->hasMany(ReportTest::class);
    }
}
