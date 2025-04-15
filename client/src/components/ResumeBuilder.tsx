import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

export default function ResumeBuilder() {
  const { careerPhase, setCurrentStep } = useStore();
  const [resumeData, setResumeData] = useState({
    // Personal information
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    
    // Professional summary
    summary: "",
    
    // Experience
    experience: [
      { 
        title: "", 
        company: "", 
        location: "", 
        startDate: "", 
        endDate: "", 
        current: false,
        description: "" 
      }
    ],
    
    // Education
    education: [
      {
        degree: "",
        institution: "",
        location: "",
        graduationDate: "",
        gpa: "",
        highlights: ""
      }
    ],
    
    // Skills
    skills: [] as string[],
    
    // Projects/Achievements
    projects: [
      {
        title: "",
        description: "",
        technologies: "",
        url: ""
      }
    ],
    
    // Certifications
    certifications: [
      {
        name: "",
        issuer: "",
        date: ""
      }
    ]
  });
  
  const [resumeTemplate, setResumeTemplate] = useState("professional");
  const [resumePreview, setResumePreview] = useState("");
  const [careerProfile, setCareerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Handle resume import via file upload
  const handleResumeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (result) {
        const text = result.toString();
        setResumeText(text);
        await parseResumeText(text);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Parse the resume text and extract information
  const parseResumeText = async (text: string) => {
    // Simple parsing logic - enhance this with more sophisticated parsing if needed
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Try to extract name (usually at the top)
    if (lines.length > 0) {
      setResumeData(prev => ({
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
        setResumeData(prev => ({
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
        setResumeData(prev => ({
          ...prev,
          phone
        }));
      }
    }
    
    // Look for LinkedIn
    const linkedinLine = lines.find(line => line.toLowerCase().includes('linkedin'));
    if (linkedinLine) {
      setResumeData(prev => ({
        ...prev,
        linkedin: linkedinLine
      }));
    }
    
    // Extract potential skills section
    const skillsSection = findSection(lines, 'skills');
    if (skillsSection && skillsSection.length > 0) {
      const skillsList = skillsSection.join(' ')
        .split(/[,•\n]/)
        .map(s => s.trim())
        .filter(Boolean);
      
      if (skillsList.length > 0) {
        setResumeData(prev => ({
          ...prev,
          skills: [...prev.skills, ...skillsList]
        }));
      }
    }
    
    // Look for education section
    const educationSection = findSection(lines, 'education');
    if (educationSection && educationSection.length > 0) {
      // Try to identify degree and institution
      const degree = educationSection.find(line => 
        line.toLowerCase().includes('bachelor') || 
        line.toLowerCase().includes('master') || 
        line.toLowerCase().includes('ph.d') || 
        line.toLowerCase().includes('certificate')
      );
      
      if (degree) {
        setResumeData(prev => ({
          ...prev,
          education: [{
            ...prev.education[0],
            degree: degree
          }]
        }));
      }
    }
    
    // Look for experience section
    const experienceSection = findSection(lines, 'experience', 'work experience');
    if (experienceSection && experienceSection.length > 0) {
      // Try to identify job titles and companies
      const titleLine = experienceSection.find(line => 
        line.length < 60 && 
        !line.includes('@') && 
        !line.includes('http')
      );
      
      if (titleLine) {
        setResumeData(prev => ({
          ...prev,
          experience: [{
            ...prev.experience[0],
            title: titleLine
          }]
        }));
      }
    }
    
    toast({
      title: "Resume parsed",
      description: "We've extracted information from your uploaded resume. Please review and edit as needed."
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
            
            // Pre-fill some resume data based on profile
            if (profile.skills) {
              setResumeData(prev => ({
                ...prev,
                skills: Array.isArray(profile.skills) ? profile.skills : [profile.skills]
              }));
            }
            
            // Depending on career phase, pre-fill other relevant sections
            if (profile.careerPhase === 'student' && profile.education) {
              setResumeData(prev => ({
                ...prev,
                education: [{
                  degree: profile.education || "",
                  institution: "",
                  location: "",
                  graduationDate: profile.graduationYear ? profile.graduationYear.toString() : "",
                  gpa: "",
                  highlights: profile.relevantCourses || ""
                }]
              }));
            }
            
            if ((profile.careerPhase === 'entry-level' || profile.careerPhase === 'experienced') && profile.currentRole) {
              setResumeData(prev => ({
                ...prev,
                experience: [{
                  title: profile.currentRole || "",
                  company: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  current: true,
                  description: profile.accomplishments || profile.keyAchievements || ""
                }]
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
  
  // Add a new experience entry
  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { 
          title: "", 
          company: "", 
          location: "", 
          startDate: "", 
          endDate: "", 
          current: false,
          description: "" 
        }
      ]
    }));
  };
  
  // Add a new education entry
  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          institution: "",
          location: "",
          graduationDate: "",
          gpa: "",
          highlights: ""
        }
      ]
    }));
  };
  
  // Add a new project
  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          title: "",
          description: "",
          technologies: "",
          url: ""
        }
      ]
    }));
  };
  
  // Add a new certification
  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          name: "",
          issuer: "",
          date: ""
        }
      ]
    }));
  };
  
  // Update experience entry values
  const updateExperience = (index: number, field: string, value: any) => {
    const updatedExperience = [...resumeData.experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setResumeData(prev => ({ ...prev, experience: updatedExperience }));
  };
  
  // Update education entry values
  const updateEducation = (index: number, field: string, value: any) => {
    const updatedEducation = [...resumeData.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setResumeData(prev => ({ ...prev, education: updatedEducation }));
  };
  
  // Update project entry values
  const updateProject = (index: number, field: string, value: any) => {
    const updatedProjects = [...resumeData.projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setResumeData(prev => ({ ...prev, projects: updatedProjects }));
  };
  
  // Update certification entry values
  const updateCertification = (index: number, field: string, value: any) => {
    const updatedCertifications = [...resumeData.certifications];
    updatedCertifications[index] = { ...updatedCertifications[index], [field]: value };
    setResumeData(prev => ({ ...prev, certifications: updatedCertifications }));
  };
  
  // Handle form input changes for personal info
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle skills input
  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const skillsList = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
    setResumeData(prev => ({ ...prev, skills: skillsList }));
  };
  
  // Generate the resume
  const generateResume = () => {
    setIsLoading(true);
    
    // Validate form data
    if (!resumeData.fullName || !resumeData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide at least your name and email.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    // Build the resume HTML based on the selected template
    let resumeHtml = '';
    
    switch (resumeTemplate) {
      case 'professional':
        resumeHtml = generateProfessionalTemplate();
        break;
      case 'modern':
        resumeHtml = generateModernTemplate();
        break;
      case 'creative':
        resumeHtml = generateCreativeTemplate();
        break;
      default:
        resumeHtml = generateProfessionalTemplate();
    }
    
    setResumePreview(resumeHtml);
    setIsLoading(false);
    
    // Scroll to the preview section
    document.getElementById('resume-preview')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Generate a professional template HTML
  const generateProfessionalTemplate = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; line-height: 1.5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; color: #2563eb;">${resumeData.fullName}</h1>
          <div style="margin: 10px 0; font-size: 14px;">
            ${resumeData.email ? `<span>${resumeData.email}</span> | ` : ''}
            ${resumeData.phone ? `<span>${resumeData.phone}</span> | ` : ''}
            ${resumeData.location ? `<span>${resumeData.location}</span>` : ''}
          </div>
          <div style="font-size: 14px;">
            ${resumeData.linkedin ? `<span>${resumeData.linkedin}</span> | ` : ''}
            ${resumeData.website ? `<span>${resumeData.website}</span>` : ''}
          </div>
        </div>
        
        ${resumeData.summary ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #2563eb; padding-bottom: 5px; color: #2563eb;">PROFESSIONAL SUMMARY</h2>
          <p>${resumeData.summary}</p>
        </div>
        ` : ''}
        
        ${resumeData.experience.some(exp => exp.title || exp.company) ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #2563eb; padding-bottom: 5px; color: #2563eb;">PROFESSIONAL EXPERIENCE</h2>
          ${resumeData.experience.map(exp => `
            ${(exp.title || exp.company) ? `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between;">
                <strong>${exp.title}${exp.company ? ` | ${exp.company}` : ''}</strong>
                <span>${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}</span>
              </div>
              ${exp.location ? `<div>${exp.location}</div>` : ''}
              ${exp.description ? `<p>${exp.description}</p>` : ''}
            </div>
            ` : ''}
          `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.education.some(edu => edu.degree || edu.institution) ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #2563eb; padding-bottom: 5px; color: #2563eb;">EDUCATION</h2>
          ${resumeData.education.map(edu => `
            ${(edu.degree || edu.institution) ? `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between;">
                <strong>${edu.degree}${edu.institution ? ` | ${edu.institution}` : ''}</strong>
                <span>${edu.graduationDate}</span>
              </div>
              ${edu.location ? `<div>${edu.location}</div>` : ''}
              ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
              ${edu.highlights ? `<p>${edu.highlights}</p>` : ''}
            </div>
            ` : ''}
          `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.skills.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #2563eb; padding-bottom: 5px; color: #2563eb;">SKILLS</h2>
          <p>${resumeData.skills.join(', ')}</p>
        </div>
        ` : ''}
        
        ${resumeData.projects.some(proj => proj.title) ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #2563eb; padding-bottom: 5px; color: #2563eb;">PROJECTS</h2>
          ${resumeData.projects.map(proj => `
            ${proj.title ? `
            <div style="margin-bottom: 15px;">
              <strong>${proj.title}</strong>
              ${proj.technologies ? `<div>Technologies: ${proj.technologies}</div>` : ''}
              ${proj.description ? `<p>${proj.description}</p>` : ''}
              ${proj.url ? `<div>URL: <a href="${proj.url}" style="color: #2563eb;">${proj.url}</a></div>` : ''}
            </div>
            ` : ''}
          `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.certifications.some(cert => cert.name) ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; border-bottom: 1px solid #2563eb; padding-bottom: 5px; color: #2563eb;">CERTIFICATIONS</h2>
          ${resumeData.certifications.map(cert => `
            ${cert.name ? `
            <div style="margin-bottom: 10px;">
              <strong>${cert.name}</strong>
              ${cert.issuer ? ` - ${cert.issuer}` : ''}
              ${cert.date ? ` (${cert.date})` : ''}
            </div>
            ` : ''}
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;
  };
  
  // Generate a modern template HTML
  const generateModernTemplate = () => {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; line-height: 1.5;">
        <div style="display: flex; flex-direction: row; margin-bottom: 30px;">
          <div style="flex: 2; padding-right: 30px;">
            <h1 style="margin: 0; font-size: 36px; color: #333; text-transform: uppercase; letter-spacing: 2px;">${resumeData.fullName}</h1>
            <p style="font-size: 18px; color: #666; margin-top: 5px; margin-bottom: 15px;">${careerPhase === 'student' ? 'Student' : careerPhase === 'entry-level' ? 'Early Career Professional' : careerPhase === 'career-switcher' ? 'Career Transition Professional' : careerPhase === 'experienced' ? 'Experienced Professional' : 'Professional'}</p>
            
            ${resumeData.summary ? `
            <div style="margin-bottom: 20px;">
              <p>${resumeData.summary}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="flex: 1; background-color: #f0f4f8; padding: 20px; border-radius: 10px;">
            <h3 style="font-size: 18px; color: #2563eb; margin-top: 0; margin-bottom: 10px;">CONTACT</h3>
            <div style="margin-bottom: 15px; font-size: 14px;">
              ${resumeData.email ? `<div><strong>Email:</strong> ${resumeData.email}</div>` : ''}
              ${resumeData.phone ? `<div><strong>Phone:</strong> ${resumeData.phone}</div>` : ''}
              ${resumeData.location ? `<div><strong>Location:</strong> ${resumeData.location}</div>` : ''}
              ${resumeData.linkedin ? `<div><strong>LinkedIn:</strong> ${resumeData.linkedin}</div>` : ''}
              ${resumeData.website ? `<div><strong>Website:</strong> ${resumeData.website}</div>` : ''}
            </div>
            
            ${resumeData.skills.length > 0 ? `
            <h3 style="font-size: 18px; color: #2563eb; margin-top: 20px; margin-bottom: 10px;">SKILLS</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
              ${resumeData.skills.map(skill => `
                <span style="background-color: #e6f0ff; color: #2563eb; padding: 5px 10px; border-radius: 15px; font-size: 12px;">${skill}</span>
              `).join('')}
            </div>
            ` : ''}
          </div>
        </div>
        
        ${resumeData.experience.some(exp => exp.title || exp.company) ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 22px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 15px;">Experience</h2>
          ${resumeData.experience.map(exp => `
            ${(exp.title || exp.company) ? `
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <h3 style="margin: 0; font-size: 18px; color: #333;">${exp.title}</h3>
                <span style="color: #666; font-size: 14px;">${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}</span>
              </div>
              <div style="font-size: 16px; color: #555; margin-bottom: 5px;">${exp.company}${exp.location ? ` | ${exp.location}` : ''}</div>
              ${exp.description ? `<p style="font-size: 15px; color: #444; margin-top: 10px;">${exp.description}</p>` : ''}
            </div>
            ` : ''}
          `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.education.some(edu => edu.degree || edu.institution) ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 22px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 15px;">Education</h2>
          ${resumeData.education.map(edu => `
            ${(edu.degree || edu.institution) ? `
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <h3 style="margin: 0; font-size: 18px; color: #333;">${edu.degree}</h3>
                <span style="color: #666; font-size: 14px;">${edu.graduationDate}</span>
              </div>
              <div style="font-size: 16px; color: #555; margin-bottom: 5px;">${edu.institution}${edu.location ? ` | ${edu.location}` : ''}</div>
              ${edu.gpa ? `<div style="font-size: 15px; color: #555;">GPA: ${edu.gpa}</div>` : ''}
              ${edu.highlights ? `<p style="font-size: 15px; color: #444; margin-top: 10px;">${edu.highlights}</p>` : ''}
            </div>
            ` : ''}
          `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.projects.some(proj => proj.title) ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 22px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 15px;">Projects</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
            ${resumeData.projects.map(proj => `
              ${proj.title ? `
              <div style="background-color: #f8f9fa; border-radius: 10px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; font-size: 18px; color: #333;">${proj.title}</h3>
                ${proj.technologies ? `<div style="font-size: 14px; color: #2563eb; margin-bottom: 10px;">${proj.technologies}</div>` : ''}
                ${proj.description ? `<p style="font-size: 15px; color: #444;">${proj.description}</p>` : ''}
                ${proj.url ? `<a href="${proj.url}" style="display: inline-block; margin-top: 10px; color: #2563eb; font-size: 14px; text-decoration: none;">View Project →</a>` : ''}
              </div>
              ` : ''}
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        ${resumeData.certifications.some(cert => cert.name) ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 22px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 15px;">Certifications</h2>
          ${resumeData.certifications.map(cert => `
            ${cert.name ? `
            <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
              <div>
                <span style="font-size: 16px; font-weight: bold; color: #333;">${cert.name}</span>
                ${cert.issuer ? ` <span style="font-size: 15px; color: #555;">- ${cert.issuer}</span>` : ''}
              </div>
              ${cert.date ? `<span style="font-size: 14px; color: #666;">${cert.date}</span>` : ''}
            </div>
            ` : ''}
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;
  };
  
  // Generate a creative template HTML
  const generateCreativeTemplate = () => {
    return `
      <div style="font-family: 'Poppins', sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; line-height: 1.5; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #6366f1 100%); color: white; padding: 40px 30px; border-radius: 15px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 36px; font-weight: 700;">${resumeData.fullName}</h1>
          <p style="font-size: 20px; opacity: 0.9; margin-top: 5px; margin-bottom: 20px;">
            ${careerPhase === 'student' ? 'Aspiring Professional' : careerPhase === 'entry-level' ? 'Rising Talent' : careerPhase === 'career-switcher' ? 'Career Transformer' : careerPhase === 'experienced' ? 'Seasoned Expert' : 'Professional'}
          </p>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px;">
            ${resumeData.email ? `<div style="font-size: 14px;"><span style="opacity: 0.8;">Email:</span> ${resumeData.email}</div>` : ''}
            ${resumeData.phone ? `<div style="font-size: 14px;"><span style="opacity: 0.8;">Phone:</span> ${resumeData.phone}</div>` : ''}
            ${resumeData.location ? `<div style="font-size: 14px;"><span style="opacity: 0.8;">Location:</span> ${resumeData.location}</div>` : ''}
          </div>
        </div>
        
        ${resumeData.summary ? `
        <div style="margin-bottom: 30px; padding: 25px; background-color: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
          <h2 style="color: #2563eb; font-size: 22px; margin-top: 0; margin-bottom: 15px; position: relative; padding-left: 15px;">
            <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background-color: #2563eb; border-radius: 10px;"></span>
            About Me
          </h2>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">${resumeData.summary}</p>
        </div>
        ` : ''}
        
        <div style="display: grid; grid-template-columns: ${isMobile ? '1fr' : '3fr 1fr'}; gap: 25px;">
          <div>
            ${resumeData.experience.some(exp => exp.title || exp.company) ? `
            <div style="margin-bottom: 30px; padding: 25px; background-color: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
              <h2 style="color: #2563eb; font-size: 22px; margin-top: 0; margin-bottom: 20px; position: relative; padding-left: 15px;">
                <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background-color: #2563eb; border-radius: 10px;"></span>
                Experience
              </h2>
              
              ${resumeData.experience.map((exp, index) => `
                ${(exp.title || exp.company) ? `
                <div style="margin-bottom: ${index === resumeData.experience.length - 1 ? '0' : '25px'}; position: relative; padding-left: ${isMobile ? '0' : '20px'};">
                  ${!isMobile ? `
                  <div style="position: absolute; left: 0; top: 5px; width: 10px; height: 10px; border-radius: 50%; background-color: #2563eb;"></div>
                  ${index !== resumeData.experience.length - 1 ? `<div style="position: absolute; left: 4px; top: 20px; bottom: -15px; width: 2px; background-color: #e5e7eb;"></div>` : ''}
                  ` : ''}
                  
                  <h3 style="margin: 0; font-size: 18px; color: #333;">${exp.title}</h3>
                  <div style="font-size: 16px; color: #555; margin-top: 5px; margin-bottom: 5px;">
                    ${exp.company}${exp.location ? ` | ${exp.location}` : ''}
                  </div>
                  <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
                    ${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                  </div>
                  
                  ${exp.description ? `<p style="font-size: 15px; color: #444; margin-top: 10px; line-height: 1.6;">${exp.description}</p>` : ''}
                </div>
                ` : ''}
              `).join('')}
            </div>
            ` : ''}
            
            ${resumeData.education.some(edu => edu.degree || edu.institution) ? `
            <div style="margin-bottom: 30px; padding: 25px; background-color: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
              <h2 style="color: #2563eb; font-size: 22px; margin-top: 0; margin-bottom: 20px; position: relative; padding-left: 15px;">
                <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background-color: #2563eb; border-radius: 10px;"></span>
                Education
              </h2>
              
              ${resumeData.education.map((edu, index) => `
                ${(edu.degree || edu.institution) ? `
                <div style="margin-bottom: ${index === resumeData.education.length - 1 ? '0' : '25px'};">
                  <h3 style="margin: 0; font-size: 18px; color: #333;">${edu.degree}</h3>
                  <div style="font-size: 16px; color: #555; margin-top: 5px; margin-bottom: 5px;">
                    ${edu.institution}${edu.location ? ` | ${edu.location}` : ''}
                  </div>
                  <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
                    ${edu.graduationDate}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                  </div>
                  
                  ${edu.highlights ? `<p style="font-size: 15px; color: #444; margin-top: 10px; line-height: 1.6;">${edu.highlights}</p>` : ''}
                </div>
                ` : ''}
              `).join('')}
            </div>
            ` : ''}
            
            ${resumeData.projects.some(proj => proj.title) ? `
            <div style="margin-bottom: 30px; padding: 25px; background-color: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
              <h2 style="color: #2563eb; font-size: 22px; margin-top: 0; margin-bottom: 20px; position: relative; padding-left: 15px;">
                <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background-color: #2563eb; border-radius: 10px;"></span>
                Projects
              </h2>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(${isMobile ? '100%' : '250px'}, 1fr)); gap: 20px;">
                ${resumeData.projects.map(proj => `
                  ${proj.title ? `
                  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 15px; transition: transform 0.2s;">
                    <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px; color: #333;">${proj.title}</h3>
                    ${proj.technologies ? `<div style="font-size: 14px; color: #2563eb; margin-bottom: 10px;">${proj.technologies}</div>` : ''}
                    ${proj.description ? `<p style="font-size: 15px; color: #444; line-height: 1.5;">${proj.description}</p>` : ''}
                    ${proj.url ? `<a href="${proj.url}" style="display: inline-block; margin-top: 10px; color: #2563eb; font-size: 14px; text-decoration: none;">View Project →</a>` : ''}
                  </div>
                  ` : ''}
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
          
          <div>
            ${resumeData.skills.length > 0 ? `
            <div style="margin-bottom: 30px; padding: 25px; background-color: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
              <h2 style="color: #2563eb; font-size: 22px; margin-top: 0; margin-bottom: 15px; position: relative; padding-left: 15px;">
                <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background-color: #2563eb; border-radius: 10px;"></span>
                Skills
              </h2>
              
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${resumeData.skills.map(skill => `
                  <div style="background-color: #e6f0ff; color: #2563eb; padding: 8px 15px; border-radius: 20px; font-size: 14px; display: inline-block;">${skill}</div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <div style="padding: 25px; background-color: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
              <h2 style="color: #2563eb; font-size: 22px; margin-top: 0; margin-bottom: 15px; position: relative; padding-left: 15px;">
                <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background-color: #2563eb; border-radius: 10px;"></span>
                Contact
              </h2>
              
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${resumeData.linkedin ? `<div style="font-size: 14px;"><strong>LinkedIn:</strong> ${resumeData.linkedin}</div>` : ''}
                ${resumeData.website ? `<div style="font-size: 14px;"><strong>Website:</strong> ${resumeData.website}</div>` : ''}
              </div>
            </div>
            
            ${resumeData.certifications.some(cert => cert.name) ? `
            <div style="margin-top: 30px; padding: 25px; background-color: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
              <h2 style="color: #2563eb; font-size: 22px; margin-top: 0; margin-bottom: 15px; position: relative; padding-left: 15px;">
                <span style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background-color: #2563eb; border-radius: 10px;"></span>
                Certifications
              </h2>
              
              <div style="display: flex; flex-direction: column; gap: 15px;">
                ${resumeData.certifications.map(cert => `
                  ${cert.name ? `
                  <div>
                    <div style="font-size: 16px; font-weight: bold; color: #333;">${cert.name}</div>
                    ${cert.issuer ? `<div style="font-size: 14px; color: #555;">${cert.issuer}</div>` : ''}
                    ${cert.date ? `<div style="font-size: 14px; color: #666; margin-top: 3px;">${cert.date}</div>` : ''}
                  </div>
                  ` : ''}
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  };
  
  // Download the resume as HTML
  const downloadResume = () => {
    if (!resumePreview) {
      toast({
        title: "No Resume Generated",
        description: "Please generate your resume first.",
        variant: "destructive"
      });
      return;
    }
    
    const blob = new Blob([`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${resumeData.fullName} - Resume</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        ${resumePreview}
      </body>
      </html>
    `], { type: 'text/html' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${resumeData.fullName.replace(/\s+/g, '_')}_resume.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Print the resume
  const printResume = () => {
    if (!resumePreview) {
      toast({
        title: "No Resume Generated",
        description: "Please generate your resume first.",
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
        <title>${resumeData.fullName} - Resume</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; }
          @media print {
            @page { margin: 0.5cm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          }
        </style>
      </head>
      <body>
        ${resumePreview}
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
  
  return (
    <motion.div
      className="max-w-4xl mx-auto px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Resume Builder</h2>
        <p className="text-blue-100">Create a professional resume tailored to your career goals</p>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="content">Resume Content</TabsTrigger>
            <TabsTrigger value="preview">Preview & Download</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Import Existing Resume (Optional)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload an existing resume to quickly pre-fill the form fields below.
              </p>
              <Input 
                type="file" 
                accept=".txt,.doc,.docx,.pdf,.rtf"
                onChange={handleResumeImport}
                className="mb-4"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Supported file formats: .txt, .doc, .docx, .pdf, .rtf
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Template Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${resumeTemplate === 'professional' ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => setResumeTemplate('professional')}
                >
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Professional</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-medium ${resumeTemplate === 'professional' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>Professional</span>
                  </div>
                </div>
                
                <div 
                  className={`border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${resumeTemplate === 'modern' ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => setResumeTemplate('modern')}
                >
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Modern</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-medium ${resumeTemplate === 'modern' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>Modern</span>
                  </div>
                </div>
                
                <div 
                  className={`border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${resumeTemplate === 'creative' ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => setResumeTemplate('creative')}
                >
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Creative</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-medium ${resumeTemplate === 'creative' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>Creative</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName"
                    name="fullName"
                    value={resumeData.fullName}
                    onChange={handlePersonalInfoChange}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={resumeData.email}
                    onChange={handlePersonalInfoChange}
                    placeholder="john.doe@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    value={resumeData.phone}
                    onChange={handlePersonalInfoChange}
                    placeholder="(123) 456-7890"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    name="location"
                    value={resumeData.location}
                    onChange={handlePersonalInfoChange}
                    placeholder="City, State"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input 
                    id="linkedin"
                    name="linkedin"
                    value={resumeData.linkedin}
                    onChange={handlePersonalInfoChange}
                    placeholder="linkedin.com/in/johndoe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website/Portfolio</Label>
                  <Input 
                    id="website"
                    name="website"
                    value={resumeData.website}
                    onChange={handlePersonalInfoChange}
                    placeholder="johndoe.com"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea 
                  id="summary"
                  name="summary"
                  value={resumeData.summary}
                  onChange={handlePersonalInfoChange}
                  placeholder="A brief summary of your professional background and career goals"
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Professional Experience
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addExperience}
                >
                  Add Experience
                </Button>
              </div>
              
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`exp-title-${index}`}>Job Title</Label>
                      <Input 
                        id={`exp-title-${index}`}
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="Software Engineer"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`exp-company-${index}`}>Company</Label>
                      <Input 
                        id={`exp-company-${index}`}
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="Acme Inc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`exp-location-${index}`}>Location</Label>
                      <Input 
                        id={`exp-location-${index}`}
                        value={exp.location}
                        onChange={(e) => updateExperience(index, 'location', e.target.value)}
                        placeholder="City, State"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`exp-start-${index}`}>Start Date</Label>
                        <Input 
                          id={`exp-start-${index}`}
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          placeholder="MM/YYYY"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`exp-end-${index}`}>End Date</Label>
                        <Input 
                          id={`exp-end-${index}`}
                          value={exp.endDate}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          placeholder="MM/YYYY"
                          className="mt-1"
                          disabled={exp.current}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <input 
                      type="checkbox" 
                      id={`exp-current-${index}`}
                      checked={exp.current}
                      onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                      className="mr-2"
                    />
                    <Label htmlFor={`exp-current-${index}`}>Current Position</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor={`exp-description-${index}`}>Description & Responsibilities</Label>
                    <Textarea 
                      id={`exp-description-${index}`}
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Describe your key responsibilities, achievements, and impact in this role"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Education
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addEducation}
                >
                  Add Education
                </Button>
              </div>
              
              {resumeData.education.map((edu, index) => (
                <div key={index} className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`edu-degree-${index}`}>Degree</Label>
                      <Input 
                        id={`edu-degree-${index}`}
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Bachelor of Science in Computer Science"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edu-institution-${index}`}>Institution</Label>
                      <Input 
                        id={`edu-institution-${index}`}
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        placeholder="University Name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edu-location-${index}`}>Location</Label>
                      <Input 
                        id={`edu-location-${index}`}
                        value={edu.location}
                        onChange={(e) => updateEducation(index, 'location', e.target.value)}
                        placeholder="City, State"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`edu-graduation-${index}`}>Graduation Date</Label>
                        <Input 
                          id={`edu-graduation-${index}`}
                          value={edu.graduationDate}
                          onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                          placeholder="MM/YYYY"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`edu-gpa-${index}`}>GPA (Optional)</Label>
                        <Input 
                          id={`edu-gpa-${index}`}
                          value={edu.gpa}
                          onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                          placeholder="3.8/4.0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`edu-highlights-${index}`}>Relevant Coursework/Achievements</Label>
                    <Textarea 
                      id={`edu-highlights-${index}`}
                      value={edu.highlights}
                      onChange={(e) => updateEducation(index, 'highlights', e.target.value)}
                      placeholder="List relevant courses, academic achievements, or extracurricular activities"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Skills
              </h3>
              <Label htmlFor="skills">List Your Skills</Label>
              <Textarea 
                id="skills"
                value={resumeData.skills.join(', ')}
                onChange={handleSkillsChange}
                placeholder="JavaScript, React, Project Management, Communication (comma separated)"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Projects
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addProject}
                >
                  Add Project
                </Button>
              </div>
              
              {resumeData.projects.map((proj, index) => (
                <div key={index} className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`proj-title-${index}`}>Project Title</Label>
                      <Input 
                        id={`proj-title-${index}`}
                        value={proj.title}
                        onChange={(e) => updateProject(index, 'title', e.target.value)}
                        placeholder="E-commerce Website"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`proj-tech-${index}`}>Technologies Used</Label>
                      <Input 
                        id={`proj-tech-${index}`}
                        value={proj.technologies}
                        onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                        placeholder="React, Node.js, MongoDB"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor={`proj-description-${index}`}>Description</Label>
                    <Textarea 
                      id={`proj-description-${index}`}
                      value={proj.description}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      placeholder="A brief description of the project, your role, and key features"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`proj-url-${index}`}>Project URL (Optional)</Label>
                    <Input 
                      id={`proj-url-${index}`}
                      value={proj.url}
                      onChange={(e) => updateProject(index, 'url', e.target.value)}
                      placeholder="https://github.com/yourusername/project"
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Certifications
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addCertification}
                >
                  Add Certification
                </Button>
              </div>
              
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`cert-name-${index}`}>Certification Name</Label>
                      <Input 
                        id={`cert-name-${index}`}
                        value={cert.name}
                        onChange={(e) => updateCertification(index, 'name', e.target.value)}
                        placeholder="AWS Certified Solutions Architect"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cert-issuer-${index}`}>Issuing Organization</Label>
                      <Input 
                        id={`cert-issuer-${index}`}
                        value={cert.issuer}
                        onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                        placeholder="Amazon Web Services"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cert-date-${index}`}>Date</Label>
                      <Input 
                        id={`cert-date-${index}`}
                        value={cert.date}
                        onChange={(e) => updateCertification(index, 'date', e.target.value)}
                        placeholder="MM/YYYY"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button 
                type="button" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                onClick={generateResume}
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
                ) : "Generate Resume"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Resume Preview
                </h3>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={downloadResume}
                    disabled={!resumePreview}
                  >
                    Download HTML
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={printResume}
                    disabled={!resumePreview}
                  >
                    Print Resume
                  </Button>
                </div>
              </div>
              
              <div id="resume-preview" className="border dark:border-gray-700 rounded-lg p-4 min-h-[500px] overflow-auto max-h-[800px]">
                {resumePreview ? (
                  <div dangerouslySetInnerHTML={{ __html: resumePreview }}></div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-center text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">No resume generated yet</p>
                    <p className="mt-2 max-w-md">Fill out your information in the Resume Content tab and click "Generate Resume" to see a preview here.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}