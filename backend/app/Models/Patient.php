<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory, HasUuids, CamelCaseApi;

    protected $fillable = [
        'custom_id',
        'lab_id',
        'name',
        'designation',
        'age',
        'gender',
        'phone',
        'ref_doctor',
        'address',
        'collected_at',
    ];

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
}
