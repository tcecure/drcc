import {
  experienceLevelOptions,
  requestTypeOptions,
  type AccessRequest,
} from "@/lib/access/options";

type AccessRequestFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  request?: AccessRequest | null;
};

export function AccessRequestForm({ action, request }: AccessRequestFormProps) {
  return (
    <form action={action} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm">
      {request ? <input type="hidden" name="requestId" value={request.id} /> : null}
      <label className="grid gap-2 text-sm font-medium">
        Request type
        <select
          className="h-11 rounded-md border bg-background px-3 text-sm"
          name="requestType"
          defaultValue={request?.request_type ?? "cmmc_level_1_training"}
          required
        >
          {requestTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Requested program
        <input
          className="h-11 rounded-md border bg-background px-3 text-sm"
          name="requestedProgram"
          defaultValue={request?.requested_program ?? ""}
          placeholder="DigitalRCC cyber range, CMMC training, or another program"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Experience level
        <select
          className="h-11 rounded-md border bg-background px-3 text-sm"
          name="experienceLevel"
          defaultValue={request?.experience_level ?? "beginner"}
          required
        >
          {experienceLevelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        School or organization
        <input
          className="h-11 rounded-md border bg-background px-3 text-sm"
          name="schoolOrOrganization"
          defaultValue={request?.school_or_organization ?? ""}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Reason for request
        <textarea
          className="min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
          name="reason"
          defaultValue={request?.reason ?? ""}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Availability notes
        <textarea
          className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
          name="availabilityNotes"
          defaultValue={request?.availability_notes ?? ""}
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          name="intent"
          type="submit"
          value="draft"
        >
          Save draft
        </button>
        <button
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          name="intent"
          type="submit"
          value="submit"
        >
          Submit request
        </button>
      </div>
    </form>
  );
}
