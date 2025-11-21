import { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

export default function SplitPayment({ totalAmount, onPaymentChange, initialPayments = null }) {
  const [payments, setPayments] = useState(() => {
    if (initialPayments && initialPayments.length > 0) {
      return initialPayments;
    }
    // Default: single cash payment
    return [{ paymentMethod: 'cash', amount: totalAmount || 0 }];
  });

  useEffect(() => {
    // Update payments when totalAmount changes
    if (payments.length === 1 && payments[0].amount !== totalAmount) {
      setPayments([{ ...payments[0], amount: totalAmount }]);
    }
  }, [totalAmount]);

  useEffect(() => {
    // Notify parent of payment changes
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    onPaymentChange(payments, totalPaid);
  }, [payments, onPaymentChange]);

  const addPayment = () => {
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const remaining = totalAmount - totalPaid;
    
    if (remaining <= 0) {
      toast.error('Total amount already covered');
      return;
    }

    setPayments([
      ...payments,
      { paymentMethod: 'cash', amount: remaining }
    ]);
  };

  const removePayment = (index) => {
    if (payments.length === 1) {
      toast.error('At least one payment method is required');
      return;
    }
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index, field, value) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const updateAmount = (index, value) => {
    const amount = parseFloat(value) || 0;
    const totalPaid = payments.reduce((sum, p, i) => {
      if (i === index) return sum + amount;
      return sum + parseFloat(p.amount || 0);
    }, 0);

    if (totalPaid > totalAmount) {
      toast.error(`Total payments (₹${totalPaid.toFixed(2)}) cannot exceed total amount (₹${totalAmount.toFixed(2)})`);
      return;
    }

    updatePayment(index, 'amount', amount);
  };

  const autoFillRemaining = (index) => {
    const totalPaid = payments.reduce((sum, p, i) => {
      if (i === index) return sum;
      return sum + parseFloat(p.amount || 0);
    }, 0);
    const remaining = totalAmount - totalPaid;
    
    if (remaining > 0) {
      updatePayment(index, 'amount', remaining);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const remaining = totalAmount - totalPaid;
  const isExact = Math.abs(remaining) < 0.01;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Payment Method{payments.length > 1 ? 's (Split Payment)' : ''}
        </label>
        {payments.length < 4 && (
          <button
            type="button"
            onClick={addPayment}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus size={16} />
            Add Payment
          </button>
        )}
      </div>

      {payments.map((payment, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1">
            <select
              value={payment.paymentMethod}
              onChange={(e) => updatePayment(index, 'paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max={totalAmount}
              value={payment.amount || ''}
              onChange={(e) => updateAmount(index, e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
            {index === payments.length - 1 && remaining > 0 && (
              <button
                type="button"
                onClick={() => autoFillRemaining(index)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary-600 hover:text-primary-700"
              >
                Fill ₹{remaining.toFixed(2)}
              </button>
            )}
          </div>
          {payments.length > 1 && (
            <button
              type="button"
              onClick={() => removePayment(index)}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove payment"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}

      {/* Payment Summary */}
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Paid:</span>
          <span className={`font-medium ${isExact ? 'text-green-600' : 'text-orange-600'}`}>
            ₹{totalPaid.toFixed(2)}
          </span>
        </div>
        {!isExact && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining:</span>
            <span className={`font-medium ${remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {remaining > 0 ? `₹${remaining.toFixed(2)}` : `Overpaid by ₹${Math.abs(remaining).toFixed(2)}`}
            </span>
          </div>
        )}
        {isExact && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            ✓ Payment complete
          </div>
        )}
      </div>
    </div>
  );
}

