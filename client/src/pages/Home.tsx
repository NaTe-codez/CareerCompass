import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WelcomeScreen from "@/components/WelcomeScreen";
import QuestionsScreen from "@/components/QuestionsScreen";
import ResultsScreen from "@/components/ResultsScreen";
import ResumeBuilder from "@/components/ResumeBuilder";
import CoverLetterBuilder from "@/components/CoverLetterBuilder";

export default function Home() {
  const { currentStep } = useStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:py-16 animate-fade-in">
        {currentStep === 'welcome' && <WelcomeScreen />}
        {currentStep === 'questions' && <QuestionsScreen />}
        {currentStep === 'results' && <ResultsScreen />}
        {currentStep === 'resume' && <ResumeBuilder />}
        {currentStep === 'cover-letter' && <CoverLetterBuilder />}
      </main>
      
      <Footer />
    </div>
  );
}
