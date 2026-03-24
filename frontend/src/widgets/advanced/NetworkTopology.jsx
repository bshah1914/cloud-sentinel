import { Network } from 'lucide-react';

export default function NetworkTopology({ account, provider }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
      <Network className="w-12 h-12 opacity-30" />
      <div className="text-center">
        <p className="text-sm font-medium text-text">Network Topology Visualization</p>
        <p className="text-xs mt-1">Interactive network graph coming soon.</p>
        <p className="text-[10px] mt-0.5">Will be implemented with @xyflow/react</p>
      </div>
    </div>
  );
}
