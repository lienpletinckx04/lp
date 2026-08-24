import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/invoer", label: "Invoer" },
  { href: "/instellingen", label: "Instellingen" },
];

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold tracking-tight text-ink">
          CFO Dashboard <span className="text-muted font-normal">· AskLien.ai</span>
        </span>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-card hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
