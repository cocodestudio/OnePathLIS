<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (!User::where('email', 'admin@onepath.in')->exists()) {
            User::create([
                'name' => 'Admin User',
                'email' => 'admin@onepath.in',
                'phone' => '9876543210',
                'lab_name' => 'OnePath Demo Lab',
                'patient_count' => '51-200',
                'password' => Hash::make('password123'), 
            ]);
        }
    }
}