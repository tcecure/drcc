import Link from "next/link";

import { publicNavItems } from "@/lib/content/public-site";

export function MainNav() {
  return (
    <nav aria-label="Primary navigation">
      <ul className="flex flex-wrap items-center gap-1">
        {publicNavItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
