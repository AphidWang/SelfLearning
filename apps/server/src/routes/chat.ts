import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

router.post('/completions', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    
    // 轉換 LangChain 格式到 xAI 格式
    const messages = body.messages || [];
    const xaiBody = {
      messages: messages.map((msg: any) => ({
        role: msg.type || msg.role,
        content: msg.content
      })),
      model: process.env.XAI_MODEL_NAME,
      temperature: body.temperature || 0.7,
      stream: false
    };
    
    const response = await fetch(`${process.env.XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify(xaiBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('xAI API error:', error);
      return res.status(response.status).json({
        error: error.message || 'API request failed'
      });
    }

    const data = await response.json();
    
    // 轉換 xAI 回應到 LangChain 格式
    return res.json({
      id: data.id,
      object: 'chat.completion',
      created: Date.now(),
      model: data.model,
      choices: data.choices.map((choice: any) => ({
        index: 0,
        message: {
          role: 'assistant',
          content: choice.message.content
        },
        finish_reason: choice.finish_reason
      }))
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Failed to process request'
    });
  }
});

export default router; 