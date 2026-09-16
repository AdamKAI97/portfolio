import { Router } from 'express';
import C from '../controllers/adminController.js';
import { adminAuth } from '../middlewares/auth.middleware.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

router.post('/login', wrap(C.login));

router.use(adminAuth);

router.get('/dashboard', wrap(C.dashboard));

router.get('/users', wrap(C.listUsers));
router.get('/users/:id', wrap(C.getUser));
router.put('/users/:id', wrap(C.updateUser));

router.get('/transactions', wrap(C.listTransactions));
router.put('/transactions/:id', wrap(C.updateTransaction));
router.delete('/transactions/:id', wrap(C.removeTransaction));

router.get('/categories', wrap(C.listCategories));
router.post('/categories', wrap(C.createCategory));
router.put('/categories/:id', wrap(C.updateCategory));
router.delete('/categories/:id', wrap(C.removeCategory));

router.get('/goals', wrap(C.listGoals));
router.post('/broadcast', wrap(C.broadcast));
router.get('/export', wrap(C.exportCsv));

export default router;
