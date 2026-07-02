<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('custom_id'); // E.g., BILL-2026-0001
            $table->foreignUuid('lab_id')->constrained('labs')->cascadeOnDelete();
            $table->foreignUuid('patient_id')->constrained('patients')->cascadeOnDelete();
            
            $table->unique(['lab_id', 'custom_id']);
            $table->decimal('total', 10, 2);
            $table->decimal('discount', 10, 2)->default(0.0);
            $table->decimal('paid_amount', 10, 2)->default(0.0);
            $table->string('status')->default('UNPAID'); // PAID, UNPAID, PARTIAL
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
