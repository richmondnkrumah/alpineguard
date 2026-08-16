import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Monitored Alpine zones with 3D geospatial & risk attributes
  geoRiskZones: defineTable({
    zoneId: v.string(), // 
    name: v.string(), // 
    canton: v.string(), // 
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
      elevationMeters: v.number(),
      slopeDegrees: v.number(),
    }),
    currentRiskScore: v.number(), // 0 (safe) to 100 (critical)
    hazardType: v.union(
      v.literal("none"),
      v.literal("avalanche"),
      v.literal("landslide"),
      v.literal("debris_flow")
    ),
    status: v.union(
      v.literal("stable"),
      v.literal("elevated"),
      v.literal("critical")
    ),
    lastEvaluated: v.number(), // Timestamp in ms
  })
    .index("by_zoneId", ["zoneId"])
    .index("by_status", ["status"])
    .index("by_riskScore", ["currentRiskScore"]),

  // Real-time alerts pushed to the UI
  riskAlerts: defineTable({
    zoneId: v.string(),
    zoneName: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical")
    ),
    hazardType: v.union(
      v.literal("avalanche"),
      v.literal("landslide"),
      v.literal("debris_flow")
    ),
    message: v.string(),
    triggerFactors: v.object({
      precipitationMm: v.number(),
      snowfallCm: v.number(),
      slopeDegrees: v.number(),
      temperatureC: v.number(),
    }),
    resolved: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_resolved", ["resolved"])
    .index("by_timestamp", ["timestamp"]),

  // Weather telemetry cache per zone
  weatherMetrics: defineTable({
    zoneId: v.string(),
    temperatureC: v.number(),
    precipitationMm: v.number(),
    snowfallCm: v.number(),
    windSpeedKmh: v.number(),
    sourceModel: v.string(),
    recordedAt: v.number(),
  }).index("by_zoneId", ["zoneId"]),
});