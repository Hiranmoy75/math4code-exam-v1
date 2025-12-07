import React from 'react';

export default function RefundPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">Refund Policy</h1>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                <section>
                    <p>Thank you for shopping with us.</p>

                    <h2 className="text-xl font-semibold mt-6 mb-4">Non-tangible irrevocable goods ("Digital products")</h2>
                    <p>
                        We do not issue refunds for non-tangible irrevocable goods ("digital products") once the order is confirmed and the product is sent.
                    </p>
                    <p>
                        We recommend contacting us for assistance if you experience any issues receiving or downloading our products.
                    </p>
                </section>

                <section className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-xl font-semibold mb-4">Contact us for any issues:</h2>
                    <p>
                        If you have any questions about our Returns and Refunds Policy, please contact us at:
                    </p>
                    <p className="mt-2">
                        <a href="mailto:deepak43545566@mailinator.com" className="text-blue-600 hover:underline">
                            deepak43545566@mailinator.com
                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
}
