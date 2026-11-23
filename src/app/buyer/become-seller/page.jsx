import { redirect } from 'next/navigation';
import { requireBuyerPage } from '@/lib/auth';
import { becomeSellerAction } from '@/app/action/account';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, Card, Field, inputClass } from '@/components/ui';

const BENEFITS = [
  {
    title: 'Open your own store',
    text: 'Add products, set prices and stock, and manage your store profile.',
  },
  {
    title: 'Keep shopping',
    text: 'Your buyer account stays active. Switch between shopping and selling anytime.',
  },
  {
    title: 'Verified by Admin',
    text: 'Your store goes live after the Admin approves your application.',
  },
];

// cek peran akun lalu tampilkan formulir pendaftaran menjadi penjual
export default async function BecomeSellerPage() {
  const user = await requireBuyerPage();

  if (user.role === 'seller') {
    if (user.status === 'active') {
      redirect('/seller/dashboard');
    } else {
      redirect('/seller/pending');
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Become a Seller"
        description="Turn your account into a seller account and start selling on FITFOUND."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BENEFITS.map(function buildBenefitCard(benefitItem) {
          return (
            <div
              key={benefitItem.title}
              className="bg-white rounded-2xl border border-neutral-200/80 p-5 hover-lift"
            >
              <p className="text-sm font-semibold text-neutral-950">
                {benefitItem.title}
              </p>
              <p className="text-xs text-neutral-500 mt-1.5">
                {benefitItem.text}
              </p>
            </div>
          );
        })}
      </div>

      <Card>
        <h3 className="text-base font-semibold mb-4">Store Application</h3>
        <ActionForm
          action={becomeSellerAction}
          className="space-y-4"
          confirmMessage="Submit your seller application?"
          confirmDescription="Your account will become a Seller account and wait for Admin approval. You can still shop while waiting."
          confirmLabel="Submit"
          confirmTone="neutral"
        >
          <Field label="Store Name" htmlFor="nama_toko">
            <input
              id="nama_toko"
              name="nama_toko"
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. Nabila Closet"
              className={inputClass}
            />
          </Field>
          <Field label="Store Description (optional)" htmlFor="deskripsi_toko">
            <textarea
              id="deskripsi_toko"
              name="deskripsi_toko"
              rows={3}
              maxLength={1000}
              placeholder="Tell buyers what your store sells."
              className={inputClass}
            />
          </Field>
          <label className="flex items-start gap-2.5 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="agree"
              required
              className="mt-0.5 w-4 h-4"
            />
            <span>
              I agree to sell 100% brand-original products and follow FITFOUND seller rules.
            </span>
          </label>
          <SubmitButton pendingText="Submitting...">Apply as Seller</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}