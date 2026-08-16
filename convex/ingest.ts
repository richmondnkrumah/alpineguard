import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const updateZoneRisk = internalMutation({
  args: {
    zoneId: v.string(),
    name: v.string(),
    canton: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
      elevationMeters: v.number(),
      slopeDegrees: v.number(),
    }),
    currentRiskScore: v.number(),
    hazardType: v.union(
      v.literal("none"),
      v.literal("avalanche"),
      v.literal("landslide"),
      v.literal("debris_flow")
    ),
    status: v.union(v.literal("stable"), v.literal("elevated"), v.literal("critical")),
  },
  handler: async (ctx, args) => {
    // Check if the zone already exists
    const existingZone = await ctx.db
      .query("geoRiskZones")
      .withIndex("by_zoneId", (q) => q.eq("zoneId", args.zoneId))
      .first();

    const timestamp = Date.now();
    
    // If it exists, update it with live risk scores. If not, insert it.
    if (existingZone) {
      await ctx.db.patch(existingZone._id, { ...args, lastEvaluated: timestamp });
    } else {
      await ctx.db.insert("geoRiskZones", { ...args, lastEvaluated: timestamp });
    }
  },
});

export const triggerAlert = internalMutation({
  args: {
    zoneId: v.string(),
    zoneName: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    hazardType: v.union(v.literal("avalanche"), v.literal("landslide"), v.literal("debris_flow")),
    message: v.string(),
    triggerFactors: v.object({
      precipitationMm: v.number(),
      snowfallCm: v.number(),
      slopeDegrees: v.number(),
      temperatureC: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("riskAlerts", {
      ...args,
      resolved: false, // Alerts start as unresolved
      timestamp: Date.now(),
    });
  },
});