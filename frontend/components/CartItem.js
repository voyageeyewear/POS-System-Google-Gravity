import { Plus, Minus, X } from 'lucide-react';

export default function CartItem({ item, onUpdateQuantity, onUpdateDiscount, onRemove }) {
  const handleQuantityChange = (delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0 && newQuantity <= item.maxQuantity) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const handleDiscountChange = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    const maxDiscount = item.discountType === 'percentage' ? 100 : item.price;
    if (discount >= 0 && discount <= maxDiscount) {
      onUpdateDiscount(item.id, discount, item.discountType);
    }
  };

  const handleDiscountTypeChange = (e) => {
    const newType = e.target.value;
    onUpdateDiscount(item.id, 0, newType); // Reset discount when type changes
  };

  // Calculate discount per item
  const discountPerItem = item.discountType === 'percentage' 
    ? (item.price * item.discount) / 100 
    : item.discount;
  
  const priceAfterDiscount = item.price - discountPerItem;
  const subtotal = priceAfterDiscount * item.quantity;

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
          <p className="text-xs text-gray-500">₹{item.price} × {item.quantity}</p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:bg-red-50 p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-600 w-16">Quantity:</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="p-1 hover:bg-white rounded"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="p-1 hover:bg-white rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Discount Input */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-600 w-16">Discount:</span>
          <select
            value={item.discountType || 'amount'}
            onChange={handleDiscountTypeChange}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="percentage">%</option>
            <option value="amount">₹</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-16"></span>
          <input
            type="number"
            value={item.discount}
            onChange={handleDiscountChange}
            min="0"
            max={item.discountType === 'percentage' ? 100 : item.price}
            step={item.discountType === 'percentage' ? 1 : 10}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
            placeholder="0"
          />
          <span className="text-xs text-gray-600 min-w-[60px]">
            {item.discountType === 'percentage' ? 'percent' : 'per item'}
          </span>
        </div>
        {item.discount > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600 w-16"></span>
            <span className="text-xs text-green-600">
              -₹{discountPerItem.toFixed(2)} per item
            </span>
          </div>
        )}
      </div>

      {/* Subtotal */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-600">Subtotal:</span>
        <span className="font-bold text-gray-800">₹{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

