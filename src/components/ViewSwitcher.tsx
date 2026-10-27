import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, User as UserIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useViewMode, type ViewMode } from "@/hooks/useViewMode";

export function ViewSwitcher() {
  const { mode, canUseAdmin, setViewMode } = useViewMode();
  const navigate = useNavigate();

  const change = (v: string) => {
    if (!v || (v === "admin" && !canUseAdmin)) return;
    setViewMode(v as ViewMode);
    navigate({ to: v === "admin" ? "/admin" : "/dashboard" });
  };

  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={change}
        variant="outline"
        size="sm"
        aria-label="Switch view"
      >
        <ToggleGroupItem value="citizen" aria-label="Citizen view" className="gap-1.5 px-3">
          <UserIcon className="size-4" /> <span className="hidden sm:inline">Citizen</span>
        </ToggleGroupItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ToggleGroupItem
                value="admin"
                disabled={!canUseAdmin}
                aria-label="Admin or supervisor view"
                className="gap-1.5 px-3"
              >
                <ShieldCheck className="size-4" />
                <span className="hidden sm:inline">Admin / Supervisor</span>
              </ToggleGroupItem>
            </span>
          </TooltipTrigger>
          {!canUseAdmin ? (
            <TooltipContent>Requires an admin or department staff account</TooltipContent>
          ) : null}
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}
