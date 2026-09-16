import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';

export type Publisher = {
    id: number;
    name: string;
};

/** All publishers ordered by name. */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));
}