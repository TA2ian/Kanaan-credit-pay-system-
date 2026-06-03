/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY_MISSING');
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

// Shared handler for Gemini Reminder Generator
async function handleGeminiReminder(req: express.Request, res: express.Response) {
  const { 
    customerName, 
    clientName, 
    amount, 
    totalOwed, 
    dueDate, 
    notes, 
    tone 
  } = req.body;

  const actualCustomerName = clientName || customerName;
  const actualAmount = totalOwed !== undefined ? totalOwed : amount;

  if (!actualCustomerName || actualAmount === undefined) {
    return res.status(400).json({
      error: 'بيانات العميل أو إجمالي الدين ناقصة.',
    });
  }

  try {
    const aiClient = getGeminiClient();
    
    let instructionSuffix = "";
    if (tone === "gentle" || tone === "friendly") {
      instructionSuffix = "أسلوب تفاوضي هادئ للغاية وبأقصى درجات الاحترام والرحمة والسعة، ودعاء بالبركة في تجارته ورزقه.";
    } else if (tone === "standard" || tone === "formal") {
      instructionSuffix = "تذكير مهني لطيف وواضح، يتمنى لهم البركة والنمو ويطلب تهيئة المبلغ تمهيداً لزيارتنا المالية القادمة.";
    } else {
      instructionSuffix = "أسلوب لبق وحضاري ولكن مباشر وحازم جداً، يوضح أنه لتسوية الحسابات الدورية نحتاج سداد المبلغ المقدر بأسرع وقت.";
    }

    const prompt = `أنت المساعد المالي الذكي لـ "شركة كنعان لتوزيع الأغذية".
قم بصياغة رسالة تحصيل باللغة العربية (اللهجة الشامية المهذبة أو مبسطة فصحى) لتُرسل عبر الواتساب.

معلومات الحساب:
- اسم العميل: ${actualCustomerName}
- المبلغ المطلوب: ${actualAmount} $ (أو ما يعادله بالعملة المحلية)
- تاريخ الاستحقاق: ${dueDate || 'الزيارة القادمة'}
- التفاصيل: ${notes || 'بضائع تسليم كنعان'}

النبرة المفضلة:
${instructionSuffix}

شروط الصياغة:
1. استخدم نجوم الواتساب *لتغميق الأرقام والأسماء المهمة*.
2. وظف إيموجيات ملائمة مثل (𫪖 ، 🌾 ، 📦 ، 🚚) للتأكيد على جودة المنتجات والبركة.
3. اختتم بالتوقيع: "أخوكم عبدالرحمن كنعان".
4. أرجع نص الرسالة النهائي مباشرة دون أي شروح أو ترميز الكود البرمجي.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "لم نتمكن من صياغة الرسالة، يرجى كتابتها يدوياً.";
    
    return res.json({ 
      message: text,
      advice: "مساعد كنعان الذكي 🌾: يُنصح بإرسال الرسالة في أوقات العمل الرسمية ومتابعة العميل بود واحترام لتوطيد ثقتكم."
    });
  } catch (error: any) {
    console.error("Gemini Route Error:", error);
    if (error.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(403).json({
        error: 'أداة الذكاء الاصطناعي تحتاج لمفتاح ربط (GEMINI_API_KEY). يرجى التأكد من إضافته في لوحة الإعدادات (Settings > Secrets) في استوديو الذكاء الاصطناعي.',
      });
    }
    return res.status(500).json({ error: "فشل الاتصال بذكاء كنعان الاصطناعي." });
  }
}

// 1. API: AI Smart Debt Reminder & Analyzer
app.post('/api/ai', handleGeminiReminder);
app.post('/api/gemini/reminder', handleGeminiReminder);

// Serve frontend assets & Vite configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
