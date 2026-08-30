// Shared data, types, and constants for CraftVerse

export interface Review {
  name: string;
  rating: number;
  date: string;
  comment: string;
  avatar: string;
}

export interface WorkshopSchedule {
  date: string;
  time: string;
  spotsLeft: number;
}

export interface Workshop {
  id: number;
  title: string;
  instructor: string;
  instructorBio: string;
  instructorAvatar: string;
  rating: number;
  reviewCount: number;
  duration: string;
  price: number;
  seats: number;
  seatsTotal: number;
  category: string;
  gradient: string;
  tall: boolean;
  description: string;
  highlights: string[];
  whatYouLearn: string[];
  includes: string[];
  location: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  schedules: WorkshopSchedule[];
  reviews: Review[];
  featured?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isHost: boolean;
  bookings: Booking[];
  savedWorkshops: number[];
}

export interface Booking {
  id: string;
  workshopId: number;
  workshopTitle: string;
  date: string;
  time: string;
  guests: number;
  total: number;
  status: "upcoming" | "completed" | "cancelled";
  gradient: string;
}

export interface HostWorkshop extends Workshop {
  earnings: number;
  totalBookings: number;
  status: "published" | "draft" | "paused";
}

export const WORKSHOPS: Workshop[] = [
  {
    id: 1,
    title: "Wheel Throwing Masterclass",
    instructor: "Maya Chen",
    instructorBio: "Maya is a ceramic artist with 15 years of experience, trained at the San Francisco School of Art. Her work has been exhibited in galleries across the US and Japan.",
    instructorAvatar: "from-amber-400 to-orange-500",
    rating: 4.9,
    reviewCount: 248,
    duration: "3h",
    price: 85,
    seats: 3,
    seatsTotal: 12,
    category: "Pottery",
    gradient: "from-amber-500 via-orange-400 to-red-400",
    tall: true,
    featured: true,
    description: "Immerse yourself in the ancient art of pottery in Maya's stunning SoHo studio. Whether you're a complete beginner or have touched clay before, this hands-on session teaches you the meditative process of centering, pulling, and shaping your own vessel on the wheel.",
    highlights: ["Max 12 students per class", "All materials included", "Take your creation home", "Light refreshments provided"],
    whatYouLearn: ["Centering clay on the wheel", "Opening and pulling walls", "Shaping cylinders and bowls", "Trimming and finishing techniques"],
    includes: ["2 lbs of clay", "Tool set", "Glazing session", "Kiln firing (ready in 2 weeks)"],
    location: "Maya's Studio, 123 Spring St, SoHo, New York",
    level: "All Levels",
    schedules: [
      { date: "Sat, Jul 19", time: "10:00 AM", spotsLeft: 3 },
      { date: "Sun, Jul 20", time: "2:00 PM", spotsLeft: 7 },
      { date: "Sat, Jul 26", time: "10:00 AM", spotsLeft: 9 },
      { date: "Sun, Jul 27", time: "2:00 PM", spotsLeft: 5 },
    ],
    reviews: [
      { name: "Alice W.", rating: 5, date: "2 weeks ago", comment: "Absolutely loved this! Maya is so patient and encouraging. I made a beautiful bowl on my very first try!", avatar: "from-violet-400 to-purple-500" },
      { name: "Mark T.", rating: 5, date: "1 month ago", comment: "The studio is gorgeous and Maya explains everything clearly. Best $85 I've ever spent.", avatar: "from-cyan-400 to-blue-500" },
      { name: "Sarah J.", rating: 4, date: "3 weeks ago", comment: "Really fun experience. The clay is challenging but Maya guides you through every step. Would definitely return!", avatar: "from-rose-400 to-pink-500" },
    ],
  },
  {
    id: 2,
    title: "Film Photography Essentials",
    instructor: "James Park",
    instructorBio: "James is a editorial photographer whose work appears in Vogue, WIRED, and National Geographic. He's passionate about teaching the lost art of analog photography.",
    instructorAvatar: "from-purple-500 to-indigo-600",
    rating: 4.8,
    reviewCount: 183,
    duration: "4h",
    price: 120,
    seats: 5,
    seatsTotal: 8,
    category: "Photography",
    gradient: "from-slate-800 via-slate-700 to-purple-900",
    tall: false,
    featured: true,
    description: "Slow down, compose intentionally, and fall in love with photography all over again. James walks you through every aspect of shooting on 35mm film — from loading a roll to developing your negatives in the darkroom.",
    highlights: ["Film camera provided", "Darkroom development included", "All chemicals & paper", "Take home developed prints"],
    whatYouLearn: ["Film loading and camera settings", "Exposure triangle for film", "Composition techniques", "Darkroom development process"],
    includes: ["35mm film camera rental", "2 rolls of Kodak Gold 200", "Darkroom time", "5 printed photos"],
    location: "Analog Lab, 45 W 18th St, Chelsea, New York",
    level: "Beginner",
    schedules: [
      { date: "Sat, Jul 19", time: "9:00 AM", spotsLeft: 5 },
      { date: "Sat, Jul 26", time: "9:00 AM", spotsLeft: 2 },
      { date: "Sun, Jul 27", time: "1:00 PM", spotsLeft: 6 },
    ],
    reviews: [
      { name: "Nina R.", rating: 5, date: "1 week ago", comment: "James made me fall in love with film photography. The darkroom experience was magical and unlike anything digital.", avatar: "from-amber-400 to-orange-500" },
      { name: "Tom K.", rating: 5, date: "2 months ago", comment: "The most unique and memorable workshop I've taken. James knows his craft deeply.", avatar: "from-emerald-400 to-teal-500" },
    ],
  },
  {
    id: 3,
    title: "French Macaron Workshop",
    instructor: "Sophie Laurent",
    instructorBio: "Sophie trained at Le Cordon Bleu Paris and ran a patisserie in Lyon before moving to New York. She specializes in precision baking and French pastry techniques.",
    instructorAvatar: "from-rose-400 to-pink-500",
    rating: 5.0,
    reviewCount: 312,
    duration: "2.5h",
    price: 65,
    seats: 2,
    seatsTotal: 14,
    category: "Baking",
    gradient: "from-pink-300 via-rose-200 to-fuchsia-300",
    tall: false,
    featured: true,
    description: "Master the notoriously tricky French macaron with expert guidance from Sophie. You'll learn her foolproof method for perfect shells every time — crispy outside, chewy inside, with a gorgeous 'foot'. Leave with a full box of your own colorful macarons.",
    highlights: ["Professional kitchen setting", "Small group (max 14)", "Box of 24 macarons to take home", "Recipe booklet included"],
    whatYouLearn: ["Italian meringue method", "Macaronage technique", "Piping perfect rounds", "3 buttercream fillings"],
    includes: ["All baking ingredients", "Apron & piping bags", "Box for your macarons", "Printed recipe card"],
    location: "Atelier Sucré, 234 Bleecker St, West Village, New York",
    level: "Beginner",
    schedules: [
      { date: "Sat, Jul 19", time: "11:00 AM", spotsLeft: 2 },
      { date: "Tue, Jul 22", time: "6:00 PM", spotsLeft: 9 },
      { date: "Sat, Jul 26", time: "11:00 AM", spotsLeft: 12 },
    ],
    reviews: [
      { name: "Chloe M.", rating: 5, date: "3 days ago", comment: "Sophie is an incredible teacher! My macarons came out PERFECT. I've been trying to make these for years and Sophie's method just works.", avatar: "from-violet-400 to-purple-500" },
      { name: "Jun H.", rating: 5, date: "1 month ago", comment: "Best workshop ever! Walked away with 24 beautiful macarons and the confidence to make them at home.", avatar: "from-cyan-400 to-blue-500" },
    ],
  },
  {
    id: 4,
    title: "Botanical Watercolor Painting",
    instructor: "Aria Kim",
    instructorBio: "Aria is a botanical illustrator whose work graces the pages of Field & Stream and The New Yorker. She teaches painting workshops in her sun-drenched Brooklyn studio.",
    instructorAvatar: "from-emerald-400 to-teal-500",
    rating: 4.7,
    reviewCount: 156,
    duration: "3h",
    price: 75,
    seats: 6,
    seatsTotal: 10,
    category: "Painting",
    gradient: "from-emerald-400 via-teal-300 to-cyan-400",
    tall: true,
    description: "Learn to capture the delicate beauty of flowers and plants in watercolor. Aria's calming teaching style and detailed demonstrations make this workshop perfect for beginners and seasoned painters alike who want to explore botanical art.",
    highlights: ["Professional watercolor supplies included", "Paint 3 finished studies", "Natural specimens provided", "Take home your artworks"],
    whatYouLearn: ["Watercolor wash techniques", "Color mixing for botanicals", "Detailed petal and leaf rendering", "Composition and negative space"],
    includes: ["Professional watercolor set", "Arches cotton paper (5 sheets)", "Brushes", "3 botanical specimens"],
    location: "Studio Aria, 56 Grand Ave, Williamsburg, Brooklyn",
    level: "All Levels",
    schedules: [
      { date: "Sun, Jul 20", time: "10:00 AM", spotsLeft: 6 },
      { date: "Wed, Jul 23", time: "6:30 PM", spotsLeft: 4 },
      { date: "Sun, Jul 27", time: "10:00 AM", spotsLeft: 8 },
    ],
    reviews: [
      { name: "Priya D.", rating: 5, date: "2 weeks ago", comment: "Aria's patience and eye for beauty shine through her teaching. I painted something I'm truly proud of.", avatar: "from-amber-400 to-orange-500" },
      { name: "Lucas F.", rating: 4, date: "3 weeks ago", comment: "Beautiful studio and great technique instruction. I wish the session was longer!", avatar: "from-rose-400 to-pink-500" },
    ],
  },
  {
    id: 5,
    title: "Sourdough Bread Baking",
    instructor: "Thomas Mueller",
    instructorBio: "Thomas is a third-generation German baker who honed his craft in Munich before bringing his mastery of fermentation and sourdough to New York's artisan bread scene.",
    instructorAvatar: "from-yellow-400 to-amber-500",
    rating: 4.9,
    reviewCount: 291,
    duration: "5h",
    price: 95,
    seats: 4,
    seatsTotal: 10,
    category: "Cooking",
    gradient: "from-yellow-400 via-amber-300 to-orange-400",
    tall: false,
    description: "Go deep into the world of wild fermentation with Thomas. From mixing and folding to scoring and baking in a Dutch oven, you'll walk away with two loaves of real sourdough bread — and the knowledge to replicate it at home.",
    highlights: ["Full 5-hour immersive session", "Leave with 2 sourdough loaves", "Sourdough starter to take home", "Recipe packet included"],
    whatYouLearn: ["Sourdough starter maintenance", "Autolyse and mixing", "Stretch & fold technique", "Scoring patterns and baking"],
    includes: ["All flour and ingredients", "Dutch oven use", "Starter culture", "Printed recipes"],
    location: "The Bread Lab, 78 Smith St, Cobble Hill, Brooklyn",
    level: "Beginner",
    schedules: [
      { date: "Sat, Jul 19", time: "8:00 AM", spotsLeft: 4 },
      { date: "Sun, Jul 20", time: "8:00 AM", spotsLeft: 7 },
      { date: "Sat, Jul 26", time: "8:00 AM", spotsLeft: 10 },
    ],
    reviews: [
      { name: "Emma B.", rating: 5, date: "1 week ago", comment: "Thomas is a bread wizard. His teaching is methodical yet joyful. I've been baking sourdough every week since!", avatar: "from-violet-400 to-purple-500" },
    ],
  },
  {
    id: 6,
    title: "Hand-Lettering & Calligraphy",
    instructor: "Lisa Wong",
    instructorBio: "Lisa is a lettering artist and graphic designer based in Manhattan. She's designed lettering for brands like Anthropologie, Warby Parker, and dozens of independent artists.",
    instructorAvatar: "from-violet-500 to-purple-600",
    rating: 4.8,
    reviewCount: 209,
    duration: "2h",
    price: 55,
    seats: 8,
    seatsTotal: 20,
    category: "Art",
    gradient: "from-violet-500 via-purple-400 to-fuchsia-400",
    tall: true,
    description: "In just two hours, Lisa will take you from writing letters to creating genuine hand-lettered art. This workshop covers both bounce lettering and pointed pen calligraphy, with plenty of practice time and personalized feedback.",
    highlights: ["Complete supplies kit included", "Two distinct styles covered", "Work at your own pace", "Certificate of completion"],
    whatYouLearn: ["Bounce lettering fundamentals", "Pointed pen hold and technique", "Letterform spacing and flow", "Creating a finished piece"],
    includes: ["Lettering practice sheets", "Pointed pen + nibs", "Ink & guide sheets", "Portfolio sleeve"],
    location: "Ink & Letter Studio, 12 Prince St, Nolita, New York",
    level: "Beginner",
    schedules: [
      { date: "Mon, Jul 21", time: "7:00 PM", spotsLeft: 8 },
      { date: "Thu, Jul 24", time: "7:00 PM", spotsLeft: 14 },
      { date: "Mon, Jul 28", time: "7:00 PM", spotsLeft: 18 },
    ],
    reviews: [
      { name: "Rachel G.", rating: 5, date: "5 days ago", comment: "Lisa breaks down calligraphy so clearly! I went from zero to creating beautiful letterforms in 2 hours.", avatar: "from-amber-400 to-orange-500" },
    ],
  },
  {
    id: 7,
    title: "Japanese Knife Skills",
    instructor: "Kenji Tanaka",
    instructorBio: "Kenji trained for 8 years under master chefs in Osaka and Tokyo before opening his own restaurant in New York. He is passionate about the art of Japanese knife technique.",
    instructorAvatar: "from-gray-600 to-gray-800",
    rating: 4.9,
    reviewCount: 174,
    duration: "3h",
    price: 110,
    seats: 4,
    seatsTotal: 8,
    category: "Cooking",
    gradient: "from-gray-800 via-gray-700 to-gray-500",
    tall: false,
    description: "Learn to handle, sharpen, and cut with Japanese kitchen knives the way professional chefs do. Kenji teaches proper grip, blade angle, and dozens of cutting techniques — from chiffonade to brunoise — that will transform your home cooking.",
    highlights: ["Professional knife set to use", "Knife sharpening covered", "Take home a recipe booklet", "Optional sake tasting"],
    whatYouLearn: ["Proper knife grip and posture", "Whetstone sharpening", "6 essential cuts", "Japanese culinary philosophy"],
    includes: ["All ingredients", "Knife use (3 styles)", "Sharpening guide", "Recipe booklet"],
    location: "Tanaka Kitchen Studio, 90 Baxter St, Chinatown, New York",
    level: "All Levels",
    schedules: [
      { date: "Sat, Jul 19", time: "3:00 PM", spotsLeft: 4 },
      { date: "Wed, Jul 23", time: "6:00 PM", spotsLeft: 6 },
      { date: "Sat, Jul 26", time: "3:00 PM", spotsLeft: 8 },
    ],
    reviews: [
      { name: "David L.", rating: 5, date: "2 weeks ago", comment: "Kenji is a master of his craft. This workshop genuinely changed how I approach cooking. A must-do.", avatar: "from-cyan-400 to-blue-500" },
    ],
  },
  {
    id: 8,
    title: "Floral Crown Making",
    instructor: "Emma Rose",
    instructorBio: "Emma is a floral designer who has created arrangements for Vogue weddings, Brooklyn art events, and celebrity celebrations. She brings her joyful, maximalist aesthetic to every class.",
    instructorAvatar: "from-rose-400 to-pink-500",
    rating: 4.6,
    reviewCount: 138,
    duration: "2h",
    price: 60,
    seats: 6,
    seatsTotal: 16,
    category: "Floral",
    gradient: "from-rose-300 via-pink-200 to-fuchsia-300",
    tall: false,
    description: "Spend a gorgeous afternoon crafting your own wearable floral crown using fresh seasonal blooms. Emma guides you through selecting, conditioning, and wiring flowers into a fully finished crown you'll wear home.",
    highlights: ["Fresh seasonal flowers provided", "Wear your crown home", "Prosecco & snacks included", "Great for groups & events"],
    whatYouLearn: ["Flower conditioning & prep", "Wire wrapping technique", "Color palette composition", "Crown fitting & finishing"],
    includes: ["Fresh flower bundle", "Floral wire & tape", "Snips and tools", "Prosecco toast"],
    location: "Bloom Studio, 33 Bedford Ave, Williamsburg, Brooklyn",
    level: "Beginner",
    schedules: [
      { date: "Sat, Jul 19", time: "1:00 PM", spotsLeft: 6 },
      { date: "Sat, Jul 26", time: "1:00 PM", spotsLeft: 10 },
      { date: "Sun, Jul 27", time: "11:00 AM", spotsLeft: 14 },
    ],
    reviews: [
      { name: "Lily M.", rating: 5, date: "4 days ago", comment: "The most fun afternoon I've had in ages! Emma is bursting with energy and creativity. My crown was absolutely stunning.", avatar: "from-violet-400 to-purple-500" },
    ],
  },
];

export const CATEGORIES = [
  { name: "Pottery", grad: "from-amber-400 to-orange-500", glow: "shadow-orange-200" },
  { name: "Photography", grad: "from-purple-600 to-indigo-700", glow: "shadow-purple-200" },
  { name: "Cooking", grad: "from-red-400 to-orange-500", glow: "shadow-red-200" },
  { name: "Baking", grad: "from-amber-300 to-yellow-500", glow: "shadow-yellow-200" },
  { name: "Music", grad: "from-violet-500 to-purple-600", glow: "shadow-violet-200" },
  { name: "Floral", grad: "from-rose-400 to-pink-500", glow: "shadow-pink-200" },
  { name: "Woodwork", grad: "from-amber-700 to-amber-500", glow: "shadow-amber-200" },
  { name: "Art", grad: "from-cyan-400 to-blue-500", glow: "shadow-cyan-200" },
  { name: "DIY", grad: "from-emerald-400 to-teal-500", glow: "shadow-emerald-200" },
  { name: "Handmade", grad: "from-fuchsia-400 to-rose-500", glow: "shadow-fuchsia-200" },
  { name: "Book Arts", grad: "from-sky-400 to-blue-600", glow: "shadow-sky-200" },
];

export const HOST_WORKSHOPS: HostWorkshop[] = WORKSHOPS.slice(0, 3).map((w, i) => ({
  ...w,
  earnings: [3240, 1920, 4100][i],
  totalBookings: [38, 16, 63][i],
  status: (["published", "published", "draft"] as const)[i],
}));

export const MOCK_BOOKINGS: Booking[] = [
  { id: "b1", workshopId: 1, workshopTitle: "Wheel Throwing Masterclass", date: "Sat, Jul 26", time: "10:00 AM", guests: 2, total: 170, status: "upcoming", gradient: "from-amber-500 to-orange-400" },
  { id: "b2", workshopId: 3, workshopTitle: "French Macaron Workshop", date: "Sat, Jul 19", time: "11:00 AM", guests: 1, total: 65, status: "completed", gradient: "from-pink-300 to-fuchsia-300" },
  { id: "b3", workshopId: 6, workshopTitle: "Hand-Lettering & Calligraphy", date: "Mon, Jun 30", time: "7:00 PM", guests: 1, total: 55, status: "completed", gradient: "from-violet-500 to-fuchsia-400" },
];
