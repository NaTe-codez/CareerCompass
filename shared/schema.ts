import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Career phase options as a type
export const careerPhaseEnum = z.enum([
  'student',
  'entry-level',
  'career-switcher',
  'experienced',
  'unsure'
]);

// Define users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define career profiles table
export const careerProfiles = pgTable("career_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  careerPhase: varchar("career_phase", { length: 50 }).notNull(),
  
  // Common fields for all phases
  skills: text("skills").array(),
  interests: text("interests").array(),
  goals: text("goals"),
  
  // Student specific fields
  education: text("education"),
  graduationYear: integer("graduation_year"),
  relevantCourses: text("relevant_courses"),
  
  // Professional specific fields
  currentRole: text("current_role"),
  yearsExperience: integer("years_experience"),
  accomplishments: text("accomplishments"),
  industryExpertise: text("industry_expertise"),
  keyAchievements: text("key_achievements"),
  
  // Career switcher specific fields
  previousField: text("previous_field"),
  targetField: text("target_field"),
  transitionReason: text("transition_reason"),
  transferableSkills: text("transferable_skills"),
  
  // Unsure specific fields
  currentSituation: text("current_situation"),
  careerChallenges: text("career_challenges"),
  idealJob: text("ideal_job"),
  
  // Additional fields
  additionalNotes: text("additional_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define saved recommendations table
export const savedRecommendations = pgTable("saved_recommendations", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => careerProfiles.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g., "resume", "cover_letter", "career_path", etc.
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Define sessions for authentication
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull()
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertCareerProfileSchema = createInsertSchema(careerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRecommendationSchema = createInsertSchema(savedRecommendations).omit({
  id: true,
  createdAt: true
});

// Export types
export type CareerPhase = z.infer<typeof careerPhaseEnum>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CareerProfile = typeof careerProfiles.$inferSelect;
export type InsertCareerProfile = z.infer<typeof insertCareerProfileSchema>;
export type SavedRecommendation = typeof savedRecommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
