import { NextFunction, Request, Response } from "express";
import { stripe } from "../app.js";
import { Coupon } from "../models/Coupon.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { OrderItemType, ShippingInfoType } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";

export const createPaymentIntent = async (req : Request,res : Response,next : NextFunction) => {
    try {
        const { id } = req.query;

        const user = await User.findById(id).select("name");

        if (!user) return next(new ErrorHandler("Please login first", 401));

        const {
            items,
            shippingInfo,
            coupon,
        }: {
            items: OrderItemType[];
            shippingInfo: ShippingInfoType | undefined;
            coupon: string | undefined;
        } = req.body;

        if (!items) return next(new ErrorHandler("Please send items", 400));

        if (!shippingInfo)
            return next(new ErrorHandler("Please send shipping info", 400));

        let discountAmount = 0;

        if (coupon) {
            const discount = await Coupon.findOne({ code: coupon });
            if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
            discountAmount = discount.amount;
        }

        const productIDs = items.map((item) => item.productId);

        const products = await Product.find({
            _id: { $in: productIDs },
        });

        const subtotal = products.reduce((prev, curr) => {
            const item = items.find((i) => i.productId === curr._id.toString());
            if (!item) return prev;
            return curr.price * item.quantity + prev;
        }, 0);

        const tax = subtotal * 0.18;

        const shipping = subtotal > 1000 ? 0 : 200;

        const total = Math.floor(subtotal + tax + shipping - discountAmount);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: total * 100,
            currency: "inr",
            description: "MERN-Ecommerce",
            shipping: {
            name: user.name,
            address: {
                line1: shippingInfo.address,
                postal_code: shippingInfo.pinCode.toString(),
                city: shippingInfo.city,
                state: shippingInfo.state,
                country: shippingInfo.country,
            },
            },
        });

        return res.status(201).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        next(error)
    }
}

export const newCoupon = async (req : Request,res : Response,next : NextFunction) => {
    try {
        console.log('here1')
    const {code, amount} = req.body
    if(!code || !amount){
        return next(new ErrorHandler("Please enter both coupon and amount",400))
    }
    console.log('here')
    await Coupon.create({code,amount})
    console.log('there')
    return res.status(201).json({
        success : true,
        message : `Coupon ${code} created successfully`
    })
    } catch (error) {
        next(error)
    }
    
}

export const applyDiscount = async (req : Request,res : Response,next : NextFunction) => {

    try {
        const {coupon} = req.body

        const discount = await Coupon.findOne({code : coupon})
        if(!discount){
            return next(new ErrorHandler("Invalid Coupon Code",400))
        }
    
        return res.status(200).json({
            success : true,
            discount : discount.amount
        })
    } catch (error) {
        next(error)
    }
    
}

export const allCoupons = async (req : Request,res : Response,next : NextFunction) => {
    try {
        const coupons = await Coupon.find({})
        return res.status(200).json({
            success : true,
            coupons
        })
    } catch (error) {
        next(error)
    }
    
}

export const deleteCoupon = async (req : Request,res : Response,next : NextFunction) => {
    try {
        const {id} = req.params
        const coupon = await Coupon.findByIdAndDelete(id)
        if(!coupon){
            return next(new ErrorHandler("Invalid Coupon ID :" + id,400))
        }
        return res.status(200).json({
            success : true,
            message : `Coupon ${coupon?.code} Deleted Successfully`
        })
    } catch (error) {
        next(error)
    }
   
}
export const getCoupon = async (req : Request,res : Response,next : NextFunction) => {
    try {
        const { id } = req.params;
  
        const coupon = await Coupon.findById(id);
    
        if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));
    
        return res.status(200).json({
        success: true,
        coupon,
        });
    } catch (error) {
        next(error)
    }
  };
  export const updateCoupon = async (req : Request,res : Response,next : NextFunction) => {
    try {
        const { id } = req.params;

        const { code, amount } = req.body;
      
        const coupon = await Coupon.findById(id);
      
        if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));
      
        if (code) coupon.code = code;
        if (amount) coupon.amount = amount;
      
        await coupon.save();
      
        return res.status(200).json({
          success: true,
          message: `Coupon ${coupon.code} Updated Successfully`,
        });
    } catch (error) {
        next(error)
    }
  };