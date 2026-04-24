import * as fc from 'fast-check';
import { COURSES } from '../data/mockData';
import {
  toggleLanguageValue,
  markReelCompleteInProgress,
  calculateProgress,
  saveProgress,
  loadProgress,
} from '../context/AppContext';
import { validateProductListing } from '../utils/validation';
import { Progress, Language, ProductListing } from '../types';

/**
 * **Feature: streeskill-app, Property 1: Course Reel Count Bounds**
 * *For any* course in the mock data, the number of reels SHALL be between 5 and 7 inclusive.
 * **Validates: Requirements 3.1**
 */
describe('Property 1: Course Reel Count Bounds', () => {
  test('all courses have between 5 and 7 reels', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COURSES),
        (course) => {
          const reelCount = course.reels.length;
          return reelCount >= 5 && reelCount <= 7;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: streeskill-app, Property 2: Language Toggle Alternation**
 * *For any* current language state, toggling the language SHALL switch from 'hindi' to 'tamil' or from 'tamil' to 'hindi'.
 * **Validates: Requirements 4.3**
 */
describe('Property 2: Language Toggle Alternation', () => {
  test('toggling language cycles through the supported caption languages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Language>('hindi', 'english', 'tamil'),
        (currentLanguage) => {
          const nextLanguage = toggleLanguageValue(currentLanguage);
          const secondLanguage = toggleLanguageValue(nextLanguage);
          const thirdLanguage = toggleLanguageValue(secondLanguage);

          return (
            nextLanguage !== currentLanguage &&
            secondLanguage !== currentLanguage &&
            secondLanguage !== nextLanguage &&
            thirdLanguage === currentLanguage
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: streeskill-app, Property 3: Reel Completion Updates Progress**
 * *For any* courseId and reelId, calling markReelComplete SHALL add that reelId to the completedReels array for that courseId.
 * **Validates: Requirements 4.4**
 */
describe('Property 3: Reel Completion Updates Progress', () => {
  test('marking reel complete adds it to progress', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 5 })
        ),
        (courseId, reelId, existingCompleted) => {
          const initialProgress: Progress = { completedReels: existingCompleted };
          const updatedProgress = markReelCompleteInProgress(initialProgress, courseId, reelId);
          
          return updatedProgress.completedReels[courseId]?.includes(reelId) === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: streeskill-app, Property 4: Form Validation Completeness**
 * *For any* product listing form state, validation SHALL return true only when all required fields (name, price, image) are non-empty.
 * **Validates: Requirements 5.5**
 */
describe('Property 4: Form Validation Completeness', () => {
  test('validation returns true only when all required fields are filled', () => {
    fc.assert(
      fc.property(
        fc.record({
          image: fc.oneof(fc.constant(null), fc.string()),
          name: fc.string(),
          description: fc.string(),
          price: fc.string(),
        }),
        (listing: ProductListing) => {
          const isValid = validateProductListing(listing);
          const hasImage = listing.image !== null && listing.image.trim() !== '';
          const hasName = listing.name.trim() !== '';
          const hasPrice = listing.price.trim() !== '';
          const shouldBeValid = hasImage && hasName && hasPrice;
          
          return isValid === shouldBeValid;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: streeskill-app, Property 5: Progress Persistence Round-Trip**
 * *For any* progress state, saving to AsyncStorage and then loading SHALL return an equivalent progress object.
 * **Validates: Requirements 6.2, 6.4**
 */
describe('Property 5: Progress Persistence Round-Trip', () => {
  test('saving and loading progress returns equivalent object', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 5 })
        ),
        async (completedReels) => {
          const originalProgress: Progress = { completedReels };
          await saveProgress(originalProgress);
          const loadedProgress = await loadProgress();
          
          return JSON.stringify(loadedProgress) === JSON.stringify(originalProgress);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: streeskill-app, Property 6: Progress Calculation Accuracy**
 * *For any* course and progress state, the progress badge SHALL correctly show the count of completed reels out of total reels for that course.
 * **Validates: Requirements 6.3**
 */
describe('Property 6: Progress Calculation Accuracy', () => {
  test('progress calculation returns correct completed count', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 10 }),
        fc.integer({ min: 1, max: 20 }),
        (courseId, completedReelIds, totalReels) => {
          const progress: Progress = {
            completedReels: { [courseId]: completedReelIds },
          };
          const result = calculateProgress(progress, courseId, totalReels);
          
          return result.completed === completedReelIds.length && result.total === totalReels;
        }
      ),
      { numRuns: 100 }
    );
  });
});
