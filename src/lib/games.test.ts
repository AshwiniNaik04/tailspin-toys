import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getFilteredGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

async function seedFilterGames(db: Database): Promise<{
    strategyId: number;
    puzzleId: number;
    publisherOneId: number;
    publisherTwoId: number;
}> {
    const [{ id: strategyId }, { id: puzzleId }] = await Promise.all([
        db.insert(categories).values({ name: 'Strategy', description: 'strategy' }).returning({ id: categories.id }),
        db.insert(categories).values({ name: 'Puzzle', description: 'puzzle' }).returning({ id: categories.id }),
    ]).then(([strategy, puzzle]) => [strategy[0], puzzle[0]] as const);
    const [{ id: publisherOneId }, { id: publisherTwoId }] = await Promise.all([
        db.insert(publishers).values({ name: 'Pub One', description: 'first' }).returning({ id: publishers.id }),
        db.insert(publishers).values({ name: 'Pub Two', description: 'second' }).returning({ id: publishers.id }),
    ]).then(([publisherOne, publisherTwo]) => [publisherOne[0], publisherTwo[0]] as const);

    await db.insert(games).values([
        { title: 'Alpha Strategy', description: 'one', starRating: 4, categoryId: strategyId, publisherId: publisherOneId },
        { title: 'Beta Puzzle', description: 'two', starRating: 4, categoryId: puzzleId, publisherId: publisherOneId },
        { title: 'Gamma Strategy', description: 'three', starRating: 4, categoryId: strategyId, publisherId: publisherTwoId },
    ]);

    return { strategyId, puzzleId, publisherOneId, publisherTwoId };
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('filters by one or more categories', async () => {
        const { strategyId, puzzleId } = await seedFilterGames(db);

        const filtered = await getFilteredGames(db, { categoryIds: [strategyId, puzzleId] });

        expect(filtered).toHaveLength(3);
        expect(filtered.map((game) => game.title)).toEqual([
            'Alpha Strategy',
            'Beta Puzzle',
            'Gamma Strategy',
        ]);
    });

    it('combines category and publisher filters', async () => {
        const { strategyId, publisherOneId } = await seedFilterGames(db);

        const filtered = await getFilteredGames(db, {
            categoryIds: [strategyId],
            publisherId: publisherOneId,
        });

        expect(filtered.map((game) => game.title)).toEqual(['Alpha Strategy']);
    });
});
