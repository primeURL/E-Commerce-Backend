import express from "express";
import {
    allOrders,
    deleteOrder,
    getSingleOrder,
    myOrders,
    newOrder,
    processOrder,
} from "../controllers/Order.js";
import { adminOnly } from "../middlewares/Auth.js";

const router = express.Router();

// route - /api/v1/order/new
router.post("/new", newOrder);

// route - /api/v1/order/my
router.get("/my", myOrders);

// route - /api/v1/order/all
router.get("/all", adminOnly, allOrders);

router
  .route("/:id")
  .get(getSingleOrder)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default router;
