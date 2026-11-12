import { getDb } from './database';
import { generateId } from './id-generator';

export interface SandboxIdea {
  id: string;
  content: string;
  created_at: string;
}

export async function getSandboxIdeas(): Promise<SandboxIdea[]> {
  try {
    const db = await getDb();
    const ideas = await db.select<SandboxIdea[]>(
      'SELECT * FROM sandbox_ideas ORDER BY created_at DESC'
    );
    return ideas;
  } catch (err) {
    console.error('[SandboxService] Failed to load ideas:', err);
    return [];
  }
}

export async function addSandboxIdea(content: string): Promise<string> {
  const db = await getDb();
  const id = generateId('idea');
  const now = new Date().toISOString();
  await db.execute(
    'INSERT INTO sandbox_ideas (id, content, created_at) VALUES ($1, $2, $3)',
    [id, content.trim(), now]
  );
  return id;
}

export async function deleteSandboxIdea(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM sandbox_ideas WHERE id = $1', [id]);
}
