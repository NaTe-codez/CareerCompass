import { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCareerProfileSchema, 
  insertRecommendationSchema,
  careerPhaseEnum
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

// Authentication middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.session?.id;
    
    if (!sessionId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    
    const session = await storage.getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({ error: "Invalid session. Please log in again." });
    }
    
    if (session.expiresAt < new Date()) {
      await storage.deleteSession(sessionId);
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    
    // Add user ID to request
    req.user = { id: session.userId };
    next();
  } catch (error) {
    next(error);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // User Management Routes
  
  // Registration
  app.post("/api/auth/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userSchema = insertUserSchema.extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string()
      }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]
      });
      
      const userData = userSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user with hashed password
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashedPassword
      });
      
      // Create session
      const sessionId = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 1 week session
      
      await storage.createSession(sessionId, newUser.id, expiresAt);
      
      // Set session ID in cookie
      req.session!.id = sessionId;
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginSchema = z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required")
      });
      
      const loginData = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(loginData.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Compare passwords
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Create session
      const sessionId = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 1 week session
      
      await storage.createSession(sessionId, user.id, expiresAt);
      
      // Set session ID in cookie
      req.session!.id = sessionId;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Logout
  app.post("/api/auth/logout", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.session?.id;
      
      if (sessionId) {
        await storage.deleteSession(sessionId);
        req.session.destroy(err => {
          if (err) {
            console.error("Error destroying session:", err);
          }
        });
      }
      
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Current user
  app.get("/api/auth/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Career Profile Routes
  
  // Create career profile
  app.post("/api/career-profiles", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extend schema with validation for career phase
      const profileSchema = insertCareerProfileSchema.extend({
        careerPhase: z.string().refine(val => careerPhaseEnum.safeParse(val).success, {
          message: "Invalid career phase"
        })
      });
      
      const profileData = profileSchema.parse(req.body);
      
      // Add user ID to profile data
      const newProfile = await storage.createCareerProfile({
        ...profileData,
        userId: req.user!.id
      });
      
      res.status(201).json(newProfile);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all career profiles for logged in user
  app.get("/api/career-profiles", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profiles = await storage.getCareerProfilesByUserId(req.user!.id);
      res.status(200).json(profiles);
    } catch (error) {
      next(error);
    }
  });
  
  // Get career profile by ID
  app.get("/api/career-profiles/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }
      
      const profile = await storage.getCareerProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile belongs to user
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ error: "You do not have permission to access this profile" });
      }
      
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  });
  
  // Update career profile
  app.patch("/api/career-profiles/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = parseInt(req.params.id);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }
      
      const profile = await storage.getCareerProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile belongs to user
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ error: "You do not have permission to update this profile" });
      }
      
      // Validate update data
      const updateSchema = insertCareerProfileSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      // Update profile
      const updatedProfile = await storage.updateCareerProfile(profileId, updateData);
      
      res.status(200).json(updatedProfile);
    } catch (error) {
      next(error);
    }
  });
  
  // Recommendation Routes
  
  // Create recommendation for a profile
  app.post("/api/profiles/:profileId/recommendations", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = parseInt(req.params.profileId);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }
      
      const profile = await storage.getCareerProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile belongs to user
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ error: "You do not have permission to create recommendations for this profile" });
      }
      
      // Validate recommendation data
      const recommendationData = insertRecommendationSchema.parse({
        ...req.body,
        profileId
      });
      
      // Create recommendation
      const newRecommendation = await storage.createSavedRecommendation(recommendationData);
      
      res.status(201).json(newRecommendation);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all recommendations for a profile
  app.get("/api/profiles/:profileId/recommendations", authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = parseInt(req.params.profileId);
      if (isNaN(profileId)) {
        return res.status(400).json({ error: "Invalid profile ID" });
      }
      
      const profile = await storage.getCareerProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile belongs to user
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ error: "You do not have permission to access recommendations for this profile" });
      }
      
      // Get recommendations
      const recommendations = await storage.getSavedRecommendations(profileId);
      
      res.status(200).json(recommendations);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
