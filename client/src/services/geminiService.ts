import { GoogleGenAI, Chat } from "@google/genai";
import { MENU_ITEMS } from "../constants";

let chatSession: Chat | null = null;

const getSystemInstruction = () => {
  const menuText = MENU_ITEMS.map(item => 
    `- ${item.name} ($${item.price}): ${item.description} [${item.category}] Tags: ${item.tags.join(', ')}`
  ).join('\n');

  return `You are "Chef Gustav", the AI Concierge for Savoria Bistro. 
  Your goal is to assist customers with menu questions, dietary requirements, and recommendations.
  
  Here is our current menu:
  ${menuText}
  
  Rules:
  1. Be polite, warm, and professional.
  2. If asked about items not on the menu, politely inform them we don't serve that but suggest a similar item from our menu.
  3. Keep answers concise (under 100 words) unless asked for a detailed description.
  4. If asked about allergies, always recommend checking with the server for safety, even if the tag says GF/Vegan.
  5. Suggest wine pairings if appropriate (invent reasonable pairings based on the dish flavors).
  `;
};

export const initializeChat = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(),
      temperature: 0.7,
    },
  });

  return chatSession;
};

export const sendMessageToChef = async function* (message: string) {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  try {
    const result = await chatSession.sendMessageStream({ message });
    
    for await (const chunk of result) {
       yield chunk.text;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield "I apologize, but I'm having trouble connecting to the kitchen right now. Please try again in a moment.";
  }
};