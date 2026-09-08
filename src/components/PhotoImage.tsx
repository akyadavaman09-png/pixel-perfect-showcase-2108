import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";
import { getPhotoUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function PhotoImage({
  path,
  alt,
  className,
}: {
  path?: string | null;
  alt: string;
  className?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["photo", path],
    queryFn: () => getPhotoUrl(path as string),
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
  });

  if (!path || (!isLoading && !data)) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-md bg-muted text-muted-foreground",
          className,
        )}
        aria-label="No photo"
      >
        <ImageOff className="size-4" aria-hidden />
      </div>
    );
  }

  if (isLoading) return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;

  return <img src={data} alt={alt} loading="lazy" className={cn("rounded-md object-cover", className)} />;
}
