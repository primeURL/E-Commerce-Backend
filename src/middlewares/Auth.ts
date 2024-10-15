import { NextFunction,Request,Response } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { User } from "../models/User.js";

// Middleware to make sure only admin is allowed
export const adminOnly = async(req : Request,res : Response,next:NextFunction) => {
    try {
        const {id} = req.query
        if(!id){
            return next(new ErrorHandler("Saale Login Kar Phle",401))
        }
        const user = await User.findById(id)
        if(!user){
            return next(new ErrorHandler("Saale Fake Id Deta Hai",401))
        }
        if(user.role !== 'admin'){
            return next(new ErrorHandler("Saale Auukat Nhi Hai Teri",403))
        }
        next()
    } catch (error) {
        next(error)
    }
}