import { BillingInvoiceDetailContent } from '@/components/billing/billing-invoice-detail-content';

export default async function BillingInvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;

  return <BillingInvoiceDetailContent invoiceId={invoiceId} />;
}
