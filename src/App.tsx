import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Plus, 
  LogOut, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft,
  Trash2,
  Edit2,
  Filter,
  BarChart3,
  Clock,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { Product, User, AnalyticsData } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = "/api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAuthMode, setIsAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "inventory" | "alerts" | "analysis">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    quantity: 0,
    category: "",
    threshold: 10
  });

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isAuthMode === "login" ? "login" : "signup";
    try {
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (isAuthMode === "login") {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          setUser(data.user);
        } else {
          setIsAuthMode("login");
          setAuthError("Signup successful! Please login.");
        }
      } else {
        setAuthError(data.message || "Invalid credentials. Please check your email and password.");
      }
    } catch (error) {
      setAuthError("A connection error occurred. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setProducts([]);
    setAnalytics(null);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? "PUT" : "POST";
    const url = editingProduct 
      ? `${API_URL}/products/${editingProduct.id}` 
      : `${API_URL}/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });
      if (res.ok) {
        fetchProducts();
        fetchAnalytics();
        setIsModalOpen(false);
        setEditingProduct(null);
        setProductForm({ name: "", price: 0, quantity: 0, category: "", threshold: 10 });
      }
    } catch (error) {
      alert("Failed to save product");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts();
        fetchAnalytics();
      }
    } catch (error) {
      alert("Failed to delete product");
    }
  };

  const handleStockUpdate = async (id: number, type: "IN" | "OUT", quantity: number) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}/stock`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type, quantity })
      });
      if (res.ok) {
        fetchProducts();
        fetchAnalytics();
      }
    } catch (error) {
      alert("Failed to update stock");
    }
  };

  const lowStockProducts = products.filter(p => p.quantity < p.threshold);

  const filteredProducts = (activeTab === "alerts" ? lowStockProducts : products).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...new Set(products.map(p => p.category))];
  const lowStockCount = lowStockProducts.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-xl">
              <Package className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
            {isAuthMode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-slate-500 text-center mb-8">
            Manage your inventory with StockFlow
          </p>

          <AnimatePresence mode="wait">
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg text-sm mb-6 text-center font-medium ${
                  authError.includes("successful") 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-4">
            {isAuthMode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  value={authForm.username}
                  onChange={e => {
                    setAuthForm({ ...authForm, username: e.target.value });
                    setAuthError(null);
                  }}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={authForm.email}
                onChange={e => {
                  setAuthForm({ ...authForm, email: e.target.value });
                  setAuthError(null);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={authForm.password}
                onChange={e => {
                  setAuthForm({ ...authForm, password: e.target.value });
                  setAuthError(null);
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              {isAuthMode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsAuthMode(isAuthMode === "login" ? "signup" : "login");
                setAuthError(null);
              }}
              className="text-indigo-600 text-sm font-medium hover:underline"
            >
              {isAuthMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Package className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-900">StockFlow</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <button 
          onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "dashboard" ? "text-indigo-600 bg-indigo-50" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>
        <button 
          onClick={() => { setActiveTab("inventory"); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "inventory" ? "text-indigo-600 bg-indigo-50" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <Package size={20} />
          Inventory
        </button>
        <button 
          onClick={() => { setActiveTab("alerts"); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "alerts" ? "text-indigo-600 bg-indigo-50" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <div className="relative">
            <AlertTriangle size={20} />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          Alerts
        </button>
        <button 
          onClick={() => { setActiveTab("analysis"); setIsMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "analysis" ? "text-indigo-600 bg-indigo-50" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <BarChart3 size={20} />
          Analysis
        </button>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Package className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">StockFlow</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-40 lg:hidden flex flex-col shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 p-4 lg:p-6 sticky top-0 lg:static z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 capitalize">
              {activeTab === "dashboard" ? "Inventory Overview" : activeTab}
            </h2>
            <p className="text-sm text-slate-500 hidden sm:block">
              {activeTab === "dashboard" && "Quick summary of your business status"}
              {activeTab === "inventory" && "Manage and track all your products"}
              {activeTab === "alerts" && "Items requiring immediate attention"}
              {activeTab === "analysis" && "Deep dive into your inventory data"}
            </p>
          </div>
          {activeTab === "inventory" && (
            <button 
              onClick={() => {
                setEditingProduct(null);
                setProductForm({ name: "", price: 0, quantity: 0, category: "", threshold: 10 });
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              <Plus size={20} />
              Add Product
            </button>
          )}
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                      <Package size={24} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{products.length}</div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                      <AlertTriangle size={24} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock</span>
                  </div>
                  <div className="text-3xl font-bold text-amber-600">{lowStockCount}</div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                      <ArrowUpRight size={24} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Value</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">${totalValue.toLocaleString()}</div>
                </motion.div>
              </div>

              {/* Recent Activity / Quick View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-500" />
                    Critical Alerts
                  </h3>
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.quantity} units left (Threshold: {p.threshold})</div>
                        </div>
                        <button 
                          onClick={() => { setActiveTab("inventory"); setSearch(p.name); }}
                          className="text-indigo-600 text-sm font-semibold hover:underline"
                        >
                          Restock
                        </button>
                      </div>
                    ))}
                    {lowStockCount === 0 && (
                      <div className="text-center py-8 text-slate-400 italic">No low stock alerts</div>
                    )}
                    {lowStockCount > 5 && (
                      <button 
                        onClick={() => setActiveTab("alerts")}
                        className="w-full text-center text-sm text-slate-500 hover:text-indigo-600 pt-2"
                      >
                        View all {lowStockCount} alerts
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-indigo-500" />
                    Recently Added
                  </h3>
                  <div className="space-y-3">
                    {products.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">${p.price} • {p.category}</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="text-center py-8 text-slate-400 italic">No products added yet</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "analysis" && analytics && (
            <div className="space-y-6">
              {/* Analysis Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Value</div>
                  <div className="text-2xl font-bold text-slate-900">${analytics.summary.totalValue.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Low Stock Items</div>
                  <div className="text-2xl font-bold text-amber-600">{analytics.summary.lowStockCount}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Categories</div>
                  <div className="text-2xl font-bold text-indigo-600">{analytics.categoryDistribution.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Items</div>
                  <div className="text-2xl font-bold text-emerald-600">{products.reduce((s, p) => s + p.quantity, 0)}</div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-500" />
                    Category Distribution
                  </h3>
                  <div className="h-64">
                    <Bar 
                      data={{
                        labels: analytics.categoryDistribution.map((c: any) => c.category),
                        datasets: [{
                          label: 'Products',
                          data: analytics.categoryDistribution.map((c: any) => c.count),
                          backgroundColor: 'rgba(79, 70, 229, 0.8)',
                          borderRadius: 8,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-500" />
                    Stock Trends (Net Change)
                  </h3>
                  <div className="h-64">
                    <Line 
                      data={{
                        labels: analytics.stockTrends.map((t: any) => t.date),
                        datasets: [{
                          label: 'Net Change',
                          data: analytics.stockTrends.map((t: any) => t.netChange),
                          borderColor: 'rgb(16, 185, 129)',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          fill: true,
                          tension: 0.4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Insights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Top Low Stock
                  </h4>
                  <div className="space-y-3">
                    {analytics.insights.topLowStock.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 truncate mr-2">{p.name}</span>
                        <span className="font-bold text-amber-600">{p.quantity} / {p.threshold}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-500" />
                    Recently Updated
                  </h4>
                  <div className="space-y-3">
                    {analytics.insights.recentlyUpdated.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 truncate mr-2">{p.name}</span>
                        <span className="text-slate-400 text-xs">{new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Trash2 size={18} className="text-slate-400" />
                    Dead Stock (Oldest)
                  </h4>
                  <div className="space-y-3">
                    {analytics.insights.deadStock.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 truncate mr-2">{p.name}</span>
                        <span className="text-slate-400 text-xs">{new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === "inventory" || activeTab === "alerts") && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter size={18} className="text-slate-400" />
                  <select 
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4 hidden md:table-cell">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-400 sm:hidden">{product.category}</div>
                          <div className="text-xs text-slate-400">ID: #{product.id}</div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">${product.price}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${product.quantity < product.threshold ? 'text-amber-600' : 'text-slate-900'}`}>
                              {product.quantity}
                            </span>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleStockUpdate(product.id, "IN", 1)}
                                className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
                                title="Stock In"
                              >
                                <ArrowUpRight size={14} />
                              </button>
                              <button 
                                onClick={() => handleStockUpdate(product.id, "OUT", 1)}
                                className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                title="Stock Out"
                              >
                                <ArrowDownLeft size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {product.quantity < product.threshold ? (
                            <span className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                              <AlertTriangle size={12} />
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs font-bold">In Stock</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingProduct(product);
                                setProductForm({
                                  name: product.name,
                                  price: product.price,
                                  quantity: product.quantity,
                                  category: product.category,
                                  threshold: product.threshold
                                });
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                          {activeTab === "alerts" ? "No low stock alerts found" : "No products found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
              </div>
              <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Quantity</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={productForm.quantity}
                      onChange={e => setProductForm({ ...productForm, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Threshold</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={productForm.threshold}
                      onChange={e => setProductForm({ ...productForm, threshold: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  >
                    {editingProduct ? "Update Product" : "Create Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
