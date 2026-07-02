<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('custom_id'); // E.g., LAB-2026-0001
            $table->foreignUuid('lab_id')->constrained('labs')->cascadeOnDelete();
            
            $table->unique(['lab_id', 'custom_id']);
            $table->string('name');
            $table->string('designation')->nullable()->default('Mr.');
            $table->integer('age');
            $table->string('gender')->default('Male'); // Male, Female, Other
            $table->string('phone');
            $table->string('ref_doctor')->default('Self');
            $table->string('address')->nullable();
            $table->string('collected_at')->nullable()->default('Lab');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
