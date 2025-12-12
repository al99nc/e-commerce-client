import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import cookieParser from "cookie-parser";
import * as z from "zod";
import { ref } from "process";
import { log } from "console";
const prisma = new PrismaClient();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: true, // Allow your frontend origin
    credentials: true, // Important for cookies
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

// Setup multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// More secure version with some basic protections
app.use(
  "/uploads",
  (req, res, next) => {
    // Prevent directory traversal
    if (req.url.includes("..")) {
      return res.status(403).send("Forbidden");
    }
    next();
  },
  express.static("uploads")
);

//slugggg generater
const generateUserSlug = (name) => {
  //from the internet
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove weird characters (like #$%!@)
    .replace(/\s+/g, "-"); // replace spaces with dashes
};

app.get("/", async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

app.get("/products", async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    console.log(product);
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.REFRESH_SECRET,
    { expiresIn: "30d" } // Long-lived refresh token
  );
  return { accessToken, refreshToken };
}

// Signup Endpoint - FIXED with refresh token
app.post("/signup", async (req, res) => {
  try {
    // Validation schema
    const schema = z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
      phone: z.string().min(10, "Phone number must be at least 10 digits"),
    });
    // Validate the data
    const validationResult = schema.safeParse(req.body);
    console.log(req.body, " fasfasfsa  ");

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }
    console.log(validationResult, "validationResult");

    const { email, password, name, phone } = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.users.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = generateUserSlug(name);

    const newUser = await prisma.users.create({
      data: {
        slug,
        email,
        phone,
        name,
        password: hashedPassword,
        role: "CUSTOMER",
        locale: "en",
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          name
        )}`,
      },
    });

    // Create both access and refresh tokens
    const tokens = generateTokens(newUser);
    // Set refresh token as httpOnly cookie
    res
      .cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true only in prod with HTTPS
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          avatar: newUser.avatar,
        },
        token: tokens.accessToken, // <-- frontend uses this for API calls
      });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Login Endpoint - FIXED with refresh token
app.post("/login", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    });
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }
    const { email, password } = validationResult.data;

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (passwordValid) {
      // Create both access and refresh tokens
      const tokens = generateTokens(user);
      // Set refresh token as httpOnly cookie
      res
        .cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // true only in prod with HTTPS
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .status(200)
        .json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          },
          token: tokens.accessToken, // <-- frontend uses this for API calls
        });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add decoded payload (userId, email, role, etc.)
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

app.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized - No refresh token" });
  }

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({ accessToken: newAccessToken });
  });
});

// PATCH route to upgrade user to seller AND create seller profile
app.patch("/become-seller", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Get from verified token

    const schema = z.object({
      business_name: z
        .string()
        .min(2, "Business name must be at least 2 characters")
        .max(100, "Business name is too long"),

      business_type: z.string().optional(),

      tax_id: z.string().optional(),

      business_address: z.string().optional(),

      business_phone: z
        .string()
        .optional()
        .refine(
          (val) => !val || val.length >= 10,
          "Phone number must be at least 10 digits"
        ),

      business_email: z
        .string()
        .optional()
        .refine(
          (val) => !val || val.includes("@"),
          "Please enter a valid email"
        ),
    });
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }
    const {
      business_name,
      business_type,
      tax_id,
      business_address,
      business_phone,
      business_email,
    } = validationResult.data; //work here

    // Validate required fields
    if (!business_name) {
      return res.status(400).json({ error: "Business name is required" });
    }

    // Check if user exists and is currently a customer
    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existingUser.role !== "CUSTOMER") {
      return res.status(400).json({
        error: "User is already a seller or has invalid role",
      });
    }

    // Check if seller profile already exists
    const existingProfile = await prisma.sellerProfile.findUnique({
      where: { user_id: userId },
    });

    if (existingProfile) {
      return res.status(400).json({ error: "Seller profile already exists" });
    }

    // Use Prisma transaction to do both operations atomically
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Update user role to SELLER
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          role: "SELLER",
        },
      });

      // 2. Create seller profile
      const newSellerProfile = await prisma.sellerProfile.create({
        data: {
          user_id: userId,
          business_name,
          business_type,
          tax_id,
          business_address,
          business_phone,
          business_email,
          commission_rate: 0.05, // 5% default
          status: "PENDING", // Needs approval
          total_sales: 0,
          total_orders: 0,
          rating_count: 0,
        },
      });

      return { updatedUser, newSellerProfile };
    });

    // Generate new token with updated role
    const newToken = jwt.sign(
      {
        userId: result.updatedUser.id,
        email: result.updatedUser.email,
        role: result.updatedUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      success: true,
      message:
        "Successfully applied to become a seller! Your application is pending approval.",
      user: {
        //this user will be send to forntend to give new info abt the user
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        name: result.updatedUser.name,
        role: result.updatedUser.role,
        avatar: result.updatedUser.avatar,
      },
      sellerProfile: {
        //this for the forntend to use the new "sellerprofile" info to make some goodes
        id: result.newSellerProfile.id,
        business_name: result.newSellerProfile.business_name,
        status: result.newSellerProfile.status,
        commission_rate: result.newSellerProfile.commission_rate,
      },
      token: newToken, //changing the token so the brawser know that the user is a seller now
    });
  } catch (error) {
    console.error("Become seller error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

//middleware to check if the user is a seller role...
const requireSeller = (req, res, next) => {
  if (req.user.role !== "SELLER") {
    return res.status(403).json({ error: "Seller access required" });
  }
  next();
};

// ============= SELLER DASHBOARD ROUTES =============

// GET: Seller Dashboard Overview
app.get("/seller-dashboard", verifyToken, requireSeller, async (req, res) => {
  try {
    const sellerId = req.user.userId;

    // Get seller profile with stats
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { user_id: sellerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!sellerProfile) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    // plus thing to see the totle sellers products
    const productCount = await prisma.product.count({
      where: { seller_id: sellerId },
    });
    const products = await prisma.product.findMany({
      where: { seller_id: sellerId },
      orderBy: { created_at: "desc" },
      take: 10, // just latest 10 for example
    });

    // Get recent orders
    const recentOrders = await prisma.orderLine.findMany({
      where: {
        product: {
          seller_id: sellerId,
        },
      },
      include: {
        product: {
          select: {
            title: true,
            picture: true,
            price: true,
          },
        },
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: {
          created_at: "desc",
        },
      },
      take: 10,
    });

    const dashboardData = {
      seller: sellerProfile,
      stats: {
        totalProducts: productCount,
        totalSales: sellerProfile.total_sales,
        totalOrders: sellerProfile.total_orders,
        rating: sellerProfile.rating,
        ratingCount: sellerProfile.rating_count,
      },
      recentOrders,
      products,
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post(
  "/add-product",
  verifyToken,
  requireSeller,
  upload.single("picture"),
  async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({
          error:
            "Request body is missing. Make sure you're sending form data properly.",
        });
      }

      // Parse numeric fields from string to numbers before validation
      const parsedBody = {
        ...req.body,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        discount_value: req.body.discount_value
          ? parseFloat(req.body.discount_value)
          : 0,
        stock_quantity: req.body.stock_quantity
          ? parseInt(req.body.stock_quantity)
          : undefined,
        tags: req.body.tags
          ? typeof req.body.tags === "string"
            ? req.body.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)
            : Array.isArray(req.body.tags)
              ? req.body.tags
              : []
          : [],
        discount_type: req.body.discount_type || "none",
      };

      const productSchema = z
        .object({
          title: z
            .string()
            .min(3, "Title must be at least 3 characters")
            .max(200, "Title too long")
            .trim(),

          summary: z.string().max(500, "Summary too long").trim().optional(),

          description: z
            .string()
            .min(10, "Description must be at least 10 characters")
            .max(2000, "Description too long")
            .trim(),

          price: z
            .number({ invalid_type_error: "Price must be a number" })
            .positive("Price must be greater than 0"),

          discount_type: z
            .enum(["percentage", "fixed", "none"])
            .default("none"),

          discount_value: z
            .number({ invalid_type_error: "Discount value must be a number" })
            .min(0, "Discount cannot be negative")
            .default(0),

          tags: z.array(z.string().min(1)).default([]),

          stock_quantity: z
            .number({ invalid_type_error: "Stock quantity must be a number" })
            .int("Stock must be whole number")
            .min(0, "Stock cannot be negative"),
        })
        .refine(
          (data) => {
            // Business rule: if discount_type is percentage, discount_value should be <= 100
            if (
              data.discount_type === "percentage" &&
              data.discount_value > 100
            ) {
              return false;
            }
            // Business rule: if discount_type is fixed, discount_value should be less than price
            if (
              data.discount_type === "fixed" &&
              data.discount_value >= data.price
            ) {
              return false;
            }
            return true;
          },
          {
            message:
              "Invalid discount: percentage cannot exceed 100% or fixed discount cannot be greater than or equal to price",
            path: ["discount_value"],
          }
        );

      const validationResult = productSchema.safeParse(parsedBody);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            received: err.received,
          })),
        });
      }

      const {
        title,
        summary,
        description,
        price,
        discount_type,
        discount_value,
        tags,
        stock_quantity,
      } = validationResult.data;

      // Get or create default category
      let defaultCategory = await prisma.category.findFirst({
        where: { slug: "uncategorized" },
      });

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            slug: "uncategorized",
            name: "Uncategorized",
            description: "Default category for uncategorized products",
            tags: ["default"],
          },
        });
      }

      const picture = req.file ? `/uploads/${req.file.filename}` : "";

      const newProduct = await prisma.product.create({
        data: {
          seller_id: req.user.userId,
          category_id: defaultCategory.id,
          title,
          summary: summary || "",
          description,
          price: price,
          discount_type: discount_type,
          discount_value: discount_value,
          tags: tags,
          stock_quantity: stock_quantity,
          picture,
        },
      });

      res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
      console.error("Add product error:", error);

      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ error: "Product with this title already exists" });
      }

      if (error.code === "P2003") {
        return res
          .status(400)
          .json({ error: "Invalid category_id or seller_id" });
      }

      res
        .status(500)
        .json({ error: "Something went wrong while creating the product" });
    }
  }
);

app.patch(
  "/edit-product/:id",
  verifyToken,
  requireSeller,
  upload.single("picture"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // First check if product exists and belongs to the seller
      const existingProduct = await prisma.product.findFirst({
        where: {
          id: id,
          seller_id: req.user.userId,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({
          error: "Product not found or you don't have permission to edit it",
        });
      }

      if (!req.body) {
        return res.status(400).json({
          error:
            "Request body is missing. Make sure you're sending form data properly.",
        });
      }

      // Parse numeric fields from string to numbers before validation
      const parsedBody = {
        ...req.body,
        price: req.body.price
          ? parseFloat(req.body.price)
          : existingProduct.price,
        discount_value: req.body.discount_value
          ? parseFloat(req.body.discount_value)
          : existingProduct.discount_value,
        stock_quantity: req.body.stock_quantity
          ? parseInt(req.body.stock_quantity)
          : existingProduct.stock_quantity,
        tags: req.body.tags
          ? typeof req.body.tags === "string"
            ? req.body.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)
            : Array.isArray(req.body.tags)
              ? req.body.tags
              : existingProduct.tags
          : existingProduct.tags,
        discount_type: req.body.discount_type || existingProduct.discount_type,
      };

      const productSchema = z
        .object({
          title: z
            .string()
            .min(3, "Title must be at least 3 characters")
            .max(200, "Title too long")
            .trim(),

          summary: z.string().max(500, "Summary too long").trim().optional(),

          description: z
            .string()
            .min(10, "Description must be at least 10 characters")
            .max(2000, "Description too long")
            .trim(),

          price: z
            .number({ invalid_type_error: "Price must be a number" })
            .positive("Price must be greater than 0"),

          discount_type: z
            .enum(["percentage", "fixed", "none"])
            .default("none"),

          discount_value: z
            .number({ invalid_type_error: "Discount value must be a number" })
            .min(0, "Discount cannot be negative")
            .default(0),

          tags: z.array(z.string().min(1)).default([]),

          stock_quantity: z
            .number({ invalid_type_error: "Stock quantity must be a number" })
            .int("Stock must be whole number")
            .min(0, "Stock cannot be negative"),
        })
        .refine(
          (data) => {
            if (
              data.discount_type === "percentage" &&
              data.discount_value > 100
            ) {
              return false;
            }
            if (
              data.discount_type === "fixed" &&
              data.discount_value >= data.price
            ) {
              return false;
            }
            return true;
          },
          {
            message:
              "Invalid discount: percentage cannot exceed 100% or fixed discount cannot be greater than or equal to price",
            path: ["discount_value"],
          }
        );

      const validationResult = productSchema.safeParse(parsedBody);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            received: err.received,
          })),
        });
      }

      const {
        title,
        summary,
        description,
        price,
        discount_type,
        discount_value,
        tags,
        stock_quantity,
      } = validationResult.data;

      // Handle picture update (only if new picture uploaded)
      const updateData = {
        title,
        summary: summary || "",
        description,
        price: price,
        discount_type: discount_type,
        discount_value: discount_value,
        tags: tags,
        stock_quantity: stock_quantity,
      };

      // Only update picture if a new one was uploaded
      if (req.file) {
        updateData.picture = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await prisma.product.update({
        where: { id: id },
        data: updateData,
      });

      res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) {
      console.error("Edit product error:", error);

      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ error: "Product with this title already exists" });
      }

      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }

      res
        .status(500)
        .json({ error: "Something went wrong while updating the product" });
    }
  }
);



app.delete(
  "/delete-product/:id",
  verifyToken,
  requireSeller,
  async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.product.delete({
        where: { id },
      });
      res.status(200).json({ message: "Product deleted successfully!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);

// FIXED VERSION: Enhanced middleware that tries to refresh token if access token is invalid
const getOptionalUserWithRefresh = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const refreshToken = req.cookies.refreshToken; // ✅ Uncommented this line
    console.log("Access Token:", accessToken, "Refresh Token:", refreshToken);

    // Try access token first
    if (accessToken) {
      try {
        req.user = jwt.verify(accessToken, process.env.JWT_SECRET);
        console.log("User from access token:", req.user);
        return next();
      } catch (error) {
        console.log("Access token expired, attempting refresh...");
      }
    }

    // Try refresh token
    if (refreshToken) {
      try {
        // Use consistent env variable name
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        const newAccessToken = jwt.sign(
          { userId: decoded.userId, email: decoded.email, role: decoded.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        res.setHeader("X-New-Access-Token", newAccessToken);
        req.user = decoded;
        req.tokenRefreshed = true;
        return next();
      } catch (refreshError) {
        console.log("Refresh token invalid:", refreshError.message);
        req.user = null;
      }
    } else {
      req.user = null;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    req.user = null;
  }

  next();
};
app.post(
  "/add-to-cart/:id", // id = product_id
  getOptionalUserWithRefresh,
  async (req, res) => {
    const user_id = req.user?.userId;
    const product_id = req.params.id;
    const { quantity = 1 } = req.body; // Default to 1 if not provided

    try {
      // Input validation
      if (!user_id) {
        // Changed error message for clarity
        return res.status(401).json({
          success: false,
          error: "Authentication required. Please log in to add items to cart.",
        });
      }
      if (!product_id) {
        return res.status(400).json({
          success: false,
          error: "Product ID is missing from the request.",
        });
      }
      // Ensure quantity is a number and within a reasonable range
      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 100) {
        return res.status(400).json({
          success: false,
          error: "Quantity must be a number between 1 and 100.",
        });
      }

      // Use a Prisma transaction to ensure atomicity and prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // 1. Check if product exists and get its current price and stock
        const product = await tx.product.findUnique({
          where: { id: product_id },
          select: {
            id: true,
            price: true,
            stock_quantity: true,
            title: true,
            discount_type: true,
            discount_value: true,
            status: true, // Also check product status
          },
        });

        if (!product) {
          throw new Error("Product not found."); // Throw error for transaction rollback
        }

        // Check product status before adding to cart
        if (product.status !== "ACTIVE") {
          throw new Error(
            `Product "${product.title}" is not available for purchase (Status: ${product.status}).`
          );
        }

        // 2. Calculate the actual price (including discounts)
        let actualPrice = product.price;
        if (product.discount_type === "percent" && product.discount_value > 0) {
          actualPrice = product.price * (1 - product.discount_value / 100);
        } else if (
          product.discount_type === "amount" &&
          product.discount_value > 0
        ) {
          actualPrice = product.price - product.discount_value;
        }
        // Ensure price doesn't go below zero
        actualPrice = Math.max(0, actualPrice);

        // 3. Find or create active cart for user
        let cart = await tx.cart.findFirst({
          where: {
            created_by: user_id,
          },
        });

        // If cart exists but status is not ACTIVE, update it to ACTIVE
        if (cart && cart.status !== "ACTIVE") {
          cart = await tx.cart.update({
            where: { id: cart.id },
            data: { status: "ACTIVE" },
          });
        }

        // If no cart exists, create one
        if (!cart) {
          cart = await tx.cart.create({
            data: {
              created_by: user_id,
              status: "ACTIVE",
            },
          });
        }

        let cartItem;
        let message;

        // 4. Try to find an existing cart item for this product in this cart
        const existingItem = await tx.cartItem.findFirst({
          where: {
            cart_id: cart.id,
            product_id: product_id,
          },
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + parsedQuantity;

          // Check if new quantity exceeds stock
          if (newQuantity > product.stock_quantity) {
            throw new Error(
              `Cannot add ${parsedQuantity} items. Adding this would exceed available stock. Current in cart: ${existingItem.quantity}, Available: ${product.stock_quantity}.`
            );
          }

          // Update existing cart item
          cartItem = await tx.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newQuantity,
              price: actualPrice, // Update price in case it changed
            },
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  picture: true,
                  stock_quantity: true,
                },
              },
            },
          });
          message = `Cart updated! Quantity increased to ${newQuantity}.`;
        } else {
          // Check if initial quantity exceeds stock for a new item
          if (parsedQuantity > product.stock_quantity) {
            throw new Error(
              `Cannot add ${parsedQuantity} items. Only ${product.stock_quantity} available.`
            );
          }

          // Create new cart item
          cartItem = await tx.cartItem.create({
            data: {
              cart_id: cart.id,
              product_id: product_id,
              quantity: parsedQuantity,
              price: actualPrice,
            },
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  picture: true,
                  stock_quantity: true,
                },
              },
            },
          });
          message = "Product added to cart successfully.";
        }

        // 5. Get updated cart summary (after item addition/update)
        const cartSummary = await tx.cart.findUnique({
          where: { id: cart.id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    title: true,
                    picture: true,
                  },
                },
              },
            },
            _count: {
              select: { items: true },
            },
          },
        });

        // Calculate cart totals
        const totalItems = cartSummary.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const totalPrice = cartSummary.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          cartItem,
          cartSummary: {
            id: cart.id,
            totalItems,
            totalPrice: parseFloat(totalPrice.toFixed(2)),
            itemCount: cartSummary._count.items,
          },
          message,
          status: existingItem ? 200 : 201, // Return appropriate status code
        };
      });

      // Send success response
      return res.status(result.status).json({
        success: true,
        message: result.message,
        data: {
          cartItem: result.cartItem,
          cartSummary: result.cartSummary,
        },
      });
    } catch (err) {
      console.error("Error adding to cart:", err.message); // Log the specific error message

      // Handle specific errors for better client feedback
      if (err.message.includes("Product not found")) {
        return res.status(404).json({ success: false, error: err.message });
      }
      if (err.message.includes("Insufficient stock")) {
        return res.status(400).json({ success: false, error: err.message });
      }
      if (err.message.includes("not available for purchase")) {
        return res.status(400).json({ success: false, error: err.message });
      }
      // For the unique constraint error (P2002), it should now be handled by the transaction's rollback
      // if it somehow still occurs due to a race condition *before* the unique constraint is applied,
      // but with the unique constraint and transaction, this specific error code should be less frequent.

      return res.status(500).json({
        success: false,
        error: "Failed to add product to cart. Please try again.",
      });
    }
  }
);
// GET /cart
app.get("/cart", getOptionalUserWithRefresh, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Step 1: Find the user's cart
    const cart = await prisma.cart.findFirst({
      where: {
        created_by: user.userId,
      },
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Step 2: Get the cart items + product info
    const cartItems = await prisma.cartItem.findMany({
      //this is the most imp. thing
      where: {
        cart_id: cart.id,
      },
      include: {
        product: true, // Include full product info
      },
    });
    return res.json({ items: cartItems });
  } catch (err) {
    console.error("Error fetching cart items:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

app.delete("/cart-item/:id", async (req, res) => {
  const itemId = req.params.id;
  try {
    await prisma.cartItem.delete({
      where: { id: itemId },
    });
    res.json({ message: "Item deleted!" });
  } catch (err) {
    res.status(500).json({ error: "Couldn't delete item" });
  }
});

app.post("/checkout", getOptionalUserWithRefresh, async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User must be logged in to checkout",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the user's active cart with all items
      const activeCart = await tx.cart.findFirst({
        where: {
          created_by: userId,
          status: "ACTIVE",
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  stock_quantity: true,
                  status: true,
                  discount_type: true,
                  discount_value: true,
                },
              },
            },
          },
        },
      });

      if (!activeCart) {
        throw new Error("No active cart found for this user.");
      }

      if (activeCart.items.length === 0) {
        throw new Error("Cart is empty.");
      }

      // 2. Validate each cart item and prepare for order creation
      const orderItems = [];
      let totalOrderAmount = 0;

      for (const cartItem of activeCart.items) {
        const product = cartItem.product;

        // Check product status
        if (product.status !== "ACTIVE") {
          throw new Error(
            `Product "${product.title}" is not available for purchase (Status: ${product.status}).`
          );
        }

        // Check stock availability
        if (product.stock_quantity < cartItem.quantity) {
          throw new Error(
            `Insufficient stock for "${product.title}". Only ${product.stock_quantity} available, but ${cartItem.quantity} requested.`
          );
        }

        // Calculate current price (in case prices changed since adding to cart)
        let currentPrice = product.price;
        if (product.discount_type === "percent" && product.discount_value > 0) {
          currentPrice = product.price * (1 - product.discount_value / 100);
        } else if (
          product.discount_type === "amount" &&
          product.discount_value > 0
        ) {
          currentPrice = product.price - product.discount_value;
        }
        currentPrice = Math.max(0, currentPrice);

        // Use the price from cart (when item was added) for consistency
        const itemTotal = cartItem.price * cartItem.quantity;
        totalOrderAmount += itemTotal;

        orderItems.push({
          product_id: product.id,
          quantity: cartItem.quantity,
          price: cartItem.price, // Use price from when item was added to cart
          itemTotal: itemTotal,
          newStockQuantity: product.stock_quantity - cartItem.quantity,
        });
      }

      // 3. Create the order
      const order = await tx.order.create({
        data: {
          user_id: userId,
        },
      });

      // 4. Create order lines and update product stock
      const orderLines = [];
      for (const orderItem of orderItems) {
        // Create order line
        const orderLine = await tx.orderLine.create({
          data: {
            order_id: order.id,
            product_id: orderItem.product_id,
            price: orderItem.price,
            quantity: orderItem.quantity,
          },
        });
        orderLines.push(orderLine);

        // Update product stock
        await tx.product.update({
          where: { id: orderItem.product_id },
          data: {
            stock_quantity: orderItem.newStockQuantity,
            status:
              orderItem.newStockQuantity === 0 ? "OUT_OF_STOCK" : undefined,
          },
        });
      }
      // Calculate and update seller statistics for each product's seller
      const sellerStats = new Map(); // Track seller updates

      for (const orderLine of orderLines) {
        // Get the product's seller info
        const product = await tx.product.findUnique({
          where: { id: orderLine.product_id },
          select: { seller_id: true },
        });

        if (!product.seller_id) continue;

        // Calculate line total
        const lineTotal = orderLine.price * orderLine.quantity;

        // Update seller statistics tracking
        if (!sellerStats.has(product.seller_id)) {
          sellerStats.set(product.seller_id, {
            total_sales: lineTotal,
            total_orders: 1,
          });
        } else {
          const stats = sellerStats.get(product.seller_id);
          stats.total_sales += lineTotal;
          stats.total_orders += 1;
        }
      }

      // Update seller profiles with new statistics
      for (const [sellerId, stats] of sellerStats) {
        await tx.sellerProfile.update({
          where: { user_id: sellerId },
          data: {
            total_sales: { increment: stats.total_sales },
            total_orders: { increment: stats.total_orders },
          },
        });
      }

      // 5. Clear the cart
      await tx.cartItem.deleteMany({
        where: {
          cart_id: activeCart.id,
        },
      });

      // 6. Update cart status
      await tx.cart.update({
        where: { id: activeCart.id },
        data: {
          status: "ORDERED",
        },
      });

      return {
        order: {
          ...order,
          total_amount: totalOrderAmount,
        },
        orderLines,
        itemCount: orderItems.length,
        totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully!",
      data: {
        orderId: result.order.id,
        totalAmount: result.order.total_amount,
        itemCount: result.itemCount,
        totalItems: result.totalItems,
        orderLines: result.orderLines,
      },
    });
  } catch (err) {
    console.error("Checkout error:", err.message);

    // Handle specific error types
    if (err.message.includes("No active cart")) {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }

    if (err.message.includes("Cart is empty")) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    if (
      err.message.includes("Insufficient stock") ||
      err.message.includes("not available")
    ) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Something went wrong during checkout. Please try again.",
    });
  }
});

app.get("/account", getOptionalUserWithRefresh, async (req, res) => {
  // Check if user is authenticated (either by access token or refresh token)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in to access your account.",
      code: "AUTH_REQUIRED",
    });
  }

  const { userId } = req.user;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "Invalid user data. Please sign in again.",
      code: "INVALID_USER_DATA",
    });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Include info about token refresh in response
    const response = {
      success: true,
      user,
    };

    // If token was refreshed, let frontend know
    if (req.tokenRefreshed) {
      response.tokenRefreshed = true;
      response.message = "Token refreshed automatically";
    }

    return res.json(response);
  } catch (error) {
    console.error("Account fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch account details",
      code: "SERVER_ERROR",
    });
  }
});

// Alternative: Separate refresh endpoint (recommended)
app.post("/auth/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: "No refresh token provided",
      code: "NO_REFRESH_TOKEN",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Set new refresh token in cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      accessToken: newAccessToken,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    // Clear invalid refresh token
    res.clearCookie("refreshToken");

    return res.status(401).json({
      success: false,
      error: "Invalid refresh token. Please sign in again.",
      code: "INVALID_REFRESH_TOKEN",
    });
  }
});
app.post("/logout", getOptionalUserWithRefresh, async (req, res) => {
  // Since JWT tokens are stateless, we just return success
  // The frontend should handle removing the token from storage
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
