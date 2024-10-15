
import { Request, Response, NextFunction } from "express"
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleWare = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
    err.message = err.message || "Internal Server Error"
    err.statusCode = err.statusCode || 500

    if(err.name === "CastError") err.message = "Invalid Id"
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  export const routeNotFoundMiddleware =  (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
      success : false,
      message : 'Route not found'
    })
  }

  // This is wrapper for TryCatch block we will build later
  export const TryCatch = (func : ControllerType) => () => {

  }