import { faker } from "@faker-js/faker";
import { NextFunction, Request, Response } from "express";
import { myCache } from "../app.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { deleteFromCloudinary, findAverageRatings, invalidateCache, uploadToCloudinary } from "../utils/featues.js";
import ErrorHandler from "../utils/utility-class.js";

export const newProduct = async(req : Request<{},{},NewProductRequestBody>,res : Response, next : NextFunction) => {
    try {
        
        const { name, price, stock, category, description } = req.body;
        const photos = req.files as Express.Multer.File[] | undefined;
        console.log(req.body,photos)
        if (!photos) return next(new ErrorHandler("Please add Photo", 400));
    
        if (photos.length < 1)
          return next(new ErrorHandler("Please add atleast one Photo", 400));
    
        if (photos.length > 5)
          return next(new ErrorHandler("You can only upload 5 Photos", 400));
    
        if (!name || !price || !stock || !category || !description)
          return next(new ErrorHandler("Please enter All Fields", 400));
    
        // Upload Here
    
        const photosURL = await uploadToCloudinary(photos);
    
        await Product.create({
          name,
          price,
          description,
          stock,
          category: category.toLowerCase(),
          photos: photosURL,
        });
    
        await invalidateCache({ product: true, admin: true });
    
        return res.status(201).json({
          success: true,
          message: "Product Created Successfully",
        });
    
    } catch (error) {
        next(error)
    }
}

// Revalidate on New, Update, Delete Product and on New Order
export const getLatestProducts = async(req : Request,res : Response, next : NextFunction) => {
    try {
        let products = []
        if(myCache.has('latest-product')){
            products = JSON.parse(myCache.get('latest-product') as string)
        }else{
            products =  await Product.find({}).sort({createdAt : -1}).limit(5);
            myCache.set("latest-product",JSON.stringify(products))
        }

        return res.status(200).json({
            success : true,
            products
        })
    } catch (error) {
        next(error)
    }
}


// Revalidate on New, Update, Delete Product and on New Order
export const getAllCategories = async(req : Request,res : Response, next : NextFunction) => {
    try {
        let categories;
        if(myCache.has('categories')){
            categories = JSON.parse(myCache.get('categories') as string)
        }else{
            categories = await Product.distinct("category")
            myCache.set('categories',JSON.stringify(categories))
        }
       
        return res.status(200).json({
            success : true,
            categories
        })
    } catch (error) {
        next(error)
    }
}

export const getAdminProducts = async(req : Request,res : Response, next : NextFunction) => {
    try {
        let products;
        if(myCache.has('all-products')){
            products = JSON.parse(myCache.get('all-products') as string)
        }else{
            products = await Product.find({})
            myCache.set('all-products',JSON.stringify(products))
        }
    
        return res.status(200).json({
            success : true,
            products
        })
    } catch (error) {
        next(error)
    }
}


export const getSingleProduct = async(req : Request,res : Response, next : NextFunction) => {
    try {
        const id = req.params.id
        let product;
        if(myCache.has(`product-${id}`)){
            product = JSON.parse(myCache.get(`product-${id}`) as string)
        }else{
            product = await Product.findById(id)
            if(!product){
                return next(new ErrorHandler("Product Not Found",404))
            }
            myCache.set(`product-${id}`,JSON.stringify(product))
        }
       
        return res.status(200).json({
            success : true,
            product
        })
    } catch (error) {
        next(error)
    }
}

export const updateProduct = async(req : Request<{id:string},{},NewProductRequestBody>,res : Response, next : NextFunction) => {
    try {
        const { id } = req.params;
        const { name, price, stock, category, description } = req.body;
        const photos = req.files as Express.Multer.File[] | undefined;
      
        const product = await Product.findById(id);
      
        if (!product) return next(new ErrorHandler("Product Not Found", 404));
      
        if (photos && photos.length > 0) {
          const photosURL = await uploadToCloudinary(photos);
      
          const ids = product.photos.map((photo) => photo.public_id);
      
          await deleteFromCloudinary(ids);
      
        //   product.photos = photosURL
        }
      
        if (name) product.name = name;
        if (price) product.price = price;
        if (stock) product.stock = stock;
        if (category) product.category = category;
        if (description) product.description = description;
      
        await product.save();
      
        await invalidateCache({
          product: true,
          productId: String(product._id),
          admin: true,
        });
      
        return res.status(200).json({
          success: true,
          message: "Product Updated Successfully",
        });
      
    } catch (error) {
        next(error)
    }
}

export const deleteProduct = async(req : Request<{id:string},{},NewProductRequestBody>,res : Response, next : NextFunction) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return next(new ErrorHandler("Product Not Found", 404));
      
        const ids = product.photos.map((photo) => photo.public_id);
      
        await deleteFromCloudinary(ids);
      
        await product.deleteOne();
      
        await invalidateCache({
          product: true,
          productId: String(product._id),
          admin: true,
        });
      
        return res.status(200).json({
          success: true,
          message: "Product Deleted Successfully",
        });
    } catch (error) {
        next(error)
    }
}

export const getAllProducts = async(req : Request<{},{},{},SearchRequestQuery>,res : Response, next : NextFunction) => {
    try {
        const {search,sort,price,category}  = req.query
        const page = Number(req.query.page) || 1

        const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
        const skip = limit * (page - 1);

        const BaseQuery : BaseQuery = {}
        if(search){
            BaseQuery.name = {
                $regex : search,
                $options : "i"
            }
        }
        if(price){
            BaseQuery.price =   {
                $lte : Number(price)
            }
        }
        if(category){
            BaseQuery.category = category
        }

        const [products,filteredOnlyProduct] = await Promise.all([Product.find(BaseQuery).sort(
            sort && {price : sort === 'asc' ? 1 : -1}
        ).limit(limit).skip(skip),Product.find(BaseQuery)])

        const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

        return res.status(200).json({
            success : true,
            totalPage,  
            products,
        })
    } catch (error) {
        next(error)
    }
}

export const allReviewsOfProduct = async(req : Request,res : Response, next : NextFunction) => {
    try {
        let reviews;
        const key = `reviews-${req.params.id}`;
        if (myCache.has(key)){
            reviews = JSON.parse(myCache.get(key) as string)
        } 
        else {
            reviews = await Review.find({
            product: req.params.id,
            })
            .populate("user", "name photo")
            .sort({ updatedAt: -1 });
            myCache.set(key,JSON.stringify(reviews))
        }

        return res.status(200).json({
            success: true,
            reviews,
        });
    } catch (error) {
        next(error)
    }
}

export const newReview = async(req : Request,res : Response, next : NextFunction) => {
    try {
        const user = await User.findById(req.query.id);

        if (!user) return next(new ErrorHandler("Not Logged In", 404));

        const product = await Product.findById(req.params.id);
        if (!product) return next(new ErrorHandler("Product Not Found", 404));

        const { comment, rating } = req.body;

        const alreadyReviewed = await Review.findOne({
            user: user._id,
            product: product._id,
        });

        if (alreadyReviewed) {
            alreadyReviewed.comment = comment;
            alreadyReviewed.rating = rating;

            await alreadyReviewed.save();
        } else {
            await Review.create({
            comment,
            rating,
            user: user._id,
            product: product._id,
            });
        }

        const { ratings, numOfReviews } = await findAverageRatings(product._id);

        product.ratings = ratings;
        product.numOfReviews = numOfReviews;

        await product.save();

        await invalidateCache({
            product: true,
            productId: String(product._id),
            admin: true,
            review: true,
        });

        return res.status(alreadyReviewed ? 200 : 201).json({
            success: true,
            message: alreadyReviewed ? "Review Update" : "Review Added",
        });
    } catch (error) {
        next(error)
    }
}

export const deleteReview = async(req : Request,res : Response, next : NextFunction) => {
    try {
        const user = await User.findById(req.query.id);

        if (!user) return next(new ErrorHandler("Not Logged In", 404));

        const review = await Review.findById(req.params.id);
        if (!review) return next(new ErrorHandler("Review Not Found", 404));

        const isAuthenticUser = review.user.toString() === user._id.toString();

        if (!isAuthenticUser) return next(new ErrorHandler("Not Authorized", 401));

        await review.deleteOne();

        const product = await Product.findById(review.product);

        if (!product) return next(new ErrorHandler("Product Not Found", 404));

        const { ratings, numOfReviews } = await findAverageRatings(product._id);

        product.ratings = ratings;
        product.numOfReviews = numOfReviews;

        await product.save();

        await invalidateCache({
            product: true,
            productId: String(product._id),
            admin: true,
        });

        return res.status(200).json({
            success: true,
            message: "Review Deleted",
        });
    } catch (error) {
        next(error)
    }
}
const generateRandomProducts = async (count: number = 10) => {
  const products = [];

  for (let i = 0; i < count; i++) {
    const product = {
      name: faker.commerce.productName(),
      photo: "uploads/37cfc24f-abf2-422b-b4e3-7e1d4cf1b422.jpg",
      price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
      stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
      category: faker.commerce.department(),
      createdAt: new Date(faker.date.past()),
      updatedAt: new Date(faker.date.recent()),
      __v: 0,
    };

    products.push(product);
  }

  await Product.create(products);

  console.log({ succecss: true });
};

// generateRandomProducts(40)