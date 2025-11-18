"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";

interface ActionsGroupProps {
  handleDetail?: () => void;
  handleEdit?: () => void;
  handleDelete?: () => Promise<void> | void;
  additionalActions?: React.ReactNode;
  showDetail?: boolean;
}

const ActionsGroup: React.FC<ActionsGroupProps> = ({
  handleDetail,
  handleEdit,
  handleDelete,
  additionalActions,
  showDetail = true,
}) => {
  const onHandleDelete = () => {
    try {
      const res = handleDelete?.();
      if (res && typeof (res as Promise<void>).then === "function") {
        (res as Promise<void>).catch(() => {
          /* swallow error */
        });
      }
    } catch {
      /* swallow */
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {/* Basic Actions */}
        {showDetail && handleDetail && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDetail}
                className="text-blue-400 border-blue-400 hover:text-blue-400 hover:bg-blue-50"
                aria-label="Detail"
              >
                <Eye className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Detail</p>
            </TooltipContent>
          </Tooltip>
        )}

        {handleEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="text-yellow-400 border-yellow-400 hover:text-yellow-400 hover:bg-yellow-50"
                aria-label="Edit"
              >
                <Edit className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        )}

        {handleDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                onClick={onHandleDelete}
                aria-label="Hapus"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hapus</p>
            </TooltipContent>
          </Tooltip>
        )}

        {additionalActions}
      </div>
    </TooltipProvider>
  );
};

export default ActionsGroup;