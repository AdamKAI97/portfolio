import { Router } from 'express';
import C from '../controllers/clientController.js';
import { telegramAuth } from '../middlewares/auth.middleware.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
router.use(telegramAuth);

router.get('/me', wrap(C.getMe));
router.put('/me', wrap(C.updateMe));

router.get('/categories', wrap(C.listCategories));
router.post('/categories', wrap(C.createCategory));
router.delete('/categories/:id', wrap(C.removeCategory));

router.get('/transactions', wrap(C.listTransactions));
router.post('/transactions', wrap(C.createTransaction));
router.put('/transactions/:id', wrap(C.updateTransaction));
router.delete('/transactions/:id', wrap(C.removeTransaction));

router.get('/overview', wrap(C.overview));
router.get('/trend', wrap(C.trend));
router.get('/daily', wrap(C.daily));
router.get('/health-score', wrap(C.health));
router.get('/stories', wrap(C.stories));
router.get('/advice', wrap(C.advice));
router.get('/achievements', wrap(C.achievements));

router.get('/goals', wrap(C.listGoals));
router.post('/goals', wrap(C.createGoal));
router.post('/goals/:id/deposit', wrap(C.depositGoal));
router.delete('/goals/:id', wrap(C.removeGoal));

router.get('/budgets', wrap(C.listBudgets));
router.put('/budgets', wrap(C.upsertBudget));
router.delete('/budgets/:id', wrap(C.removeBudget));

router.get('/debts', wrap(C.listDebts));
router.post('/debts', wrap(C.createDebt));
router.post('/debts/:id/settle', wrap(C.settleDebt));

router.get('/recurring', wrap(C.listRecurring));
router.post('/recurring', wrap(C.createRecurring));
router.put('/recurring/:id', wrap(C.updateRecurring));
router.delete('/recurring/:id', wrap(C.removeRecurring));

router.get('/allowance', wrap(C.allowance));

router.get('/export', wrap(C.exportCsv));

export default router;
