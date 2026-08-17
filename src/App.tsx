import { ConvexProvider, ConvexReactClient } from "convex/react";
import DeckGLMap from "./components/DeckGLMap";
import AlertPanel from "./components/AlertPanel";

const convex = new ConvexReactClient("https://aware-gerbil-519.convex.cloud");

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <main className="p-8 mx-auto flex flex-col gap-8 min-w-screen h-screen">
        {/* Header */}
        <header className="flex flex-col gap-1 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">AlpineGuard 3D</h1>
          <p className="text-zinc-400">Real-Time Geo-Risk Intelligence & Topography</p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
          {/* Map takes up 2/3 of the screen */}
          <div className="lg:col-span-2 flex flex-col gap-4 relative h-full min-h-[500px]">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Live Topography Feed</h2>
            <div className="relative flex-1 rounded-xl overflow-hidden border border-zinc-800">
              <DeckGLMap />
            </div>
          </div>

          {/* Alerts take up 1/3 */}
          <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Security Console</h2>
            <AlertPanel />
          </div>
        </div>
      </main>
    </ConvexProvider>
  );
}
