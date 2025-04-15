import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ResultsScreen() {
  const { careerPhase, setCurrentStep } = useStore();
  const [careerProfile, setCareerProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load profile and recommendations from the database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if we have a profile ID in localStorage
        const profileId = localStorage.getItem('currentProfileId');
        
        if (profileId) {
          // Fetch the profile data
          const profileResponse = await fetch(`/api/career-profiles/${profileId}`);
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setCareerProfile(profileData);
            
            // Fetch recommendations for this profile
            try {
              const recommendationsResponse = await fetch(`/api/profiles/${profileId}/recommendations`);
              
              if (recommendationsResponse.ok) {
                const recommendationsData = await recommendationsResponse.json();
                setRecommendations(recommendationsData);
              }
            } catch (recError) {
              console.error('Error fetching recommendations:', recError);
            }
          } else {
            setError('Failed to load your career profile.');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while loading your career information.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Create a recommendation in the database
  const saveRecommendation = async (title: string, content: string, type: string) => {
    try {
      const profileId = localStorage.getItem('currentProfileId');
      
      if (!profileId) {
        console.error('No profile ID found');
        return;
      }
      
      const response = await fetch(`/api/profiles/${profileId}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          type
        })
      });
      
      if (response.ok) {
        const newRecommendation = await response.json();
        setRecommendations(prev => [...prev, newRecommendation]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving recommendation:', error);
      return false;
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  // Tailored guidance based on career phase
  const getPersonalizedContent = () => {
    switch(careerPhase) {
      case 'student':
        return {
          title: "Launch Your Career",
          subtitle: "Steps for students and recent graduates",
          recommendations: [
            "Focus on internships and entry-level positions to gain practical experience",
            "Build a portfolio showcasing academic projects and skills",
            "Network with alumni and industry professionals",
            "Participate in career fairs and campus recruitment",
            "Consider certifications to complement your degree"
          ],
          resources: [
            "LinkedIn Learning - Career Essentials",
            "GitHub Student Developer Pack",
            "Internship portals like Handshake or Indeed",
            "University career services"
          ]
        };
        
      case 'entry-level':
        return {
          title: "Accelerate Your Growth",
          subtitle: "Strategies for early-career professionals",
          recommendations: [
            "Seek mentorship within your organization",
            "Take on challenging projects to expand your skill set",
            "Identify skills gaps and pursue relevant training",
            "Build your professional network in your industry",
            "Document your achievements for future promotion opportunities"
          ],
          resources: [
            "Industry-specific certifications",
            "Professional associations in your field",
            "Online courses on platforms like Coursera or Udemy",
            "Networking events and industry conferences"
          ]
        };
        
      case 'career-switcher':
        return {
          title: "Navigate Your Transition",
          subtitle: "Keys to successful career pivoting",
          recommendations: [
            "Identify transferable skills from your previous experience",
            "Gain relevant qualifications for your target field",
            "Build connections in your new industry",
            "Consider transitional roles that bridge your past and future",
            "Create a resume that highlights relevant experience"
          ],
          resources: [
            "Career transition coaches",
            "Skill-building bootcamps",
            "LinkedIn groups for your target industry",
            "Informational interviews with professionals in your desired field"
          ]
        };
        
      case 'experienced':
        return {
          title: "Elevate Your Impact",
          subtitle: "Strategies for seasoned professionals",
          recommendations: [
            "Pursue leadership opportunities within your organization",
            "Develop your personal brand as an industry expert",
            "Consider executive education or advanced certifications",
            "Mentor junior colleagues to strengthen your leadership skills",
            "Explore board positions or advisory roles"
          ],
          resources: [
            "Executive education programs",
            "Industry speaking opportunities",
            "Professional coaching",
            "Leadership networks and industry forums"
          ]
        };
        
      case 'unsure':
        return {
          title: "Explore Your Potential",
          subtitle: "Finding your career direction",
          recommendations: [
            "Take career assessment tests to identify your strengths and interests",
            "Research growing industries that align with your skills",
            "Conduct informational interviews across different fields",
            "Consider job shadowing or volunteering to explore options",
            "Reflect on what gives you satisfaction in your work"
          ],
          resources: [
            "Career counseling services",
            "Personality and strength assessments",
            "Industry growth reports and job market analysis",
            "Career exploration workshops"
          ]
        };
        
      default:
        return {
          title: "Your Personalized Career Plan",
          subtitle: "Next steps for your professional growth",
          recommendations: [
            "Define clear short-term and long-term career goals",
            "Identify skills gaps and create a development plan",
            "Build a strong professional network",
            "Keep your resume and LinkedIn profile updated",
            "Stay current with industry trends and technologies"
          ],
          resources: [
            "Industry-specific online communities",
            "Professional development courses",
            "Career coaching services",
            "Networking events and conferences"
          ]
        };
    }
  };
  
  const content = getPersonalizedContent();
  
  return (
    <div className="max-w-3xl mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-8 mb-8 shadow-lg"
            variants={itemVariants}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {content.title}
            </h2>
            <p className="text-blue-100">
              {content.subtitle}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Recommendations
              </h3>
              <ul className="space-y-3">
                {content.recommendations.map((item, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mr-2 mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Helpful Resources
              </h3>
              <ul className="space-y-3">
                {content.resources.map((item, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mr-2 mt-0.5 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8"
            variants={itemVariants}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Next Steps
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Based on your profile, we recommend the following actions to help you progress in your career journey:
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Create or update your resume</h4>
                  <p className="text-gray-600 dark:text-gray-400">Use our resume builder to create a targeted resume that highlights your relevant skills and experience.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Build your personal brand</h4>
                  <p className="text-gray-600 dark:text-gray-400">Update your LinkedIn profile and establish a consistent professional presence online.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Develop your skills plan</h4>
                  <p className="text-gray-600 dark:text-gray-400">Work on closing skills gaps with targeted learning resources specific to your career goals.</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => {
                  // Save any recommendations to the database if needed
                  setCurrentStep('resume');
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Build My Resume
              </Button>
              <Button
                onClick={() => {
                  // Navigate to the cover letter builder
                  setCurrentStep('cover-letter');
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Cover Letter
              </Button>
              <Button
                onClick={() => setCurrentStep('welcome')}
                size="lg"
                variant="outline"
              >
                Start Over
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}