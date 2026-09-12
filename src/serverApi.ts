import express, { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const apiRouter = Router();
apiRouter.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Generate Full Curated Party Plan
apiRouter.post('/plan-party', async (req: Request, res: Response) => {
  try {
    const {
      partyType = 'Birthday Celebration',
      theme = 'Tropical Sunkissed Fiesta',
      budget = 200,
      guestCount = 15,
      adultCount = 12,
      kidCount = 3,
      dietaryRestrictions = [],
      specialRequests = '',
      indoorOutdoor = 'indoor',
      vibe = 'Upbeat & Lively',
    } = req.body;

    const prompt = `You are CymbalMart's expert Chief Party Concierge & Shopping Strategist.
Create a complete, budget-conscious, realistic shopping list and hosting plan for a customer shopping at CymbalMart superstore.

Party Parameters:
- Party Type: ${partyType}
- Theme: ${theme}
- Total Guest Count: ${guestCount} (Adults: ${adultCount}, Kids: ${kidCount})
- Total Budget: $${budget} (HARD CONSTRAINT: The sum of (unitPrice * quantity) for all items MUST be less than or equal to $${budget}, ideally between $${Math.max(20, Math.floor(budget * 0.88))} and $${budget})
- Dietary Restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None specified'}
- Location: ${indoorOutdoor}
- Vibe / Atmosphere: ${vibe}
- Special Notes & Requests: ${specialRequests || 'Standard party needs'}

CymbalMart Store Brands to use realistically:
- 'Cymbal Fresh' (Fresh produce, butcher meats, deli platters)
- 'Cymbal Market' (Artisanal dips, organic snacks, sauces)
- 'Cymbal Basics' (Great value essentials, chips, napkins, ice, paper goods)
- 'Cymbal Select' (Premium cheeses, charcuterie, specialty sodas)
- 'Cymbal Eco' (100% compostable plates, birchwood cutlery, unbleached napkins)
- 'Cymbal Party+' (Balloons, garlands, tableware, photo props, glow favors)
- 'Cymbal Craft' (Cocktail/mocktail mixers, artisanal tonics)
- 'Cymbal Living' (Fairy lights, table runners, scented diffusers)
- 'Cymbal Bakery' (Fresh cakes, cupcakes, pastries, artisan rolls)

Requirements:
1. Distribute items realistically across:
   - 'food' (appetizers, finger foods, main bites, desserts)
   - 'beverages' (punch base, seltzers/sodas, ice bags, garnishes)
   - 'tableware' (plates, cups, napkins, cutlery, serving bowls)
   - 'decor' (thematic banner, lighting/candles, centerpiece)
   - 'entertainment' (games, photo props, or party favors)
2. Every item must have realistic superstore pricing (e.g. $2.99 - $18.99).
3. Quantities must precisely match the guest count of ${guestCount}.
4. Provide a signature batch recipe (mocktail, punch, or signature snack) scaled for ${guestCount} guests.
5. Provide a prep timeline with actionable milestones.
6. Provide 3 host tips.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert party planner for CymbalMart. You always return pristine, structured JSON with realistic grocery and party supply prices, accurate serving math for guest counts, and strict budget adherence.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Catchy party title' },
            themeVibe: { type: Type.STRING, description: 'Atmospheric summary of vibe and decor' },
            servingsNote: { type: Type.STRING, description: 'Portion math explanation for guest count' },
            targetBudget: { type: Type.NUMBER },
            estimatedCost: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  department: { type: Type.STRING, enum: ['food', 'beverages', 'tableware', 'decor', 'entertainment'] },
                  aisle: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  quantity: { type: Type.INTEGER },
                  packageSize: { type: Type.STRING },
                  servingsPerPack: { type: Type.STRING },
                  dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  whyNeeded: { type: Type.STRING },
                  budgetAlternative: { type: Type.STRING },
                  premiumAlternative: { type: Type.STRING },
                },
                required: ['id', 'name', 'brand', 'department', 'aisle', 'unitPrice', 'quantity', 'packageSize', 'whyNeeded'],
              },
            },
            prepTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  title: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        done: { type: Type.BOOLEAN },
                      },
                      required: ['id', 'text', 'done'],
                    },
                  },
                },
                required: ['id', 'timeframe', 'title', 'tasks'],
              },
            },
            signatureRecipe: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Drink', 'Mocktail', 'Cocktail', 'Appetizer', 'Dessert'] },
                servings: { type: Type.NUMBER },
                prepTime: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['name', 'type', 'servings', 'prepTime', 'ingredients', 'instructions'],
            },
            partyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'themeVibe', 'servingsNote', 'items', 'prepTimeline', 'partyTips'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response generated from Gemini API');
    }

    const planData = JSON.parse(text);
    res.json({
      success: true,
      data: {
        ...planData,
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        guestCount,
        partyType,
        targetBudget: budget,
      },
    });
  } catch (error: any) {
    console.error('Error planning party:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate party shopping plan',
    });
  }
});

// 2. AI Budget Rebalancer
apiRouter.post('/rebalance-budget', async (req: Request, res: Response) => {
  try {
    const { currentItems = [], currentTotal = 0, targetBudget = 150, strategy = 'balanced' } = req.body;

    const prompt = `You are CymbalMart's AI Budget Optimizer.
The user is currently planning a party shopping list at CymbalMart with a target budget of $${targetBudget}.
Current Total: $${currentTotal.toFixed(2)}.
Strategy: ${strategy} (options: 'budget-first' reduce non-essentials aggressively; 'keep-food' preserve fresh food platters and cut decor/extras; 'balanced' smart swaps to Cymbal Basics and portion adjustments).

Current Items in Cart:
${JSON.stringify(currentItems, null, 2)}

Task:
Rebalance the shopping list so that the new total is strictly <= $${targetBudget}.
- You can reduce item quantities where reasonable (e.g. 3 packs of cups down to 2).
- You can replace items with cheaper Cymbal Basics alternatives.
- You can remove non-essential luxury items if necessary.
- Return the updated list of items with clear explanations of savings made.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You optimize grocery and party carts to strictly fit the target budget without leaving guests hungry or lacking basic tableware.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Summary of the rebalance adjustments and total savings achieved' },
            newTotal: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  department: { type: Type.STRING, enum: ['food', 'beverages', 'tableware', 'decor', 'entertainment'] },
                  aisle: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  quantity: { type: Type.INTEGER },
                  packageSize: { type: Type.STRING },
                  servingsPerPack: { type: Type.STRING },
                  dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  whyNeeded: { type: Type.STRING },
                  budgetAlternative: { type: Type.STRING },
                  premiumAlternative: { type: Type.STRING },
                },
                required: ['id', 'name', 'brand', 'department', 'aisle', 'unitPrice', 'quantity', 'packageSize', 'whyNeeded'],
              },
            },
            savingsTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'newTotal', 'items', 'savingsTips'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('No rebalance response from Gemini');
    const result = JSON.parse(text);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error rebalancing budget:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Interactive CymbalMart Assistant Chat
apiRouter.post('/chat-agent', async (req: Request, res: Response) => {
  try {
    const { messages = [], currentPlan } = req.body;

    const planContext = currentPlan
      ? `Current Customer Party Context:
Title: ${currentPlan.title}
Theme: ${currentPlan.themeVibe}
Guest Count: ${currentPlan.guestCount}
Target Budget: $${currentPlan.targetBudget}
Items in Cart: ${currentPlan.items?.length || 0} items
Current Cart Total: $${currentPlan.items?.reduce((s: number, i: any) => s + (i.unitPrice * i.quantity), 0).toFixed(2)}
`
      : 'Customer is browsing general CymbalMart store services.';

    const systemInstruction = `You are "CymbalMart Assistant", the friendly, knowledgeable, and proactive AI chatbot for CymbalMart Superstores.
Your goal is to assist customers with:
1. Party planning, grocery manifest calculation, beverage/ice calculations, and signature recipes.
2. Store information:
   - Store Hours: Mon-Sun 6:00 AM - 11:00 PM (Supercenter Flagship #104).
   - Curbside Pickup: Free on orders over $35, pickup bays 1-12 on North side.
   - Same-Day Express Delivery: 2-hour delivery window ($5.99, free for Cymbal Rewards+ members).
   - Return Policy: 90-day hassle-free returns with digital or paper receipt; 100% Freshness Guarantee on all produce and bakery goods.
   - Cymbal Rewards: Earn 2 points per $1 spent, $10 off coupon on party orders over $100.
3. CymbalMart Exclusive Store Brands:
   - "Cymbal Fresh" (Butcher, deli, organic produce)
   - "Cymbal Basics" (Value essentials, napkins, paper plates, ice, chips)
   - "Cymbal Select" (Gourmet cheeses, artisan charcuterie, imported sodas)
   - "Cymbal Eco" (100% compostable tableware, plant-fiber cutlery)
   - "Cymbal Craft" (Artisanal mixers, tonics, cocktail garnishes)
   - "Cymbal Bakery" (Fresh party sheet cakes, sliders buns, mini cupcakes)
   - "Cymbal Party+" (Balloons, garlands, tableware, favors)
4. Aisle Directory:
   - Aisle 1-2: Fresh Produce & Salad Kits
   - Aisle 3: Chips, Pretzels, Salsa & Dips
   - Aisle 4: Deli Cheeses, Charcuterie Platters & Bakery
   - Aisle 5: Sparkling Waters, Craft Tonics & Mixers
   - Aisle 6: Sodas, Juices & Canned Beverages
   - Aisle 7: Paper Plates, Cups, Napkins & Eco-Tableware
   - Aisle 8: Party Banners, Balloons & Theme Decor
   - Aisle 9: Bags of Ice, Coolers & Party Accessories
   - Aisle 10: Backyard Games, Tabletop Fun & Favors

Tone: Enthusiastic, helpful, concise, well-formatted with markdown and emoji highlights.
When recommending a specific item to buy or add, format it clearly with price, brand, and aisle so the customer can easily find it or add it to their manifest.`;

    const chatMessages = [
      {
        role: 'user' as const,
        parts: [
          { text: `System Context & Current State:\n${planContext}\n\nUser conversation history:\n${JSON.stringify(messages)}` },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: chatMessages,
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      message: response.text || 'Hello! I am your CymbalMart Assistant. How can I help you today with your shopping or event?',
    });
  } catch (error: any) {
    console.error('Error in CymbalMart Assistant chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
