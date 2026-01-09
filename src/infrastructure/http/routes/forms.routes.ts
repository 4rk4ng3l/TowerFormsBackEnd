import { Router } from 'express';
import { container } from 'tsyringe';
import { FormsController } from '../controllers/forms.controller';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const formsController = container.resolve(FormsController);
    await formsController.create(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const formsController = container.resolve(FormsController);
    await formsController.getById(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const formsController = container.resolve(FormsController);
    await formsController.list(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
