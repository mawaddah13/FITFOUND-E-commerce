import { FiCheck, FiXCircle } from 'react-icons/fi';
import { updateOrderStatusAction } from '@/app/action/order';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { ORDER_STATUS, SELLER_STATUS_FLOW, formatDate, formatStepDate, getStatusDate } from '@/lib/format';

const STEPS = ['pending', 'processing', 'shipped', 'completed'];

const NEXT_STEP_HINT = {
  processing: 'The buyer has paid. Confirm the payment to start processing.',
  shipped: 'Package handed to the courier.',
};

// teks tombol untuk tahap berikutnya
const NEXT_STEP_LABEL = {
  processing: 'Confirm Payment',
  shipped: 'Mark as Shipped',
};

// tampilkan alur tahapan pesanan penjual beserta tombol pembaruan status
// paidAt = waktu buyer tekan Pay Now (null kalau belum bayar)
export default function OrderStatusPanel({ idOrder, status, paidAt = null, history = [], createdAt = null }) {
  let allowedStatuses = [];
  if (SELLER_STATUS_FLOW[status]) {
    allowedStatuses = SELLER_STATUS_FLOW[status];
  }

  let nextStep = null;
  const nextStepItem = allowedStatuses.find(function findNextStep(stepItem) {
    return stepItem !== 'cancelled';
  });
  if (nextStepItem) {
    nextStep = nextStepItem;
  }
  // tombol Confirm Payment baru muncul kalau buyer sudah bayar
  if (status === 'pending' && !paidAt) {
    nextStep = null;
  }

  const canCancel = allowedStatuses.includes('cancelled');
  const currentIndex = STEPS.indexOf(status);

  if (status === 'cancelled') {
    let cancelledDateText = '';
    const cancelledDate = getStatusDate(history, 'cancelled', null);
    if (cancelledDate) {
      cancelledDateText = ` Cancelled on ${formatDate(cancelledDate)}.`;
    }

    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
        <FiXCircle className="w-4 h-4 shrink-0 text-red-600" />
        <p className="text-xs text-red-700">
          This order was cancelled. The stock has been returned to your products.
          {cancelledDateText}
        </p>
      </div>
    );
  }

  const stepper = (
    <ol className="flex items-start w-full max-w-3xl">
      {STEPS.map(function buildStepItem(stepName, stepIndex) {
        const isDone = stepIndex < currentIndex || status === 'completed';
        const isCurrent = stepIndex === currentIndex && status !== 'completed';
        const isLast = stepIndex === STEPS.length - 1;

        let circleClass = 'border-neutral-400 bg-white text-neutral-600';
        let labelClass = 'text-neutral-600';

        if (isDone) {
          circleClass = 'border-neutral-950 bg-neutral-950 text-white';
          labelClass = 'text-neutral-950';
        } else if (isCurrent) {
          circleClass = 'border-(--biru) bg-(--biru) text-white ring-4 ring-blue-100';
          labelClass = 'text-neutral-950 font-semibold';
        }

        let connectorLine = null;
        if (!isLast) {
          let lineColorClass = 'bg-neutral-300';
          if (stepIndex < currentIndex) {
            lineColorClass = 'bg-neutral-950';
          }
          connectorLine = <span className={`absolute top-3.5 left-1/2 w-full h-0.5 ${lineColorClass}`} />;
        }

        // tanggal tahap ini dari riwayat status, dipisah tanggal n jam
        let stepDateElement = null;
        const stepDate = getStatusDate(history, stepName, createdAt);
        if (stepDate && (isDone || isCurrent)) {
          const stepDateText = formatStepDate(stepDate);
          stepDateElement = (
            <span className="mt-1 text-[11px] leading-snug text-neutral-700">
              {stepDateText.day}
              <br />
              {stepDateText.time}
            </span>
          );
        }

        let stepMarkerContent = stepIndex + 1;
        if (isDone) {
          stepMarkerContent = <FiCheck className="w-4 h-4" />;
        }

        return (
          <li key={stepName} className="relative flex-1 flex flex-col items-center text-center px-1">
            {connectorLine}
            <span
              className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${circleClass}`}
            >
              {stepMarkerContent}
            </span>
            <span className={`mt-2 text-xs sm:text-sm leading-tight ${labelClass}`}>
              {ORDER_STATUS[stepName].label}
            </span>
            {stepDateElement}
          </li>
        );
      })}
    </ol>
  );

  let cancelActionForm = null;
  if (canCancel) {
    const boundCancelAction = updateOrderStatusAction.bind(null, idOrder);
    cancelActionForm = (
      <ActionForm
        action={boundCancelAction}
        confirmMessage={`Cancel order #${idOrder}?`}
        confirmDescription="The buyer will see this order as cancelled and the stock will be returned."
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        className="flex-1 sm:flex-none"
      >
        <input type="hidden" name="status_order" value="cancelled" />
        <SubmitButton
          size="sm"
          variant="dangerOutline"
          pendingText="Cancelling..."
          className="w-full px-4 py-2"
        >
          Cancel
        </SubmitButton>
      </ActionForm>
    );
  }

  let nextStepForm = null;
  if (nextStep) {
    const boundNextStepAction = updateOrderStatusAction.bind(null, idOrder);
    let nextStepLabel = `Mark as ${ORDER_STATUS[nextStep].label}`;
    if (NEXT_STEP_LABEL[nextStep]) {
      nextStepLabel = NEXT_STEP_LABEL[nextStep];
    }

    nextStepForm = (
      <ActionForm action={boundNextStepAction} className="flex-1 sm:flex-none">
        <input type="hidden" name="status_order" value={nextStep} />
        <SubmitButton
          size="sm"
          variant="dark"
          pendingText="Updating..."
          className="w-full px-4 py-2"
        >
          {nextStepLabel}
        </SubmitButton>
      </ActionForm>
    );
  }

  let stepHintText = '';
  if (nextStep && NEXT_STEP_HINT[nextStep]) {
    stepHintText = NEXT_STEP_HINT[nextStep];
  }

  let actions = null;
  if (nextStep || canCancel) {
    actions = (
      <div className="shrink-0 sm:ml-auto flex flex-col items-stretch sm:items-end gap-1.5">
        <div className="flex flex-wrap gap-2">
          {cancelActionForm}
          {nextStepForm}
        </div>
        <p className="text-[11px] text-neutral-950">{stepHintText}</p>
      </div>
    );
  } else if (status === 'shipped') {
    // yg menyelesaikan pesanan buyer (tombol I Have Received This Order)
    actions = (
      <p className="shrink-0 sm:ml-auto text-xs text-neutral-950">
        Waiting for the buyer to confirm the package has arrived.
      </p>
    );
  } else if (status === 'completed') {
    actions = (
      <p className="shrink-0 sm:ml-auto text-xs text-neutral-950">
        Completed. Customer has received the order.
      </p>
    );
  }

  // info pembayaran dari buyer (tanpa foto)
  let paymentInfo = null;
  if (status === 'pending' && paidAt) {
    paymentInfo = (
      <p className="text-xs font-medium text-emerald-700">Buyer paid on {formatDate(paidAt)}.</p>
    );
  } else if (status === 'pending') {
    paymentInfo = <p className="text-xs text-neutral-700">The buyer has not paid yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-(--abumuda) px-4 py-4">
      {stepper}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {paymentInfo}
        {actions}
      </div>
    </div>
  );
}