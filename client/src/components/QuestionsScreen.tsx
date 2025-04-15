import { useState } from "react";
import { motion } from "framer-motion";
import { useStore, CareerPhase } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type QuestionForm = {
  skills: string[];
  experience: string;
  education: string;
  interests: string[];
  goals: string;
  [key: string]: any;
};

export default function QuestionsScreen() {
  const { careerPhase, setCurrentStep } = useStore();
  const [currentStep, setStep] = useState(0);
  const [form, setForm] = useState<QuestionForm>({
    skills: [],
    experience: "",
    education: "",
    interests: [],
    goals: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // First check if user is logged in, if not create a temporary user
      let userId = 0;
      
      // Attempt to find the current user
      try {
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.id;
        } else {
          // Auto-register a temporary user
          const username = `user_${Math.floor(Math.random() * 1000000)}`;
          const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          
          const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username,
              password,
              confirmPassword: password
            })
          });
          
          if (registerResponse.ok) {
            const newUser = await registerResponse.json();
            userId = newUser.id;
          } else {
            throw new Error('Failed to create temp user');
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
      
      // If we have a user, create a career profile
      if (userId) {
        // Format form data for API
        const profileData = {
          userId,
          careerPhase,
          skills: [...form.skills, ...(form.otherSkills || [])],
          interests: [...form.interests, ...(form.otherInterests || [])],
          goals: form.goals,
          // Include all possible fields based on career phase
          ...(careerPhase === 'student' && {
            education: form.education,
            graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
            relevantCourses: form.relevantCourses
          }),
          ...(careerPhase === 'entry-level' && {
            currentRole: form.currentRole,
            yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
            accomplishments: form.accomplishments
          }),
          ...(careerPhase === 'career-switcher' && {
            previousField: form.previousField,
            targetField: form.targetField,
            transitionReason: form.transitionReason,
            transferableSkills: form.transferableSkills
          }),
          ...(careerPhase === 'experienced' && {
            currentRole: form.currentRole,
            yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
            industryExpertise: form.industryExpertise,
            keyAchievements: form.keyAchievements
          }),
          ...(careerPhase === 'unsure' && {
            currentSituation: form.currentSituation,
            careerChallenges: form.careerChallenges,
            idealJob: form.ideaJob
          })
        };
        
        try {
          const profileResponse = await fetch('/api/career-profiles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
          });
          
          if (!profileResponse.ok) {
            throw new Error('Failed to save career profile');
          }
          
          // Get the profile data with ID
          const savedProfile = await profileResponse.json();
          
          // Store profile ID in localStorage for later use in results
          localStorage.setItem('currentProfileId', savedProfile.id.toString());
        } catch (error) {
          console.error('Profile save error:', error);
        }
      }

    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      // Move to results page regardless of errors (we'll handle gracefully)
      setCurrentStep("results");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value: string, field: keyof QuestionForm) => {
    setForm(prev => {
      const currentValues = prev[field] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [field]: newValues };
    });
  };

  // Skills based on career phase
  const skillOptions: Record<string, string[]> = {
    student: ["Programming", "Research", "Communication", "Project Management", "Design", "Writing"],
    "entry-level": ["Problem-solving", "Teamwork", "Technical skills", "Organization", "Communication", "Customer service"],
    "career-switcher": ["Adaptability", "Technical skills", "Leadership", "Project Management", "Communication", "Industry knowledge"],
    experienced: ["Leadership", "Strategic planning", "Team management", "Technical expertise", "Negotiation", "Mentoring"],
    unsure: ["Communication", "Organization", "Technical skills", "Problem-solving", "Teamwork", "Leadership"],
  };

  // Interest options
  const interestOptions = [
    "Technology", "Business", "Healthcare", "Education", "Arts & Entertainment", 
    "Science & Research", "Public Service", "Environment", "Finance", "Marketing"
  ];

  // Get questions based on career phase
  const getPhaseQuestions = () => {
    const baseQuestions = [
      {
        title: "What skills do you have or want to develop?",
        component: (
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Select all that apply or add your own
            </p>
            <div className="grid grid-cols-2 gap-3">
              {careerPhase && skillOptions[careerPhase]?.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`skill-${skill}`} 
                    checked={form.skills.includes(skill)}
                    onCheckedChange={() => handleCheckboxChange(skill, "skills")}
                  />
                  <Label htmlFor={`skill-${skill}`} className="text-gray-700 dark:text-gray-200">
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="other-skills" className="text-gray-700 dark:text-gray-200">
                Other skills (comma separated)
              </Label>
              <Input 
                id="other-skills"
                name="otherSkills"
                className="mt-1"
                placeholder="e.g., Public speaking, Data analysis"
                onChange={(e) => {
                  const newSkills = e.target.value.split(',')
                    .map(s => s.trim())
                    .filter(s => s !== '');
                  setForm(prev => ({ ...prev, otherSkills: newSkills }));
                }}
              />
            </div>
          </div>
        )
      },
      {
        title: "What are your career interests?",
        component: (
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Select areas that interest you professionally
            </p>
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`interest-${interest}`} 
                    checked={form.interests.includes(interest)}
                    onCheckedChange={() => handleCheckboxChange(interest, "interests")}
                  />
                  <Label htmlFor={`interest-${interest}`} className="text-gray-700 dark:text-gray-200">
                    {interest}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="other-interests" className="text-gray-700 dark:text-gray-200">
                Other interests (comma separated)
              </Label>
              <Input 
                id="other-interests"
                name="otherInterests"
                className="mt-1"
                placeholder="e.g., Sustainable development, Artificial intelligence"
                onChange={(e) => {
                  const newInterests = e.target.value.split(',')
                    .map(s => s.trim())
                    .filter(s => s !== '');
                  setForm(prev => ({ ...prev, otherInterests: newInterests }));
                }}
              />
            </div>
          </div>
        )
      }
    ];

    // Define type that excludes null from CareerPhase
    type NonNullCareerPhase = Exclude<CareerPhase, null>;
    
    // Phase-specific questions
    const phaseQuestions: Record<NonNullCareerPhase, any[]> = {
      student: [
        {
          title: "Tell us about your education",
          component: (
            <div className="space-y-4">
              <div>
                <Label htmlFor="education" className="text-gray-700 dark:text-gray-200">
                  What is your field of study and degree level?
                </Label>
                <Input 
                  id="education"
                  name="education"
                  className="mt-1"
                  placeholder="e.g., Bachelor's in Computer Science"
                  value={form.education}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="graduationYear" className="text-gray-700 dark:text-gray-200">
                  Expected/actual graduation year
                </Label>
                <Input 
                  id="graduationYear"
                  name="graduationYear"
                  type="number"
                  className="mt-1"
                  placeholder="e.g., 2023"
                  value={form.graduationYear || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="relevantCourses" className="text-gray-700 dark:text-gray-200">
                  Relevant coursework or projects
                </Label>
                <Textarea 
                  id="relevantCourses"
                  name="relevantCourses"
                  className="mt-1"
                  placeholder="List any coursework, projects, or activities relevant to your career goals"
                  value={form.relevantCourses || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          )
        }
      ],
      "entry-level": [
        {
          title: "Tell us about your work experience",
          component: (
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentRole" className="text-gray-700 dark:text-gray-200">
                  Current or most recent role
                </Label>
                <Input 
                  id="currentRole"
                  name="currentRole"
                  className="mt-1"
                  placeholder="e.g., Junior Developer"
                  value={form.currentRole || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="yearsExperience" className="text-gray-700 dark:text-gray-200">
                  Years of professional experience
                </Label>
                <Input 
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  className="mt-1"
                  placeholder="e.g., 2"
                  value={form.yearsExperience || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="accomplishments" className="text-gray-700 dark:text-gray-200">
                  Key accomplishments or responsibilities
                </Label>
                <Textarea 
                  id="accomplishments"
                  name="accomplishments"
                  className="mt-1"
                  placeholder="Describe your main achievements or responsibilities in your current/recent role"
                  value={form.accomplishments || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          )
        }
      ],
      "career-switcher": [
        {
          title: "Tell us about your transition",
          component: (
            <div className="space-y-4">
              <div>
                <Label htmlFor="previousField" className="text-gray-700 dark:text-gray-200">
                  Previous career field
                </Label>
                <Input 
                  id="previousField"
                  name="previousField"
                  className="mt-1"
                  placeholder="e.g., Marketing"
                  value={form.previousField || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="targetField" className="text-gray-700 dark:text-gray-200">
                  Target career field
                </Label>
                <Input 
                  id="targetField"
                  name="targetField"
                  className="mt-1"
                  placeholder="e.g., Web Development"
                  value={form.targetField || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="transitionReason" className="text-gray-700 dark:text-gray-200">
                  Why are you making this career change?
                </Label>
                <Textarea 
                  id="transitionReason"
                  name="transitionReason"
                  className="mt-1"
                  placeholder="What motivated you to switch careers?"
                  value={form.transitionReason || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="transferableSkills" className="text-gray-700 dark:text-gray-200">
                  Transferable skills from previous career
                </Label>
                <Textarea 
                  id="transferableSkills"
                  name="transferableSkills"
                  className="mt-1"
                  placeholder="What skills from your previous career will be valuable in your new field?"
                  value={form.transferableSkills || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          )
        }
      ],
      experienced: [
        {
          title: "Tell us about your career trajectory",
          component: (
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentRole" className="text-gray-700 dark:text-gray-200">
                  Current role and level
                </Label>
                <Input 
                  id="currentRole"
                  name="currentRole"
                  className="mt-1"
                  placeholder="e.g., Senior Project Manager"
                  value={form.currentRole || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="yearsExperience" className="text-gray-700 dark:text-gray-200">
                  Total years of professional experience
                </Label>
                <Input 
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  className="mt-1"
                  placeholder="e.g., 8"
                  value={form.yearsExperience || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="industryExpertise" className="text-gray-700 dark:text-gray-200">
                  Industry expertise
                </Label>
                <Input 
                  id="industryExpertise"
                  name="industryExpertise"
                  className="mt-1"
                  placeholder="e.g., Healthcare technology"
                  value={form.industryExpertise || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="keyAchievements" className="text-gray-700 dark:text-gray-200">
                  Key career achievements
                </Label>
                <Textarea 
                  id="keyAchievements"
                  name="keyAchievements"
                  className="mt-1"
                  placeholder="What are your most significant professional accomplishments?"
                  value={form.keyAchievements || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          )
        }
      ],
      unsure: [
        {
          title: "Let's explore your options",
          component: (
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentSituation" className="text-gray-700 dark:text-gray-200">
                  Your current situation
                </Label>
                <Textarea 
                  id="currentSituation"
                  name="currentSituation"
                  className="mt-1"
                  placeholder="Tell us about your current work or education status"
                  value={form.currentSituation || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="careerChallenges" className="text-gray-700 dark:text-gray-200">
                  What career challenges are you facing?
                </Label>
                <Textarea 
                  id="careerChallenges"
                  name="careerChallenges"
                  className="mt-1"
                  placeholder="What specific career problems are you trying to solve?"
                  value={form.careerChallenges || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="ideaJob" className="text-gray-700 dark:text-gray-200">
                  What would your ideal job look like?
                </Label>
                <Textarea 
                  id="ideaJob"
                  name="ideaJob"
                  className="mt-1"
                  placeholder="Describe elements of your ideal role (work environment, tasks, impact, etc.)"
                  value={form.ideaJob || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          )
        }
      ]
    };
    
    // Common final question
    const finalQuestion = {
      title: "What are your career goals?",
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="goals" className="text-gray-700 dark:text-gray-200">
              What do you hope to achieve in your career?
            </Label>
            <Textarea 
              id="goals"
              name="goals"
              className="mt-1"
              placeholder="Share your short and long-term career goals"
              value={form.goals}
              onChange={handleChange}
            />
          </div>
        </div>
      )
    };

    if (!careerPhase) return [];
    
    return [
      ...(careerPhase ? phaseQuestions[careerPhase] : []),
      ...baseQuestions,
      finalQuestion
    ];
  };

  const questions = getPhaseQuestions();
  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: {
        duration: 0.3
      }
    }
  };

  const progressPercentage = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700 dark:text-gray-300">
            Question {currentStep + 1} of {questions.length}
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <motion.div
        key={currentStep}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
      >
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
          {currentQuestion.title}
        </h3>
        
        {currentQuestion.component}
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => currentStep > 0 && setStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="text-gray-800 dark:text-gray-200"
          >
            Previous
          </Button>
          
          <Button
            onClick={() => {
              if (isLastQuestion) {
                handleSubmit();
              } else {
                setStep(currentStep + 1);
              }
            }}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLastQuestion ? (
              isSubmitting ? "Submitting..." : "Submit"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}