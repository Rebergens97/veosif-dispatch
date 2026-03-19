<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_inspections', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 191)->unique()->nullable();
            $table->string('public_id', 191)->unique()->nullable();
            $table->string('company_uuid', 191)->nullable()->index();
            $table->string('driver_uuid', 191)->nullable()->index();
            $table->string('vehicle_uuid', 191)->nullable()->index();
            $table->string('order_uuid', 191)->nullable()->index();

            // Tractor items (JSON array of checked items)
            $table->json('tractor_items')->nullable();
            // Trailer items (JSON array of checked items)
            $table->json('trailer_items')->nullable();

            // Overall condition
            $table->boolean('tractor_satisfactory')->default(true);
            $table->boolean('trailer_satisfactory')->default(true);

            // Defects reported
            $table->json('defects')->nullable();
            $table->text('remarks')->nullable();

            // Status: pending, approved, rejected
            $table->string('status', 50)->default('pending');

            $table->timestamp('inspected_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_uuid', 'inspected_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_inspections');
    }
};
