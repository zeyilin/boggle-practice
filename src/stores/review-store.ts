import { create } from "zustand";
import type { ReviewCard, GameRecord, DictionaryName } from "@/lib/types";
import {
  getDueReviewCards,
  getAllReviewCards,
  saveReviewCard,
  deleteReviewCard,
} from "@/lib/db";
import {
  REVIEW_ADD_THRESHOLD,
  REVIEW_INTERVALS,
  REVIEW_GRADUATE_THRESHOLD,
} from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

interface ReviewStore {
  dueCards: ReviewCard[];
  allCards: ReviewCard[];
  isLoading: boolean;
  /** The queue has been read from IndexedDB at least once. */
  hasLoaded: boolean;

  loadReviewQueue: (dictionary: DictionaryName) => Promise<void>;

  /** After a game, check if the board should be added to review */
  maybeAddToReview: (record: GameRecord) => Promise<void>;

  /** After completing a review game, update the card's schedule */
  updateAfterReview: (
    cardId: string,
    discoveryRate: number,
  ) => Promise<void>;
}

function calculateInterval(discoveryRate: number): number | null {
  if (discoveryRate > REVIEW_GRADUATE_THRESHOLD) return null; // graduate

  for (const [threshold, days] of REVIEW_INTERVALS) {
    if (discoveryRate < threshold) return days;
  }

  return 7; // fallback
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  dueCards: [],
  allCards: [],
  isLoading: false,
  hasLoaded: false,

  loadReviewQueue: async (dictionary) => {
    set({ isLoading: true });
    const [dueCards, allCards] = await Promise.all([
      getDueReviewCards(dictionary),
      getAllReviewCards(),
    ]);
    set({ dueCards, allCards, isLoading: false, hasLoaded: true });
  },

  maybeAddToReview: async (record) => {
    const totalWords = record.wordsAvailable.length;
    if (totalWords === 0) return;

    const discoveryRate = record.wordsFound.length / totalWords;
    if (discoveryRate >= REVIEW_ADD_THRESHOLD) return;

    // Check if this board already has a review card
    const allCards = await getAllReviewCards();
    const existing = allCards.find((c) => c.gameId === record.id);
    if (existing) return;

    const interval = calculateInterval(discoveryRate) ?? 1;
    const card: ReviewCard = {
      id: uuidv4(),
      gameId: record.id,
      board: record.board,
      gridSize: record.gridSize,
      dictionary: record.dictionary,
      easeFactor: 2.5,
      interval,
      nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000,
      reviewCount: 0,
      bestDiscoveryRate: discoveryRate,
    };

    await saveReviewCard(card);
    await get().loadReviewQueue(card.dictionary);
  },

  updateAfterReview: async (cardId, discoveryRate) => {
    const allCards = await getAllReviewCards();
    const card = allCards.find((c) => c.id === cardId);
    if (!card) return;

    const interval = calculateInterval(discoveryRate);

    if (interval === null) {
      // Graduate — remove from review queue
      await deleteReviewCard(cardId);
    } else {
      const updated: ReviewCard = {
        ...card,
        interval,
        nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000,
        reviewCount: card.reviewCount + 1,
        bestDiscoveryRate: Math.max(card.bestDiscoveryRate, discoveryRate),
      };
      await saveReviewCard(updated);
    }
    // Refresh what's due (the badge on home, and Play Again in review mode)
    await get().loadReviewQueue(card.dictionary);
  },
}));
