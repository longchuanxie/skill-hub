import express from 'express';
import {
  getAllPages,
  getPageByKey,
  createPage,
  updatePage,
  deletePage
} from '../controllers/customPageController';

const router = express.Router();

router.get('/', getAllPages);
router.get('/:pageKey', getPageByKey);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

export default router;
