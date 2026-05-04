import { useContext } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { ItemNodeData } from "../utils/graphBuilder";
import { TowerIndicatorContext } from "../towerIndicatorContext";

type ItemNodeProps = NodeProps & { data: ItemNodeData };

export default function ItemNode({ data }: ItemNodeProps) {
  const showTower = useContext(TowerIndicatorContext);
  const base = "relative flex flex-col items-center justify-center gap-1 rounded-lg border px-0.5 py-0.5 w-[80px] h-[80px] transition-all duration-200 cursor-pointer overflow-hidden";

  let style: string;
  if (data.searchMatch) {
    style = "bg-gray-700 border-amber-400 text-white shadow-[0_0_6px_rgba(251,191,36,0.4)]";
  } else if (data.highlight === "highlighted") {
    style = "bg-gray-800 border-gray-400 text-gray-100";
  } else if (data.highlight === "dimmed") {
    style = "bg-gray-900 border-gray-700 text-gray-600 opacity-25";
  } else if (data.isCraftable) {
    style = "bg-gray-800 border-gray-600 text-gray-100";
  } else {
    style = "bg-gray-900/80 border-gray-700 border-dashed text-gray-400";
  }

  const dim = data.highlight === "dimmed";
  const towerColor = data.towerType === "grand" ? "bg-violet-400" : "bg-cyan-400";

  return (
    <div className={`${base} ${style}`}>
      {showTower && data.towerLevel != null && (
        <div
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${towerColor} ${dim ? "opacity-25" : ""}`}
          title={`Tower Lv ${data.towerLevel} (${data.towerType === "grand" ? "Grand" : "Mega"} Mastery)`}
        />
      )}
      {data.hasParents && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={false}
          className="!bg-gray-500 !w-1.5 !h-1.5 !min-w-0 !min-h-0 !cursor-default !pointer-events-none"
        />
      )}
      <img
        src={`/images/${data.id}.png`}
        alt={data.label}
        className="w-8 h-8 object-contain shrink-0"
        draggable={false}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <span className="text-[10px] leading-[1.15] text-center line-clamp-2 w-full">
        {data.label}
      </span>
      {data.hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          className="!bg-gray-500 !w-1.5 !h-1.5 !min-w-0 !min-h-0 !cursor-default !pointer-events-none"
        />
      )}
    </div>
  );
}
