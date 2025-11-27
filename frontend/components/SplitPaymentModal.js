import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SplitPaymentModal({ isOpen, onClose, totalAmount, onConfirm }) {
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setCashAmount('');
      setCardAmount('');
      setUpiAmount('');
      setErrors({});
    }
  }, [isOpen]);

  const calculateTotal = () => {
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;
    return cash + card + upi;
  };

  const validateInput = (value) => {
    if (value === '') return true; // Empty is allowed
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  };

  const handleCashChange = (e) => {
    const value = e.target.value;
    if (validateInput(value)) {
      setCashAmount(value);
      setErrors({ ...errors, cash: '' });
    }
  };

  const handleCardChange = (e) => {
    const value = e.target.value;
    if (validateInput(value)) {
      setCardAmount(value);
      setErrors({ ...errors, card: '' });
    }
  };

  const handleUpiChange = (e) => {
    const value = e.target.value;
    if (validateInput(value)) {
      setUpiAmount(value);
      setErrors({ ...errors, upi: '' });
    }
  };

  const handleConfirm = () => {
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;
    const totalEntered = cash + card + upi;

    // Validation
    const newErrors = {};

    // Check if at least one payment method has amount
    if (cash === 0 && card === 0 && upi === 0) {
      toast.error('Please enter at least one payment amount');
      return;
    }

    // Check if total matches
    if (Math.abs(totalEntered - totalAmount) > 0.01) {
      newErrors.total = `Total split amount must equal ₹${totalAmount.toFixed(2)}`;
      setErrors(newErrors);
      toast.error(newErrors.total);
      return;
    }

    // Validate individual amounts
    if (cashAmount && (!validateInput(cashAmount) || cash < 0)) {
      newErrors.cash = 'Enter valid numeric value';
    }
    if (cardAmount && (!validateInput(cardAmount) || card < 0)) {
      newErrors.card = 'Enter valid numeric value';
    }
    if (upiAmount && (!validateInput(upiAmount) || upi < 0)) {
      newErrors.upi = 'Enter valid numeric value';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare payment details
    const paymentDetails = {};
    if (cash > 0) paymentDetails.cash = cash;
    if (card > 0) paymentDetails.card = card;
    if (upi > 0) paymentDetails.upi = upi;

    onConfirm({
      paymentMode: 'Split',
      paymentDetails
    });

    onClose();
  };

  const totalEntered = calculateTotal();
  const remaining = totalAmount - totalEntered;
  const isValid = Math.abs(remaining) < 0.01 && totalEntered > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Split Payment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Total Bill Amount */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Total Bill Amount</div>
            <div className="text-2xl font-bold text-primary-600">₹{totalAmount.toFixed(2)}</div>
          </div>

          {/* Payment Inputs */}
          <div className="space-y-3">
            {/* Cash */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cash Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={handleCashChange}
                placeholder="Enter cash amount"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                  errors.cash ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cash && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.cash}
                </p>
              )}
            </div>

            {/* Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cardAmount}
                onChange={handleCardChange}
                placeholder="Enter card amount"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                  errors.card ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.card && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.card}
                </p>
              )}
            </div>

            {/* UPI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={upiAmount}
                onChange={handleUpiChange}
                placeholder="Enter UPI amount"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                  errors.upi ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.upi && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.upi}
                </p>
              )}
            </div>
          </div>

          {/* Total Summary */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Entered:</span>
              <span className={`font-medium ${isValid ? 'text-green-600' : 'text-orange-600'}`}>
                ₹{totalEntered.toFixed(2)}
              </span>
            </div>
            {!isValid && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining:</span>
                <span className={`font-medium ${remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {remaining > 0 ? `₹${remaining.toFixed(2)}` : `Overpaid by ₹${Math.abs(remaining).toFixed(2)}`}
                </span>
              </div>
            )}
            {errors.total && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.total}
              </p>
            )}
            {isValid && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                ✓ Payment complete
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
              isValid
                ? 'bg-primary-600 hover:bg-primary-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

