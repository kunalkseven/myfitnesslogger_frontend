/**
 * MuscleMemory — Database Provider
 * React context providing SQLite database instance to the app.
 * Handles web platform gracefully (SQLite not available on web).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { CREATE_TABLES_SQL } from './schema';
import { seedDatabase } from './seed';

// Conditionally import expo-sqlite only on native platforms
let SQLiteModule: typeof import('expo-sqlite') | null = null;

interface DatabaseContextType {
  db: any | null;
  isReady: boolean;
  isWeb: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isReady: false,
  isWeb: Platform.OS === 'web',
});

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    let mounted = true;

    async function initDB() {
      if (isWeb) {
        // On web, skip SQLite - mark as ready with null db
        if (mounted) setIsReady(true);
        return;
      }

      try {
        // Dynamic import for native platforms
        const SQLite = await import('expo-sqlite');
        const database = await SQLite.openDatabaseAsync('musclememory.db');

        // Enable WAL mode for better performance
        await database.execAsync('PRAGMA journal_mode = WAL;');
        await database.execAsync('PRAGMA foreign_keys = ON;');

        // Create tables
        await database.execAsync(CREATE_TABLES_SQL);

        // Seed default data
        await seedDatabase(database);

        if (mounted) {
          setDb(database);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        // Still mark as ready so the app can show fallback UI
        if (mounted) setIsReady(true);
      }
    }

    initDB();

    return () => {
      mounted = false;
    };
  }, [isWeb]);

  return (
    <DatabaseContext.Provider value={{ db, isReady, isWeb }}>
      {children}
    </DatabaseContext.Provider>
  );
};
