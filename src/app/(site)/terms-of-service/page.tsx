export const metadata = {
  title: "Terms of Service — De-Sign Plus",
};

export default function TermsPage() {
  return (
    <main className="py-16 lg:py-24">
      <div className="max-w-2xl mx-auto px-5 sm:px-6">
        <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
          Legal
        </p>
        <h1 className="font-sarlotte font-bold text-foreground text-4xl lg:text-5xl leading-tight mb-4">
          Terms of Service
        </h1>
        <p className="font-raleway text-sm text-muted-foreground mb-12">
          Last updated: 1 June 2025
        </p>

        <Prose>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the De-Sign Plus
            website and the procurement of goods and services from De-Sign Plus
            (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By placing an order or submitting an
            enquiry, you agree to be bound by these Terms.
          </p>

          <H2>1. Our Services</H2>
          <p>
            De-Sign Plus provides business-to-business branded merchandise,
            corporate gifting, workwear, PPE, and custom branding services. All
            engagements are between De-Sign Plus and registered business entities
            or their authorised representatives. We do not supply to members of
            the general public (consumers).
          </p>

          <H2>2. Quotations and Orders</H2>
          <ul>
            <li>
              All quotations are valid for <strong>14 calendar days</strong>{" "}
              from the date of issue unless otherwise stated.
            </li>
            <li>
              An order is confirmed only once De-Sign Plus issues a written
              order confirmation and, where applicable, receives the agreed
              deposit.
            </li>
            <li>
              Prices quoted exclude VAT and applicable import duties unless
              expressly stated otherwise.
            </li>
            <li>
              We reserve the right to decline any order at our discretion.
            </li>
          </ul>

          <H2>3. Custom and Branded Orders</H2>
          <p>
            Orders involving custom branding, embroidery, printing, or engraving
            require client approval of a digital proof before production
            commences. Once production has started, cancellations or amendments
            are not possible and the full order value remains payable.
          </p>
          <p>
            By providing artwork, logos, or other brand assets, you warrant that
            you own or have the right to use those materials and that their use
            by De-Sign Plus to fulfil your order does not infringe any
            third-party intellectual property rights.
          </p>

          <H2>4. Payment Terms</H2>
          <ul>
            <li>New clients: <strong>50% deposit</strong> on order confirmation; balance due before dispatch.</li>
            <li>Approved account holders: net <strong>30 days</strong> from invoice date, unless otherwise agreed in writing.</li>
            <li>Overdue amounts attract interest at <strong>2% per month</strong> compounded monthly.</li>
            <li>We accept EFT and bank transfer. Card payments may attract a processing surcharge.</li>
          </ul>

          <H2>5. Delivery</H2>
          <p>
            Delivery lead times are estimates only and commence from the date
            production begins. De-Sign Plus is not liable for delays caused by
            suppliers, shipping carriers, customs authorities, or circumstances
            beyond our reasonable control.
          </p>
          <p>
            Risk in goods passes to the client upon delivery to the agreed
            delivery address. Title passes upon receipt of full payment.
          </p>

          <H2>6. Inspection and Returns</H2>
          <p>
            You must inspect goods within <strong>5 business days</strong> of
            delivery and notify us in writing of any defects, shortages, or
            non-conformances. Failure to notify us within this period constitutes
            acceptance of the goods as delivered.
          </p>
          <p>
            Custom-branded goods are non-returnable except where they are
            defective or materially non-conforming. Returns of stock items
            require prior written authorisation and may be subject to a
            restocking fee of up to 15%.
          </p>

          <H2>7. Intellectual Property</H2>
          <p>
            All original design work, artwork, and creative assets produced by
            De-Sign Plus remain our intellectual property until full payment is
            received, at which point ownership transfers to the client as agreed
            in writing. Client-supplied assets remain the property of the client.
          </p>

          <H2>8. Limitation of Liability</H2>
          <p>
            To the maximum extent permitted by applicable law, De-Sign Plus&apos;s
            liability to you for any claim arising out of or in connection with
            these Terms or any order is limited to the value of the goods or
            services in respect of which the claim arises. We are not liable for
            indirect, consequential, or special loss, loss of profit, or loss of
            business opportunity.
          </p>

          <H2>9. Confidentiality</H2>
          <p>
            Both parties agree to keep confidential any proprietary or sensitive
            business information disclosed during the course of an engagement and
            not to disclose it to third parties without prior written consent,
            except as required by law.
          </p>

          <H2>10. Force Majeure</H2>
          <p>
            Neither party is liable for failure to perform its obligations where
            such failure results from circumstances beyond its reasonable control,
            including natural disasters, industrial action, government action,
            power outages, or supply-chain disruptions. The affected party must
            notify the other promptly and use reasonable endeavours to mitigate
            the impact.
          </p>

          <H2>11. Governing Law</H2>
          <p>
            These Terms are governed by the laws of the Federal Republic of
            Nigeria. Any dispute that cannot be resolved by good-faith
            negotiation will be referred to the courts of Lagos State, Nigeria,
            whose jurisdiction both parties irrevocably accept.
          </p>

          <H2>12. Changes to These Terms</H2>
          <p>
            We may update these Terms from time to time. The version in force at
            the time an order is placed governs that order. Material changes will
            be communicated to account holders by email.
          </p>

          <H2>13. Contact</H2>
          <p>
            Queries regarding these Terms should be directed to:{" "}
            <a href="mailto:support@de-signplus.com">support@de-signplus.com</a>
          </p>
        </Prose>
      </div>
    </main>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-raleway text-[0.95rem] leading-[1.8] text-muted-foreground space-y-5 [&_strong]:text-foreground [&_a]:text-dsp-yellow [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-80 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sarlotte font-bold text-foreground text-xl mt-10 mb-3">
      {children}
    </h2>
  );
}
