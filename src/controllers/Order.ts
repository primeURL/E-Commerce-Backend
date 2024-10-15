import { Order } from "../models/Order.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Request,Response,NextFunction } from "express";
import { invalidateCache, reduceStock } from "../utils/featues.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";


// To create new Order ()
export const newOrder = async (req : Request<{},{},NewOrderRequestBody>,res : Response, next : NextFunction) => {

    try {
        const {shippingInfo,orderItems,user,subtotal,tax,shippingCharges,discount,total} = req.body
        if(!shippingInfo || !orderItems || !user || !subtotal || !tax || !total){
            return next(new ErrorHandler("Please Enter All Fields",400))
        }
        const order = await Order.create({
            shippingInfo,orderItems,user,subtotal,tax,shippingCharges,discount,total
        })
        await reduceStock(orderItems)

        await invalidateCache({product : true,order : true, admin : true, userId : user,productId:order.orderItems.map(i=>String(i.productId))})

        return res.status(201).json({
            success : true,
            message : "Order Placed Successfully"
        })
    } catch (error) {
        next(error)
    }
}

// To get order of particular user with it's id
export const myOrders = async (req : Request,res : Response, next : NextFunction) => {

    try {
        const {id} = req.query
        let orders = [];
        const key = `my-orders-${id}`
        if(myCache.has(key)){
            orders = JSON.parse(myCache.get(key) as string)
        }else{
            orders = await Order.find({user : id})
            myCache.set(key,JSON.stringify(orders))
        }

        return res.status(200).json({
            success : true,
            orders
        })
    } catch (error) {
        next(error)
    }
}

// To get all order for admin
export const allOrders = async (req : Request,res : Response, next : NextFunction) => {

    try {
        
        let orders = [];
        const key = 'all-orders'
        if(myCache.has(key)){
            orders = JSON.parse(myCache.get(key) as string)
        }else{
            orders = await await Order.find().populate("user","name")
            // orders = await await Order.find().populate("user","name").populate("orderItems.productId");
            myCache.set(key,JSON.stringify(orders))
        }
        return res.status(200).json({
            success : true,
            orders
        })
    } catch (error) {
        next(error)
    }
}

// To get single Order by it's id
export const getSingleOrder = async (req : Request,res : Response, next : NextFunction) => {

    try {
        const {id} = req.params
        let order;
        const key = `order-${id}`
        if(myCache.has(key)){
            order = JSON.parse(myCache.get(key) as string)
        }else{
            order = await await Order.findById(id).populate("user",'name')
            if(!order){
                return next(new ErrorHandler("Order not found with given Id",404))
            }
            myCache.set(key,JSON.stringify(order))
        }
        return res.status(200).json({
            success : true,
            order
        })
    } catch (error) {
        next(error)
    }
}

export const processOrder = async (req : Request<{id : string}>,res : Response, next : NextFunction) => {

    try {
        const  {id} = req.params
        
        const order = await Order.findById(id)

        if(!order){
            return next(new ErrorHandler("Order not Found with given Id",404))
        }
        switch(order.status){
            case "Processing":
                order.status = "Shipped"
                break;
            case "Shipped":
                order.status = "Delivered"
                break;
            default:
                order.status = "Delivered"
                break
        }
        await order.save()

        await invalidateCache({product : false,order : true, admin : true, userId : order.user,orderId : String(order._id)})

        return res.status(200).json({
            success : true,
            message : "Order Processed Successfully"
        })
    } catch (error) {
        next(error)
    }
}

export const deleteOrder = async (req : Request<{id : string}>,res : Response, next : NextFunction) => {

    try {
        const  {id} = req.params
        
        const order = await Order.findById(id)

        if(!order){
            return next(new ErrorHandler("Order not Found with given Id",404))
        }
        await order.deleteOne()
 
        await invalidateCache({product : false,order : true, admin : true, userId : order.user,orderId : String(order._id)})

        return res.status(200).json({
            success : true,
            message : "Order Deleted Successfully"
        })
    } catch (error) {
        next(error)
    }
}