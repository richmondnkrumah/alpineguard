import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // 1. Parse the incoming JSON payload from Python
      const payload = await request.json();
      
      // 2. Trigger the internal mutation to update the Alpine Zone on the map
      await ctx.runMutation(internal.ingest.updateZoneRisk, payload.zone);
      
      // 3. If Python flagged a hazard, trigger the Alert system
      if (payload.alert) {
        await ctx.runMutation(internal.ingest.triggerAlert, payload.alert);
      }
      
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error("Ingestion Error:", error);
      return new Response(JSON.stringify({ error: "Invalid payload format" }), { status: 400 });
    }
  }),
});

export default http;