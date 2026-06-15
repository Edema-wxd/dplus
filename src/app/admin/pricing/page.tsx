import { getPricingConfig } from "@/lib/pricing";
import { pool } from "@/lib/db";
import PricingForm from "@/components/admin/PricingForm";

export default async function AdminPricingPage() {
  const config = await getPricingConfig();

  let updatedByName: string | null = null;
  if (config.updatedBy) {
    const { rows } = await pool.query<{ name: string | null; email: string }>(
      "select name, email from admin_users where id = $1",
      [config.updatedBy]
    );
    updatedByName = rows[0]?.name ?? rows[0]?.email ?? null;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Pricing Configuration</h1>
      <p className="mt-2 text-muted-foreground">
        Control VAT, markup, and the ZAR &rarr; NGN exchange rate used across the catalogue.
      </p>

      <div className="mt-6 max-w-2xl">
        <PricingForm config={config} updatedByName={updatedByName} />
      </div>
    </div>
  );
}
