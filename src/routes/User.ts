import express from "express";
import {newUser,getAllUsers,getUser,deleteUser,updateUserCart} from "../controllers/User.js";
import { adminOnly } from "../middlewares/Auth.js";

// import { adminOnly } from "../middlewares/auth.js";

const router = express.Router();

// route - /api/v1/user/new
router.post("/new", newUser);

// Route - /api/v1/user/all
router.get("/all",adminOnly, getAllUsers);

// Route - /api/v1/user/dynamicID
router.get("/:id",getUser)

// Route - /api/v1/user/updateUserCart/:id
router.put("/updateUserCart/:userId",updateUserCart)


router.delete("/:id",adminOnly, deleteUser)

export default router;