import express from "express";
import db from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  try {
    // Total Inventory Value
    const totalValue = db.prepare("SELECT SUM(price * quantity) as totalValue FROM products").get() as { totalValue: number };

    // Low Stock Count
    const lowStockCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE quantity < threshold").get() as { count: number };

    // Category Distribution
    const categoryDistribution = db.prepare("SELECT category, COUNT(*) as count FROM products GROUP BY category").all();

    // Stock Trends (Last 7 days)
    const stockTrends = db.prepare(`
      SELECT 
        DATE(timestamp) as date, 
        SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as netChange 
      FROM stock_logs 
      WHERE timestamp >= DATE('now', '-7 days')
      GROUP BY DATE(timestamp) 
      ORDER BY date ASC
    `).all();

    // Top 5 Low Stock Products
    const topLowStock = db.prepare("SELECT * FROM products WHERE quantity < threshold ORDER BY quantity ASC LIMIT 5").all();

    // Recently Updated Products
    const recentlyUpdated = db.prepare("SELECT * FROM products ORDER BY updated_at DESC LIMIT 5").all();

    // Dead Stock (Not updated for 30+ days or longest time)
    const deadStock = db.prepare("SELECT * FROM products ORDER BY updated_at ASC LIMIT 5").all();

    res.json({
      summary: {
        totalValue: totalValue.totalValue || 0,
        lowStockCount: lowStockCount.count || 0,
      },
      categoryDistribution,
      stockTrends,
      insights: {
        topLowStock,
        recentlyUpdated,
        deadStock
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

export default router;
