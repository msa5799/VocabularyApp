const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vocabulary App Backend is running' });
});

// Google Translate scraping endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang = 'tr' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Try MyMemory API first (more reliable)
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
      
      const response = await axios.get(myMemoryUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'VocabularyApp/1.0'
        }
      });

      if (response.data && response.data.responseData && response.data.responseData.translatedText) {
        const translatedText = response.data.responseData.translatedText;
        return res.json({ 
          success: true, 
          originalText: text,
          translatedText: translatedText,
          targetLanguage: targetLang,
          service: 'MyMemory'
        });
      }
    } catch (myMemoryError) {
      console.log('MyMemory API failed, trying Google Translate:', myMemoryError.message);
    }

    // Fallback to Google Translate API
    const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await axios.get(googleTranslateUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Parse Google Translate response
    const data = response.data;
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translatedText = data[0][0][0];
      res.json({ 
        success: true, 
        originalText: text,
        translatedText: translatedText,
        targetLanguage: targetLang,
        service: 'Google Translate'
      });
    } else {
      throw new Error('Invalid response format from Google Translate');
    }
  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Translation failed', 
      message: error.message 
    });
  }
});

// Cambridge Dictionary scraping endpoint
app.post('/api/cambridge', async (req, res) => {
  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const url = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word)}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract definition
    const definition = $('.def').first().text().trim();
    
    // Extract pronunciation
    const pronunciation = $('.pron .ipa').first().text().trim();
    
    // Extract part of speech
    const partOfSpeech = $('.pos').first().text().trim();
    
    // Extract examples
    const examples = [];
    $('.examp .eg').each((i, elem) => {
      if (i < 3) { // Limit to 3 examples
        examples.push($(elem).text().trim());
      }
    });

    res.json({
      success: true,
      word: word,
      definition: definition || 'Definition not found',
      pronunciation: pronunciation || '',
      partOfSpeech: partOfSpeech || '',
      examples: examples
    });
  } catch (error) {
    console.error('Cambridge scraping error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Cambridge scraping failed', 
      message: error.message 
    });
  }
});

// MyMemory Translation API endpoint
app.post('/api/mymemory', async (req, res) => {
  try {
    const { text, targetLang = 'tr' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (data && data.responseData && data.responseData.translatedText) {
      res.json({
        success: true,
        originalText: text,
        translatedText: data.responseData.translatedText,
        targetLanguage: targetLang,
        confidence: data.responseData.match || 0
      });
    } else {
      throw new Error('Invalid response from MyMemory API');
    }
  } catch (error) {
    console.error('MyMemory translation error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'MyMemory translation failed', 
      message: error.message 
    });
  }
});

// CEFR Level Assessment Question Generator
app.post('/api/generate-level-test', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Generate 50 English language assessment questions for CEFR level testing. These are TEXT-BASED language proficiency questions only - NO visual elements, images, or "what is this?" type questions.
    
    Distribution:
    - A1 level: 8 questions (very basic vocabulary and simple present tense)
    - A2 level: 8 questions (everyday vocabulary and basic grammar)
    - B1 level: 10 questions (intermediate vocabulary and grammar)
    - B2 level: 10 questions (upper-intermediate with some academic vocabulary)
    - C1 level: 8 questions (advanced vocabulary and complex grammar)
    - C2 level: 6 questions (near-native proficiency)
    
    IMPORTANT: Create ONLY text-based English language questions. Focus on:
    - Grammar structures and usage
    - Vocabulary in context
    - Reading comprehension
    - Sentence completion
    - Word choice and meaning
    - Phrasal verbs and idioms
    - Collocations
    
    DO NOT create questions that:
    - Ask "what is this?" or similar identification questions
    - Require visual elements or images
    - Ask about objects without linguistic context
    
    CEFR Level Guidelines:
    
    A1 (Beginner):
    - Very basic vocabulary (family, colors, numbers, daily activities)
    - Simple present tense, basic "to be" verb
    - Common everyday words in sentences
    - Simple sentence completion
    
    A2 (Elementary):
    - Everyday vocabulary (food, shopping, work, travel)
    - Present, past, and future tenses (simple forms)
    - Basic prepositions and common phrasal verbs
    - Simple comparatives in context
    
    B1 (Intermediate):
    - More varied vocabulary including abstract concepts
    - Present perfect, past continuous, conditionals
    - Common idioms and expressions
    - Modal verbs and passive voice (simple)
    
    B2 (Upper-Intermediate):
    - Academic and professional vocabulary
    - Complex tenses and advanced grammar structures
    - Collocations and phrasal verbs
    - Formal and informal register differences
    
    C1 (Advanced):
    - Sophisticated vocabulary and academic terms
    - Complex grammatical structures and nuanced meanings
    - Advanced collocations and idiomatic expressions
    - Formal and academic language
    
    C2 (Proficiency):
    - Near-native vocabulary including rare and specialized terms
    - Subtle grammatical distinctions and complex structures
    - Advanced literary and academic language
    - Nuanced meaning and style recognition
    
    Return the response in this exact JSON format:
    {
      "questions": [
        {
          "id": 1,
          "level": "A1",
          "type": "vocabulary",
          "question": "Complete the sentence: I ___ to school every day.",
          "options": ["go", "goes", "going", "went"],
          "correctAnswer": 0,
          "explanation": "Simple present tense with first person singular."
        }
      ]
    }
    
    Make sure the JSON is valid, properly formatted, and contains exactly 50 text-based English language questions.`;
    
    // Use retry mechanism for Gemini API call
    const result = await retryWithBackoff(async () => {
      const apiResult = await model.generateContent(prompt);
      const apiResponse = await apiResult.response;
      return apiResponse.text();
    });
    
    const text = result;
    
    // Try to parse the JSON response
    let questionsData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        questionsData = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);
      
      // Fallback: return CEFR-appropriate level questions if AI response is malformed
      questionsData = {
        questions: [
          // A1 Level Questions (8 questions) - Very Basic
          {
            id: 1,
            level: "A1",
            type: "vocabulary",
            question: "What do you use to write?",
            options: ["pen", "car", "house", "tree"],
            correctAnswer: 0,
            explanation: "A pen is used for writing."
          },
          {
            id: 2,
            level: "A1",
            type: "grammar",
            question: "I ___ a student.",
            options: ["am", "is", "are", "be"],
            correctAnswer: 0,
            explanation: "'I am' is the correct form of the verb 'to be' with 'I'."
          },
          {
            id: 3,
            level: "A1",
            type: "vocabulary",
            question: "Where do you sleep?",
            options: ["kitchen", "bathroom", "bedroom", "garage"],
            correctAnswer: 2,
            explanation: "You sleep in a bedroom."
          },
          {
            id: 4,
            level: "A1",
            type: "grammar",
            question: "This ___ my book.",
            options: ["am", "is", "are", "be"],
            correctAnswer: 1,
            explanation: "'This is' is the correct form for singular objects."
          },
          {
            id: 5,
            level: "A1",
            type: "vocabulary",
            question: "What color is the sun?",
            options: ["blue", "green", "yellow", "purple"],
            correctAnswer: 2,
            explanation: "The sun is yellow."
          },
          {
            id: 6,
            level: "A1",
            type: "grammar",
            question: "She ___ my sister.",
            options: ["am", "is", "are", "be"],
            correctAnswer: 1,
            explanation: "'She is' is correct for third person singular."
          },
          {
            id: 7,
            level: "A1",
            type: "vocabulary",
            question: "How many days are in a week?",
            options: ["five", "six", "seven", "eight"],
            correctAnswer: 2,
            explanation: "There are seven days in a week."
          },
          {
            id: 8,
            level: "A1",
            type: "grammar",
            question: "We ___ happy.",
            options: ["am", "is", "are", "be"],
            correctAnswer: 2,
            explanation: "'We are' is correct for plural subjects."
          },
          // A2 Level Questions (8 questions)
          {
            id: 9,
            level: "A2",
            type: "vocabulary",
            question: "Where do you buy food?",
            options: ["library", "supermarket", "hospital", "school"],
            correctAnswer: 1,
            explanation: "You buy food at a supermarket."
          },
          {
            id: 10,
            level: "A2",
            type: "grammar",
            question: "She ___ to work every day.",
            options: ["go", "goes", "going", "went"],
            correctAnswer: 1,
            explanation: "'Goes' is the correct third person singular form."
          },
          {
            id: 11,
            level: "A2",
            type: "vocabulary",
            question: "I need to ___ my teeth before bed.",
            options: ["wash", "brush", "clean", "scrub"],
            correctAnswer: 1,
            explanation: "We 'brush' our teeth, not wash or clean them."
          },
          {
            id: 12,
            level: "A2",
            type: "grammar",
            question: "There ___ many people at the party.",
            options: ["was", "were", "is", "are"],
            correctAnswer: 1,
            explanation: "'Were' is used with plural subjects in the past tense."
          },
          {
            id: 13,
            level: "A2",
            type: "vocabulary",
            question: "What do you wear on your feet?",
            options: ["hat", "gloves", "shoes", "scarf"],
            correctAnswer: 2,
            explanation: "You wear shoes on your feet."
          },
          {
            id: 14,
            level: "A2",
            type: "grammar",
            question: "I ___ television last night.",
            options: ["watch", "watched", "watching", "watches"],
            correctAnswer: 1,
            explanation: "'Watched' is the past tense of 'watch'."
          },
          {
            id: 15,
            level: "A2",
            type: "vocabulary",
            question: "The weather is very ___ today. I need a jacket.",
            options: ["hot", "warm", "cold", "sunny"],
            correctAnswer: 2,
            explanation: "If you need a jacket, the weather is cold."
          },
          {
            id: 16,
            level: "A2",
            type: "grammar",
            question: "Can you ___ me the time?",
            options: ["say", "tell", "speak", "talk"],
            correctAnswer: 1,
            explanation: "We 'tell' someone the time, not 'say' the time."
          },
          // B1 Level Questions (10 questions)
          {
            id: 17,
            level: "B1",
            type: "vocabulary",
            question: "The meeting was ___. Everyone agreed.",
            options: ["successful", "terrible", "boring", "expensive"],
            correctAnswer: 0,
            explanation: "If everyone agreed, the meeting was successful."
          },
          {
            id: 18,
            level: "B1",
            type: "grammar",
            question: "If I ___ more time, I would travel more.",
            options: ["have", "had", "will have", "having"],
            correctAnswer: 1,
            explanation: "This is a second conditional sentence requiring 'had'."
          },
          {
            id: 19,
            level: "B1",
            type: "vocabulary",
            question: "The new employee seems very ___ and hardworking.",
            options: ["lazy", "reliable", "careless", "rude"],
            correctAnswer: 1,
            explanation: "'Reliable' fits with 'hardworking' as positive qualities."
          },
          {
            id: 20,
            level: "B1",
            type: "grammar",
            question: "I've been waiting ___ two hours.",
            options: ["since", "for", "during", "while"],
            correctAnswer: 1,
            explanation: "'For' is used with periods of time."
          },
          {
            id: 21,
            level: "B1",
            type: "vocabulary",
            question: "The doctor ___ that I should exercise more.",
            options: ["suggested", "ordered", "demanded", "insisted"],
            correctAnswer: 0,
            explanation: "'Suggested' is the most appropriate for medical advice."
          },
          {
            id: 22,
            level: "B1",
            type: "grammar",
            question: "She's the woman ___ car was stolen.",
            options: ["who", "whose", "which", "that"],
            correctAnswer: 1,
            explanation: "'Whose' shows possession - her car."
          },
          {
            id: 23,
            level: "B1",
            type: "vocabulary",
            question: "The concert was ___. The audience loved it.",
            options: ["disappointing", "boring", "outstanding", "terrible"],
            correctAnswer: 2,
            explanation: "If the audience loved it, the concert was outstanding."
          },
          {
            id: 24,
            level: "B1",
            type: "grammar",
            question: "By the time we arrived, the movie ___.",
            options: ["started", "has started", "had started", "was starting"],
            correctAnswer: 2,
            explanation: "Past perfect 'had started' shows the action was completed before another past action."
          },
          {
            id: 25,
            level: "B1",
            type: "vocabulary",
            question: "I need to ___ my presentation before tomorrow's meeting.",
            options: ["prepare", "repair", "compare", "declare"],
            correctAnswer: 0,
            explanation: "You 'prepare' a presentation before giving it."
          },
          {
            id: 26,
            level: "B1",
            type: "grammar",
            question: "The package should ___ by Friday.",
            options: ["deliver", "be delivered", "delivering", "delivered"],
            correctAnswer: 1,
            explanation: "Passive voice 'be delivered' is needed here."
          },
          // B2 Level Questions (10 questions)
          {
            id: 27,
            level: "B2",
            type: "vocabulary",
            question: "The company's profits have ___ significantly this year.",
            options: ["decreased", "increased", "remained", "fluctuated"],
            correctAnswer: 1,
            explanation: "Context suggests positive growth, so 'increased' fits best."
          },
          {
            id: 28,
            level: "B2",
            type: "grammar",
            question: "The report ___ by the team yesterday.",
            options: ["completed", "was completed", "has completed", "completing"],
            correctAnswer: 1,
            explanation: "Passive voice is needed here: 'was completed'."
          },
          {
            id: 29,
            level: "B2",
            type: "vocabulary",
            question: "The research findings were quite ___ and challenged existing theories.",
            options: ["conventional", "predictable", "groundbreaking", "ordinary"],
            correctAnswer: 2,
            explanation: "'Groundbreaking' means innovative and challenging to existing ideas."
          },
          {
            id: 30,
            level: "B2",
            type: "grammar",
            question: "___ the heavy rain, the match continued.",
            options: ["Although", "Despite", "Because of", "Due to"],
            correctAnswer: 1,
            explanation: "'Despite' is followed by a noun phrase, not a clause."
          },
          {
            id: 31,
            level: "B2",
            type: "vocabulary",
            question: "The politician's speech was designed to ___ public opinion.",
            options: ["influence", "ignore", "destroy", "confuse"],
            correctAnswer: 0,
            explanation: "Politicians typically try to 'influence' public opinion."
          },
          {
            id: 32,
            level: "B2",
            type: "grammar",
            question: "I wish I ___ more attention in school.",
            options: ["paid", "had paid", "pay", "have paid"],
            correctAnswer: 1,
            explanation: "'I wish I had paid' expresses regret about the past."
          },
          {
            id: 33,
            level: "B2",
            type: "vocabulary",
            question: "The new policy aims to ___ environmental protection with economic growth.",
            options: ["separate", "balance", "oppose", "eliminate"],
            correctAnswer: 1,
            explanation: "'Balance' means to find equilibrium between two things."
          },
          {
            id: 34,
            level: "B2",
            type: "grammar",
            question: "The building ___ for over a century when it was demolished.",
            options: ["stood", "had been standing", "was standing", "has stood"],
            correctAnswer: 1,
            explanation: "Past perfect continuous shows duration up to a past point."
          },
          {
            id: 35,
            level: "B2",
            type: "vocabulary",
            question: "The scientist's hypothesis was ___ by extensive research.",
            options: ["contradicted", "supported", "ignored", "questioned"],
            correctAnswer: 1,
            explanation: "Research typically 'supports' or validates a hypothesis."
          },
          {
            id: 36,
            level: "B2",
            type: "grammar",
            question: "The more you practice, ___ you'll become.",
            options: ["the better", "better", "the best", "best"],
            correctAnswer: 0,
            explanation: "Comparative structure: 'the more..., the better'."
          },
          // C1 Level Questions (8 questions)
          {
            id: 37,
            level: "C1",
            type: "vocabulary",
            question: "Her argument was so ___ that it convinced everyone.",
            options: ["compelling", "simple", "short", "loud"],
            correctAnswer: 0,
            explanation: "'Compelling' means convincing and persuasive."
          },
          {
            id: 38,
            level: "C1",
            type: "grammar",
            question: "___ the weather, we decided to go hiking.",
            options: ["Despite", "Because", "Although", "Notwithstanding"],
            correctAnswer: 3,
            explanation: "'Notwithstanding' is a more advanced way to express 'despite'."
          },
          {
            id: 39,
            level: "C1",
            type: "vocabulary",
            question: "The author's writing style is characterized by its ___ and sophistication.",
            options: ["simplicity", "eloquence", "confusion", "brevity"],
            correctAnswer: 1,
            explanation: "'Eloquence' refers to fluent and persuasive speaking or writing."
          },
          {
            id: 40,
            level: "C1",
            type: "grammar",
            question: "Little ___ that this decision would change everything.",
            options: ["he knew", "did he know", "he knows", "does he know"],
            correctAnswer: 1,
            explanation: "After 'little' at the beginning, we use inversion: 'did he know'."
          },
          {
            id: 41,
            level: "C1",
            type: "vocabulary",
            question: "The professor's lecture was so ___ that many students fell asleep.",
            options: ["engaging", "stimulating", "soporific", "enlightening"],
            correctAnswer: 2,
            explanation: "'Soporific' means tending to induce drowsiness or sleep."
          },
          {
            id: 42,
            level: "C1",
            type: "grammar",
            question: "The proposal ___ serious consideration by the board.",
            options: ["merits", "merit", "meriting", "merited"],
            correctAnswer: 0,
            explanation: "'Merits' (third person singular) means deserves or warrants."
          },
          {
            id: 43,
            level: "C1",
            type: "vocabulary",
            question: "The diplomat's response was deliberately ___ to avoid controversy.",
            options: ["specific", "ambiguous", "clear", "direct"],
            correctAnswer: 1,
            explanation: "'Ambiguous' means open to more than one interpretation."
          },
          {
            id: 44,
            level: "C1",
            type: "grammar",
            question: "Scarcely ___ the meeting when the fire alarm went off.",
            options: ["we had begun", "had we begun", "we began", "did we begin"],
            correctAnswer: 1,
            explanation: "After 'scarcely', we use inversion with past perfect: 'had we begun'."
          },
          {
            id: 44,
            level: "C1",
            type: "vocabulary",
            question: "The artist's work demonstrates a remarkable ___ of styles and techniques.",
            options: ["limitation", "synthesis", "separation", "rejection"],
            correctAnswer: 1,
            explanation: "'Synthesis' means the combination of different elements into a coherent whole."
          },
          {
            id: 45,
            level: "C1",
            type: "grammar",
            question: "The committee recommended that the policy ___ immediately.",
            options: ["is implemented", "be implemented", "was implemented", "will be implemented"],
            correctAnswer: 1,
            explanation: "After 'recommend that', we use the subjunctive: 'be implemented'."
          },
          // C2 Level Questions (5 questions)
          {
            id: 46,
            level: "C2",
            type: "vocabulary",
            question: "The politician's speech was full of ___ designed to avoid direct answers.",
            options: ["honesty", "clarity", "obfuscation", "simplicity"],
            correctAnswer: 2,
            explanation: "'Obfuscation' means deliberately making something unclear."
          },
          {
            id: 47,
            level: "C2",
            type: "grammar",
            question: "Were it not for your intervention, the situation ___ much worse.",
            options: ["would be", "would have been", "will be", "had been"],
            correctAnswer: 1,
            explanation: "This is an inverted conditional requiring 'would have been'."
          },
          {
            id: 48,
            level: "C2",
            type: "vocabulary",
            question: "The scholar's argument was so ___ that it defied easy categorization.",
            options: ["simple", "nuanced", "obvious", "superficial"],
            correctAnswer: 1,
            explanation: "'Nuanced' means characterized by subtle shades of meaning."
          },
          {
            id: 49,
            level: "C2",
            type: "grammar",
            question: "The manuscript, ___ authenticity had long been questioned, was finally verified.",
            options: ["which", "whose", "that", "what"],
            correctAnswer: 1,
            explanation: "'Whose' indicates possession - the manuscript's authenticity."
          },
          {
            id: 50,
            level: "C2",
            type: "vocabulary",
            question: "The author's prose style is characterized by its ___ and intellectual rigor.",
            options: ["verbosity", "perspicacity", "ambiguity", "superficiality"],
            correctAnswer: 1,
            explanation: "'Perspicacity' means having keen insight and understanding."
          }
        ]
      };
    }
    
    res.json({
      success: true,
      questions: questionsData.questions || [],
      generatedBy: 'Google Gemini AI'
    });
    
  } catch (error) {
    console.error('Gemini AI Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate questions',
      message: error.message
    });
  }
});

// Rate limiting için basit in-memory store
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 8; // Gemini free tier limit is 10, we use 8 to be safe

// Rate limiting middleware
function checkRateLimit(req, res, next) {
  const clientId = req.ip || 'default';
  const now = Date.now();
  
  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitStore.get(clientId);
  
  if (now > clientData.resetTime) {
    // Reset the counter
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (clientData.count >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        if (i === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// Gemini AI Word Learning Assistant endpoint
app.post('/api/word-learning-assistant', checkRateLimit, async (req, res) => {
  try {
    const { word, userLevel = 'beginner', context = '' } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
    As an English language learning assistant, analyze the word "${word}" and provide:
    
    1. CEFR Level (A1, A2, B1, B2, C1, C2)
    2. Difficulty Score (1-10, where 1 is easiest)
    3. Learning Priority (high/medium/low) for a ${userLevel} level student
    4. Memory Techniques (2-3 specific techniques to remember this word)
    5. Usage Context (formal/informal/academic/casual)
    6. Common Collocations (3-5 words that commonly go with this word)
    7. Similar Words (synonyms and related words)
    8. Learning Tips (specific advice for mastering this word)
    
    ${context ? `Context provided: "${context}"` : ''}
    
    Please respond in JSON format with the following structure:
    {
      "word": "${word}",
      "cefrLevel": "B1",
      "difficultyScore": 5,
      "learningPriority": "medium",
      "memoryTechniques": ["technique1", "technique2"],
      "usageContext": "casual",
      "collocations": ["word1", "word2", "word3"],
      "similarWords": ["synonym1", "synonym2"],
      "learningTips": "Specific advice for learning this word",
      "explanation": "Brief explanation of why this level/difficulty was assigned"
    }
    `;

    // Use retry mechanism for Gemini API call
    const result = await retryWithBackoff(async () => {
      const apiResult = await model.generateContent(prompt);
      const apiResponse = await apiResult.response;
      return apiResponse.text();
    });
    
    const text = result;
    
    try {
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        res.json({
          success: true,
          analysis: analysisData
        });
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // If JSON parsing fails, return raw text
      res.json({
        success: true,
        analysis: {
          word: word,
          rawResponse: text,
          cefrLevel: 'B1', // Default fallback
          difficultyScore: 5,
          learningPriority: 'medium'
        }
      });
    }
    
  } catch (error) {
    console.error('Gemini AI Word Learning error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Word learning analysis failed', 
      message: error.message 
    });
  }
});

// Gemini AI Personalized Learning Path endpoint
app.post('/api/personalized-learning-path', checkRateLimit, async (req, res) => {
  try {
    const { words, userLevel = 'beginner', learningGoals = [], weakAreas = [] } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Words array is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
    As an English learning specialist, create a personalized learning path for a ${userLevel} level student.
    
    Words to learn: ${words.join(', ')}
    Learning goals: ${learningGoals.join(', ') || 'General improvement'}
    Weak areas: ${weakAreas.join(', ') || 'None specified'}
    
    Please provide:
    1. Recommended learning order (prioritize words by importance and difficulty)
    2. Study schedule (how many words per day/week)
    3. Learning techniques for each word
    4. Practice exercises suggestions
    5. Review intervals (spaced repetition schedule)
    6. Progress milestones
    
    Respond in JSON format:
    {
      "learningPath": [
        {
          "word": "word1",
          "priority": 1,
          "studyDay": 1,
          "techniques": ["technique1", "technique2"],
          "exercises": ["exercise1", "exercise2"],
          "reviewDays": [1, 3, 7, 14]
        }
      ],
      "schedule": {
        "wordsPerDay": 3,
        "studyDuration": "15-20 minutes",
        "totalDays": 10
      },
      "milestones": [
        {
          "day": 7,
          "goal": "Master first 5 words",
          "assessment": "Quick quiz"
        }
      ]
    }
    `;

    // Use retry mechanism for Gemini API call
    const result = await retryWithBackoff(async () => {
      const apiResult = await model.generateContent(prompt);
      const apiResponse = await apiResult.response;
      return apiResponse.text();
    });
    
    const text = result;
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const pathData = JSON.parse(jsonMatch[0]);
        res.json({
          success: true,
          learningPath: pathData
        });
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      res.json({
        success: true,
        learningPath: {
          rawResponse: text,
          schedule: {
            wordsPerDay: Math.min(3, words.length),
            studyDuration: '15-20 minutes',
            totalDays: Math.ceil(words.length / 3)
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Gemini AI Learning Path error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Learning path generation failed', 
      message: error.message 
    });
  }
});

// AI Word Suggestions Endpoint
app.post('/api/ai-word-suggestions', checkRateLimit, async (req, res) => {
  try {
    const { level, limit = 10, language = 'english', excludeWords = [] } = req.body;
    
    if (!level) {
      return res.status(400).json({ 
        success: false, 
        error: 'Level parameter is required' 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create exclude words text for prompt
    const excludeWordsText = excludeWords.length > 0 
      ? `\n\nIMPORTANT: Do NOT include any of these words that the user already knows: ${excludeWords.join(', ')}. Generate completely different words.`
      : '';

    const prompt = `Generate ${limit} English words suitable for CEFR level ${level} learners. 
    
    Requirements:
    - Words should be appropriate for ${level} level (A1=beginner, A2=elementary, B1=intermediate, B2=upper-intermediate, C1=advanced, C2=proficient)
    - Include a mix of different parts of speech (nouns, verbs, adjectives, adverbs)
    - Prioritize commonly used, practical vocabulary
    - Avoid overly technical or specialized terms unless appropriate for the level
    - Each word should be useful for daily communication${excludeWordsText}
    
    Please respond with a JSON array of objects, each containing:
    {
      "word": "example",
      "definition": "brief English definition",
      "definition_tr": "Turkish translation",
      "part_of_speech": "noun/verb/adjective/etc",
      "example": "example sentence in English"
    }
    
    Return only the JSON array, no additional text.`;

    // Use retry mechanism for Gemini API call
    const result = await retryWithBackoff(async () => {
      const apiResult = await model.generateContent(prompt);
      const apiResponse = await apiResult.response;
      return apiResponse.text();
    });
    
    let text = result;
    
    // Clean up the response text
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const words = JSON.parse(text);
      
      if (Array.isArray(words) && words.length > 0) {
        res.json({
          success: true,
          words: words.slice(0, limit), // Ensure we don't exceed the limit
          level: level,
          count: Math.min(words.length, limit)
        });
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw AI response:', text);
      
      // Fallback: try to extract words from raw text
      const fallbackWords = [];
      const lines = text.split('\n').filter(line => line.trim());
      
      for (let i = 0; i < Math.min(lines.length, limit); i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('{') && !line.startsWith('[')) {
          // Simple word extraction
          const word = line.replace(/[^a-zA-Z]/g, '').toLowerCase();
          if (word.length > 2) {
            fallbackWords.push({
              word: word,
              definition: `A ${level} level English word`,
              definition_tr: `${level} seviyesi İngilizce kelime`,
              part_of_speech: 'unknown',
              example: `This is an example with ${word}.`
            });
          }
        }
      }
      
      if (fallbackWords.length > 0) {
        res.json({
          success: true,
          words: fallbackWords,
          level: level,
          count: fallbackWords.length,
          note: 'Fallback word generation used'
        });
      } else {
        throw parseError;
      }
    }
    
  } catch (error) {
    console.error('AI Word Suggestions error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Word suggestions generation failed', 
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Vocabulary App Backend is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔤 Translation API: http://localhost:${PORT}/api/translate`);
  console.log(`📚 Cambridge API: http://localhost:${PORT}/api/cambridge`);
  console.log(`🧠 Level Test API: http://localhost:${PORT}/api/generate-level-test`);
  console.log(`🌐 MyMemory API: http://localhost:${PORT}/api/mymemory`);
  console.log(`🤖 Gemini Word Learning API: http://localhost:${PORT}/api/word-learning-assistant`);
  console.log(`📈 Personalized Learning Path API: http://localhost:${PORT}/api/personalized-learning-path`);
  console.log(`🎯 AI Word Suggestions API: http://localhost:${PORT}/api/ai-word-suggestions`);
});

module.exports = app;