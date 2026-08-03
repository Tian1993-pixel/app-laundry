const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const checkLicense = require('../middleware/licenseMiddleware');

const authController = require('../controllers/authController');
const settingController = require('../controllers/settingController');
const serviceController = require('../controllers/serviceController');
const customerController = require('../controllers/customerController');
const orderController = require('../controllers/orderController');

router.post('/auth/login', authController.login);
router.get('/auth/me', verifyToken, authController.getProfile);

router.get('/settings', settingController.getSettings);
router.put('/settings', verifyToken, checkLicense, settingController.updateSettings);
router.post('/settings/license', verifyToken, settingController.updateLicense);

router.get('/services', checkLicense, serviceController.getServices);
router.post('/services', verifyToken, checkLicense, serviceController.createService);
router.put('/services/:id', verifyToken, checkLicense, serviceController.updateService);

router.get('/customers', verifyToken, checkLicense, customerController.getCustomers);
router.post('/customers', verifyToken, checkLicense, customerController.createCustomer);
router.post('/customers/:id/deposit', verifyToken, checkLicense, customerController.topupDeposit);

router.post('/orders', verifyToken, checkLicense, orderController.createOrder);
router.get('/orders', verifyToken, checkLicense, orderController.getOrders);
router.get('/orders/:id', checkLicense, orderController.getOrderById);
router.patch('/orders/:id/status', verifyToken, checkLicense, orderController.updateOrderStatus);
router.patch('/orders/:id/payment', verifyToken, checkLicense, orderController.updateOrderPayment);

router.get('/track/:keyword', checkLicense, orderController.trackOrder);

module.exports = router;