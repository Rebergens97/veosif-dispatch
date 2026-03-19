<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class VehicleInspection extends Model
{
    use SoftDeletes;

    protected $table = 'vehicle_inspections';

    protected $fillable = [
        'uuid',
        'public_id',
        'company_uuid',
        'driver_uuid',
        'vehicle_uuid',
        'order_uuid',
        'tractor_items',
        'trailer_items',
        'tractor_satisfactory',
        'trailer_satisfactory',
        'defects',
        'remarks',
        'status',
        'inspected_at',
    ];

    protected $casts = [
        'tractor_items'         => 'array',
        'trailer_items'         => 'array',
        'defects'               => 'array',
        'tractor_satisfactory'  => 'boolean',
        'trailer_satisfactory'  => 'boolean',
        'inspected_at'          => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->public_id)) {
                $model->public_id = 'insp_' . strtolower(Str::random(10));
            }
        });
    }

    public function hasDefects(): bool
    {
        return !empty($this->defects) && count($this->defects) > 0;
    }

    public function isSatisfactory(): bool
    {
        return $this->tractor_satisfactory && $this->trailer_satisfactory;
    }
}
