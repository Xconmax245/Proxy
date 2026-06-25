"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { DelegationObject } from "@/lib/state";
import { useSuiNSNames } from "@/hooks/useSuiNS";
import { mistToSui } from "@/lib/sui";

interface DelegationGraphProps {
  delegations: DelegationObject[];
  connectedAddress?: string;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  isMe: boolean;
  label: string;
  isSubDelegate?: boolean;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: number;
  amount: number;
  status: number;
  id: string;
  isSub?: boolean;
}

export default function DelegationGraph({ delegations, connectedAddress }: DelegationGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    title: string;
    body: string[];
  }>({
    show: false,
    x: 0,
    y: 0,
    title: "",
    body: [],
  });

  const allAddresses = useMemo(() => {
    return delegations.flatMap(d => [d.delegator, d.delegate]);
  }, [delegations]);
  const { data: nameMap } = useSuiNSNames(allAddresses);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Determine dimensions from parent container
    const width = containerRef.current.clientWidth || 800;
    const height = 400;

    // 1. Process delegations into Nodes and Links
    const nodeSet = new Set<string>();
    const nodes: Node[] = [];
    const links: Link[] = [];
    const subDelegates = new Set<string>();

    delegations.forEach((d) => {
      nodeSet.add(d.delegator.toLowerCase());
      nodeSet.add(d.delegate.toLowerCase());

      const isSub = connectedAddress ? d.delegator.toLowerCase() !== connectedAddress.toLowerCase() : false;
      if (isSub) {
        subDelegates.add(d.delegate.toLowerCase());
      }

      links.push({
        source: d.delegator.toLowerCase(),
        target: d.delegate.toLowerCase(),
        type: d.delegation_type,
        amount: mistToSui(BigInt(d.scope_limit)),
        status: d.status,
        id: d.id,
        isSub,
      });
    });

    nodeSet.forEach((addr) => {
      const isMe = connectedAddress ? addr === connectedAddress.toLowerCase() : false;
      const name = nameMap?.[addr];
      let label = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      if (name && name !== addr) {
        label = name;
      } else if (isMe) {
        label = "Me (Connected)";
      }

      nodes.push({
        id: addr,
        isMe,
        label,
        isSubDelegate: subDelegates.has(addr),
      });
    });

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background", "transparent");

    // Add arrowhead markers for directed lines
    svg
      .append("defs")
      .selectAll("marker")
      .data(["active", "active-sub", "expired", "revoked"])
      .enter()
      .append("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26) // Adjusted for new larger radii
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L10,0L0,4")
      .attr("fill", (d) => {
        if (d === "active") return "#c8ff00"; // Neon green
        if (d === "active-sub") return "#3b82f6"; // Blue
        if (d === "revoked") return "#ef4444"; // Red
        return "#6b7280"; // Gray
      });

    // 2. Setup Force Simulation
    const simulation = d3
      .forceSimulation<Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(130)
      )
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(35));

    // 3. Draw Links (Edges)
    const linkBase = svg
      .append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.status === 0) return d.isSub ? "rgba(59, 130, 246, 0.2)" : "rgba(200, 255, 0, 0.2)";
        if (d.status === 1) return "rgba(239, 68, 68, 0.2)";
        return "rgba(107, 114, 128, 0.2)";
      })
      .attr("stroke-width", (d) => {
        if (d.amount === 0) return 2;
        return Math.max(2, Math.min(6, d.amount / 300));
      })
      .attr("stroke-dasharray", (d) => {
        if (d.status === 1) return "4, 4";
        return "none";
      })
      .attr("marker-end", (d) => {
        if (d.status === 0) return d.isSub ? "url(#arrow-active-sub)" : "url(#arrow-active)";
        if (d.status === 1) return "url(#arrow-revoked)";
        return "url(#arrow-expired)";
      });

    // Energy flow link (only for active)
    const linkEnergy = svg
      .append("g")
      .selectAll("path")
      .data(links.filter(d => d.status === 0))
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", (d) => d.isSub ? "#3b82f6" : "#c8ff00")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 16")
      .style("animation", "energyFlow 1.2s linear infinite")
      .attr("pointer-events", "none");

    const setupTooltip = (selection: any) => {
      selection
        .on("mouseover", (event: any, d: any) => {
          const typeNames = ["Financial", "Governance", "Operational", "Legal"];
          const statusLabels = ["Active", "Revoked", "Expired"];
          setTooltip({
            show: true,
            x: event.offsetX,
            y: event.offsetY - 20,
            title: `Delegation ID: ${d.id.slice(0, 8)}...`,
            body: [
              `Type: ${typeNames[d.type] || "Custom"}`,
              `Limit: ${d.amount > 0 ? `${d.amount} SUI` : "Unlimited"}`,
              `Status: ${statusLabels[d.status]}`,
            ],
          });
        })
        .on("mousemove", (event: any) => {
          setTooltip((prev) => ({
            ...prev,
            x: event.offsetX,
            y: event.offsetY - 20,
          }));
        })
        .on("mouseout", () => {
          setTooltip((prev) => ({ ...prev, show: false }));
        });
    };

    setupTooltip(linkBase);
    // 4. Draw Nodes (Wallets)
    const nodeGroup = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Outer glow
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.isMe ? 26 : 20))
      .attr("fill", (d) => {
        if (d.isMe) return "rgba(200, 255, 0, 0.05)";
        if (d.isSubDelegate) return "rgba(59, 130, 246, 0.08)";
        return "rgba(255, 255, 255, 0.02)";
      })
      .attr("stroke", "none");

    // Orbital ring
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.isMe ? 20 : 15))
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.isMe) return "rgba(200, 255, 0, 0.5)";
        if (d.isSubDelegate) return "rgba(59, 130, 246, 0.5)";
        return "rgba(255, 255, 255, 0.2)";
      })
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 4")
      .style("transform-origin", "0 0")
      .style("animation", (d) => d.isMe ? "spin 12s linear infinite" : "spin 20s linear infinite reverse");

    // Inner core
    nodeGroup
      .append("circle")
      .attr("r", (d) => (d.isMe ? 8 : 5))
      .attr("fill", (d) => {
        if (d.isMe) return "#c8ff00";
        if (d.isSubDelegate) return "#3b82f6";
        return "#ffffff";
      })
      .style("filter", (d) => {
        if (d.isMe) return "drop-shadow(0px 0px 8px rgba(200,255,0,0.8))";
        if (d.isSubDelegate) return "drop-shadow(0px 0px 8px rgba(59,130,246,0.8))";
        return "drop-shadow(0px 0px 4px rgba(255,255,255,0.4))";
      })
      .style("animation", (d) => (d.isMe || d.isSubDelegate) ? "pulse 2.5s infinite" : "none")
      .style("transform-origin", "0 0");

    // Invisible larger circle for easier hover/drag interaction
    nodeGroup
      .append("circle")
      .attr("r", 30)
      .attr("fill", "transparent")
      .on("mouseover", (event, d) => {
        setTooltip({
          show: true,
          x: event.offsetX,
          y: event.offsetY - 20,
          title: d.isMe ? "Connected Wallet" : "Wallet Node",
          body: [`Address: ${d.id}`],
        });
      })
      .on("mousemove", (event) => {
        setTooltip((prev) => ({
          ...prev,
          x: event.offsetX,
          y: event.offsetY - 20,
        }));
      })
      .on("mouseout", () => {
        setTooltip((prev) => ({ ...prev, show: false }));
      });

    // Monospace Text Labels
    nodeGroup
      .append("text")
      .text((d) => d.label)
      .attr("dy", 26)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255, 255, 255, 0.75)")
      .style("font-size", "10px")
      .style("font-family", "IBM Plex Mono, monospace")
      .style("pointer-events", "none");

    // 5. Update coordinates on every simulation tick
    const linkPath = (d: any) => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
      if (dr === 0) return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    };

    simulation.on("tick", () => {
      linkBase.attr("d", linkPath);
      linkEnergy.attr("d", linkPath);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Drag helper functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [delegations, connectedAddress, nameMap]);

  return (
    <div ref={containerRef} className="w-full bg-black/30 border border-white/5 rounded-2xl relative overflow-hidden h-[400px]">
      
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none text-[10px] font-mono uppercase text-white/40">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
          <span>Revoked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#6b7280]" />
          <span>Expired</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes energyFlow {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
      `}} />

      <svg ref={svgRef} className="block w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Tooltip */}
      {tooltip.show && (
        <div
          className="absolute bg-[#070e1b]/95 border border-white/10 p-3 rounded-lg pointer-events-none z-20 shadow-xl max-w-[280px]"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y - 15}px`,
          }}
        >
          <p className="text-xs font-mono font-bold text-white mb-1.5 border-b border-white/5 pb-1 select-all">
            {tooltip.title}
          </p>
          <div className="space-y-1">
            {tooltip.body.map((line, idx) => (
              <p key={idx} className="text-[10px] text-white/60 font-medium font-mono select-all">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
