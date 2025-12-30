import { Router } from 'express';
import { container } from 'tsyringe';
import { FormsController } from '../controllers/forms.controller';

const router = Router();
const formsController = container.resolve(FormsController);

router.post('/', (req, res, next) =>
  formsController.create(req, res).catch(next)
);

router.get('/:id', (req, res, next) =>
  formsController.getById(req, res).catch(next)
);

router.get('/', (req, res, next) =>
  formsController.list(req, res).catch(next)
);

export default router;
