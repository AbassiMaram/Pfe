const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");

// Middleware admin
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Accès admin requis" });
  }
  next();
};

/* Routes existantes (inchangées) */
router.post("/", productController.createProduct); 
router.get("/", productController.getProducts);
router.get("/by-shop", productController.getProductsByShop);
router.get("/best-seller", productController.getBestSeller);
router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

/* Routes ADMIN (protection seule) */
router.get("/admin/by-shop", 
  authMiddleware,
  isAdmin,
  productController.getProductsByShop
);

router.post("/admin", 
  authMiddleware,
  isAdmin, 
  productController.createProduct
);

router.put("/admin/:id", 
  authMiddleware,
  isAdmin,
  productController.updateProduct
);

router.delete("/admin/:id", 
  authMiddleware,
  isAdmin,
  productController.deleteProduct
);

module.exports = router;