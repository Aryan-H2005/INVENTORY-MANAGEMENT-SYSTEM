import db from "./db";
import bcrypt from "bcryptjs";

export const User = {
  create: (username, email, password) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    return stmt.run(username, email, hashedPassword);
  },
  findByEmail: (email) => {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  },
  findById: (id) => {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }
};

export const Product = {
  findAll: () => {
    return db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  },
  findById: (id) => {
    return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  },
  create: (product) => {
    const { name, price, quantity, category, threshold } = product;
    const stmt = db.prepare(
      "INSERT INTO products (name, price, quantity, category, threshold) VALUES (?, ?, ?, ?, ?)"
    );
    return stmt.run(name, price, quantity, category, threshold || 10);
  },
  update: (id, product) => {
    const { name, price, quantity, category, threshold } = product;
    const stmt = db.prepare(
      "UPDATE products SET name = ?, price = ?, quantity = ?, category = ?, threshold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    return stmt.run(name, price, quantity, category, threshold, id);
  },
  delete: (id) => {
    return db.prepare("DELETE FROM products WHERE id = ?").run(id);
  },
  updateStock: (id, quantityChange) => {
    const stmt = db.prepare(
      "UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    return stmt.run(quantityChange, id);
  },
  getLowStock: () => {
    return db.prepare("SELECT * FROM products WHERE quantity < threshold").all();
  }
};

export const StockLog = {
  create: (productId, type, quantity) => {
    const stmt = db.prepare("INSERT INTO stock_logs (product_id, type, quantity) VALUES (?, ?, ?)");
    return stmt.run(productId, type, quantity);
  }
};
