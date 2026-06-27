import { prisma } from '@/lib/prisma';

interface PromptTemplate {
  type: string;
  template: string;
  variables: string[];
}

const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  LINKEDIN_POST: {
    type: 'LINKEDIN_POST',
    template: `Generate a professional LinkedIn post about {{topic}} for a {{tone}} audience. Keep it under 300 words. Focus on {{focus}}.`,
    variables: ['topic', 'tone', 'focus'],
  },
  INSTAGRAM_CAPTION: {
    type: 'INSTAGRAM_CAPTION',
    template: `Write an engaging Instagram caption for {{topic}}. Tone: {{tone}}. Include a call-to-action. Keep it under 150 characters.`,
    variables: ['topic', 'tone'],
  },
  SALES_EMAIL: {
    type: 'SALES_EMAIL',
    template: `Write a sales email about {{productName}} for {{audience}}. Tone: {{tone}}. Include benefit statement and CTA. Keep under 150 words.`,
    variables: ['productName', 'audience', 'tone'],
  },
  JOB_POST: {
    type: 'JOB_POST',
    template: `Create a job posting for a {{position}} role at {{company}}. Highlight {{keyRequirement}}. Tone: {{tone}}.`,
    variables: ['position', 'company', 'keyRequirement', 'tone'],
  },
  VIDEO_SCRIPT: {
    type: 'VIDEO_SCRIPT',
    template: `Write a {{length}} video script about {{topic}} in {{tone}} tone. Make it engaging and include a hook, body, and call-to-action.`,
    variables: ['length', 'topic', 'tone'],
  },
  COMPANY_ANNOUNCEMENT: {
    type: 'COMPANY_ANNOUNCEMENT',
    template: `Write a company announcement about {{news}} for {{audience}}. Tone: {{tone}}. Include impact statement and next steps.`,
    variables: ['news', 'audience', 'tone'],
  },
};

export class ContentGenerationPipelineService {
  static async generateContent(
    type: string,
    variables: Record<string, string>,
    tone: string = 'professional'
  ): Promise<string> {
    const template = PROMPT_TEMPLATES[type];
    if (!template) {
      throw new Error(`Unknown content type: ${type}`);
    }

    const prompt = this.buildPrompt(template, { ...variables, tone });
    const content = await this.callAIProvider(prompt);

    return content;
  }

  static buildPrompt(template: PromptTemplate, variables: Record<string, string>): string {
    let prompt = template.template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    }

    return prompt;
  }

  static async callAIProvider(prompt: string): Promise<string> {
    try {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      const useOpenRouter = openRouterKey && !openRouterKey.startsWith('YOUR_');
      if (!useOpenRouter && !openaiKey) {
        return this.generateFallbackContent(prompt);
      }

      const url = useOpenRouter
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useOpenRouter ? openRouterKey : openaiKey}`,
          ...(useOpenRouter ? { 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || '', 'X-Title': 'HaneXes' } : {}),
        },
        body: JSON.stringify({
          model: useOpenRouter ? (process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct') : 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional content creator. Generate high-quality, engaging content as requested.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        return this.generateFallbackContent(prompt);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.generateFallbackContent(prompt);
    } catch (error) {
      console.error('AI provider error:', error);
      return this.generateFallbackContent(prompt);
    }
  }

  static generateFallbackContent(prompt: string): string {
    if (prompt.includes('LinkedIn')) {
      return `Excited to share insights on this topic! Looking forward to connecting with professionals in this space. What are your thoughts? 💡`;
    }
    if (prompt.includes('Instagram')) {
      return `Check this out! 🚀 Let me know what you think in the comments below.`;
    }
    if (prompt.includes('sales')) {
      return `I think this could be a great opportunity for your business. Would love to chat more about how we can help. Let me know!`;
    }
    if (prompt.includes('job')) {
      return `Exciting opportunity! We are looking for talented individuals. Apply now!`;
    }
    if (prompt.includes('video')) {
      return `In this video, we dive deep into the key insights and actionable takeaways. Don't forget to like and subscribe!`;
    }
    return `Great content here! Happy to help you succeed with this initiative. Let's connect!`;
  }

  static async generateContentSeries(
    topic: string,
    contentTypes: string[],
    tone: string,
    count: number = 5
  ): Promise<Array<{ type: string; content: string }>> {
    const series = [];

    for (let i = 0; i < count; i++) {
      for (const type of contentTypes) {
        const template = PROMPT_TEMPLATES[type];
        if (!template) continue;

        const dayNumber = i + 1;
        const prompt = `${this.buildPrompt(template, { topic, tone })} (Part ${dayNumber} of ${count})`;
        const content = await this.callAIProvider(prompt);

        series.push({
          type,
          content,
        });
      }
    }

    return series;
  }

  static async validateContent(content: string, type: string): Promise<boolean> {
    const minLengths: Record<string, number> = {
      LINKEDIN_POST: 10,
      INSTAGRAM_CAPTION: 5,
      SALES_EMAIL: 20,
      JOB_POST: 30,
      VIDEO_SCRIPT: 50,
      COMPANY_ANNOUNCEMENT: 25,
    };

    const maxLengths: Record<string, number> = {
      LINKEDIN_POST: 300,
      INSTAGRAM_CAPTION: 150,
      SALES_EMAIL: 300,
      JOB_POST: 1000,
      VIDEO_SCRIPT: 2000,
      COMPANY_ANNOUNCEMENT: 500,
    };

    const wordCount = content.trim().split(/\s+/).length;
    const minLength = minLengths[type] || 10;
    const maxLength = maxLengths[type] || 5000;

    return wordCount >= minLength && wordCount <= maxLength;
  }

  static async saveGeneratedContent(
    userId: string,
    type: string,
    content: string,
    topic: string
  ): Promise<any> {
    const isValid = await this.validateContent(content, type);

    if (!isValid) {
      throw new Error(`Generated content does not meet ${type} requirements`);
    }

    const savedContent = await prisma.content.create({
      data: {
        userId,
        title: topic.substring(0, 100),
        type: type as any,
        body: content,
        aiGenerated: true,
      },
    });

    await prisma.contentVersion.create({
      data: {
        contentId: savedContent.id,
        body: content,
        versionNumber: 1,
      } as any,
    });

    return savedContent;
  }
}
