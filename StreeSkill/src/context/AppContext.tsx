import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContextType, Progress, Language } from '../types';

const STORAGE_KEY = 'streeskill_progress';
const createCompletedReelsMap = (): Progress['completedReels'] => Object.create(null) as Progress['completedReels'];
const createDefaultProgress = (): Progress => ({
  completedReels: createCompletedReelsMap(),
});

const defaultProgress: Progress = createDefaultProgress();

const AppContext = createContext<AppContextType | undefined>(undefined);

const getCompletedReelsForCourse = (progress: Progress, courseId: string): string[] => {
  const candidate = Object.prototype.hasOwnProperty.call(progress.completedReels, courseId)
    ? progress.completedReels[courseId]
    : undefined;

  return Array.isArray(candidate) ? candidate : [];
};

const normalizeProgress = (value: unknown): Progress => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('completedReels' in value) ||
    typeof value.completedReels !== 'object' ||
    value.completedReels === null
  ) {
    return createDefaultProgress();
  }

  const normalizedCompletedReels = Object.entries(value.completedReels).reduce<Progress['completedReels']>(
    (accumulator, [courseId, reelIds]) => {
      accumulator[courseId] = Array.isArray(reelIds)
        ? reelIds.filter((reelId): reelId is string => typeof reelId === 'string')
        : [];
      return accumulator;
    },
    createCompletedReelsMap()
  );

  return { completedReels: normalizedCompletedReels };
};

export const toggleLanguageValue = (current: Language): Language => {
  if (current === 'hindi') return 'english';
  if (current === 'english') return 'tamil';
  return 'hindi';
};

export const markReelCompleteInProgress = (
  progress: Progress,
  courseId: string,
  reelId: string
): Progress => {
  const currentCompleted = getCompletedReelsForCourse(progress, courseId);
  if (currentCompleted.includes(reelId)) {
    return progress;
  }
  return {
    ...progress,
    completedReels: {
      ...progress.completedReels,
      [courseId]: [...currentCompleted, reelId],
    },
  };
};

export const calculateProgress = (
  progress: Progress,
  courseId: string,
  totalReels: number
): { completed: number; total: number } => {
  const completed = getCompletedReelsForCourse(progress, courseId).length;
  return { completed, total: totalReels };
};

export const saveProgress = async (progress: Progress): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const loadProgress = async (): Promise<Progress> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return normalizeProgress(JSON.parse(stored));
    } catch {
      return createDefaultProgress();
    }
  }
  return createDefaultProgress();
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [language, setLanguage] = useState<Language>('hindi');

  useEffect(() => {
    loadProgress().then(setProgress).catch(console.error);
  }, []);

  const markReelComplete = (courseId: string, reelId: string) => {
    setProgress((prev) => {
      const updated = markReelCompleteInProgress(prev, courseId, reelId);
      saveProgress(updated).catch(console.error);
      return updated;
    });
  };

  const toggleLanguage = () => {
    setLanguage((prev) => toggleLanguageValue(prev));
  };

  const getProgress = (courseId: string, totalReels: number) => {
    return calculateProgress(progress, courseId, totalReels);
  };

  return (
    <AppContext.Provider
      value={{ progress, language, markReelComplete, toggleLanguage, getProgress }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
