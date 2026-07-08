import {
  requiredRoleOptions,
  resourceAudienceOptions,
  resourceStatusOptions,
  resourceTypeOptions,
  type Resource,
} from "@/lib/resources/options";

type ResourceEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  resource?: Resource | null;
  tagList?: string;
};

export function ResourceEditor({ action, resource, tagList }: ResourceEditorProps) {
  return (
    <form action={action} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm">
      {resource ? <input type="hidden" name="resourceId" value={resource.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Title" name="title" defaultValue={resource?.title} />
        <TextInput label="Slug" name="slug" defaultValue={resource?.slug} placeholder="student-lab-guide" />
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm" name="description" defaultValue={resource?.description ?? ""} required />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectInput label="Resource type" name="resourceType" defaultValue={resource?.resource_type ?? "student_guide"} options={resourceTypeOptions} />
        <TextInput label="Program area" name="programArea" defaultValue={resource?.program_area} placeholder="CMMC Level 1" />
        <SelectInput label="Audience" name="audience" defaultValue={resource?.audience ?? "public"} options={resourceAudienceOptions} />
        <SelectInput label="Required role" name="requiredRole" defaultValue={resource?.required_role ?? "none"} options={requiredRoleOptions} />
        <TextInput label="External URL" name="externalUrl" defaultValue={resource?.external_url ?? ""} required={false} placeholder="https://..." />
        <TextInput label="Storage file path" name="filePath" defaultValue={resource?.file_path ?? ""} required={false} placeholder="public-resources/path/file.pdf" />
        <TextInput label="Version" name="version" defaultValue={resource?.version ?? "1.0"} />
        <SelectInput label="Status" name="status" defaultValue={resource?.status ?? "draft"} options={resourceStatusOptions} />
        <TextInput label="Effective date" name="effectiveDate" type="date" defaultValue={resource?.effective_date ?? ""} required={false} />
        <TextInput label="Expiration date" name="expirationDate" type="date" defaultValue={resource?.expiration_date ?? ""} required={false} />
        <TextInput label="Review due" name="reviewDueAt" type="datetime-local" defaultValue={resource?.review_due_at?.slice(0, 16) ?? ""} required={false} />
        <TextInput label="Tags" name="tags" defaultValue={tagList ?? ""} required={false} placeholder="Lab Guide, CMMC" />
      </div>
      <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
        Save resource
      </button>
    </form>
  );
}

function TextInput({
  label,
  name,
  type = "text",
  defaultValue = "",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input className="h-11 rounded-md border bg-background px-3 text-sm" name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} />
    </label>
  );
}

function SelectInput<T extends string>({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: T;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select className="h-11 rounded-md border bg-background px-3 text-sm" name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
