// src/seeds/seed_diverse_no_images_cleanup.js
// Run:
//   BACKUP=true node src/seeds/seed_diverse_no_images_cleanup.js
// or
//   node src/seeds/seed_diverse_no_images_cleanup.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Product = require('../src/models/Product');
const User = require('../src/models/User');
const Review = require('../src/models/Review');
const { MONGODB_URI } = require('../src/config/env');

const PRODUCT_COUNT = 500; // change if you want more/less

// ---------- Helper pools for diversity ----------
const categories = ["Dresses", "Tops", "Pants", "Jackets", "Shoes", "Accessories", "Traditional", "Maternity"];
const dressTypes = [
  "A-line dress", "Sheath dress", "Maxi dress", "Midi dress", "Mini dress",
  "Wrap dress", "Slip dress", "Shirt dress", "Ball gown", "Mermaid gown",
  "Kaftan", "Kimono dress", "Sari + blouse set", "Abaya", "Qipao/Cheongsam"
];
const occasions = ["Casual", "Work", "Evening", "Wedding", "Bridal", "Party", "Beach", "Festival", "Travel", "Formal", "Religious Ceremony"];
const colors = ["Ivory", "Beige", "Black", "White", "Navy", "Red", "Emerald", "Blush", "Mustard", "Coral", "Olive", "Lavender", "Chocolate"];
const fabrics = ["Cotton", "Linen", "Silk", "Satin", "Chiffon", "Crepe", "Velvet", "Organza", "Denim", "Jersey", "Rayon", "Brocade", "Lace"];
const patterns = ["Solid", "Floral", "Paisley", "Geometric", "Plaid", "Polka dot", "Stripe", "Embroidered", "Beaded", "Sequin"];
const necklines = ["V-neck", "Round", "Square", "Boat", "Sweetheart", "Halter", "High neck", "Off-shoulder"];
const sleeves = ["Sleeveless", "Short", "3/4", "Long", "Cap sleeve", "Bell sleeve", "Raglan", "Puff sleeve"];
const lengths = ["Mini", "Above knee", "Knee", "Midi", "Tea", "Ankle", "Floor-length"];
const fits = ["True to size", "Slim fit", "Relaxed", "Oversized", "Tailored"];
const bodyTypes = ["Petite", "Regular", "Tall", "Plus size", "Maternity-friendly", "Athletic build", "Curvy", "Pregnancy/postpartum"];
const sustainabilityTags = ["organic", "recycled", "low-waste", "vegan", "carbon-neutral"];
const brands = ["ModaRoot", "HeritageWeave", "Sunloom", "EcoThread", "StudioLuxe", "StreetMuse", "CeremonyCo", "NomadCraft"];
const styleLabels = ["Bohemian", "Minimalist", "Romantic", "Classic", "Modern", "Streetwear", "Athleisure", "Glam", "Traditional"];

// ---------- Helpers ----------
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const maybe = (p=0.5) => Math.random() < p;
const slug = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

let skuCounter = 100000;

const generateProduct = (i) => {
  const isDress = Math.random() < 0.7;
  const category = isDress ? "Dresses" : rand(categories);
  const dressType = isDress ? rand(dressTypes) : null;
  const brand = rand(brands);
  const priceTier = Math.random();
  const price = priceTier < 0.5 ? rint(20, 80) : (priceTier < 0.85 ? rint(80, 250) : rint(250, 1500));
  const color = rand(colors);
  const fabric = rand(fabrics);
  const pattern = rand(patterns);
  const neckline = rand(necklines);
  const sleeve = rand(sleeves);
  const length = rand(lengths);
  const fit = rand(fits);
  const sizeSet = maybe(0.2) ? ["XS","S","M","L","XL","1X","2X","3X"] : (maybe(0.15) ? ["XXS","XS","S","M"] : ["S","M","L","XL"]);
  const targetAudience = rand(["Women", "Unisex", "Maternity"]);
  const bodyType = rand(bodyTypes);
  const sustainable = maybe(0.18);
  const cultural = maybe(0.08);
  const isMaternity = maybe(0.06);

  const nameParts = [
    brand,
    isDress ? dressType : rand(["Top", "Jacket", "Pant", "Blouse", "Skirt"]),
    color,
    slug(pattern).replace(/-/g, ' ')
  ].filter(Boolean).slice(0,4);
  const name = nameParts.join(' ').replace(/\s{2,}/g,' ').trim();

  const shortDesc = isDress
    ? `${dressType} in ${fabric} with ${pattern.toLowerCase()} pattern — ${fit.toLowerCase()} fit, ${length.toLowerCase()}.`
    : `A ${fit.toLowerCase()} ${category.toLowerCase()} from ${brand} crafted in ${fabric}.`;

  const aiDescription = (() => {
    const keyAttributes = [
      `Fabric: ${fabric}`,
      `Pattern: ${pattern}`,
      `Color: ${color}`,
      `Neckline: ${neckline}`,
      `Sleeve: ${sleeve}`,
      `Length: ${length}`,
      `Fit: ${fit}`
    ];
    const fitNoteMap = {
      "True to size": "Order your normal size.",
      "Slim fit": "Consider sizing up if between sizes or for layering.",
      "Relaxed": "Comfortable, allows movement; sizing can be your usual.",
      "Oversized": "Designed to be roomy—size down for a fitted look.",
      "Tailored": "For a sharp silhouette; follow measurements closely."
    };
    const additional = [];
    if (isMaternity) additional.push("Maternity-friendly panel & adjustable waist.");
    if (bodyType === "Petite") additional.push("Hem is shorter—great for petite frames.");
    if (bodyType === "Plus size") additional.push("Cut designed for curvy silhouettes with supportive seams.");
    if (sustainable) additional.push(`Sustainability: ${rand(sustainabilityTags)} materials used.`);
    if (cultural) additional.push("Culturally inspired detailing and traditional craftsmanship.");
    const styleRec = `Style suggestion: pair with ${rand(["block heels", "white sneakers", "ankle boots", "gold jewelry", "a tailored blazer"])}.`;
    return `${shortDesc} ${keyAttributes.join(' • ')} ${fitNoteMap[fit]} ${additional.join(' ')} ${styleRec}`;
  })();

  const styleTips = `Wear for ${rand(occasions)}. Try ${rand(["belted", "layered", "with loafers", "with heels", "with a denim jacket"])}.`;

  const tags = [
    "dress",
    pattern.toLowerCase(),
    fabric.toLowerCase(),
    fit.toLowerCase(),
    styleLabels.includes(rand(styleLabels)) ? rand(styleLabels).toLowerCase() : "everyday",
    ...(sustainable ? ["sustainable", rand(sustainabilityTags)] : []),
    ...(isMaternity ? ["maternity"] : []),
    ...(cultural ? ["traditional", "handmade"] : [])
  ].filter(Boolean);

  return {
    name,
    category,
    price,
    description: `${shortDesc} ${styleTips} Care: ${maybe(0.85) ? "Machine wash cold, line dry." : "Dry clean only."}`,
    aiDescription,
    color: [color, rand(colors)],
    sizes: sizeSet,
    material: fabric,
    brand,
    style: rand(styleLabels),
    fit,
    occasion: rand(occasions),
    careInstructions: maybe(0.85) ? "Machine wash cold, gentle cycle. Hang to dry." : "Dry clean only. Professional cleaning recommended.",
    styleTips,
    targetAudience,
    season: [rand(["Spring", "Summer", "Fall", "Winter"])],
    metadata: {
      skuSource: "seed_diverse_no_images_script",
      batch: "diverse_v1_no_images",
      modelSample: {
        heightCm: rint(160, 185),
        bustCm: rint(80, 120),
        waistCm: rint(60, 110),
        hipsCm: rint(85, 140)
      },
      inclusive: {
        bodyType,
        isMaternity
      }
    },
    tags,
    // Image fields removed intentionally
    stockQuantity: rint(0, 300),
    sku: `DV-${skuCounter++}`,
    isActive: true,
    isFeatured: maybe(0.07),
    analytics: {
      viewCount: rint(0, 1000),
      cartAddCount: rint(0, 200),
      purchaseCount: rint(0, 100),
      averageRating: parseFloat((Math.random() * 2 + 3).toFixed(2)),
      reviewCount: rint(0, 60)
    },
    embeddings: [],
    attributes: {
      neckline,
      sleeve,
      length,
      pattern,
      sustainable,
      cultural,
      neckline_keyword: neckline.toLowerCase().replace(/\s+/g,'_')
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
    stylePreferences: "Elegant, Romantic",
    sizePreferences: { tops: "M", pants: "32", shoes: "9" },
    favoriteCategories: ["Dresses", "Bridal", "Maternity"],
    isActive: true,
    lastLogin: new Date()
  };

  const users = [];
  for (let i = 1; i <= 25; i++) {
    users.push({
      email: `user${i}@example.com`,
      passwordHash: await bcrypt.hash("password" + i, 10),
      name: `User ${i}`,
      phone: `+1-555-010${String(i).padStart(2,'0')}`,
      stylePreferences: rand(styleLabels),
      sizePreferences: {
        tops: rand(["XS","S","M","L","XL","1X","2X"]),
        pants: rand(["28","30","32","34","36","38"]),
        shoes: rand(["6","7","8","9","10","11"])
      },
      favoriteCategories: [rand(categories), rand(categories)],
      isActive: true
    });
  }

  return { admin, users };
};

// ---------- Create Reviews ----------
const generateReviews = (products, users, count = 400) => {
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const product = rand(products);
    const user = rand(users);
    const rating = rint(1,5);
    const fitFeedback = rand(["true_to_size","runs_small","runs_large"]);
    const reviewTextPool = [
      "Beautiful fabric and great drape.",
      "Loved the cut—very flattering.",
      "Sizing ran smaller than expected.",
      "Perfect for my wedding!",
      "Good quality but pricey.",
      "Comfortable and breathable for summer.",
      "Not suitable for tall frame — hem was short.",
      "Excellent craftsmanship and embroidery.",
      "Nice color, but color transfer after first wash.",
      "Great maternity fit — stretchy and supportive."
    ];

    reviews.push({
      productId: product._id ? product._id : product.id,
      userId: user._id ? user._id : user.id,
      rating,
      title: rating >= 4 ? "Loved it!" : (rating === 3 ? "It's okay" : "Disappointed"),
      reviewText: rand(reviewTextPool),
      purchasedSize: rand(product.sizes || ["S","M","L"]),
      fitFeedback,
      isVerifiedPurchase: Math.random() > 0.3,
      isApproved: true,
      createdAt: new Date(Date.now() - rint(0, 1000) * 24 * 3600 * 1000)
    });
  }
  return reviews;
};

// ---------- Backup helper ----------
async function backupCollectionsIfRequested() {
  if (process.env.BACKUP !== 'true') return;
  const backupDir = path.join('/tmp', `db-backup-${Date.now()}`);
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Backing up collections to ${backupDir} ...`);

  const prods = await Product.find({}).lean();
  const users = await User.find({}).lean();
  const reviews = await Review.find({}).lean();

  fs.writeFileSync(path.join(backupDir, 'products.json'), JSON.stringify(prods, null, 2));
  fs.writeFileSync(path.join(backupDir, 'users.json'), JSON.stringify(users, null, 2));
  fs.writeFileSync(path.join(backupDir, 'reviews.json'), JSON.stringify(reviews, null, 2));

  console.log('Backup complete.');
}

// ---------- Seed procedure ----------
const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    // Optional backup
    await backupCollectionsIfRequested();

    // Cleanup existing data first
    console.log('Clearing existing collections (Product, User, Review)...');
    await Product.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});

    // Insert products
    console.log(`Generating ${PRODUCT_COUNT} diverse products (no images)...`);
    const productDocs = [];
    for (let i = 0; i < PRODUCT_COUNT; i++) {
      productDocs.push(generateProduct(i));
    }
    const createdProducts = await Product.insertMany(productDocs, { ordered: false });
    console.log(`Inserted ${createdProducts.length} products.`);

    // Users
    console.log('Creating users...');
    const { admin, users } = await createUsers();
    await User.create(admin);
    const createdUsers = await User.insertMany(users);
    console.log(`Inserted ${1 + createdUsers.length} users (including admin).`);

    // Reviews
    console.log('Generating reviews...');
    const reviews = generateReviews(createdProducts, createdUsers, Math.min(800, createdProducts.length * 2));
    const createdReviews = await Review.insertMany(reviews, { ordered: false });
    console.log(`Inserted ${createdReviews.length} reviews.`);

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
