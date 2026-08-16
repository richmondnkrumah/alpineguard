import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Fetch all Alpine zones for the 3D Map
export const getZones = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("geoRiskZones").collect();
  },
});

// Fetch only unresolved hazard alerts for the Alert Panel
export const getActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("riskAlerts")
      .withIndex("by_resolved", (q) => q.eq("resolved", false))
      .order("desc") // Newest alerts first
      .collect();
  },
});

// Allow a SOC engineer to resolve an alert from the dashboard
export const resolveIncident = mutation({
  args: { 
    alertId: v.id("riskAlerts"), 
    zoneId: v.string() 
  },
  handler: async (ctx, args) => {
    // Mark alert as resolved
    await ctx.db.patch(args.alertId, { resolved: true });
    
    // Automatically revert the Alpine zone status back to stable
    const zone = await ctx.db
      .query("geoRiskZones")
      .withIndex("by_zoneId", (q) => q.eq("zoneId", args.zoneId))
      .first();
      
    if (zone) {
      await ctx.db.patch(zone._id, { 
        status: "stable", 
        currentRiskScore: 0, 
        hazardType: "none" 
      });
    }
  },
});