import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPicker } from "@/components/map/LazyMaps";
import { supabase } from "@/integrations/supabase/client";
import { uploadComplaintPhoto } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, type ComplaintCategory } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({
    meta: [
      { title: "Report an Issue — SmartCity" },
      { name: "description", content: "Submit a city issue with a photo and exact map location." },
      { property: "og:title", content: "Report an Issue — SmartCity" },
      { property: "og:description", content: "Submit a city issue with photo and location." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [ward, setWard] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category) return;
    setBusy(true);
    try {
      let imagePath: string | null = null;
      if (file) imagePath = await uploadComplaintPhoto(file, user.id);

      const { data, error } = await supabase
        .from("complaints")
        .insert({
          citizen_id: user.id,
          title,
          category,
          description,
          location_text: locationText || null,
          ward: ward.trim() || null,
          latitude: point?.lat ?? null,
          longitude: point?.lng ?? null,
          image_url: imagePath,
          code: "",
        })
        .select("id, code")
        .single();
      if (error) throw error;

      await qc.invalidateQueries({ queryKey: ["complaints"] });
      toast.success(`Complaint ${data.code} submitted`);
      navigate({ to: "/complaints/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit the complaint");
    } finally {
      setBusy(false);
    }
  };

  const dept = CATEGORIES.find((c) => c.value === category)?.department;

  return (
    <AppShell title="Report an Issue" description="Tell us what needs fixing in your city">
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="surface-card space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              placeholder="Large pothole near the market"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dept ? (
              <p className="text-xs text-muted-foreground">Will be routed to the {dept}.</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              required
              rows={5}
              placeholder="Describe the issue, how long it has been there and any risk it causes."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc">Address / landmark</Label>
            <Input
              id="loc"
              placeholder="Main Street, near City Library"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ward">Ward (optional)</Label>
            <Input
              id="ward"
              placeholder="Ward 12"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photo">Photo (optional)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Button type="submit" disabled={busy || !category} className="w-full sm:w-auto">
            {busy ? "Submitting…" : "Submit complaint"}
          </Button>
        </div>

        <div className="surface-card space-y-3 p-5">
          <div>
            <Label>Pin the location</Label>
            <p className="text-xs text-muted-foreground">
              Tap the map to place a marker at the exact spot.
            </p>
          </div>
          <div className="h-[380px] overflow-hidden rounded-md border border-border">
            <LocationPicker value={point} onPick={(lat, lng) => setPoint({ lat, lng })} />
          </div>
          <p className="text-xs text-muted-foreground">
            {point
              ? `Selected: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
              : "No location selected yet."}
          </p>
        </div>
      </form>
    </AppShell>
  );
}
