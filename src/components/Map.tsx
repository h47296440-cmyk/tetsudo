import React from 'react';
import { Node, Edge, ActiveTransport } from '../types';
import { 
  MapPin, 
  Anchor, 
  Warehouse, 
  Settings, 
  HelpCircle,
  Truck,
  Ship,
  Train,
  AlertTriangle,
  CheckCircle,
  Construction
} from 'lucide-react';
import { playBeep } from '../utils/audio';

interface MapProps {
  nodes: Node[];
  edges: Edge[];
  transports: ActiveTransport[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
}

export const Map: React.FC<MapProps> = ({
  nodes,
  edges,
  transports,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
}) => {
  // SVG Canvas configuration
  const width = 1000;
  const height = 900;

  // Helper to find node by id
  const findNode = (id: string) => nodes.find(n => n.id === id);

  // Helper to get coordinates for progress along an edge
  const getTransportCoords = (t: ActiveTransport) => {
    const fromNode = findNode(t.from);
    const toNode = findNode(t.to);
    if (!fromNode || !toNode) return { x: 0, y: 0 };
    
    // Line interpolation
    const x = fromNode.coord.x + (toNode.coord.x - fromNode.coord.x) * t.progress;
    const y = fromNode.coord.y + (toNode.coord.y - fromNode.coord.y) * t.progress;
    return { x, y };
  };

  return (
    <div id="reconstruction-map-root" className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Map Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-lg flex items-center space-x-3 shadow-md">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-xs font-mono font-bold tracking-wider text-slate-300">RAIL-GRID VECTOR RADAR v4.2</span>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-lg text-right font-mono text-[10px] text-slate-400 leading-relaxed shadow-md">
        <div>GREEN: 信通軌道完全開通</div>
        <div>RED DASHED: 震災不通区間</div>
        <div>ORANGE DASHED: 復旧工事中</div>
      </div>

      {/* Map Legend & Overlay Description */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-lg flex flex-col space-y-1 text-[11px] font-mono shadow-md text-slate-300">
        <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-100 flex items-center gap-1">
          <Settings className="w-3.5 h-3.5 text-blue-400" />
          路線トポロジー
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-[3px] bg-emerald-500 rounded inline-block" />
          <span>通常運行可能 (列車運行可)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-[3px] border-b-2 border-dashed border-red-500 inline-block" />
          <span>被災・不通区間 (トラック配送のみ)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-[3px] border-b-2 border-dashed border-amber-500 inline-block animate-pulse" />
          <span>軌道復旧工事中 (資材/人員集中)</span>
        </div>
      </div>

      {/* Watermark / Narrative context */}
      <div className="absolute bottom-5 right-5 z-0 opacity-10 select-none text-right">
        <h4 className="text-lg font-bold font-mono text-slate-400">SANRIKU COAST</h4>
        <p className="text-[10px] font-mono text-slate-500">RECONSTRUCTION SECTOR A-3</p>
      </div>

      {/* SVG Container inside fluid div */}
      <div className="w-full h-full min-h-[500px] lg:min-h-[620px]">
        <svg 
          viewBox={`200 50 600 800`} 
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Grid Lines to look like radar dashboard */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            {/* Soft radial glare */}
            <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0b1329" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            
            {/* Filter for glow */}
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width={width} height={height} fill="url(#ocean-gradient)" />
          <rect width={width} height={height} fill="url(#grid)" />

          {/* Simulated Coastline paths for realistic visual mapping */}
          <path 
            d="M 230,50 Q 320,250 330,450 T 360,650 T 290,900" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="3" 
            strokeDasharray="8,4"
          />
          <path 
            d="M 580,50 C 530,220 540,430 520,620 C 510,710 490,820 510,900" 
            fill="none" 
            stroke="#0f172a" 
            strokeWidth="110" 
            strokeLinecap="round"
            opacity="0.3"
          />
          <text x="580" y="470" fill="#334155" fontSize="14" fontFamily="monospace" letterSpacing="6" className="font-bold opacity-30 origin-center rotate-90">太平洋 PACIFIC OCEAN</text>
          <text x="250" y="470" fill="#334155" fontSize="14" fontFamily="monospace" letterSpacing="6" className="font-bold opacity-30 origin-center -rotate-90">陸上山脈 AREA MOUNTAIN</text>

          {/* BACKGROUND ROAD LINKS (Alternative Truck Routes) - Sleek dashed gray lines */}
          <g opacity="0.4">
            {edges.map((edge) => {
              const fromNode = findNode(edge.from);
              const toNode = findNode(edge.to);
              if (!fromNode || !toNode) return null;

              // Compute simple arc path for roads to differentiate from straight rail lines
              const midX = (fromNode.coord.x + toNode.coord.x) / 2 - 30;
              const midY = (fromNode.coord.y + toNode.coord.y) / 2;

              return (
                <path
                  key={`road-${edge.id}`}
                  d={`M ${fromNode.coord.x} ${fromNode.coord.y} Q ${midX} ${midY} ${toNode.coord.x} ${toNode.coord.y}`}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4,6"
                />
              );
            })}
          </g>

          {/* RAILWAYS (EDGES) */}
          <g>
            {edges.map((edge) => {
              const fromNode = findNode(edge.from);
              const toNode = findNode(edge.to);
              if (!fromNode || !toNode) return null;

              const isSelected = selectedEdgeId === edge.id;
              
              let strokeColor = '#ef4444'; // Red for damaged
              let strokeDash = '8,6';
              let lineWidth = 3.5;
              let filter = '';
              let animeClass = '';

              if (edge.status === 'operational') {
                strokeColor = '#10b981'; // Emerald Green of hope
                strokeDash = '0';
                lineWidth = 4.5;
                filter = 'url(#glow-green)';
              } else if (edge.status === 'under_construction') {
                strokeColor = '#f59e0b'; // Amber warning
                strokeDash = '6,4';
                lineWidth = 3.5;
                animeClass = 'animate-[dash_1s_linear_infinite]';
              } else {
                // Damaged but severe glow
                filter = isSelected ? 'url(#glow-red)' : '';
              }

              return (
                <g key={edge.id} className="cursor-pointer" onClick={() => { playBeep(500, 0.05); onSelectEdge(edge.id); }}>
                  {/* Broad invisible gesture detector link underneath */}
                  <line
                    x1={fromNode.coord.x}
                    y1={fromNode.coord.y}
                    x2={toNode.coord.x}
                    y2={toNode.coord.y}
                    stroke="transparent"
                    strokeWidth="18"
                  />
                  
                  {/* Outer selection indicator */}
                  {isSelected && (
                    <line
                      x1={fromNode.coord.x}
                      y1={fromNode.coord.y}
                      x2={toNode.coord.x}
                      y2={toNode.coord.y}
                      stroke="#3b82f6"
                      strokeWidth={lineWidth + 5}
                      opacity="0.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Core rail line */}
                  <line
                    x1={fromNode.coord.x}
                    y1={fromNode.coord.y}
                    x2={toNode.coord.x}
                    y2={toNode.coord.y}
                    stroke={strokeColor}
                    strokeWidth={lineWidth}
                    strokeDasharray={strokeDash}
                    strokeLinecap="round"
                    filter={filter}
                    className={animeClass}
                  />

                  {/* Railroad wood sleeper notches overlay for authenticity (on restored lines) */}
                  {edge.status === 'operational' && (
                    <line
                      x1={fromNode.coord.x}
                      y1={fromNode.coord.y}
                      x2={toNode.coord.x}
                      y2={toNode.coord.y}
                      stroke="#047857"
                      strokeWidth={lineWidth - 1.5}
                      strokeDasharray="2,6"
                    />
                  )}

                  {/* Distance text node indicator bubble */}
                  <g transform={`translate(${(fromNode.coord.x + toNode.coord.x) / 2}, ${(fromNode.coord.y + toNode.coord.y) / 2 - 12})`}>
                    <rect
                      x="-24"
                      y="-8"
                      width="48"
                      height="16"
                      rx="4"
                      fill="#0f172a"
                      stroke={isSelected ? '#3b82f6' : '#1e293b'}
                      strokeWidth="1"
                    />
                    <text
                      fill={edge.status === 'operational' ? '#10b981' : '#cbd5e1'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      y="3"
                      fontWeight="bold"
                    >
                      {edge.distance}km
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* ACTIVE LOGISTICS TRANSPORTS ANIMATING IN REALTIME */}
          <g>
            {transports.map((transport) => {
              const coords = getTransportCoords(transport);
              if (coords.x === 0 && coords.y === 0) return null;

              let color = '#f59e0b'; // Yellow for truck
              let size = 6;
              let iconSymbol = '🚙';

              if (transport.type === 'train') {
                color = '#10b981'; // Green for energy efficient rail
                size = 8;
                iconSymbol = '🚃';
              } else if (transport.type === 'barge') {
                color = '#3b82f6'; // Blue sea transport
                size = 7;
                iconSymbol = '🚢';
              }

              return (
                <g key={transport.id} className="transition-all duration-300">
                  {/* Floating cargo pulse aura */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={size + 5}
                    fill={color}
                    opacity="0.25"
                    className="animate-ping"
                  />
                  {/* Main carriage vessel */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={size}
                    fill={color}
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                  {/* Directional arrow pointer or identifier label */}
                  <text
                    x={coords.x}
                    y={coords.y - size - 4}
                    fill={color}
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="font-bold bg-slate-950 px-1 rounded"
                  >
                    {transport.type === 'train' ? 'TRAIN' : transport.type === 'barge' ? 'SHIP' : 'TRUCK'}
                  </text>
                </g>
              );
            })}
          </g>

          {/* STATION NODES */}
          <g>
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              
              // Determine thematic color of node based on connection and role
              let nodeColor = '#3b82f6'; // default blue
              if (node.type === 'hub') nodeColor = '#a855f7'; // purple
              else if (node.type === 'port') nodeColor = '#06b6d4'; // cyan
              
              // If isolated, display red indicator warning
              const isIsolated = node.isolationLevel > 0 && node.type !== 'port';
              
              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.coord.x}, ${node.coord.y})`}
                  className="cursor-pointer"
                  onClick={() => { playBeep(600, 0.05); onSelectNode(node.id); }}
                >
                  {/* Big touch target handler */}
                  <circle r="22" fill="transparent" />

                  {/* Pulsing hazard glow if town remains totally isolated */}
                  {isIsolated && (
                    <circle
                      r="16"
                      fill="#ef4444"
                      opacity="0.15"
                      className="animate-[ping_3s_infinite_ease-in-out]"
                    />
                  )}

                  {/* Base geometric anchor node */}
                  {isSelected && (
                    <circle
                      r="18"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="2.5"
                      strokeDasharray="4,2"
                      className="animate-[spin_12s_linear_infinite]"
                    />
                  )}

                  <circle
                    r={node.type === 'hub' ? '12' : '10'}
                    fill="#0f172a"
                    stroke={isSelected ? '#60a5fa' : isIsolated ? '#ef4444' : '#10b981'}
                    strokeWidth={isSelected ? '3.5' : '2.5'}
                  />

                  {/* Core symbol center point */}
                  <circle
                    r="4"
                    fill={isIsolated ? '#ef4444' : '#10b981'}
                  />

                  {/* Tiny warning icon for isolated populations */}
                  {isIsolated && (
                    <g transform="translate(10, -10)">
                      <circle r="6" fill="#ef4444" />
                      <text fill="#ffffff" fontSize="7" textAnchor="middle" y="2" fontWeight="bold">!</text>
                    </g>
                  )}

                  {/* Double rings for high-tech base depot */}
                  {node.type === 'hub' && (
                    <circle r="7" fill="none" stroke="#a855f7" strokeWidth="1" />
                  )}

                  {/* Node Label Card */}
                  <g transform={`translate(0, ${node.type === 'hub' ? '24' : '22'})`}>
                    {/* Shadow Plate */}
                    <rect
                      x="-65"
                      y="-12"
                      width="130"
                      height="22"
                      rx="4"
                      fill="#0f172ac0"
                      stroke={isSelected ? '#60a5fa' : '#1e293b'}
                      strokeWidth="1"
                    />
                    {/* Primary Japanese station name */}
                    <text
                      fill="#ffffff"
                      fontSize="9.5"
                      fontStyle=""
                      fontWeight="bold"
                      textAnchor="middle"
                      y="-1"
                    >
                      {node.jpName.split(' ')[0]}
                    </text>
                    {/* Isolation index readout or node role label */}
                    <text
                      fill={isIsolated ? '#ef4444' : '#10b981'}
                      fontSize="7"
                      fontFamily="monospace"
                      textAnchor="middle"
                      y="7.5"
                      className="font-bold tracking-wider"
                    >
                      {isIsolated ? `孤立度: ${node.isolationLevel}%` : '全線復旧開通・接続済'}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
