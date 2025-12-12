// src/seeds/seed_improved.js
// Run: node src/seeds/seed_improved.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Product = require('../src/models/Product');
const User = require('../src/models/User');
const Review = require('../src/models/Review');
const { MONGODB_URI } = require('../src/config/env');

const PRODUCT_COUNT = 500;

// ---------- Improved Data Pools ----------
const brands = {
  luxury: ["Valentino", "Dior", "Chanel", "Gucci"],
  contemporary: ["Reformation", "Madewell", "Everlane", "COS"],
  affordable: ["Zara", "H&M", "Mango", "ASOS"],
  traditional: ["Fabindia", "Biba", "Sabyasachi", "Anita Dongre"]
};

// Product templates with proper categorization
const productTemplates = {
  dresses: {
    casual: [
      { name: "Floral Midi Dress", keywords: ["casual", "floral", "midi", "everyday", "brunch"], price: [40, 120] },
      { name: "Cotton Sundress", keywords: ["summer", "casual", "sundress", "beach", "vacation"], price: [35, 90] },
      { name: "Denim Shirt Dress", keywords: ["casual", "denim", "shirt dress", "weekend", "versatile"], price: [50, 110] },
      { name: "Wrap Dress", keywords: ["wrap", "casual", "flattering", "work", "versatile"], price: [55, 130] },
      { name: "T-shirt Dress", keywords: ["casual", "comfortable", "everyday", "relaxed", "simple"], price: [25, 65] }
    ],
    formal: [
      { name: "Evening Gown", keywords: ["formal", "evening", "gown", "elegant", "gala"], price: [200, 800] },
      { name: "Cocktail Dress", keywords: ["cocktail", "party", "formal", "evening", "celebration"], price: [120, 350] },
      { name: "Black Tie Dress", keywords: ["formal", "black tie", "elegant", "sophisticated"], price: [250, 900] }
    ],
    wedding: [
      { name: "Bridal Gown", keywords: ["wedding", "bridal", "bride", "white", "ceremony"], price: [800, 3000] },
      { name: "Wedding Guest Dress", keywords: ["wedding", "guest", "celebration", "elegant", "party"], price: [100, 300] },
      { name: "Bridesmaid Dress", keywords: ["bridesmaid", "wedding", "party", "celebration"], price: [120, 280] },
      { name: "Rehearsal Dinner Dress", keywords: ["wedding", "rehearsal", "dinner", "semi-formal"], price: [80, 200] }
    ],
    workwear: [
      { name: "Sheath Dress", keywords: ["work", "professional", "office", "business", "tailored"], price: [70, 180] },
      { name: "Blazer Dress", keywords: ["work", "professional", "power", "office", "structured"], price: [90, 220] },
      { name: "Pencil Dress", keywords: ["work", "professional", "office", "classic", "fitted"], price: [65, 160] }
    ]
  },
  tops: {
    casual: [
      { name: "Cotton T-Shirt", keywords: ["casual", "tshirt", "everyday", "basic", "comfortable"], price: [15, 45] },
      { name: "Henley Top", keywords: ["casual", "henley", "relaxed", "weekend"], price: [25, 60] },
      { name: "Tank Top", keywords: ["casual", "tank", "summer", "basic", "layering"], price: [12, 35] }
    ],
    dressy: [
      { name: "Silk Blouse", keywords: ["dressy", "silk", "elegant", "work", "sophisticated"], price: [80, 200] },
      { name: "Peplum Top", keywords: ["dressy", "peplum", "flattering", "work", "feminine"], price: [50, 120] },
      { name: "Satin Camisole", keywords: ["dressy", "satin", "elegant", "layering", "evening"], price: [40, 95] }
    ]
  },
  bottoms: {
    pants: [
      { name: "High-Waisted Jeans", keywords: ["jeans", "denim", "casual", "everyday", "versatile"], price: [60, 150] },
      { name: "Wide Leg Pants", keywords: ["pants", "wide leg", "comfortable", "trendy", "work"], price: [55, 140] },
      { name: "Tailored Trousers", keywords: ["trousers", "tailored", "work", "professional", "elegant"], price: [70, 180] }
    ],
    skirts: [
      { name: "Midi Skirt", keywords: ["skirt", "midi", "versatile", "feminine", "work"], price: [45, 110] },
      { name: "Pleated Skirt", keywords: ["skirt", "pleated", "feminine", "dressy", "elegant"], price: [50, 120] }
    ]
  },
  outerwear: {
    jackets: [
      { name: "Leather Jacket", keywords: ["jacket", "leather", "edgy", "casual", "cool"], price: [150, 500] },
      { name: "Denim Jacket", keywords: ["jacket", "denim", "casual", "versatile", "classic"], price: [50, 120] },
      { name: "Blazer", keywords: ["blazer", "work", "professional", "tailored", "smart"], price: [80, 250] }
    ],
    coats: [
      { name: "Trench Coat", keywords: ["coat", "trench", "classic", "elegant", "rain"], price: [120, 400] },
      { name: "Wool Coat", keywords: ["coat", "wool", "winter", "warm", "elegant"], price: [150, 500] }
    ]
  },
  shoes: {
    casual: [
      { name: "White Sneakers", keywords: ["sneakers", "casual", "comfortable", "everyday", "athletic"], price: [50, 150] },
      { name: "Sandals", keywords: ["sandals", "summer", "casual", "comfortable", "beach"], price: [30, 90] }
    ],
    dressy: [
      { name: "Heels", keywords: ["heels", "dressy", "formal", "elegant", "party"], price: [60, 200] },
      { name: "Ankle Boots", keywords: ["boots", "ankle", "versatile", "fall", "winter"], price: [80, 250] }
    ]
  },
  accessories: {
    bags: [
      { name: "Leather Handbag", keywords: ["handbag", "bag", "leather", "work", "everyday"], price: [100, 400] },
      { name: "Crossbody Bag", keywords: ["bag", "crossbody", "casual", "convenient", "travel"], price: [50, 150] },
      { name: "Clutch", keywords: ["clutch", "evening", "party", "formal", "small"], price: [40, 120] }
    ],
    jewelry: [
      { name: "Gold Necklace", keywords: ["necklace", "jewelry", "gold", "elegant", "accessory"], price: [30, 200] },
      { name: "Pearl Earrings", keywords: ["earrings", "jewelry", "pearl", "classic", "elegant"], price: [25, 150] }
    ]
  }
};

const colors = {
  neutrals: ["Black", "White", "Beige", "Gray", "Navy", "Cream", "Taupe"],
  brights: ["Red", "Pink", "Blue", "Green", "Yellow", "Orange", "Purple"],
  pastels: ["Blush", "Lavender", "Mint", "Peach", "Baby Blue", "Powder Pink"],
  earth: ["Brown", "Olive", "Rust", "Terracotta", "Sage", "Mustard"]
};

const fabrics = {
  casual: ["Cotton", "Denim", "Jersey", "Linen", "Canvas"],
  dressy: ["Silk", "Satin", "Chiffon", "Velvet", "Lace", "Organza"],
  structured: ["Wool", "Tweed", "Leather", "Suede"],
  seasonal: ["Cashmere", "Knit", "Fleece"]
};

const patterns = ["Solid", "Floral", "Striped", "Polka Dot", "Geometric", "Animal Print", "Paisley", "Plaid"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const occasions = ["Casual", "Work", "Party", "Wedding", "Formal", "Beach", "Travel", "Evening"];
const fits = ["Regular", "Slim", "Relaxed", "Oversized", "Tailored"];

// ---------- Helper Functions ----------
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const maybe = (p = 0.5) => Math.random() < p;

let skuCounter = 100000;

// Get all templates flattened
const getAllTemplates = () => {
  const all = [];
  Object.keys(productTemplates).forEach(category => {
    Object.keys(productTemplates[category]).forEach(subcategory => {
      productTemplates[category][subcategory].forEach(template => {
        all.push({
          ...template,
          mainCategory: category,
          subCategory: subcategory
        });
      });
    });
  });
  return all;
};

// Map category to proper name
const getCategoryName = (mainCat) => {
  const mapping = {
    dresses: "Dresses",
    tops: "Tops",
    bottoms: "Bottoms",
    outerwear: "Outerwear",
    shoes: "Shoes",
    accessories: "Accessories"
  };
  return mapping[mainCat] || "Clothing";
};

// Get occasion from subcategory
const getOccasion = (subCat, keywords) => {
  if (keywords.includes("wedding") || keywords.includes("bridal")) return "Wedding";
  if (keywords.includes("work") || keywords.includes("professional")) return "Work";
  if (keywords.includes("formal") || keywords.includes("evening")) return "Formal";
  if (keywords.includes("party")) return "Party";
  if (keywords.includes("beach")) return "Beach";
  if (subCat === "casual") return "Casual";
  return rand(occasions);
};

// Generate meaningful description
const generateDescription = (template, color, fabric, pattern, fit) => {
  const { name, keywords, mainCategory } = template;
  
  const fabricDesc = fabric ? `crafted in ${fabric.toLowerCase()}` : "";
  const patternDesc = pattern !== "Solid" ? `with ${pattern.toLowerCase()} pattern` : "";
  const fitDesc = fit !== "Regular" ? `Features a ${fit.toLowerCase()} fit` : "";
  
  const parts = [
    `A beautiful ${name.toLowerCase()}`,
    fabricDesc,
    patternDesc,
    `in ${color.toLowerCase()}.`,
    fitDesc
  ].filter(Boolean);
  
  return parts.join(" ").replace(/\s+/g, " ").trim();
};

// Generate AI description with proper details
const generateAIDescription = (template, color, fabric, pattern, fit, occasion) => {
  const { name, keywords } = template;
  
  const features = [
    `Color: ${color}`,
    fabric ? `Fabric: ${fabric}` : null,
    pattern !== "Solid" ? `Pattern: ${pattern}` : null,
    `Fit: ${fit}`,
    `Occasion: ${occasion}`
  ].filter(Boolean);
  
  const styling = keywords.includes("dress") 
    ? "Pair with heels and jewelry for a complete look."
    : keywords.includes("jacket")
    ? "Layer over dresses or pair with jeans."
    : "Versatile piece that works for multiple occasions.";
  
  const care = fabric === "Silk" || fabric === "Wool" 
    ? "Dry clean recommended." 
    : "Machine wash cold, tumble dry low.";
  
  return `${name} ${features.join(" • ")}. ${styling} Care: ${care}`;
};

// Generate a product
const generateProduct = () => {
  const allTemplates = getAllTemplates();
  const template = rand(allTemplates);
  const { name, keywords, price: priceRange, mainCategory, subCategory } = template;
  
  // Pick brand based on price tier
  const avgPrice = (priceRange[0] + priceRange[1]) / 2;
  let brandPool;
  if (avgPrice > 400) brandPool = brands.luxury;
  else if (avgPrice > 150) brandPool = brands.contemporary;
  else brandPool = brands.affordable;
  
  const brand = rand(brandPool);
  const price = randRange(priceRange[0], priceRange[1]);
  
  // Pick appropriate color and fabric
  const colorPool = keywords.includes("wedding") || keywords.includes("bridal")
    ? [...colors.neutrals, ...colors.pastels]
    : [...colors.neutrals, ...colors.brights];
  const color = rand(colorPool);
  
  const fabricPool = keywords.includes("formal") || keywords.includes("dressy")
    ? fabrics.dressy
    : keywords.includes("work")
    ? fabrics.structured
    : fabrics.casual;
  const fabric = rand(fabricPool);
  
  const pattern = maybe(0.3) ? rand(patterns) : "Solid";
  const fit = rand(fits);
  const occasion = getOccasion(subCategory, keywords);
  const category = getCategoryName(mainCategory);
  
  // Generate name with brand and color
  const productName = `${brand} ${name} ${color}${pattern !== "Solid" ? ` ${pattern}` : ""}`;
  
  const description = generateDescription(template, color, fabric, pattern, fit);
  const aiDescription = generateAIDescription(template, color, fabric, pattern, fit, occasion);
  
  // Generate relevant tags
  const tags = [
    ...keywords,
    color.toLowerCase(),
    fabric.toLowerCase(),
    fit.toLowerCase(),
    occasion.toLowerCase(),
    ...(maybe(0.2) ? ["sustainable", "eco-friendly"] : [])
  ].filter((v, i, a) => a.indexOf(v) === i); // unique only
  
  return {
    name: productName,
    category,
    price,
    description,
    aiDescription,
    color: [color, maybe(0.3) ? rand(colorPool) : color], // primary + optional secondary
    sizes,
    material: fabric,
    brand,
    style: keywords.includes("elegant") ? "Elegant" : 
           keywords.includes("casual") ? "Casual" :
           keywords.includes("edgy") ? "Edgy" : "Classic",
    fit,
    occasion,
    tags,
    stockQuantity: randRange(0, 200),
    sku: `${category.slice(0,2).toUpperCase()}-${skuCounter++}`,
    isActive: true,
    isFeatured: maybe(0.05),
    analytics: {
      viewCount: randRange(0, 500),
      cartAddCount: randRange(0, 100),
      purchaseCount: randRange(0, 50),
      averageRating: parseFloat((Math.random() * 2 + 3).toFixed(2)),
      reviewCount: randRange(0, 30)
    }
  };
};

// ---------- Create Users ----------
const createUsers = async () => {
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = {
    email: "admin@example.com",
    passwordHash: adminHash,
    name: "Admin User",
    phone: "000-000-0000",
    isActive: true,
    lastLogin: new Date()
  };

  const users = [];
  for (let i = 1; i <= 30; i++) {
    users.push({
      email: `user${i}@example.com`,
      passwordHash: await bcrypt.hash(`password${i}`, 10),
      name: `User ${i}`,
      phone: `+1-555-${String(1000 + i).slice(1)}`,
      isActive: true
    });
  }

  return { admin, users };
};

// ---------- Create Reviews ----------
const generateReviews = (products, users, count = 300) => {
  const reviews = [];
  const reviewTexts = {
    5: ["Absolutely love it!", "Perfect fit and quality!", "Exceeded expectations!", "Best purchase ever!"],
    4: ["Really nice, minor issues", "Good quality overall", "Happy with purchase", "Looks great!"],
    3: ["It's okay, as expected", "Average quality", "Decent for the price"],
    2: ["Not what I expected", "Quality could be better", "Disappointing"],
    1: ["Very poor quality", "Does not match description", "Returning this"]
  };

  for (let i = 0; i < count; i++) {
    const product = rand(products);
    const user = rand(users);
    const rating = Math.random() < 0.6 ? randRange(4, 5) : randRange(1, 5);
    
    reviews.push({
      productId: product._id,
      userId: user._id,
      rating,
      title: reviewTexts[rating][0],
      reviewText: rand(reviewTexts[rating]),
      purchasedSize: rand(product.sizes || sizes),
      fitFeedback: rand(["true_to_size", "runs_small", "runs_large"]),
      isVerifiedPurchase: maybe(0.8),
      isApproved: true,
      createdAt: new Date(Date.now() - randRange(0, 365) * 24 * 3600 * 1000)
    });
  }
  return reviews;
};

// ---------- Seed Main Function ----------
const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    console.log('Clearing existing data...');
    await Product.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log('✓ Collections cleared');

    console.log(`\nGenerating ${PRODUCT_COUNT} products...`);
    const productDocs = [];
    for (let i = 0; i < PRODUCT_COUNT; i++) {
      productDocs.push(generateProduct());
    }
    const createdProducts = await Product.insertMany(productDocs);
    console.log(`✓ Inserted ${createdProducts.length} products`);

    console.log('\nCreating users...');
    const { admin, users } = await createUsers();
    await User.create(admin);
    const createdUsers = await User.insertMany(users);
    console.log(`✓ Inserted ${1 + createdUsers.length} users`);

    console.log('\nGenerating reviews...');
    const reviews = generateReviews(createdProducts, createdUsers, 300);
    const createdReviews = await Review.insertMany(reviews);
    console.log(`✓ Inserted ${createdReviews.length} reviews`);

    console.log('\n✅ Seeding complete!');
    console.log(`
Summary:
- Products: ${createdProducts.length}
- Users: ${1 + createdUsers.length}
- Reviews: ${createdReviews.length}
    `);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seed();