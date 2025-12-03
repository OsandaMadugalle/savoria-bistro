import { MenuItem, Review, GalleryItem, User } from './types';

export const RESTAURANT_NAME = "Savoria Bistro";

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 's1',
    name: 'Truffle Arancini',
    description: 'Crispy risotto balls infused with black truffle, served with garlic aioli.',
    price: 14,
    category: 'Starter',
    image: 'https://picsum.photos/400/300?random=1',
    tags: ['Vegetarian'],
    ingredients: ['Arborio Rice', 'Black Truffle', 'Parmesan', 'Garlic', 'Breadcrumbs', 'Egg'],
    calories: 420,
    prepTime: 15
  },
  {
    id: 's2',
    name: 'Seared Scallops',
    description: 'Pan-seared scallops with cauliflower purée and crispy pancetta.',
    price: 18,
    category: 'Starter',
    image: 'https://picsum.photos/400/300?random=2',
    tags: ['GF'],
    ingredients: ['Sea Scallops', 'Cauliflower', 'Pancetta', 'Butter', 'Chives'],
    calories: 320,
    prepTime: 20
  },
  {
    id: 'm1',
    name: 'Wagyu Beef Burger',
    description: 'Premium Wagyu patty, aged cheddar, caramelized onions, brioche bun.',
    price: 24,
    category: 'Main',
    image: 'https://picsum.photos/400/300?random=3',
    tags: [],
    ingredients: ['Wagyu Beef', 'Aged Cheddar', 'Brioche Bun', 'Onions', 'Lettuce', 'Tomato'],
    calories: 850,
    prepTime: 25
  },
  {
    id: 'm2',
    name: 'Wild Mushroom Risotto',
    description: 'Arborio rice, porcini mushrooms, parmesan crisp, truffle oil.',
    price: 22,
    category: 'Main',
    image: 'https://picsum.photos/400/300?random=4',
    tags: ['Vegetarian', 'GF'],
    ingredients: ['Arborio Rice', 'Porcini Mushrooms', 'Vegetable Stock', 'White Wine', 'Parmesan'],
    calories: 580,
    prepTime: 30
  },
  {
    id: 'm3',
    name: 'Pan-Roasted Salmon',
    description: 'Sustainable salmon fillet, quinoa salad, lemon butter sauce.',
    price: 26,
    category: 'Main',
    image: 'https://picsum.photos/400/300?random=5',
    tags: ['GF', 'Healthy'],
    ingredients: ['Atlantic Salmon', 'Quinoa', 'Lemon', 'Butter', 'Asparagus', 'Dill'],
    calories: 450,
    prepTime: 25
  },
  {
    id: 'd1',
    name: 'Dark Chocolate Fondant',
    description: 'Molten center chocolate cake served with vanilla bean ice cream.',
    price: 12,
    category: 'Dessert',
    image: 'https://picsum.photos/400/300?random=6',
    tags: ['Vegetarian'],
    ingredients: ['Dark Chocolate', 'Butter', 'Eggs', 'Sugar', 'Flour', 'Vanilla Ice Cream'],
    calories: 520,
    prepTime: 20
  },
  {
    id: 'd2',
    name: 'Lemon Basil Tart',
    description: 'Zesty lemon curd in a buttery pastry shell topped with fresh basil.',
    price: 10,
    category: 'Dessert',
    image: 'https://picsum.photos/400/300?random=7',
    tags: ['Vegetarian'],
    ingredients: ['Lemon Juice', 'Eggs', 'Butter', 'Sugar', 'Flour', 'Fresh Basil'],
    calories: 380,
    prepTime: 45
  },
  {
    id: 'dr1',
    name: 'Artisan Kombucha',
    description: 'House-fermented peach and ginger kombucha.',
    price: 6,
    category: 'Drink',
    image: 'https://picsum.photos/400/300?random=8',
    tags: ['Vegan', 'GF'],
    ingredients: ['Black Tea', 'Sugar', 'Peach', 'Ginger', 'Live Culture'],
    calories: 60,
    prepTime: 0
  }
];

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    author: 'Sarah Jenkins',
    rating: 5,
    text: "The best dining experience I've had in years. The truffle arancini is to die for!",
    date: '2023-10-15'
  },
  {
    id: 'r2',
    author: 'Michael Chen',
    rating: 4,
    text: "Great atmosphere and lovely staff. The burger was cooked perfectly.",
    date: '2023-11-02'
  },
  {
    id: 'r3',
    author: 'Emma Thompson',
    rating: 5,
    text: "Beautiful presentation and exquisite flavors. Highly recommend the risotto.",
    date: '2023-11-20'
  },
  {
    id: 'r4',
    author: 'David Kim',
    rating: 5,
    text: "Absolutely stunning interior and the service was impeccable. A true gem.",
    date: '2023-12-01'
  },
  {
    id: 'r5',
    author: 'Sophie Marceau',
    rating: 4,
    text: "The wine selection is fantastic. Loved the intimate atmosphere for our anniversary.",
    date: '2023-12-05'
  },
  {
    id: 'r6',
    author: 'James Wilson',
    rating: 5,
    text: "Best steak I have had in the city. The chef clearly knows what they are doing.",
    date: '2023-12-10'
  }
];

export const GALLERY_IMAGES: GalleryItem[] = [
  { id: 'g1', src: 'https://picsum.photos/800/600?random=20', caption: 'Main Dining Room', category: 'Interior' },
  { id: 'g2', src: 'https://picsum.photos/800/800?random=21', caption: 'Chef Plating Signature Dish', category: 'Kitchen' },
  { id: 'g3', src: 'https://picsum.photos/600/800?random=22', caption: 'Fresh Local Ingredients', category: 'Food' },
  { id: 'g4', src: 'https://picsum.photos/800/600?random=23', caption: 'Evening Ambiance', category: 'Interior' },
  { id: 'g5', src: 'https://picsum.photos/800/600?random=24', caption: 'Summer Patio', category: 'Exterior' },
  { id: 'g6', src: 'https://picsum.photos/800/800?random=25', caption: 'Private Dining Area', category: 'Interior' },
  { id: 'g7', src: 'https://picsum.photos/600/800?random=26', caption: 'Artisan Cocktails', category: 'Drinks' },
  { id: 'g8', src: 'https://picsum.photos/800/600?random=27', caption: 'Detailed Preparation', category: 'Kitchen' },
];

export const DEMO_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.j@example.com',
  phone: '(555) 987-6543',
  loyaltyPoints: 850,
  memberSince: '2022',
  tier: 'Gold',
  role: 'customer',
  history: [
    { id: '#8834', date: '2023-12-01', items: ['Wagyu Beef Burger', 'Artisan Kombucha'], total: 30, status: 'Delivered' },
    { id: '#7521', date: '2023-11-15', items: ['Truffle Arancini', 'Wild Mushroom Risotto'], total: 36, status: 'Delivered' },
    { id: '#6240', date: '2023-10-30', items: ['Lemon Basil Tart'], total: 10, status: 'Delivered' },
  ]
};