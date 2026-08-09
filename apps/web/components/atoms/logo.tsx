import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label="DigitalRCC home"
    >
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
      >
        DR
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold">DigitalRCC</span>
        <span className="text-xs text-muted-foreground">Portal</span>
      </span>
    </Link>
  );
}
