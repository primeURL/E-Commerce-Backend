import express from "express";
import { adminOnly } from "../middlewares/Auth.js";
import { allCoupons, applyDiscount, deleteCoupon, newCoupon,createPaymentIntent,
    getCoupon, updateCoupon
 } from "../controllers/Payment.js";


const router = express.Router();

// route - /api/v1/payment/create
router.post("/create", createPaymentIntent);

// route - /api/v1/payment/coupon/new
router.get("/discount", applyDiscount);

// route - /api/v1/payment/coupon/new
router.post("/createnewcoupon", adminOnly,newCoupon);

// route - /api/v1/payment/discount
router.get("/discount", applyDiscount);

// route - /api/v1/payment//coupon/all
router.get("/coupon/all", adminOnly,allCoupons);

// route - /api/v1/payment/coupon/:id
router
  .route("/coupon/:id")
  .get(adminOnly, getCoupon)
  .put(adminOnly, updateCoupon)
  .delete(adminOnly, deleteCoupon);

export default router;