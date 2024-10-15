import express from "express";
import {
    deleteProduct,
    getAdminProducts,
    getAllCategories,
    getAllProducts,
    getLatestProducts,
    getSingleProduct,
    newProduct,
    updateProduct,
    allReviewsOfProduct,
    deleteReview,
    newReview
} from "../controllers/Product.js";
import { adminOnly } from "../middlewares/Auth.js";
import { mutliUpload } from "../middlewares/Multer.js";

const router = express.Router();

//To Create New Product  - /api/v1/product/new
router.post("/new", adminOnly, mutliUpload, newProduct);

//To Get all Products with filter  - /api/v1/product/all
router.get("/all", getAllProducts);

//To Get Latest Product  - /api/v1/product/latest
router.get("/latest", getLatestProducts);

//To Get all unique categories   - /api/v1/product/categories
router.get("/categories", getAllCategories);

// To get all products
router.get("/admin-products", adminOnly, getAdminProducts);

router
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, mutliUpload, updateProduct)
  .delete(adminOnly, deleteProduct);


router.get("/reviews/:id", allReviewsOfProduct);
router.post("/review/new/:id", newReview);
router.delete("/review/:id", deleteReview);  

export default router;
