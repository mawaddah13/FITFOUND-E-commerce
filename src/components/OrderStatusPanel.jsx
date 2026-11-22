import { FiCheck, FiXCircle } from 'react-icons/fi';
import { updateOrderStatusAction } from '@/app/action/order';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { ORDER_STATUS, SELLER_STATUS_FLOW } from '@/lib/format';

const STEPS = ['pending', 'processing', 'shipped', 'completed'];

const NEXT_STEP_HINT = {
  processing: 'Payment confirmed, start packing.',
  shipped: 'Package handed to the courier.',
  completed: 'Buyer has received the package.',
};

// tampilkan alur tahapan pesanan penjual beserta tombol pembaruan status
export default function OrderStatusPanel({ idOrder, status }) {
  let allowedStatuses = [];
  if (SELLER_STATUS_FLOW[status]) {
    allowedStatuses = SELLER_STATUS_FLOW[status];
  }

  const nextStepItem = allowedStatuses.find(function findNextStep(stepItem) {
    return stepItem !== 'cancelled';
  });

  let nextStep = null;
  if (nextStepItem) {
    nextStep = nextStepItem;
  }

  const canCancel = allowedStatuses.includes('cancelled');
  const currentIndex = STEPS.indexOf(status);

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
        <FiXCircle className="w-4 h-4 shrink-0 text-red-600" />
        <p className="text-xs text-red-700">
          This order was cancelled. The stock has been returned to your products.
        </p>
      </div>
    );
  }

  const stepper = (
    <ol className="flex items-start w-full sm:flex-1 min-w-0 max-w-xl">
      {STEPS.map(function buildStepItem(stepName, stepIndex) {
        const isDone = stepIndex < currentIndex || status === 'completed';
        const isCurrent = stepIndex === currentIndex && status !== 'completed';
        const isLast = stepIndex === STEPS.length - 1;

        let circleClass = 'border-neutral-300 bg-white text-neutral-400';
        let labelClass = 'text-neutral-400';

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
          connectorLine = (
            <span
              className={`absolute top-2.5 left-1/2 w-full h-0.5 ${lineColorClass}`}
            />
          );
        }

        let stepMarkerContent = stepIndex + 1;
        if (isDone) {
          stepMarkerContent = <FiCheck className="w-3 h-3" />;
        }

        return (
          <li key={stepName} className="relative flex-1 flex flex-col items-center text-center">
            {connectorLine}
            <span
              className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-semibold ${circleClass}`}
            >
              {stepMarkerContent}
            </span>
            <span className={`mt-1.5 text-[11px] leading-tight ${labelClass}`}>
              {ORDER_STATUS[stepName].label}
            </span>
          </li>
        );
      })}
    </ol>
  );

  let actions = null;
  if (nextStep) {
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

    const boundNextStepAction = updateOrderStatusAction.bind(null, idOrder);
    let stepHintText = '';
    if (NEXT_STEP_HINT[nextStep]) {
      stepHintText = NEXT_STEP_HINT[nextStep];
    }

    actions = (
      <div className="shrink-0 sm:ml-auto flex flex-col items-stretch sm:items-end gap-1.5">
        <div className="flex gap-2">
          {cancelActionForm}
          <ActionForm action={boundNextStepAction} className="flex-1 sm:flex-none">
            <input type="hidden" name="status_order" value={nextStep} />
            <SubmitButton
              size="sm"
              variant="dark"
              pendingText="Updating..."
              className="w-full px-4 py-2"
            >
              Mark as {ORDER_STATUS[nextStep].label}
            </SubmitButton>
          </ActionForm>
        </div>
        <p className="text-[11px] text-neutral-950">{stepHintText}</p>
      </div>
    );
  } else if (status === 'completed') {
    actions = (
      <p className="shrink-0 sm:ml-auto text-xs text-neutral-950">
        Completed — no action needed.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl bg-(--abumuda) px-4 py-3">
      {stepper}
      {actions}
    </div>
  );
}