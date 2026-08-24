import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function InstellingenPage() {
  const settings = await getSettings();
  return (
    <div className="pb-8">
      <h1 className="text-xl font-semibold text-ink">Instellingen</h1>
      <p className="mb-4 text-sm text-muted">
        Doelen, drempels en vaste kosten die de dashboard-berekeningen sturen.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
