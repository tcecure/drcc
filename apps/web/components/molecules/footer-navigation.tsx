import Link from "next/link";

import { publicNavItems } from "@/lib/content/public-site";

export function FooterNavigation() {
  return (
    <nav aria-label="Footer navigation">
      <ul className="flex flex-wrap gap-x-5 gap-y-3">
        {publicNavItems.map((item) => (
          <li key={item.href}>
            <Link className="hover:text-foreground" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
