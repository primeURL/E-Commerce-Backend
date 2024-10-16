import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import NodeCache from "node-cache";
import Stripe from "stripe";
import { errorMiddleWare, routeNotFoundMiddleware } from "./middlewares/Error.js";
import { connectDB } from "./utils/featues.js";
const app = express();

config({
    path : "./.env"
})
process.on('uncaughtException',(err)=>{
    if(err){
      console.log(err.message)
      process.exit(1)
    }
})

const port = process.env.PORT || 4000
const stripeKey = process.env.STRIPE_KEY || "";
const clientURL = process.env.CLIENT_URL || "";
export const stripe = new Stripe(stripeKey);

// Importing Routes
import orderRoutes from './routes/Order.js';
import paymentRoutes from './routes/Payment.js';
import productRoutes from "./routes/Products.js";
import dashboardRoutes from './routes/Statistics.js';
import userRoutes from "./routes/User.js";

connectDB(process.env.MONGO_URI as string);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


export const myCache = new NodeCache()

app.use(express.json());
app.use(morgan("dev"))
app.use(cors({
  origin : '*',  // All request origin are allowed
  methods : ['GET','POST','PUT','DELETE'],   // Methods are allowed
  // credentials : true // Means headers are allowed
}))
app.use((req, res, next) => {
  // res.header('Access-Control-Allow-Origin', 'http://frontend.com'); // Allow the frontend domain
  res.header('Access-Control-Allow-Credentials', 'true'); // Allow credentials
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.get("/", (req, res) => {
  res.send("API is working, deployed on Render");
});



// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);



app.use('/uploads',express.static('uploads'))

// Middle for Handling Error
app.use(errorMiddleWare);

// Global Route Handlers 
app.use(routeNotFoundMiddleware)

app.listen(port, () => {
  console.log(`Express is working on http://localhost:${port}`);
});
