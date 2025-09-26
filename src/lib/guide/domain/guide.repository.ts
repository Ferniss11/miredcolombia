// src/lib/guide/domain/guide.repository.ts
import type { Guide } from './guide.entity';

/**
 * Defines the contract (port) for interacting with the guide data persistence layer.
 */
export interface GuideRepository {
  create(guide: Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guide>;
  findById(id: string): Promise<Guide | null>;
  findAll(): Promise<Guide[]>;
  update(id: string, data: Partial<Omit<Guide, 'id' | 'createdAt'>>): Promise<Guide>;
  delete(id: string): Promise<void>;
}
