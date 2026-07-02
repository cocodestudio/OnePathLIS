<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('lab_id')->nullable()->constrained('labs')->cascadeOnDelete();
            $table->string('role')->default('STAFF'); // ADMIN, STAFF, PATHOLOGIST
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['lab_id']);
            $table->dropColumn(['lab_id', 'role']);
        });
    }
};
