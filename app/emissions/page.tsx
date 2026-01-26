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
    new Set(["flight", "coach"])
  );
  const [carFuelType, setCarFuelType] = useState<CarFuelType>("petrol");
  const [results, setResults] = useState<EmissionResult[]>([]);
  const [expandedMode, setExpandedMode] = useState<TransportMode | null>(null);

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
    <main className="space-y-8 max-w-4xl">
      <BackHome />

      {/* Page Title */}
      <h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-[var(--secondary)]"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        Emissions Calculator
      </h1>

      <form onSubmit={handleSubmit} className="card p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Trip Details Section */}
        <div className="space-y-6">
          <h2
            className="text-xl font-bold text-[var(--secondary)]"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Trip details
          </h2>

          {/* Modes Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--secondary)]/80 uppercase tracking-wide">
              Modes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(MODE_INFO).map(([mode, info]) => {
                const isSelected = selectedModes.has(mode as TransportMode);
                const isExpanded = expandedMode === mode;
                const isCar = mode === "car";

                return (
                  <div key={mode} className="relative">
              <label
                      className={`card p-5 cursor-pointer transition-all relative min-h-[140px] flex flex-col ${
                        isSelected
                          ? "border-2 border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                          : "border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-sm"
                      }`}
                    >
                      {/* Header Row - Checkbox and Arrow */}
                      <div className="flex items-start justify-between mb-4">
                        {/* Custom Checkbox - Top Left */}
                        <div className="flex-shrink-0">
                <input
                  type="checkbox"
                            checked={isSelected}
                  onChange={() => toggleMode(mode as TransportMode)}
                            className="sr-only"
                />
                          <div
                            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary)] shadow-sm"
                                : "border-[var(--secondary)]/30 bg-white hover:border-[var(--primary)]/50"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMode(mode as TransportMode);
                            }}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
          </div>

                        {/* Downward Arrow - Top Right */}
                        {isCar && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedMode(isExpanded ? null : (mode as TransportMode));
                            }}
                            className={`flex-shrink-0 p-1 rounded transition-all ${
                              isExpanded
                                ? "text-[var(--primary)] bg-[var(--primary)]/10"
                                : "text-[var(--secondary)]/40 hover:text-[var(--secondary)]/60 hover:bg-[var(--secondary)]/5"
                            }`}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
          )}
        </div>

                      {/* Icon and Label - Centered */}
                      <div className="flex flex-col items-center justify-center gap-3 flex-1">
                        <span className="text-4xl">{info.icon}</span>
                        <span
                          className={`text-sm font-semibold transition-colors ${
                            isSelected
                              ? "text-[var(--primary)]"
                              : "text-[var(--secondary)]"
                          }`}
                        >
                          {info.label}
                        </span>
                      </div>
                    </label>

                    {/* Car Fuel Type Dropdown */}
                    {isCar && isExpanded && (
                      <div className="absolute top-full left-0 right-0 mt-2 card p-4 z-10 bg-white border-2 border-[var(--primary)]/20 shadow-lg">
                        <label className="block text-xs font-semibold text-[var(--secondary)] mb-2 uppercase tracking-wide">
                          Fuel Type
            </label>
            <select
                          className="border-2 border-[var(--border)] p-2.5 w-full rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all"
              value={carFuelType}
              onChange={(e) => setCarFuelType(e.target.value as CarFuelType)}
                          onClick={(e) => e.stopPropagation()}
            >
              {CAR_FUEL_TYPES.map((fuel) => (
                <option key={fuel.value} value={fuel.value}>
                  {fuel.label}
                </option>
              ))}
            </select>
          </div>
        )}
                  </div>
                );
              })}
            </div>
            {selectedModes.size === 0 && (
              <p className="text-xs text-[var(--primary)]">Please select at least one transport mode.</p>
            )}
          </div>

          {/* Number of People */}
        <div className="space-y-2">
            <label htmlFor="passengers" className="flex items-center gap-2 text-sm font-semibold text-[var(--secondary)]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              People
          </label>
            <div className="flex items-center gap-2">
          <input
            id="passengers"
            type="number"
            min="1"
                className="border border-[var(--border)] p-2 rounded-lg flex-1"
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
            required
          />
              <button
                type="button"
                onClick={() => setPassengers(String(Math.max(1, parseInt(passengers) - 1)))}
                className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)]/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setPassengers(String(parseInt(passengers) + 1))}
                className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)]/5"
              >
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <label htmlFor="distance" className="block text-sm font-semibold text-[var(--secondary)]">
              Distance
            </label>
            <div className="flex items-center gap-2">
              <input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                className="border border-[var(--border)] p-2 rounded-lg flex-1"
                placeholder="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                required
              />
              <span className="text-sm text-[var(--secondary)]/60 font-medium">km</span>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          type="submit"
          className="w-full py-4 bg-[var(--primary)] text-white font-bold text-lg rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
          disabled={selectedModes.size === 0}
        >
          CALCULATE
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
