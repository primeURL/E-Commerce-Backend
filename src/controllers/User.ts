import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";

export const updateUserCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return next(new ErrorHandler("Invalid Id", 400));
    }
    console.log(req.body);

    const { subtotal, tax, discount, total, shippingCharges, cartItems } =
      req.body;
    user.userCart.subTotal = subtotal;
    user.userCart.tax = tax;
    user.userCart.discount = discount;
    user.userCart.shippingCharges = shippingCharges;
    user.userCart.total = total;
    user.userCart.cartItems = cartItems;

    user.save();
    return res.status(201).json({
      success: true,
      message: `User CartItems Updated Successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const newUser = async (
  req: Request<{}, {}, NewUserRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.body);
    const { _id, name, email, photo, gender, dob } = req.body;

    if (!_id || !name || !email || !photo || !gender || !dob) {
      return next(new ErrorHandler("Please add all fields", 400));
    }
    let user = await User.findById({ _id });
    if (user) {
      return res.status(200).json({
        success: true,
        message: `Welcome Back, ${user.name}`,
      });
    }
    user = await User.create({
      _id,
      name,
      email,
      photo,
      gender,
      dob: new Date(dob),
    });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find({});
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return next(new ErrorHandler("Invalid Id", 400));
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return next(new ErrorHandler("Invalid Id", 400));
    }
    await user.deleteOne();
    return res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    return next(error);
  }
};
