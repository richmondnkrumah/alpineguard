"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function AlertPanel() {
  const activeAlerts = useQuery(api.alerts.getActiveAlerts) || [];
  const resolveIncident = useMutation(api.alerts.resolveIncident);

  if (activeAlerts.length === 0) {
    return (
      <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/50 flex flex-col items-center justify-center text-zinc-500 h-[600px]">
        <ShieldCheck size={48} className="mb-4 text-emerald-500/50" />
        <p>No active hazards detected.</p>
        <p className="text-sm">Alpine grid is stable.</p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden h-[600px] flex flex-col">
      <div className="p-4 border-b border-zinc-800 bg-red-950/20 text-red-500 font-bold flex items-center gap-2">
        <AlertTriangle size={18} />
        ACTIVE INCIDENTS ({activeAlerts.length})
      </div>
      
      <div className="overflow-y-auto p-4 flex flex-col gap-4">
        {activeAlerts.map((alert) => (
          <div key={alert._id} className="p-4 border border-red-900/50 bg-red-950/10 rounded-lg">
            <h3 className="font-bold text-red-400 text-lg mb-1">{alert.zoneName}</h3>
            <p className="text-zinc-300 text-sm mb-3">{alert.message}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 mb-4 bg-black/30 p-2 rounded">
              <div>Slope: <span className="text-zinc-200">{alert.triggerFactors.slopeDegrees}°</span></div>
              <div>Snow: <span className="text-zinc-200">{alert.triggerFactors.snowfallCm} cm</span></div>
              <div>Temp: <span className="text-zinc-200">{alert.triggerFactors.temperatureC}°C</span></div>
              <div>Rain: <span className="text-zinc-200">{alert.triggerFactors.precipitationMm} mm</span></div>
            </div>

            <button
              onClick={() => resolveIncident({ alertId: alert._id, zoneId: alert.zoneId })}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition font-medium text-sm"
            >
              Resolve & Clear Alert
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}