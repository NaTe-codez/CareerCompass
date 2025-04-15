import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CoverLetterBuilder() {
  const { careerPhase, setCurrentStep } = useStore();
  const [coverLetterData, setCoverLetterData] = useState({
    // Job application details
    recipientName: "",
    recipientTitle: "",
    companyName: "",
    positionTitle: "",
    where: "", // Where they found the job posting
    
    // Personal information (may be pre-filled from resume)
    fullName: "",
    phone: "",
    email: "",
    linkedin: "",
    portfolio: "",
    
    // Career goals & motivations (more detailed than in typical cover letters)
    shortTermGoals: "",
    longTermGoals: "",
    companyInterest: "", // Why this specific company
    roleAlignment: "", // How this role aligns with your goals
    
    // Skills & qualifications
    keySkills: [] as string[],
    relevantAchievements: "",
    
    // Work style & values
    workStyle: [] as string[],
    workValues: [] as string[],
    
    // Additional components
    greeting: "Dear",
    closing: "Sincerely",
    followUp: true,
    followUpTimeframe: "one week",
    
    // Cover letter customization
    tone: "professional", // professional, conversational, enthusiastic
    length: "medium", // short, medium, long
    structure: "standard", // standard, story-based, achievement-focused
    
    // File upload fields
    jobDescription: "",
    uploadedResume: null as File | null
  });
  
  const [letterPreview, setLetterPreview] = useState("");
  const [section, setSection] = useState("info");
  const [careerProfile, setCareerProfile] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const { toast } = useToast();
  
  // Fetch user profile data from localStorage
  useEffect(() => {
    const fetchProfile = async () => {
      const profileId = localStorage.getItem('currentProfileId');
      
      if (profileId) {
        try {
          const response = await fetch(`/api/career-profiles/${profileId}`);
          if (response.ok) {
            const profile = await response.json();
            setCareerProfile(profile);
            
            // Pre-fill some cover letter data based on profile
            if (profile.skills) {
              setCoverLetterData(prev => ({
                ...prev,
                keySkills: Array.isArray(profile.skills) ? profile.skills : [profile.skills]
              }));
            }
            
            // Depending on career phase, set different default values
            if (profile.careerPhase === 'student') {
              setCoverLetterData(prev => ({
                ...prev,
                shortTermGoals: "Seeking to apply my academic knowledge in a professional setting",
                workStyle: ["Collaborative", "Eager to learn", "Detail-oriented"],
                workValues: ["Growth", "Learning opportunities", "Mentorship"]
              }));
            } else if (profile.careerPhase === 'entry-level') {
              setCoverLetterData(prev => ({
                ...prev,
                shortTermGoals: "Develop my skills in a professional environment and make meaningful contributions",
                workStyle: ["Adaptable", "Team-oriented", "Proactive"],
                workValues: ["Growth", "Impact", "Collaboration"]
              }));
            } else if (profile.careerPhase === 'career-switcher') {
              setCoverLetterData(prev => ({
                ...prev,
                shortTermGoals: "Successfully transition into this new field by leveraging my transferable skills",
                workStyle: ["Adaptable", "Quick learner", "Resilient"],
                workValues: ["New challenges", "Growth", "Applying diverse experiences"]
              }));
            } else if (profile.careerPhase === 'experienced') {
              setCoverLetterData(prev => ({
                ...prev,
                shortTermGoals: "Apply my extensive experience to drive results and mentor others",
                workStyle: ["Strategic", "Leadership-oriented", "Results-driven"],
                workValues: ["Innovation", "Excellence", "Impact"]
              }));
            }
            
            // Pre-fill goals field if it exists in the profile
            if (profile.goals) {
              setCoverLetterData(prev => ({
                ...prev,
                longTermGoals: profile.goals
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };
    
    fetchProfile();
  }, []);
  
  // Function to parse uploaded resume
  const parseResume = async (text: string) => {
    // Simple parsing logic - enhance this with more sophisticated parsing if needed
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Try to extract name (usually at the top)
    if (lines.length > 0) {
      setCoverLetterData(prev => ({
        ...prev,
        fullName: lines[0]
      }));
    }
    
    // Look for email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailLine = lines.find(line => emailRegex.test(line));
    if (emailLine) {
      const email = emailLine.match(emailRegex)?.[0] || '';
      if (email) {
        setCoverLetterData(prev => ({
          ...prev,
          email
        }));
      }
    }
    
    // Look for phone number
    const phoneRegex = /(\+?[0-9][ -]?){10,}/;
    const phoneLine = lines.find(line => phoneRegex.test(line));
    if (phoneLine) {
      const phone = phoneLine.match(phoneRegex)?.[0] || '';
      if (phone) {
        setCoverLetterData(prev => ({
          ...prev,
          phone
        }));
      }
    }
    
    // Look for LinkedIn
    const linkedinLine = lines.find(line => line.toLowerCase().includes('linkedin'));
    if (linkedinLine) {
      setCoverLetterData(prev => ({
        ...prev,
        linkedin: linkedinLine
      }));
    }
    
    // Look for portfolio/website
    const websiteRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const websiteLine = lines.find(line => 
      websiteRegex.test(line) && 
      !line.toLowerCase().includes('linkedin')
    );
    if (websiteLine) {
      const portfolio = websiteLine.match(websiteRegex)?.[0] || '';
      if (portfolio) {
        setCoverLetterData(prev => ({
          ...prev,
          portfolio
        }));
      }
    }
    
    // Extract potential skills (keywords)
    const skillsSection = findSection(lines, 'skills');
    if (skillsSection && skillsSection.length > 0) {
      const skills = extractSkills(skillsSection.join(' '));
      if (skills.length > 0) {
        setCoverLetterData(prev => ({
          ...prev,
          keySkills: [...Array.from(new Set([...prev.keySkills, ...skills]))]
        }));
      }
    }
    
    // Extract achievements
    const achievementsSection = findSection(lines, 'achievements', 'accomplishments');
    if (achievementsSection && achievementsSection.length > 0) {
      setCoverLetterData(prev => ({
        ...prev,
        relevantAchievements: achievementsSection.join('\n')
      }));
    }
    
    toast({
      title: "Resume parsed successfully",
      description: "We've extracted information from your resume. Please review and edit as needed.",
    });
  };
  
  // Helper function to find sections in resume text
  const findSection = (lines: string[], ...keywords: string[]): string[] | null => {
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    
    // Find the start of the section
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      if (lowerKeywords.some(keyword => lowerLine.includes(keyword))) {
        startIndex = i + 1; // Start after the section header
        break;
      }
    }
    
    if (startIndex === -1 || startIndex >= lines.length) return null;
    
    // Find the end of the section (next section or end of document)
    let endIndex = lines.length;
    for (let i = startIndex + 1; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      // Typically section headers are short and might be in all caps or end with a colon
      if (lowerLine.length < 30 && 
          (lowerLine === lowerLine.toUpperCase() || lowerLine.endsWith(':')) &&
          !lowerLine.startsWith('•') && 
          !lowerLine.startsWith('-')) {
        endIndex = i;
        break;
      }
    }
    
    return lines.slice(startIndex, endIndex);
  };
  
  // Helper function to extract skills from text
  const extractSkills = (text: string): string[] => {
    // Common skill keywords
    const commonSkills = [
      'javascript', 'python', 'java', 'c++', 'c#', 'react', 'angular', 'vue', 'node',
      'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'communication', 'leadership',
      'teamwork', 'problem-solving', 'critical thinking', 'time management', 'project management',
      'agile', 'scrum', 'kanban', 'aws', 'azure', 'gcp', 'devops', 'ci/cd', 'docker', 'kubernetes',
      'html', 'css', 'sass', 'less', 'typescript', 'redux', 'graphql', 'rest', 'api', 'git',
      'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'adobe', 'photoshop', 'illustrator',
      'indesign', 'figma', 'sketch', 'analytics', 'seo', 'marketing', 'sales', 'customer service',
      'account management', 'negotiation', 'presentation', 'research', 'writing', 'editing',
      'proofreading', 'data analysis', 'machine learning', 'ai', 'artificial intelligence',
      'natural language processing', 'nlp', 'data visualization', 'power bi', 'tableau',
      'excel', 'word', 'powerpoint', 'outlook', 'office'
    ];
    
    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const skill of commonSkills) {
      if (lowerText.includes(skill)) {
        // Capitalize first letter of each word
        const formattedSkill = skill.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        foundSkills.push(formattedSkill);
      }
    }
    
    return foundSkills;
  };
  
  // Handle resume upload
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCoverLetterData(prev => ({ ...prev, uploadedResume: file }));
    
    const reader = new FileReader();
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (result) {
        const text = result.toString();
        setResumeText(text);
        await parseResume(text);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Handle job description upload
  const handleJobDescUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (result) {
        setCoverLetterData(prev => ({ 
          ...prev, 
          jobDescription: result.toString() 
        }));
      }
    };
    
    reader.readAsText(file);
  };
  
  // Handle input and text area changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCoverLetterData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setCoverLetterData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox changes for array fields
  const handleCheckboxChange = (value: string, field: 'workStyle' | 'workValues' | 'keySkills') => {
    setCoverLetterData(prev => {
      const currentValues = prev[field];
      return {
        ...prev,
        [field]: currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
      };
    });
  };
  
  // Handle custom skill input
  const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      const newSkill = e.currentTarget.value.trim();
      if (newSkill && !coverLetterData.keySkills.includes(newSkill)) {
        setCoverLetterData(prev => ({
          ...prev,
          keySkills: [...prev.keySkills, newSkill]
        }));
        e.currentTarget.value = '';
      }
    }
  };
  
  // Generate cover letter based on input data
  const generateCoverLetter = () => {
    setIsLoading(true);
    
    // Validate required fields
    if (!coverLetterData.fullName || !coverLetterData.companyName || !coverLetterData.positionTitle) {
      toast({
        title: "Missing information",
        description: "Please enter at least your name, the company name, and the position title.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    // Different templates based on structure
    let letter = '';
    
    switch (coverLetterData.structure) {
      case 'standard':
        letter = generateStandardLetter();
        break;
      case 'story-based':
        letter = generateStoryBasedLetter();
        break;
      case 'achievement-focused':
        letter = generateAchievementFocusedLetter();
        break;
      default:
        letter = generateStandardLetter();
    }
    
    setLetterPreview(letter);
    setIsLoading(false);
    setSection("preview");
  };
  
  // Generate a standard cover letter
  const generateStandardLetter = () => {
    const { 
      greeting, recipientName, recipientTitle, companyName, positionTitle, 
      fullName, email, phone, linkedin, portfolio, shortTermGoals, longTermGoals, 
      companyInterest, roleAlignment, keySkills, relevantAchievements, workStyle, 
      workValues, closing, followUp, followUpTimeframe, where
    } = coverLetterData;
    
    // Determine date format
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Customize greeting
    const recipient = recipientName 
      ? `${greeting} ${recipientTitle ? `${recipientTitle} ` : ''}${recipientName},` 
      : `${greeting} Hiring Manager,`;
    
    // First paragraph (introduction)
    const firstPara = `I am writing to express my interest in the ${positionTitle} position at ${companyName}${where ? ` that I saw advertised on ${where}` : ''}. With ${careerPhase === 'student' ? 'my educational background and coursework' : careerPhase === 'entry-level' ? 'my early career experience' : careerPhase === 'career-switcher' ? 'my diverse professional background' : 'my extensive professional experience'} in ${keySkills.slice(0, 3).join(', ')}, I am confident in my ability to make valuable contributions to your team.`;
    
    // Second paragraph (alignment with goals and company)
    const secondPara = `${roleAlignment ? `${roleAlignment} ` : ''}My ${shortTermGoals ? `short-term career goal is to ${shortTermGoals.toLowerCase()}` : 'professional goal'} while ${longTermGoals ? `working toward ${longTermGoals.toLowerCase()}` : 'developing professionally'}. ${companyInterest ? `I'm particularly drawn to ${companyName} because ${companyInterest}.` : `I'm excited about the opportunity to join ${companyName} and contribute to your innovative work.`}`;
    
    // Third paragraph (skills and achievements)
    let thirdPara = `My key strengths include ${keySkills.slice(0, 5).join(', ')}, and I value a work environment that promotes ${workValues.slice(0, 3).join(', ')}. My approach to work is ${workStyle.slice(0, 3).join(', ')}.`;
    
    if (relevantAchievements) {
      thirdPara += ` Some of my notable achievements include: ${relevantAchievements}`;
    }
    
    // Fourth paragraph (closing)
    const fourthPara = `I am excited about the possibility of bringing my ${keySkills.slice(0, 2).join(' and ')} to ${companyName} and would welcome the opportunity to discuss how my background aligns with your needs${followUp ? ` in more detail. I will follow up in ${followUpTimeframe} if I don't hear back before then` : ''}.`;
    
    // Closing
    const closingText = `${closing},\n${fullName}`;
    
    // Contact info (optional)
    const contactInfo = [
      email ? `Email: ${email}` : null,
      phone ? `Phone: ${phone}` : null,
      linkedin ? `LinkedIn: ${linkedin}` : null,
      portfolio ? `Portfolio: ${portfolio}` : null
    ].filter(Boolean).join('\n');
    
    // Assemble the full letter
    return `${date}

${recipient}

${firstPara}

${secondPara}

${thirdPara}

${fourthPara}

${closingText}
${contactInfo ? `\n${contactInfo}` : ''}`;
  };
  
  // Generate a story-based cover letter
  const generateStoryBasedLetter = () => {
    const { 
      greeting, recipientName, recipientTitle, companyName, positionTitle, 
      fullName, email, phone, linkedin, portfolio, shortTermGoals, longTermGoals, 
      companyInterest, roleAlignment, keySkills, relevantAchievements, workStyle, 
      workValues, closing, followUp, followUpTimeframe, where
    } = coverLetterData;
    
    // Determine date format
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Customize greeting
    const recipient = recipientName 
      ? `${greeting} ${recipientTitle ? `${recipientTitle} ` : ''}${recipientName},` 
      : `${greeting} Hiring Manager,`;
    
    // First paragraph (hook/story beginning)
    const firstPara = `I still remember the moment when I realized the impact of ${keySkills[0] || 'effective work'} in ${careerPhase === 'student' ? 'my studies' : 'my professional life'}. This pivotal experience has guided my career path and led me to apply for the ${positionTitle} role at ${companyName}${where ? `, which I discovered on ${where}` : ''}.`;
    
    // Second paragraph (personal story that relates to the position)
    let secondPara = `Throughout my ${careerPhase === 'student' ? 'academic journey' : careerPhase === 'entry-level' ? 'early career' : careerPhase === 'career-switcher' ? 'professional transitions' : 'career'}, I've cultivated a ${workStyle[0] || 'dedicated'} approach to challenges. `;
    
    if (relevantAchievements) {
      secondPara += `One example that demonstrates my ability to deliver results is ${relevantAchievements.split('\n')[0] || relevantAchievements}. `;
    }
    
    secondPara += `This experience reinforced my commitment to ${workValues[0] || 'excellence'} and my desire to ${shortTermGoals ? shortTermGoals.toLowerCase() : 'contribute meaningfully'}.`;
    
    // Third paragraph (connection to company values and role)
    const thirdPara = `What resonates with me about ${companyName} is ${companyInterest || `your reputation for innovation and excellence`}. ${roleAlignment ? `${roleAlignment} ` : ''}I believe my background in ${keySkills.slice(0, 3).join(', ')} positions me well to help your team ${positionTitle.toLowerCase().includes('manager') ? 'lead initiatives' : 'tackle challenges'} while working toward my long-term goal to ${longTermGoals ? longTermGoals.toLowerCase() : 'grow professionally'}.`;
    
    // Fourth paragraph (closing/call to action)
    const fourthPara = `I would welcome the opportunity to discuss how my unique journey and skills in ${keySkills.slice(0, 2).join(' and ')} can benefit ${companyName}${followUp ? `. I'll follow up in ${followUpTimeframe} if I don't hear from you before then` : ''}.`;
    
    // Closing
    const closingText = `${closing},\n${fullName}`;
    
    // Contact info (optional)
    const contactInfo = [
      email ? `Email: ${email}` : null,
      phone ? `Phone: ${phone}` : null,
      linkedin ? `LinkedIn: ${linkedin}` : null,
      portfolio ? `Portfolio: ${portfolio}` : null
    ].filter(Boolean).join('\n');
    
    // Assemble the full letter
    return `${date}

${recipient}

${firstPara}

${secondPara}

${thirdPara}

${fourthPara}

${closingText}
${contactInfo ? `\n${contactInfo}` : ''}`;
  };
  
  // Generate an achievement-focused cover letter
  const generateAchievementFocusedLetter = () => {
    const { 
      greeting, recipientName, recipientTitle, companyName, positionTitle, 
      fullName, email, phone, linkedin, portfolio, shortTermGoals, longTermGoals, 
      companyInterest, roleAlignment, keySkills, relevantAchievements, workStyle, 
      workValues, closing, followUp, followUpTimeframe, where
    } = coverLetterData;
    
    // Determine date format
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Customize greeting
    const recipient = recipientName 
      ? `${greeting} ${recipientTitle ? `${recipientTitle} ` : ''}${recipientName},` 
      : `${greeting} Hiring Manager,`;
    
    // First paragraph (introduction with focus on achievements)
    const firstPara = `I am excited to apply for the ${positionTitle} position at ${companyName}${where ? ` that I discovered on ${where}` : ''}. As a ${careerPhase === 'student' ? 'promising graduate' : careerPhase === 'entry-level' ? 'motivated professional' : careerPhase === 'career-switcher' ? 'versatile professional' : 'seasoned professional'} with expertise in ${keySkills.slice(0, 3).join(', ')}, I have consistently delivered measurable results throughout my ${careerPhase === 'student' ? 'academic career' : 'professional journey'}.`;
    
    // Second paragraph (specific achievements bullet points)
    let secondPara = `Here are some specific achievements that demonstrate my qualifications:`;
    
    // Create bullet points from achievements
    let achievementPoints = [];
    if (relevantAchievements) {
      // Split by new line or try to create 2-3 bullet points from the text
      const achievementLines = relevantAchievements.split('\n').filter(line => line.trim().length > 0);
      
      if (achievementLines.length > 0) {
        achievementPoints = achievementLines;
      } else {
        // If no clear separation, create at least one bullet point
        achievementPoints = [relevantAchievements];
      }
    } else {
      // Create generic achievements based on skills and career phase
      if (careerPhase === 'student') {
        achievementPoints = [
          `Completed coursework in ${keySkills[0] || 'relevant subject areas'} with excellent academic standing`,
          `Led a student project that demonstrated skills in ${keySkills[1] || 'problem-solving and teamwork'}`
        ];
      } else if (careerPhase === 'entry-level') {
        achievementPoints = [
          `Successfully applied ${keySkills[0] || 'key skills'} to improve processes in my current role`,
          `Collaborated with team members to achieve departmental goals through ${keySkills[1] || 'effective communication'}`
        ];
      } else if (careerPhase === 'career-switcher') {
        achievementPoints = [
          `Transferred skills in ${keySkills[0] || 'previous field'} to tackle new challenges`,
          `Quickly adapted to new environments while maintaining high performance standards`
        ];
      } else {
        achievementPoints = [
          `Led initiatives that resulted in improved outcomes through ${keySkills[0] || 'strategic planning'}`,
          `Mentored team members and fostered a culture of ${workValues[0] || 'excellence'}`
        ];
      }
    }
    
    // Add bullet points to second paragraph
    secondPara += `\n\n${achievementPoints.map(point => `• ${point}`).join('\n\n')}`;
    
    // Third paragraph (alignment with company and goals)
    const thirdPara = `I am particularly interested in joining ${companyName} because ${companyInterest || `of your reputation in the industry`}. ${roleAlignment ? `${roleAlignment} ` : ''}My approach to work, which is ${workStyle.slice(0, 2).join(' and ')}, aligns with my goal to ${shortTermGoals ? shortTermGoals.toLowerCase() : 'continue delivering excellent results'} while working toward ${longTermGoals ? longTermGoals.toLowerCase() : 'greater professional impact'}.`;
    
    // Fourth paragraph (closing)
    const fourthPara = `I would welcome the opportunity to discuss how my achievement-oriented approach and expertise in ${keySkills.slice(0, 2).join(' and ')} can contribute to ${companyName}'s success${followUp ? `. I will follow up in ${followUpTimeframe} if I haven't heard back` : ''}.`;
    
    // Closing
    const closingText = `${closing},\n${fullName}`;
    
    // Contact info (optional)
    const contactInfo = [
      email ? `Email: ${email}` : null,
      phone ? `Phone: ${phone}` : null,
      linkedin ? `LinkedIn: ${linkedin}` : null,
      portfolio ? `Portfolio: ${portfolio}` : null
    ].filter(Boolean).join('\n');
    
    // Assemble the full letter
    return `${date}

${recipient}

${firstPara}

${secondPara}

${thirdPara}

${fourthPara}

${closingText}
${contactInfo ? `\n${contactInfo}` : ''}`;
  };
  
  // Download the cover letter as a document
  const downloadLetter = () => {
    if (!letterPreview) {
      toast({
        title: "No letter generated",
        description: "Please generate your cover letter first.",
        variant: "destructive"
      });
      return;
    }
    
    const blob = new Blob([letterPreview], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cover_Letter_${coverLetterData.companyName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Print the cover letter
  const printLetter = () => {
    if (!letterPreview) {
      toast({
        title: "No letter generated",
        description: "Please generate your cover letter first.",
        variant: "destructive"
      });
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cover Letter - ${coverLetterData.companyName}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.5;
            margin: 1in;
            white-space: pre-wrap;
          }
          @media print {
            @page { margin: 1in; }
          }
        </style>
      </head>
      <body>
        ${letterPreview.replace(/\n/g, '<br>')}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Common work styles
  const workStyleOptions = [
    "Collaborative", "Independent", "Detail-oriented", "Big-picture focused",
    "Analytical", "Creative", "Structured", "Flexible", "Proactive", "Adaptable",
    "Methodical", "Fast-paced", "Relationship-building", "Results-driven"
  ];
  
  // Common work values
  const workValueOptions = [
    "Growth", "Innovation", "Balance", "Stability", "Impact", "Recognition",
    "Autonomy", "Collaboration", "Diversity", "Excellence", "Learning", "Challenge",
    "Creativity", "Structure", "Leadership", "Purpose"
  ];
  
  // Render the component
  return (
    <motion.div
      className="max-w-4xl mx-auto px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Cover Letter Builder</h2>
        <p className="text-blue-100">Create a personalized cover letter that highlights your career goals and motivations</p>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Tabs defaultValue={section} value={section} onValueChange={setSection} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="import">1. Import Data</TabsTrigger>
            <TabsTrigger value="info">2. Letter Info</TabsTrigger>
            <TabsTrigger value="preview">3. Preview & Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Resume & Job Information</CardTitle>
                <CardDescription>
                  Start by uploading your resume and/or job description to pre-fill the cover letter fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="resume-upload">Upload Your Resume (Optional)</Label>
                  <Input 
                    id="resume-upload" 
                    type="file" 
                    accept=".txt,.doc,.docx,.pdf,.rtf"
                    onChange={handleResumeUpload}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    We'll extract your contact info and skills to save you time
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="job-desc-upload">Upload Job Description (Optional)</Label>
                  <Input 
                    id="job-desc-upload" 
                    type="file" 
                    accept=".txt,.doc,.docx,.pdf,.rtf"
                    onChange={handleJobDescUpload}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This helps us tailor your letter to match the job requirements
                  </p>
                </div>
                
                <div className="text-center mt-8">
                  <Button 
                    onClick={() => setSection("info")}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    Continue to Letter Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Who you're writing to and the position you're applying for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name*</Label>
                    <Input 
                      id="companyName"
                      name="companyName"
                      value={coverLetterData.companyName}
                      onChange={handleInputChange}
                      placeholder="Acme Corporation"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionTitle">Position Title*</Label>
                    <Input 
                      id="positionTitle"
                      name="positionTitle"
                      value={coverLetterData.positionTitle}
                      onChange={handleInputChange}
                      placeholder="Software Developer"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientName">Recipient's Name (If Known)</Label>
                    <Input 
                      id="recipientName"
                      name="recipientName"
                      value={coverLetterData.recipientName}
                      onChange={handleInputChange}
                      placeholder="Jane Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientTitle">Recipient's Title</Label>
                    <Input 
                      id="recipientTitle"
                      name="recipientTitle"
                      value={coverLetterData.recipientTitle}
                      onChange={handleInputChange}
                      placeholder="Hiring Manager"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="greeting">Greeting</Label>
                    <Select
                      value={coverLetterData.greeting}
                      onValueChange={(value) => handleSelectChange('greeting', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a greeting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dear">Dear</SelectItem>
                        <SelectItem value="Hello">Hello</SelectItem>
                        <SelectItem value="Greetings">Greetings</SelectItem>
                        <SelectItem value="To">To</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="where">Where You Found This Position</Label>
                    <Input 
                      id="where"
                      name="where"
                      value={coverLetterData.where}
                      onChange={handleInputChange}
                      placeholder="LinkedIn, company website, etc."
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Contact Information</CardTitle>
                <CardDescription>
                  How the employer can reach you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Your Full Name*</Label>
                    <Input 
                      id="fullName"
                      name="fullName"
                      value={coverLetterData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      name="email"
                      value={coverLetterData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone"
                      name="phone"
                      value={coverLetterData.phone}
                      onChange={handleInputChange}
                      placeholder="(123) 456-7890"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input 
                      id="linkedin"
                      name="linkedin"
                      value={coverLetterData.linkedin}
                      onChange={handleInputChange}
                      placeholder="linkedin.com/in/johndoe"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="portfolio">Portfolio/Website</Label>
                    <Input 
                      id="portfolio"
                      name="portfolio"
                      value={coverLetterData.portfolio}
                      onChange={handleInputChange}
                      placeholder="johndoe.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Career Goals & Motivations</CardTitle>
                <CardDescription>
                  What makes you unique and why you're interested in this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shortTermGoals">Short-Term Career Goals</Label>
                  <Textarea 
                    id="shortTermGoals"
                    name="shortTermGoals"
                    value={coverLetterData.shortTermGoals}
                    onChange={handleInputChange}
                    placeholder="What you hope to accomplish in the next 1-2 years"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="longTermGoals">Long-Term Career Goals</Label>
                  <Textarea 
                    id="longTermGoals"
                    name="longTermGoals"
                    value={coverLetterData.longTermGoals}
                    onChange={handleInputChange}
                    placeholder="Where you see yourself in 5+ years"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="companyInterest">Why This Company Interests You</Label>
                  <Textarea 
                    id="companyInterest"
                    name="companyInterest"
                    value={coverLetterData.companyInterest}
                    onChange={handleInputChange}
                    placeholder="What attracts you to this specific company (culture, mission, products, etc.)"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="roleAlignment">How This Role Aligns With Your Goals</Label>
                  <Textarea 
                    id="roleAlignment"
                    name="roleAlignment"
                    value={coverLetterData.roleAlignment}
                    onChange={handleInputChange}
                    placeholder="How this position fits into your career path"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Skills & Qualifications</CardTitle>
                <CardDescription>
                  Your key strengths and achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Key Skills</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management', 'Technical Expertise'].map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`skill-${skill}`} 
                          checked={coverLetterData.keySkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) handleCheckboxChange(skill, 'keySkills');
                            else handleCheckboxChange(skill, 'keySkills');
                          }}
                        />
                        <Label htmlFor={`skill-${skill}`} className="text-gray-700 dark:text-gray-200">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Input
                      placeholder="Type a custom skill and press Enter"
                      onKeyDown={handleAddCustomSkill}
                      className="mt-1"
                    />
                  </div>
                  {coverLetterData.keySkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {coverLetterData.keySkills.map((skill) => (
                        <span 
                          key={skill} 
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm px-2.5 py-0.5 rounded-full flex items-center"
                        >
                          {skill}
                          <button 
                            type="button" 
                            className="ml-1.5 text-xs hover:text-blue-900 dark:hover:text-blue-200"
                            onClick={() => handleCheckboxChange(skill, 'keySkills')}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="relevantAchievements">Relevant Achievements</Label>
                  <Textarea 
                    id="relevantAchievements"
                    name="relevantAchievements"
                    value={coverLetterData.relevantAchievements}
                    onChange={handleInputChange}
                    placeholder="Specific accomplishments or projects that demonstrate your capabilities"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Work Style & Values</CardTitle>
                <CardDescription>
                  How you approach work and what matters to you professionally
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Your Work Style (Select up to 5)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {workStyleOptions.map((style) => (
                      <div key={style} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`style-${style}`} 
                          checked={coverLetterData.workStyle.includes(style)}
                          disabled={coverLetterData.workStyle.length >= 5 && !coverLetterData.workStyle.includes(style)}
                          onCheckedChange={(checked) => {
                            if (checked) handleCheckboxChange(style, 'workStyle');
                            else handleCheckboxChange(style, 'workStyle');
                          }}
                        />
                        <Label htmlFor={`style-${style}`} className="text-gray-700 dark:text-gray-200">
                          {style}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Work Values (Select up to 5)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {workValueOptions.map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`value-${value}`} 
                          checked={coverLetterData.workValues.includes(value)}
                          disabled={coverLetterData.workValues.length >= 5 && !coverLetterData.workValues.includes(value)}
                          onCheckedChange={(checked) => {
                            if (checked) handleCheckboxChange(value, 'workValues');
                            else handleCheckboxChange(value, 'workValues');
                          }}
                        />
                        <Label htmlFor={`value-${value}`} className="text-gray-700 dark:text-gray-200">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Letter Customization</CardTitle>
                <CardDescription>
                  Format and style preferences for your letter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="structure">Letter Structure</Label>
                    <Select
                      value={coverLetterData.structure}
                      onValueChange={(value) => handleSelectChange('structure', value)}
                    >
                      <SelectTrigger id="structure" className="mt-1">
                        <SelectValue placeholder="Choose structure" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Format</SelectItem>
                        <SelectItem value="story-based">Story-Based</SelectItem>
                        <SelectItem value="achievement-focused">Achievement-Focused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select
                      value={coverLetterData.tone}
                      onValueChange={(value) => handleSelectChange('tone', value)}
                    >
                      <SelectTrigger id="tone" className="mt-1">
                        <SelectValue placeholder="Choose tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="length">Length</Label>
                    <Select
                      value={coverLetterData.length}
                      onValueChange={(value) => handleSelectChange('length', value)}
                    >
                      <SelectTrigger id="length" className="mt-1">
                        <SelectValue placeholder="Choose length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Concise (less than 250 words)</SelectItem>
                        <SelectItem value="medium">Standard (250-400 words)</SelectItem>
                        <SelectItem value="long">Detailed (more than 400 words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="closing">Closing</Label>
                    <Select
                      value={coverLetterData.closing}
                      onValueChange={(value) => handleSelectChange('closing', value)}
                    >
                      <SelectTrigger id="closing" className="mt-1">
                        <SelectValue placeholder="Choose closing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sincerely">Sincerely</SelectItem>
                        <SelectItem value="Best regards">Best regards</SelectItem>
                        <SelectItem value="Kind regards">Kind regards</SelectItem>
                        <SelectItem value="Thank you">Thank you</SelectItem>
                        <SelectItem value="Respectfully">Respectfully</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 h-10 mt-6">
                      <Checkbox 
                        id="followUp" 
                        checked={coverLetterData.followUp}
                        onCheckedChange={(checked) => {
                          setCoverLetterData(prev => ({
                            ...prev,
                            followUp: checked === true
                          }));
                        }}
                      />
                      <Label htmlFor="followUp">Mention follow-up plans</Label>
                    </div>
                    
                    {coverLetterData.followUp && (
                      <div className="mt-2">
                        <Label htmlFor="followUpTimeframe">Follow-up Timeframe</Label>
                        <Select
                          value={coverLetterData.followUpTimeframe}
                          onValueChange={(value) => handleSelectChange('followUpTimeframe', value)}
                        >
                          <SelectTrigger id="followUpTimeframe" className="mt-1">
                            <SelectValue placeholder="Choose timeframe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one week">One week</SelectItem>
                            <SelectItem value="two weeks">Two weeks</SelectItem>
                            <SelectItem value="a few days">A few days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => setSection("import")}
                variant="outline"
                size="lg"
              >
                Back to Import
              </Button>
              <Button 
                onClick={generateCoverLetter}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </div>
                ) : "Generate Cover Letter"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Cover Letter Preview</span>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={downloadLetter}
                      variant="outline"
                      size="sm"
                      disabled={!letterPreview}
                    >
                      Download
                    </Button>
                    <Button 
                      onClick={printLetter}
                      variant="outline"
                      size="sm"
                      disabled={!letterPreview}
                    >
                      Print
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  This is how your cover letter will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border dark:border-gray-700 rounded-lg p-6 min-h-[600px] bg-white dark:bg-gray-950 font-serif">
                  {letterPreview ? (
                    <pre className="whitespace-pre-wrap font-serif">{letterPreview}</pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No cover letter generated yet</p>
                      <p className="mt-2 max-w-md">Complete the information in the previous tabs and click "Generate Cover Letter" to see your cover letter here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => setSection("info")}
                variant="outline"
                size="lg"
              >
                Back to Edit
              </Button>
              <Button 
                onClick={() => setCurrentStep('welcome')}
                size="lg"
                variant="outline"
              >
                Start Over
              </Button>
              {letterPreview && (
                <Button 
                  onClick={generateCoverLetter}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={isLoading}
                >
                  Regenerate Letter
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}