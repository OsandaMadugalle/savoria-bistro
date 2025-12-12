import { GoogleGenAI, Chat } from "@google/genai";
import { MENU_ITEMS } from "../constants";

let chatSession: Chat | null = null;


const getSystemInstruction = (menu = MENU_ITEMS) => {
  // Group menu items by category
  const categories = ['Starter', 'Main', 'Dessert', 'Drink'];
  const grouped = categories.map(cat => {
    const items = menu.filter(item => item.category === cat).slice(0, 2);
    if (!items.length) return '';
    const header = `${cat.toUpperCase()}\n${'-'.repeat(28)}`;
    const itemLines = items.map(item => {
      const tags = item.tags && item.tags.length ? ` [${item.tags.join(', ')}]` : '';
      return `${item.name}${tags}  $${item.price}\n  ${item.description}`;
    }).join('\n\n');
    return `${header}\n${itemLines}`;
  }).filter(Boolean).join('\n\n');

  return `You are \"Chef Gustav\", the AI Concierge for Savoria Bistro.\n\nGreet the guest warmly and help with any menu, dietary, or general restaurant questions.\n\nIMPORTANT: If the guest asks about contact information, hours, location, reservations, private events, or anything about the site or restaurant, answer helpfully and concisely.\n\nFor contact: Savoria Bistro, 123 Galle Road, Colombo 03, Sri Lanka. Phone: +94 11 234 5678. Email: info@savoriabistro.com, events@savoriabistro.com.\nHours: Mon-Thu 11:00 AM - 10:00 PM, Fri-Sat 11:00 AM - 11:00 PM, Sun 10:00 AM - 9:30 PM.\nReservations: Available online or by phone.\nPrivate events: We host private events—please inquire for details.\n\nWhen showing the menu: Present as plain text only. Do NOT use markdown, asterisks, or bold. Use clear section headers and spacing.\n\nSavoria Bistro Menu (sample):\n${grouped}\n\nFor the full menu, please visit our Menu page: [Menu](#/menu)\n\nIf asked about items not on the menu, politely inform them we don't serve that but suggest a similar item from our menu.\nIf asked about allergies, always recommend checking with the server for safety, even if the tag says GF/Vegan.\nKeep answers concise (under 100 words) unless asked for a detailed description.\nSuggest wine pairings if appropriate (invent reasonable pairings based on the dish flavors).`;
};

export const initializeChat = (menu?: any[]): Chat => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(menu),
      temperature: 0.7,
    },
  });

  return chatSession;
};

export const sendMessageToChef = async function* (message: string, context?: { menu?: any[] }) {
  if (!chatSession || (context && context.menu)) {
    initializeChat(context?.menu);
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  try {
    const result = await chatSession.sendMessageStream({ message });
    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Check for quota exceeded error
    if (typeof error?.message === 'string' && error.message.includes('quota')) {
      yield "Sorry, our AI Chef has reached its daily conversation limit. Please try again tomorrow or contact the restaurant directly for assistance.";
    } else {
      yield "I apologize, but I'm having trouble connecting to the kitchen right now. Please try again in a moment.";
    }
  }
};