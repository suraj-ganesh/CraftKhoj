import { pgTable, serial, text, numeric, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const Role = pgEnum("Role", ["BUYER", "ARTISAN", "ADMIN"]);
export const UserStatus = pgEnum("UserStatus", ["ACTIVE", "PENDING", "DEACTIVATED"]);
export const ApprovalStatus = pgEnum("ApprovalStatus", ["PENDING", "APPROVED", "REJECTED", "CHANGES_REQUESTED"]);
export const ProductStatus = pgEnum("ProductStatus", ["PENDING", "APPROVED", "REJECTED", "HIDDEN"]);
export const PaymentMethod = pgEnum("PaymentMethod", ["CASH_ON_DELIVERY", "SIMULATED"]);
export const PaymentStatus = pgEnum("PaymentStatus", ["PENDING", "PAID", "FAILED"]);
export const OrderStatus = pgEnum("OrderStatus", ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);
export const ReportStatus = pgEnum("ReportStatus", ["OPEN", "RESOLVED", "DISMISSED"]);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: Role("role").default("BUYER"),
  status: UserStatus("status").default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Artisan profiles
export const artisanProfiles = pgTable("artisan_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  craftSpecialty: text("craft_specialty"),
  bio: text("bio"),
  district: text("district"),
  workshopAddress: text("workshop_address"),
  yearsExperience: integer("years_experience").default(0),
  portraitUrl: text("portrait_url"),
  verificationStatus: ApprovalStatus("verification_status").default("PENDING"),
  verificationNote: text("verification_note"),
  trustScore: numeric("trust_score").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  artisanId: integer("artisan_id").notNull(),
  categoryId: integer("category_id"),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  status: ProductStatus("status").default("PENDING"),
  provenanceId: text("provenance_id"),
  origin: text("origin"),
  productionMethod: text("production_method"),
  productionDate: timestamp("production_date"),
  processImageUrl: text("process_image_url"),
  riskScore: integer("risk_score").default(0),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// Product images
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  imageUrl: text("image_url").notNull(),
  isPrimary: boolean("is_primary").default(false),
});

// Materials
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Product materials (junction table)
export const productMaterials = pgTable("product_materials", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  materialId: integer("material_id").notNull(),
  quantityOrQuantity: text("quantity"),
});

// Provenance records
export const provenanceRecords = pgTable("provenance_records", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().unique(),
  workshopLocation: text("workshop_location"),
  productionDate: timestamp("production_date"),
  productionMethod: text("production_method"),
  processNotes: text("process_notes"),
  processImageUrl: text("process_image_url"),
  verificationStatus: ApprovalStatus("verification_status").default("PENDING"),
  verificationNote: text("verification_note"),
  verifierId: integer("verifier_id"),
  verifiedAt: timestamp("verified_at"),
});

// Provenance events
export const provenanceEvents = pgTable("provenance_events", {
  id: serial("id").primaryKey(),
  provenanceRecordId: integer("provenance_record_id").notNull(),
  eventType: text("event_type").notNull(),
  description: text("description"),
  performedBy: integer("performed_by"),
  eventTime: timestamp("event_time").defaultNow(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").default(1),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: PaymentMethod("payment_method").default("CASH_ON_DELIVERY"),
  paymentStatus: PaymentStatus("payment_status").default("PENDING"),
  orderStatus: OrderStatus("order_status").default("PLACED"),
  shippingName: text("shipping_name"),
  shippingPhone: text("shipping_phone"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
});

// Reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  reporterId: integer("reporter_id").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: ReportStatus("status").default("OPEN"),
  adminRemarks: text("admin_remarks"),
  resolvedBy: integer("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verification logs
export const verificationLogs = pgTable("verification_logs", {
  id: serial("id").primaryKey(),
  decision: ApprovalStatus("approval_status").notNull(),
  remarks: text("remarks"),
  artisanProfileId: integer("artisan_profile_id"),
  provenanceRecordId: integer("provenance_record_id"),
  createdAt: timestamp("created_at").defaultNow(),
});