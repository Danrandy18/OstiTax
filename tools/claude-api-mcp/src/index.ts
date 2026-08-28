#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const DEFAULT_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-5-20250929';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada.');
  }
  return new Anthropic({ apiKey });
}

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

const server = new McpServer({
  name: 'claude-api',
  version: '1.0.0',
});

server.tool(
  'ask_claude',
  'Envía un prompt a Claude y devuelve la respuesta de texto. Útil para segunda opinión, diseño o análisis.',
  {
    prompt: z.string().describe('Mensaje o pregunta para Claude'),
    model: z.string().optional().describe('Modelo de Claude (opcional)'),
    max_tokens: z.number().int().min(1).max(8192).optional().describe('Máximo de tokens de salida'),
    system: z.string().optional().describe('Instrucciones de sistema opcionales'),
  },
  async ({ prompt, model, max_tokens, system }) => {
    const client = getClient();
    const response = await client.messages.create({
      model: model ?? DEFAULT_MODEL,
      max_tokens: max_tokens ?? 2048,
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: extractText(response.content),
        },
      ],
    };
  },
);

server.tool(
  'review_with_claude',
  'Pide a Claude una revisión estructurada de código, arquitectura o diseño.',
  {
    subject: z.string().describe('Qué se debe revisar'),
    content: z.string().describe('Código, diff o descripción a revisar'),
    focus: z
      .enum(['bugs', 'security', 'architecture', 'performance', 'ux', 'general'])
      .optional()
      .describe('Enfoque principal de la revisión'),
  },
  async ({ subject, content, focus = 'general' }) => {
    const client = getClient();
    const system = `Eres un revisor técnico senior. Responde en español salvo que el contenido esté claramente en otro idioma. Enfócate en: ${focus}.`;

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system,
      messages: [
        {
          role: 'user',
          content: `Revisa lo siguiente sobre "${subject}":\n\n${content}`,
        },
      ],
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: extractText(response.content),
        },
      ],
    };
  },
);

server.tool(
  'count_tokens',
  'Estima tokens de un texto con la API de Anthropic.',
  {
    text: z.string().describe('Texto a contar'),
    model: z.string().optional().describe('Modelo de referencia'),
  },
  async ({ text, model }) => {
    const client = getClient();
    const result = await client.messages.countTokens({
      model: model ?? DEFAULT_MODEL,
      messages: [{ role: 'user', content: text }],
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
