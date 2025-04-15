import { motion } from "framer-motion";
import CareerPhaseSelection from "./CareerPhaseSelection";

export default function WelcomeScreen() {
  return (
    <div className="max-w-3xl mx-auto">
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to your Career Journey
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Get personalized career guidance, CV creation, and job application assistance based on your unique situation
        </p>
        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
      </motion.div>
      
      <motion.div 
        className="rounded-xl bg-white dark:bg-dark-200 shadow-lg p-6 md:p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-gray-800 dark:text-black mb-4">
          Let's get started!
        </h3>
        <p className="text-gray-600 dark:text-black-800 max-w-2xl mx-auto mb-6 text-center">
          Select your current career phase below so we can tailor our guidance to your specific needs.
        </p>
        
        <CareerPhaseSelection />
      </motion.div>
      
      <motion.div 
        className="text-center text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <p>Your information is secure and will only be used to provide personalized career guidance.</p>
      </motion.div>
    </div>
  );
}
