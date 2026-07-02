<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('custom_id'); // E.g., REP-2026-0001
            $table->foreignUuid('lab_id')->constrained('labs')->cascadeOnDelete();
            $table->foreignUuid('bill_id')->constrained('bills')->cascadeOnDelete();
            $table->foreignUuid('patient_id')->constrained('patients')->cascadeOnDelete();
            
            $table->unique(['lab_id', 'custom_id']);
            $table->string('status')->default('PENDING'); // PENDING, COMPLETED
            $table->json('printed_interpretations')->nullable(); // JSON array of test names/IDs
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
