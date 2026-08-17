"use client";

import React from "react";
import DeckGL from "@deck.gl/react";
import { ColumnLayer } from "@deck.gl/layers";
import { Map } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const INITIAL_VIEW_STATE = {
    longitude: 8.2275, // Center of Switzerland
    latitude: 46.8182,
    zoom: 7.5,
    pitch: 45, // Tilted to see 3D
    bearing: 0,
};
type Props = {}

const DeckGLMap = (props: Props) => {
    // Real-time subscription to the Alpine Zones
    const zones = useQuery(api.alerts.getZones) || [];

    // Generate 3D columns based on the risk score
    const layers = [
        new ColumnLayer({
            id: "risk-zones-layer",
            data: zones,
            diskResolution: 12,
            radius: 2500, // 2.5km radius
            extruded: true,
            pickable: true,
            elevationScale: 50,
            getPosition: (d) => [d.coordinates.lng, d.coordinates.lat],
            getFillColor: (d) => {
                if (d.status === "critical") return [239, 68, 68, 200]; // Tailwind Red-500
                if (d.status === "elevated") return [234, 179, 8, 200]; // Tailwind Yellow-500
                return [34, 197, 94, 150]; // Tailwind Green-500
            },
            getElevation: (d) => d.currentRiskScore || 1, // Pillar height = risk score
        }),
    ];
    return (
        <div className="relative w-full h-150 rounded-xl overflow-hidden border border-zinc-800">
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                layers={layers}
                getTooltip={({ object }) =>
                    object &&
                    `${object.name}\nStatus: ${object.status.toUpperCase()}\nRisk Score: ${object.currentRiskScore}`
                }
            >
            <Map
                maplibreLogo={false}
                attributionControl={false}
                style={{ width: "100%", height: "100%" }}
                mapStyle="https://demotiles.maplibre.org/style.json"
            />
            </DeckGL>
        </div>
    );
}

export default DeckGLMap