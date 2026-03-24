import { GitCompare } from 'lucide-react';

export default function ScanComparison({ account, provider }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
      <GitCompare className="w-12 h-12 opacity-30" />
      <div className="text-center">
        <p className="text-sm font-medium text-text">Scan Comparison</p>
        <p className="text-xs mt-1">Compare security posture between two scans.</p>
        <p className="text-[10px] mt-0.5">Select two scans to see differences in findings and scores.</p>
      </div>
    </div>
  );
}
