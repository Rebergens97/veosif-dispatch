<?php

namespace App\Http\Controllers;

use App\Models\VehicleInspection;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class VehicleInspectionController extends Controller
{
    /**
     * Store a new vehicle inspection.
     * Called from the VEOSIF Driver app after pre-trip inspection.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'driver'                 => 'nullable|string',
            'vehicle'                => 'nullable|string',
            'order'                  => 'nullable|string',
            'tractor_items'          => 'nullable|array',
            'trailer_items'          => 'nullable|array',
            'tractor_satisfactory'   => 'nullable|boolean',
            'trailer_satisfactory'   => 'nullable|boolean',
            'defects'                => 'nullable|array',
            'remarks'                => 'nullable|string',
            'inspected_at'           => 'nullable|string',
        ]);

        // Get company from session/token if available
        $companyUuid = null;
        try {
            $user = auth()->user();
            if ($user && $user->company_uuid) {
                $companyUuid = $user->company_uuid;
            }
        } catch (\Exception $e) {
            // Continue without company
        }

        $inspection = VehicleInspection::create([
            'company_uuid'          => $companyUuid,
            'driver_uuid'           => $data['driver'] ?? null,
            'vehicle_uuid'          => $data['vehicle'] ?? null,
            'order_uuid'            => $data['order'] ?? null,
            'tractor_items'         => $data['tractor_items'] ?? [],
            'trailer_items'         => $data['trailer_items'] ?? [],
            'tractor_satisfactory'  => $data['tractor_satisfactory'] ?? true,
            'trailer_satisfactory'  => $data['trailer_satisfactory'] ?? true,
            'defects'               => $data['defects'] ?? [],
            'remarks'               => $data['remarks'] ?? null,
            'status'                => empty($data['defects']) ? 'approved' : 'pending',
            'inspected_at'          => isset($data['inspected_at'])
                ? Carbon::parse($data['inspected_at'])
                : now(),
        ]);

        return response()->json([
            'status'     => 'success',
            'inspection' => $inspection,
        ], 201);
    }

    /**
     * List inspections (for dispatcher console).
     */
    public function index(Request $request)
    {
        $query = VehicleInspection::orderBy('inspected_at', 'desc');

        // Filter by company
        $companyUuid = null;
        try {
            $user = auth()->user();
            if ($user && $user->company_uuid) {
                $companyUuid = $user->company_uuid;
                $query->where('company_uuid', $companyUuid);
            }
        } catch (\Exception $e) {
            // Continue
        }

        // Filter by date
        if ($request->has('date')) {
            $date = Carbon::parse($request->date)->toDateString();
            $query->whereDate('inspected_at', $date);
        } else {
            // Default: today
            $query->whereDate('inspected_at', Carbon::today());
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $inspections = $query->limit(50)->get();

        return response()->json([
            'inspections'   => $inspections,
            'total'         => $inspections->count(),
            'with_defects'  => $inspections->filter(fn($i) => $i->hasDefects())->count(),
            'satisfactory'  => $inspections->filter(fn($i) => $i->isSatisfactory())->count(),
        ]);
    }

    /**
     * Check if a driver has completed today's inspection.
     */
    public function checkDriver(Request $request, string $driverUuid)
    {
        $today = Carbon::today();
        $inspection = VehicleInspection::where('driver_uuid', $driverUuid)
            ->whereDate('inspected_at', $today)
            ->first();

        return response()->json([
            'inspected_today'  => !is_null($inspection),
            'inspection'       => $inspection,
            'can_start_order'  => !is_null($inspection),
        ]);
    }

    /**
     * Approve or reject an inspection (dispatcher action).
     */
    public function updateStatus(Request $request, string $uuid)
    {
        $data = $request->validate([
            'status' => 'required|in:approved,rejected,pending',
        ]);

        $inspection = VehicleInspection::where('uuid', $uuid)->firstOrFail();
        $inspection->update(['status' => $data['status']]);

        return response()->json(['status' => 'updated', 'inspection' => $inspection]);
    }
}
