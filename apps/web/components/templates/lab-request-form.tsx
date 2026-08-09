import { experienceLevelOptions } from "@/lib/access/options";

type LabTrack = {
  id: string;
  name: string;
};

type LabRequestFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  tracks: LabTrack[];
};

export function LabRequestForm({ action, tracks }: LabRequestFormProps) {
  return (
    <form action={action} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm">
      <label className="grid gap-2 text-sm font-medium">
        Lab track
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="labTrackId" required>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Preferred start date
        <input className="h-11 rounded-md border bg-background px-3 text-sm" name="preferredStartDate" type="date" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Experience level
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="experienceLevel" defaultValue="beginner" required>
          {experienceLevelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Weekly availability
        <textarea
          className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm"
          name="weeklyAvailability"
          placeholder="Example: Weeknights after 6 PM and Saturday mornings"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Accessibility needs
        <textarea
          className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
          name="accessibilityNeeds"
          placeholder="Optional"
        />
      </label>
      <label className="flex gap-3 text-sm leading-6">
        <input className="mt-1 h-4 w-4" name="acceptableUseAccepted" type="checkbox" required />
        <span>I accept the DigitalRCC hands-on lab acceptable use expectations.</span>
      </label>
      <label className="flex gap-3 text-sm leading-6">
        <input className="mt-1 h-4 w-4" name="connectivityConfirmed" type="checkbox" required />
        <span>I confirm I have reliable connectivity for a browser-based virtual lab session.</span>
      </label>
      <button
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        type="submit"
      >
        Submit lab request
      </button>
    </form>
  );
}
