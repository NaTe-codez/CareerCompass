import { useState } from "react";
import { motion } from "framer-motion";
import { useStore, CareerPhase } from "@/lib/store";

type CareerPhaseOption = {
  id: CareerPhase;
  title: string;
  description: string;
  icon: JSX.Element;
};

export default function CareerPhaseSelection() {
  const { setCareerPhase } = useStore();
  const [selectedPhase, setSelectedPhase] = useState<CareerPhase | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (phase: CareerPhase) => {
    setSelectedPhase(phase);
    setIsLoading(true);
    
    // Simulate a small delay before transitioning to the next step
    setTimeout(() => {
      setCareerPhase(phase);
      setIsLoading(false);
    }, 800);
  };

  const careerPhases: CareerPhaseOption[] = [
    {
      id: "student",
      title: "Student or recent graduate",
      description: "Starting your career journey with limited professional experience",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: "entry-level",
      title: "Entry-level professional",
      description: "1-3 years of experience, looking to grow in your field",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: "career-switcher",
      title: "Career switcher",
      description: "Transitioning to a new industry or role from previous experience",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: "experienced",
      title: "Experienced professional",
      description: "4+ years of experience, seeking career advancement",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: "unsure",
      title: "I'm not sure",
      description: "Exploring options and need guidance to determine the right path",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {careerPhases.map((phase, index) => (
          <motion.div
            key={phase.id}
            variants={itemVariants}
            className={`
              card-transition
              ${index === 4 ? 'md:col-span-2' : ''}
              ${selectedPhase === phase.id 
                ? 'ring-2 ring-primary dark:ring-primary-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800/80'
              }
              bg-gray-50 dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700 
              rounded-lg p-5 cursor-pointer shadow-sm hover:shadow-md
            `}
            onClick={() => handleSelect(phase.id)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full p-2 bg-primary-100 dark:bg-primary-900/30 text-primary dark:text-primary-400">
                {phase.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{phase.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{phase.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </>
  );
}
