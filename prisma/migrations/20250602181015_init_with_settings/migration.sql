-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Bella Pizza',
    "slogan" TEXT DEFAULT 'Les meilleures pizzas de la ville',
    "logo" TEXT,
    "phone" TEXT NOT NULL DEFAULT '01 23 45 67 89',
    "email" TEXT NOT NULL DEFAULT 'contact@bellapizza.fr',
    "address" TEXT NOT NULL DEFAULT '123 Rue de la Pizza, 75001 Paris',
    "openingHours" JSONB,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "closedMessage" TEXT DEFAULT 'Nous sommes actuellement fermés',
    "clickAndCollectEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryZone" JSONB,
    "deliveryFee" REAL NOT NULL DEFAULT 3.50,
    "freeDeliveryThreshold" REAL DEFAULT 25.00,
    "minOrderAmount" REAL NOT NULL DEFAULT 15.00,
    "deliveryTime" TEXT NOT NULL DEFAULT '30-45 min',
    "preparationTime" TEXT NOT NULL DEFAULT '15-20 min',
    "pickupInstructions" TEXT DEFAULT 'Présentez-vous à l''accueil avec votre numéro de commande',
    "cashEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "onlinePaymentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cashMaxAmount" REAL DEFAULT 50.00,
    "ticketsRestaurantEnabled" BOOLEAN NOT NULL DEFAULT true,
    "checkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "websiteUrl" TEXT,
    "welcomeMessage" TEXT DEFAULT 'Bienvenue chez Bella Pizza !',
    "specialAnnouncement" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#EA580C',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FED7AA',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "headerImage" TEXT,
    "adminEmail" TEXT NOT NULL DEFAULT 'admin@bellapizza.fr',
    "orderNotificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "categoryId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "ingredients" TEXT,
    "allergens" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "deliveryMethod" TEXT NOT NULL,
    "pickupTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "stripePaymentId" TEXT,
    "subTotal" REAL NOT NULL,
    "deliveryFee" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "DailyStats"("date");
