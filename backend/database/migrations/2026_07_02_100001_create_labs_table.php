<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('address');
            $table->string('logo_url')->nullable();
            $table->string('print_bg_image')->nullable();
            $table->integer('print_header_height')->default(40);
            $table->integer('print_footer_height')->default(40);
            $table->integer('print_margin_left')->default(40);
            $table->integer('print_margin_right')->default(40);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labs');
    }
};
