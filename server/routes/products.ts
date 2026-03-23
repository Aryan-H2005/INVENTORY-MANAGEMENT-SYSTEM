import express from "express";
import { Product, StockLog } from "../models";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// All product routes protected
router.use(authMiddleware);

router.get("/", (req, res, next) => {
  try {
    const products = Product.findAll();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get("/low-stock", (req, res, next) => {
  try {
    const products = Product.getLowStock();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  try {
    const result = Product.create(req.body);
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", (req, res, next) => {
  try {
    Product.update(req.params.id, req.body);
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    Product.delete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/stock", (req, res, next) => {
  try {
    const { type, quantity } = req.body; // type: 'IN' or 'OUT'
    const productId = req.params.id;
    
    const change = type === "IN" ? quantity : -quantity;
    
    Product.updateStock(productId, change);
    StockLog.create(productId, type, quantity);
    
    res.json({ message: `Stock updated successfully (${type})` });
  } catch (error) {
    next(error);
  }
});

router.get("/logs", (req, res, next) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, p.name as product_name 
      FROM stock_logs l 
      JOIN products p ON l.product_id = p.id 
      ORDER BY l.timestamp DESC 
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
