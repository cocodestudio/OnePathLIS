<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    use HasFactory, HasUuids, CamelCaseApi;

    protected $fillable = [
        'custom_id',
        'lab_id',
        'patient_id',
        'total',
        'discount',
        'paid_amount',
        'status',
    ];

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
}
