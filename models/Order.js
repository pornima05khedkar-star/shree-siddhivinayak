const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: { type: Number, required: true },
    size: String,
    color: String
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  paymentMethod: String,
  paymentStatus: { type: String, default: 'pending' },
  orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);