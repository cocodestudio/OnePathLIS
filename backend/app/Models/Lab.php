<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lab extends Model
{
    use HasFactory, HasUuids, CamelCaseApi;

    protected $fillable = [
        'name',
        'email',
        'address',
        'logo_url',
        'print_bg_image',
        'print_header_height',
        'print_footer_height',
        'print_margin_left',
        'print_margin_right',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function patients()
    {
        return $this->hasMany(Patient::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function tests()
    {
        return $this->hasMany(Test::class);
    }
}
