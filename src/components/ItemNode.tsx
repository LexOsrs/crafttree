import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { ItemNodeData } from "../utils/graphBuilder";

type ItemNodeProps = NodeProps & { data: ItemNodeData };

export default function ItemNode({ data }: ItemNodeProps) {
  const base = "flex flex-col items-center justify-center rounded-lg border px-1 pt-1.5 pb-1 w-[80px] h-[80px] transition-all duration-200 cursor-pointer overflow-hidden";

  const dashed = !data.isCraftable ? " border-dashed" : "";

  let style: string;
  if (data.searchMatch) {
    style = `bg-gray-700 border-amber-400 text-white shadow-[0_0_6px_rgba(251,191,36,0.4)]${dashed}`;
  } else if (data.highlight === "highlighted") {
    style = `bg-gray-750 border-slate-400 text-gray-100 shadow-[0_0_4px_rgba(148,163,184,0.3)]${dashed}`;
  } else if (data.highlight === "dimmed") {
    style = "bg-gray-900 border-gray-700 text-gray-600 opacity-25";
  } else if (data.isCraftable) {
    style = "bg-gray-800 border-amber-500/60 text-gray-100";
  } else {
    style = "bg-gray-900/80 border-gray-600 border-dashed text-gray-400";
  }

  return (
    <div className={`${base} ${style}`}>
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
        className="w-9 h-9 object-contain"
        draggable={false}
      />
      <span className="text-[8px] leading-[1.2] text-center mt-0.5 line-clamp-3 w-full">
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
