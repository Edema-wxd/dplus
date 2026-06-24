export const metadata = {
  title: "Privacy Policy — De-Sign Plus",
};

export default function PrivacyPage() {
  return (
    <main className="py-16 lg:py-24">
      <div className="max-w-2xl mx-auto px-5 sm:px-6">
        <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
          Legal
        </p>
        <h1 className="font-sarlotte font-bold text-foreground text-4xl lg:text-5xl leading-tight mb-4">
          Privacy Policy
        </h1>
        <p className="font-raleway text-sm text-muted-foreground mb-12">
          Last updated: 1 June 2025
        </p>

        <Prose>
          <p>
            De-Sign Plus (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to
            protecting the personal information of our clients, suppliers, and
            website visitors in accordance with the Protection of Personal
            Information Act, 4 of 2013 (&ldquo;POPIA&rdquo;) and applicable Nigerian
            data-protection regulations.
          </p>

          <H2>1. Who We Are</H2>
          <p>
            De-Sign Plus is a business-to-business luxury curation and branded
            merchandise company operating primarily in Nigeria. We source and
            supply corporate gifts, branded merchandise, workwear, PPE, and
            custom branding solutions to corporate clients across Africa.
          </p>
          <p>
            Responsible party:{" "}
            <strong>De-Sign Plus</strong>. Contact:{" "}
            <a href="mailto:support@de-signplus.com">support@de-signplus.com</a>
          </p>

          <H2>2. Personal Information We Collect</H2>
          <p>We collect information only to the extent necessary to deliver our services:</p>
          <ul>
            <li>
              <strong>Business contact details</strong> — name, job title,
              business email, phone number, and company name of the individual
              we engage with at a client or supplier organisation.
            </li>
            <li>
              <strong>Delivery information</strong> — physical address and
              recipient details required to fulfil orders.
            </li>
            <li>
              <strong>Communication records</strong> — emails, enquiry forms,
              and notes from client engagements.
            </li>
            <li>
              <strong>Technical data</strong> — IP address, browser type, and
              pages visited, collected automatically when you use our website.
            </li>
          </ul>
          <p>
            We do not collect sensitive personal information unless strictly
            required and with your explicit consent.
          </p>

          <H2>3. How We Use Your Information</H2>
          <ul>
            <li>Processing and fulfilling orders and service requests</li>
            <li>Communicating about your project or enquiry</li>
            <li>Sending transactional notifications (order confirmations, delivery updates)</li>
            <li>Marketing communications where you have opted in or where we have a legitimate interest based on an existing business relationship</li>
            <li>Maintaining records required for tax and regulatory compliance</li>
            <li>Improving our website and services through aggregated analytics</li>
          </ul>

          <H2>4. Legal Basis for Processing</H2>
          <ul>
            <li><strong>Contract performance</strong> — processing necessary to fulfil an order or service agreement.</li>
            <li><strong>Legitimate interests</strong> — client communications, relationship management, and fraud prevention.</li>
            <li><strong>Legal obligation</strong> — where required by applicable law (e.g., tax records).</li>
            <li><strong>Consent</strong> — for marketing communications where no pre-existing relationship exists.</li>
          </ul>

          <H2>5. Sharing Your Information</H2>
          <p>We do not sell, rent, or trade personal information. We share it only with:</p>
          <ul>
            <li><strong>Service providers</strong> — logistics partners, payment processors, and cloud providers engaged to deliver our services, bound by appropriate data-processing agreements.</li>
            <li><strong>Suppliers</strong> — where necessary to produce or deliver a custom order.</li>
            <li><strong>Regulatory authorities</strong> — where required by law or valid legal process.</li>
          </ul>

          <H2>6. Cross-Border Transfers</H2>
          <p>
            Some of our service providers are located outside Nigeria and South
            Africa. Where personal information is transferred internationally, we
            ensure adequate protections are in place, consistent with POPIA
            section 72 requirements.
          </p>

          <H2>7. Data Retention</H2>
          <p>
            We retain personal information only for as long as necessary to
            fulfil the purpose for which it was collected or as required by law.
            Client and supplier records are typically retained for seven years
            following the end of the business relationship for tax and audit
            purposes. Website analytics data is retained for 26 months.
          </p>

          <H2>8. Your Rights</H2>
          <p>You have the right to:</p>
          <ul>
            <li>Request access to your personal information</li>
            <li>Correct inaccurate or outdated information</li>
            <li>Request deletion of your information where we have no legal obligation to retain it</li>
            <li>Object to processing based on legitimate interests</li>
            <li>Withdraw consent for marketing at any time</li>
            <li>Lodge a complaint with the Information Regulator (South Africa) or the Nigeria Data Protection Commission</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:support@de-signplus.com">support@de-signplus.com</a>.
            We will respond within 30 days.
          </p>

          <H2>9. Cookies</H2>
          <p>
            Our website uses essential cookies required for site operation and
            anonymised analytics cookies to understand usage patterns. We do not
            use cookies for targeted advertising. You can disable cookies in
            your browser settings; this may affect site functionality.
          </p>

          <H2>10. Security</H2>
          <p>
            We implement appropriate technical and organisational measures to
            protect personal information against unauthorised access, loss, or
            disclosure, including encrypted data transmission (TLS), access
            controls, and regular security reviews.
          </p>

          <H2>11. Changes to This Policy</H2>
          <p>
            We may update this policy from time to time. Material changes will
            be communicated to existing clients by email. The current version is
            always available at this URL.
          </p>

          <H2>12. Contact</H2>
          <p>
            Questions about this policy should be directed to:{" "}
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
