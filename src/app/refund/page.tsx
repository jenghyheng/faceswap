export default function RefundPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Digital Products</h2>
          <p className="text-gray-600">
            Due to the nature of digital products and services, we generally do not offer refunds
            once the service has been used or digital content has been accessed. However, we may
            consider refunds in the following circumstances:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-600">
            <li>Technical issues preventing service access</li>
            <li>Billing errors or duplicate charges</li>
            <li>Service unavailability during paid period</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Refund Process</h2>
          <p className="text-gray-600">
            To request a refund:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-600">
            <li>Contact our support team within 7 days of purchase</li>
            <li>Provide your order number and reason for refund</li>
            <li>Describe any technical issues encountered</li>
            <li>Include relevant screenshots or error messages</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Processing Time</h2>
          <p className="text-gray-600">
            Refund requests are typically processed within 5-7 business days. Once approved:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-600">
            <li>Credit card refunds may take 5-10 business days to appear</li>
            <li>Bank transfers may take 3-5 business days</li>
            <li>Other payment methods may vary in processing time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Items</h2>
          <p className="text-gray-600">
            The following are not eligible for refunds:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-600">
            <li>Used or consumed digital products</li>
            <li>Customized or personalized services</li>
            <li>Services used beyond the refund period</li>
            <li>Purchases violating our terms of service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Contact Information</h2>
          <p className="text-gray-600">
            For refund requests or questions about our refund policy, please contact us at:
            support@tinylittle.ai
          </p>
        </section>
      </div>
    </div>
  );
} 