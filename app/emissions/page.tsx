"use client";

import { useState } from "react";
import BackHome from "../components/BackHome";

// Emission factors (kg CO₂e per passenger-km, except car which is per vehicle-km)
// Sources: UK DEFRA, EEA, ICCT
const EMISSION_FACTORS = {
  flight: 0.15, // kg CO₂e per passenger-km (avg. economy)
  rail: 0.04, // kg CO₂e per passenger-km (electric + diesel mix)
  coach: 0.03, // kg CO₂e per passenger-km (long distance)
  car: {
    petrol: 0.18, // kg CO₂e per vehicle-km
    diesel: 0.17, // kg CO₂e per vehicle-km
    hybrid: 0.11, // kg CO₂e per vehicle-km
    ev: 0.05, // kg CO₂e per vehicle-km (average grid)
  },
};

type TransportMode = "flight" | "rail" | "car" | "coach";
type CarFuelType = "petrol" | "diesel" | "hybrid" | "ev";

type EmissionResult = {
  mode: TransportMode;
  label: string;
  icon: string;
  perPerson: number;
  total: number;
  fuelType?: CarFuelType;
};

const MODE_INFO: Record<
  TransportMode,
  { label: string; icon: string }
> = {
  flight: { label: "Flight", icon: "✈️" },
  rail: { label: "Rail", icon: "🚂" },
  car: { label: "Car", icon: "🚗" },
  coach: { label: "Coach", icon: "🚌" },
};

const CAR_FUEL_TYPES: { value: CarFuelType; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "ev", label: "EV" },
];

export default function EmissionsPage() {
  const [distance, setDistance] = useState<string>("");
  const [passengers, setPassengers] = useState<string>("1");
  const [selectedModes, setSelectedModes] = useState<Set<TransportMode>>(
    new Set(["flight", "rail", "car", "coach"])
  );
  const [carFuelType, setCarFuelType] = useState<CarFuelType>("petrol");
  const [results, setResults] = useState<EmissionResult[]>([]);

  function toggleMode(mode: TransportMode) {
    const newSet = new Set(selectedModes);
    if (newSet.has(mode)) {
      newSet.delete(mode);
    } else {
      newSet.add(mode);
    }
    setSelectedModes(newSet);
  }

  function calculateEmissions() {
    const dist = parseFloat(distance);
    const pass = parseInt(passengers, 10);

    if (isNaN(dist) || dist <= 0 || isNaN(pass) || pass <= 0 || selectedModes.size === 0) {
      setResults([]);
      return;
    }

    const calculated: EmissionResult[] = [];

    // Calculate for each selected mode
    selectedModes.forEach((mode) => {
      const info = MODE_INFO[mode];
      let perPerson: number;
      let total: number;

      if (mode === "car") {
        // Car-specific logic: vehicle-based calculation
        const vehicleFactor = EMISSION_FACTORS.car[carFuelType];
        const vehicleTotal = dist * vehicleFactor;
        perPerson = vehicleTotal / pass;
        total = vehicleTotal;

        calculated.push({
          mode,
          label: `${info.label} (${CAR_FUEL_TYPES.find((f) => f.value === carFuelType)?.label})`,
          icon: info.icon,
          perPerson: Math.round(perPerson * 100) / 100,
          total: Math.round(total * 100) / 100,
          fuelType: carFuelType,
        });
      } else {
        // Standard modes: passenger-based calculation
        const factor = EMISSION_FACTORS[mode];
        perPerson = dist * factor;
        total = perPerson * pass;

        calculated.push({
          mode,
          label: info.label,
          icon: info.icon,
          perPerson: Math.round(perPerson * 100) / 100,
          total: Math.round(total * 100) / 100,
        });
      }
    });

    // Sort by total emissions (lowest first)
    calculated.sort((a, b) => a.total - b.total);
    setResults(calculated);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateEmissions();
  };

  const getBestOption = () => {
    if (results.length === 0) return null;
    return results[0];
  };

  const best = getBestOption();

  return (
    <main className="space-y-6 max-w-4xl">
      <BackHome />

      <div>
        <h1 className="text-3xl font-bold">Carbon Emissions Comparison</h1>
        <p className="text-sm opacity-80 mt-2">
          Provide comparative travel emissions estimates for different transport modes.
          <br />
          <span className="italic">This tool is informational only, not an official carbon reporting system.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="distance" className="block font-semibold text-sm">
            Distance (km) <span className="text-red-600">*</span>
          </label>
          <input
            id="distance"
            type="number"
            step="0.1"
            min="0"
            className="border p-2 w-full"
            placeholder="e.g. 500"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block font-semibold text-sm">
            Transport Modes to Compare <span className="text-red-600">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(MODE_INFO).map(([mode, info]) => (
              <label
                key={mode}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                  selectedModes.has(mode as TransportMode)
                    ? "border-[var(--accent)] bg-red-50 dark:bg-red-950/20"
                    : "border-[var(--border)] hover:border-[var(--border-hover)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedModes.has(mode as TransportMode)}
                  onChange={() => toggleMode(mode as TransportMode)}
                  className="cursor-pointer"
                />
                <span className="text-lg">{info.icon}</span>
                <span className="text-sm font-medium">{info.label}</span>
              </label>
            ))}
          </div>
          {selectedModes.size === 0 && (
            <p className="text-xs text-red-600">Please select at least one transport mode.</p>
          )}
        </div>

        {selectedModes.has("car") && (
          <div className="space-y-2">
            <label htmlFor="carFuelType" className="block font-semibold text-sm">
              Fuel Type (Car only)
            </label>
            <select
              id="carFuelType"
              className="border p-2 w-full"
              value={carFuelType}
              onChange={(e) => setCarFuelType(e.target.value as CarFuelType)}
            >
              {CAR_FUEL_TYPES.map((fuel) => (
                <option key={fuel.value} value={fuel.value}>
                  {fuel.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="passengers" className="block font-semibold text-sm">
            Number of People Travelling <span className="text-red-600">*</span>
          </label>
          <input
            id="passengers"
            type="number"
            min="1"
            className="border p-2 w-full"
            placeholder="1"
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary px-6 py-2"
          disabled={selectedModes.size === 0}
        >
          Calculate Emissions
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          {best && (
            <div className="card p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                <span>🌱</span>
                <span>Lowest CO₂e Option</span>
              </div>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span>{best.icon}</span>
                <span>{best.label}</span>
              </div>
              <div className="text-sm opacity-80 mt-1">
                {best.perPerson} kg CO₂e per person • {best.total} kg CO₂e total
              </div>
            </div>
          )}

          <div className="card p-4 space-y-3">
            <div className="font-semibold">Comparison Results</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result) => {
                const isBest = result.mode === best?.mode && result.fuelType === best?.fuelType;

                return (
                  <div
                    key={`${result.mode}-${result.fuelType || ""}`}
                    className={`border rounded-lg p-4 ${
                      isBest
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{result.icon}</span>
                        <div className="font-semibold">{result.label}</div>
                      </div>
                      {isBest && (
                        <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 rounded font-medium">
                          Best
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="opacity-70 text-xs">Per person</div>
                        <div className="font-semibold text-base">{result.perPerson} kg CO₂e</div>
                      </div>
                      <div>
                        <div className="opacity-70 text-xs">
                          Total ({passengers} {passengers === "1" ? "person" : "people"})
                        </div>
                        <div className="font-semibold text-base">{result.total} kg CO₂e</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      <p className="text-xs opacity-70 text-center italic">
        Values represent averages and are intended for comparison only. This is not an official carbon accounting tool.
      </p>
    </main>
  );
}
