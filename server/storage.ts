import { drizzle } from "drizzle-orm/neon-serverless";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { 
  users, 
  careerProfiles, 
  savedRecommendations, 
  sessions,
  type User, 
  type InsertUser,
  type CareerProfile,
  type InsertCareerProfile,
  type SavedRecommendation,
  type InsertRecommendation
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Database connection
const databaseUrl = process.env.DATABASE_URL!;
// Fix: Use the correct neon configuration
const sql = () => { throw new Error("Database connection disabled for local testing."); };
const db = drizzle(sql);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Career profile management
  getCareerProfile(id: number): Promise<CareerProfile | undefined>;
  getCareerProfilesByUserId(userId: number): Promise<CareerProfile[]>;
  createCareerProfile(profile: InsertCareerProfile): Promise<CareerProfile>;
  updateCareerProfile(id: number, profile: Partial<InsertCareerProfile>): Promise<CareerProfile | undefined>;
  
  // Recommendations management
  getSavedRecommendations(profileId: number): Promise<SavedRecommendation[]>;
  createSavedRecommendation(recommendation: InsertRecommendation): Promise<SavedRecommendation>;

  // Session management
  createSession(sessionId: string, userId: number, expiresAt: Date): Promise<void>;
  getSession(sessionId: string): Promise<{ userId: number; expiresAt: Date } | undefined>;
  deleteSession(sessionId: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Career profile management
  async getCareerProfile(id: number): Promise<CareerProfile | undefined> {
    const result = await db.select().from(careerProfiles).where(eq(careerProfiles.id, id)).limit(1);
    return result[0];
  }

  async getCareerProfilesByUserId(userId: number): Promise<CareerProfile[]> {
    return await db.select().from(careerProfiles).where(eq(careerProfiles.userId, userId)).orderBy(desc(careerProfiles.createdAt));
  }

  async createCareerProfile(profile: InsertCareerProfile): Promise<CareerProfile> {
    const result = await db.insert(careerProfiles).values(profile).returning();
    return result[0];
  }

  async updateCareerProfile(id: number, profile: Partial<InsertCareerProfile>): Promise<CareerProfile | undefined> {
    const result = await db.update(careerProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(careerProfiles.id, id))
      .returning();
    return result[0];
  }

  // Recommendations management
  async getSavedRecommendations(profileId: number): Promise<SavedRecommendation[]> {
    return await db.select().from(savedRecommendations)
      .where(eq(savedRecommendations.profileId, profileId))
      .orderBy(desc(savedRecommendations.createdAt));
  }

  async createSavedRecommendation(recommendation: InsertRecommendation): Promise<SavedRecommendation> {
    const result = await db.insert(savedRecommendations).values(recommendation).returning();
    return result[0];
  }

  // Session management
  async createSession(sessionId: string, userId: number, expiresAt: Date): Promise<void> {
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt
    });
  }

  async getSession(sessionId: string): Promise<{ userId: number; expiresAt: Date } | undefined> {
    const result = await db.select({
      userId: sessions.userId,
      expiresAt: sessions.expiresAt
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
    
    // Handle potentially null userId (shouldn't happen in practice)
    if (result[0] && result[0].userId !== null) {
      return result[0] as { userId: number; expiresAt: Date };
    }
    return undefined;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
}

// Export a singleton instance of the storage
export const storage = new PostgresStorage();
