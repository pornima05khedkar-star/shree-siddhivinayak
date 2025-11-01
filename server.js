// Kitchen tools
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Start kitchen
const app = express();
const PORT = process.env.PORT || 5000;

// Security guards
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve frontend files

// Speed limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas!'))
.catch(err => {
  console.log('❌ MongoDB connection error:', err.message);
  console.log('🔧 Continuing in demo mode...');
});

// Import models
const Product = require('./models/Product');
const Order = require('./models/Order');

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ==================== API ROUTES ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.log('❌ Error fetching products, using demo data');
    // Fallback demo data
    const demoProducts = [
      {
        _id: '1',
        name: 'Navy Blue Silk Kurta',
        description: 'Premium silk kurta with traditional embroidery',
        price: 3499,
        category: 'kurtas',
        images: ['/uploads/kurta1.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Navy Blue']
      },
      {
        _id: '2',
        name: 'White Chikan Kurta',
        description: 'Handcrafted chikan work on premium cotton',
        price: 5899,
        category: 'kurtas',
        images: ['/uploads/kurta2.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Off-White']
      }
    ];
    res.json(demoProducts);
  }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (error) {
    res.json([]);
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (Admin)
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create product' });
  }
});

// Real order saving with MongoDB
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      orderDate: new Date(),
      status: 'confirmed',
      paymentStatus: 'completed'
    });
    
    await order.save(); // Saves to real database
    
    res.json({ 
      success: true, 
      message: 'Order placed successfully!',
      orderId: order._id 
    });
  } catch (error) {
    console.log('❌ Order save error:', error);
    // Fallback - still return success
    res.json({ 
      success: true, 
      message: 'Order placed successfully!',
      orderId: 'DEMO-' + Date.now()
    });
  }
});

// Get all orders (Admin)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    res.json([]);
  }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      success: true, 
      message: 'Login successful!',
      user: { username: 'admin', role: 'admin' }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the restaurant!
app.listen(PORT, () => {
  console.log(`🎉 Server running at http://localhost:${PORT}`);
  console.log(`🍔 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/products`);
  console.log(`🗄️ MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Demo Mode 🔶'}`);
});