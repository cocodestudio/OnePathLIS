<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_tests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignUuid('test_id')->constrained('tests')->cascadeOnDelete();
            $table->string('result_value')->nullable(); // String to accommodate ranges
            $table->boolean('is_abnormal')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_tests');
    }
};
