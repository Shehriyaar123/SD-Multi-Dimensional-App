import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Sparkles, Download, Layout, User, Briefcase, GraduationCap, Code, Eye, Edit3, Search, BookOpen, Award, Terminal, Image as ImageIcon, Camera, X, Link as LinkIcon, Globe } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ResumeData, Experience, Education, Project } from '../types';
import { aiCareerService } from '../services/aiCareerService';
import ResumePreview from './ResumePreview';
import ResumeAnalyzer from './ResumeAnalyzer';

// Tiptap Editor Component
const RichTextEditor = ({ content, onChange }: { content: string, onChange: (html: string) => void }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex gap-2 p-2 border-b border-zinc-800 bg-zinc-800/50">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1 rounded ${editor.isActive('bold') ? 'bg-zinc-700' : ''}`}><b>B</b></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1 rounded ${editor.isActive('italic') ? 'bg-zinc-700' : ''}`}><i>I</i></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-zinc-700' : ''}`}>• List</button>
      </div>
      <EditorContent editor={editor} className="p-4 min-h-[100px] prose prose-invert prose-sm max-w-none" />
    </div>
  );
};

const initialResume: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: '',
    profileImage: '',
    socialLinks: [],
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  coursework: [],
  certifications: [],
};

type SubTab = 'edit' | 'preview' | 'analyze';

export default function ResumeArchitect() {
  const [resume, setResume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('penta_resume');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Ensure all top-level arrays exist
      const merged: ResumeData = {
        ...initialResume,
        ...parsed,
        personalInfo: { 
          ...initialResume.personalInfo, 
          ...(parsed.personalInfo || {}),
          socialLinks: parsed.personalInfo?.socialLinks || []
        },
        experience: parsed.experience || [],
        education: parsed.education || [],
        skills: parsed.skills || [],
        projects: parsed.projects || [],
        coursework: parsed.coursework || [],
        certifications: parsed.certifications || [],
      };

      // Migrate old array descriptions to HTML string
      if (merged.experience) {
        merged.experience = merged.experience.map((exp: any) => ({
          ...exp,
          description: Array.isArray(exp.description) 
            ? `<ul>${exp.description.map((d: string) => `<li>${d}</li>`).join('')}</ul>`
            : exp.description || ''
        }));
      }
      return merged;
    }
    return initialResume;
  });
  const [template, setTemplate] = useState<'modern' | 'executive' | 'minimalist' | 'ats'>('modern');
  const [isRefining, setIsRefining] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('edit');
  const [isUploading, setIsUploading] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    localStorage.setItem('penta_resume', JSON.stringify(resume));
  }, [resume]);

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResume(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addSocialLink = () => {
    const newLink = { id: Math.random().toString(36).substr(2, 9), label: '', url: '' };
    setResume(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        socialLinks: [...(prev.personalInfo.socialLinks || []), newLink]
      }
    }));
  };

  const updateSocialLink = (id: string, field: 'label' | 'url', value: string) => {
    setResume(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        socialLinks: (prev.personalInfo.socialLinks || []).map(link => 
          link.id === id ? { ...link, [field]: value } : link
        )
      }
    }));
  };

  const removeSocialLink = (id: string) => {
    setResume(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        socialLinks: (prev.personalInfo.socialLinks || []).filter(link => link.id !== id)
      }
    }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Math.random().toString(36).substr(2, 9),
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    setResume(prev => ({ ...prev, experience: [newExp, ...(prev.experience || [])] }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const refineDescription = async (expId: string, role: string) => {
    const exp = resume.experience.find(e => e.id === expId);
    if (!exp || !exp.description) return;

    setIsRefining(expId);
    try {
      const refined = await aiCareerService.refineBulletPoint(exp.description, role);
      updateExperience(expId, 'description', refined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefining(null);
    }
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Math.random().toString(36).substr(2, 9),
      school: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      grade: '',
      gradeType: 'cgpa',
    };
    setResume(prev => ({ ...prev, education: [newEdu, ...(prev.education || [])] }));
  };

  const addProject = () => {
    const newProj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      link: '',
      technologies: [],
    };
    setResume(prev => ({ ...prev, projects: [newProj, ...(prev.projects || [])] }));
  };

  const addCertification = () => {
    const newCert = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      issuer: '',
      date: '',
    };
    setResume(prev => ({ ...prev, certifications: [newCert, ...(prev.certifications || [])] }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updatePersonalInfo('profileImage', data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-navigation */}
      <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl">
        <div className="flex gap-2">
          {[
            { id: 'edit', label: 'Edit Content', icon: Edit3 },
            { id: 'preview', label: 'Live Preview', icon: Eye },
            { id: 'analyze', label: 'AI Analyzer', icon: Search },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {activeSubTab === 'preview' && (
            <>
              <button 
                onClick={() => setIsCompact(!isCompact)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isCompact ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
              >
                <Layout className="w-3 h-3" />
                {isCompact ? 'Fit: One Page' : 'Fit: Standard'}
              </button>
              <div className="flex bg-zinc-800 rounded-xl p-1">
                {(['modern', 'executive', 'minimalist', 'ats'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${template === t ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
          <button 
            onClick={() => {
              if (activeSubTab !== 'preview') {
                setActiveSubTab('preview');
                setTimeout(() => {
                  (window as any).downloadResume?.();
                }, 600);
              } else {
                (window as any).downloadResume?.();
              }
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold transition-all shadow-xl"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {activeSubTab === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8"
            >
              <div className="max-w-4xl mx-auto space-y-12">
                {/* Personal Info */}
                <section className="space-y-6">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" /> Personal Information
                  </h3>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Profile Image Upload */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1 block">Profile Image</label>
                      <div className="relative group">
                        <div className={`w-32 h-32 rounded-3xl overflow-hidden bg-zinc-800 border-2 border-dashed transition-all ${resume.personalInfo.profileImage ? 'border-zinc-700' : 'border-zinc-700 hover:border-orange-500'}`}>
                          {resume.personalInfo.profileImage ? (
                            <img 
                              src={resume.personalInfo.profileImage} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                              <Camera className="w-6 h-6" />
                              <span className="text-[10px] font-bold">Upload</span>
                            </div>
                          )}
                          
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        <input 
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />

                        {resume.personalInfo.profileImage && (
                          <button 
                            onClick={() => updatePersonalInfo('profileImage', '')}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Full Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={resume.personalInfo.fullName}
                          onChange={e => updatePersonalInfo('fullName', e.target.value)}
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={resume.personalInfo.email}
                          onChange={e => updatePersonalInfo('email', e.target.value)}
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="+1 234 567 890"
                          value={resume.personalInfo.phone}
                          onChange={e => updatePersonalInfo('phone', e.target.value)}
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Location</label>
                        <input
                          type="text"
                          placeholder="New York, NY"
                          value={resume.personalInfo.location}
                          onChange={e => updatePersonalInfo('location', e.target.value)}
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Professional Links</label>
                      <button 
                        type="button"
                        onClick={addSocialLink}
                        className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Link
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(resume.personalInfo.socialLinks || []).map((link) => (
                        <div key={link.id} className="flex gap-2 items-center bg-zinc-800/30 p-2 rounded-xl border border-zinc-700/50">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              placeholder="Label (e.g. GitHub)"
                              value={link.label}
                              onChange={(e) => updateSocialLink(link.id, 'label', e.target.value)}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 text-white"
                            />
                            <input
                              type="text"
                              placeholder="URL (https://github.com/...)"
                              value={link.url}
                              onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 text-white"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeSocialLink(link.id)}
                            className="p-2 text-zinc-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Professional Summary</label>
                    <textarea
                      placeholder="Briefly describe your professional background and goals..."
                      value={resume.personalInfo.summary}
                      onChange={e => updatePersonalInfo('summary', e.target.value)}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all min-h-[120px] resize-none"
                    />
                  </div>
                </section>

                {/* Experience */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Professional Experience
                    </h3>
                    <button onClick={addExperience} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all text-xs font-bold">
                      <Plus className="w-4 h-4" /> Add Experience
                    </button>
                  </div>
                  <div className="space-y-6">
                    {resume.experience.map(exp => (
                      <div key={exp.id} className="p-8 bg-zinc-800/30 border border-zinc-700/50 rounded-[32px] space-y-6 relative group">
                        <button 
                          onClick={() => setResume(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== exp.id) }))}
                          className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Company</label>
                            <input
                              type="text"
                              placeholder="Google"
                              value={exp.company}
                              onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Role</label>
                            <input
                              type="text"
                              placeholder="Senior Software Engineer"
                              value={exp.role}
                              onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1 flex items-center gap-2">
                            Achievements <Sparkles className="w-3 h-3 text-indigo-400" />
                          </label>
                          <div className="space-y-3">
                            <RichTextEditor 
                                content={exp.description} 
                                onChange={(val) => updateExperience(exp.id, 'description', val)}
                              />
                            <div className="flex justify-end">
                              <button 
                                onClick={() => refineDescription(exp.id, exp.role)}
                                disabled={!exp.description || isRefining === exp.id}
                                className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                              >
                                {isRefining === exp.id ? (
                                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold">AI Refine Description</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Education */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Education
                    </h3>
                    <button onClick={addEducation} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all text-xs font-bold">
                      <Plus className="w-4 h-4" /> Add Education
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resume.education.map(edu => (
                      <div key={edu.id} className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-3xl space-y-4 relative">
                        <button 
                          onClick={() => setResume(prev => ({ ...prev, education: prev.education.filter(e => e.id !== edu.id) }))}
                          className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">School / University</label>
                          <input
                            type="text"
                            placeholder="Stanford University"
                            value={edu.school}
                            onChange={e => setResume(prev => ({ ...prev, education: prev.education.map(ed => ed.id === edu.id ? { ...ed, school: e.target.value } : ed) }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Degree</label>
                          <input
                            type="text"
                            placeholder="Bachelor of Science"
                            value={edu.degree}
                            onChange={e => setResume(prev => ({ ...prev, education: prev.education.map(ed => ed.id === edu.id ? { ...ed, degree: e.target.value } : ed) }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1 block">Grade Type</label>
                          <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 gap-1">
                            {(['cgpa', 'percentage'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => setResume(prev => ({ 
                                  ...prev, 
                                  education: prev.education.map(ed => ed.id === edu.id ? { ...ed, gradeType: type } : ed) 
                                }))}
                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                  (edu.gradeType || 'cgpa') === type 
                                    ? 'bg-orange-500 text-white shadow-md' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Value</label>
                          <input
                            type="text"
                            placeholder={edu.gradeType === 'percentage' ? "e.g. 85%" : "e.g. 3.8/4.0"}
                            value={edu.grade}
                            onChange={e => setResume(prev => ({ ...prev, education: prev.education.map(ed => ed.id === edu.id ? { ...ed, grade: e.target.value } : ed) }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Coursework */}
                <section className="space-y-6">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Core Coursework
                  </h3>
                  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-3xl p-8">
                    <div className="flex flex-wrap gap-3">
                      {resume.coursework?.map((course, idx) => (
                        <span key={idx} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-3 group">
                          {course}
                          <button onClick={() => setResume(prev => ({ ...prev, coursework: prev.coursework.filter((_, i) => i !== idx) }))}>
                            <Trash2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-400 transition-all" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          id="coursework-input"
                          type="text"
                          placeholder="Add Course"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              const val = input.value.trim();
                              if (val && !(resume.coursework || []).includes(val)) {
                                setResume(prev => ({ ...prev, coursework: [...(prev.coursework || []), val] }));
                                input.value = '';
                              }
                            }
                          }}
                          className="bg-white/5 border border-dashed border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 transition-all w-32 placeholder:text-zinc-600"
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('coursework-input') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !(resume.coursework || []).includes(val)) {
                              setResume(prev => ({ ...prev, coursework: [...(prev.coursework || []), val] }));
                              input.value = '';
                            }
                          }}
                          className="p-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Certifications */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4" /> Certifications
                    </h3>
                    <button onClick={addCertification} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all text-xs font-bold">
                      <Plus className="w-4 h-4" /> Add Certification
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {resume.certifications?.map(cert => (
                        <div key={cert.id} className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-3xl space-y-4 relative">
                          <button 
                            onClick={() => setResume(prev => ({ ...prev, certifications: (prev.certifications || []).filter(c => c.id !== cert.id) }))}
                            className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Certificate Name</label>
                            <input
                              type="text"
                              placeholder="AWS Certified Solutions Architect"
                              value={cert.name}
                              onChange={e => setResume(prev => ({ ...prev, certifications: (prev.certifications || []).map(c => c.id === cert.id ? { ...c, name: e.target.value } : c) }))}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Issuer</label>
                            <input
                              type="text"
                              placeholder="Amazon Web Services"
                              value={cert.issuer}
                              onChange={e => setResume(prev => ({ ...prev, certifications: (prev.certifications || []).map(c => c.id === cert.id ? { ...c, issuer: e.target.value } : c) }))}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </section>

                {/* Projects */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Technical Projects
                    </h3>
                    <button onClick={addProject} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all text-xs font-bold">
                      <Plus className="w-4 h-4" /> Add Project
                    </button>
                  </div>
                  <div className="space-y-6">
                    {resume.projects?.map(project => (
                      <div key={project.id} className="p-8 bg-zinc-800/30 border border-zinc-700/50 rounded-[32px] space-y-6 relative group">
                        <button 
                          onClick={() => setResume(prev => ({ ...prev, projects: (prev.projects || []).filter(p => p.id !== project.id) }))}
                          className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Project Name</label>
                            <input
                              type="text"
                              placeholder="E-commerce Platform"
                              value={project.name}
                              onChange={e => setResume(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, name: e.target.value } : p) }))}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Technologies (Comma separated)</label>
                            <input
                              type="text"
                              placeholder="React, Node.js, Firebase"
                              value={project.technologies.join(', ')}
                              onChange={e => {
                                const techs = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                setResume(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, technologies: techs } : p) }));
                              }}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Description</label>
                          <textarea
                            placeholder="Describe the project objective, your role, and the outcome..."
                            value={project.description}
                            onChange={e => setResume(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, description: e.target.value } : p) }))}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-all min-h-[100px] resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Skills */}
                <section className="space-y-6">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-4 h-4" /> Skills & Expertise
                  </h3>
                  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-3xl p-8">
                    <div className="flex flex-wrap gap-3">
                      {resume.skills.map((skill, idx) => (
                        <span key={idx} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-3 group">
                          {skill}
                          <button onClick={() => setResume(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))}>
                            <Trash2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-400 transition-all" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          id="skill-input"
                          type="text"
                          placeholder="Add Skill"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              const val = input.value.trim();
                              if (val && !resume.skills.includes(val)) {
                                setResume(prev => ({ ...prev, skills: [...prev.skills, val] }));
                                input.value = '';
                              }
                            }
                          }}
                          className="bg-white/5 border border-dashed border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 transition-all w-32 placeholder:text-zinc-600"
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('skill-input') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !resume.skills.includes(val)) {
                              setResume(prev => ({ ...prev, skills: [...prev.skills, val] }));
                              input.value = '';
                            }
                          }}
                          className="p-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-zinc-900/50 rounded-[40px] overflow-x-auto overflow-y-auto custom-scrollbar p-8 flex justify-center items-start min-h-[800px] border border-zinc-800"
            >
              <ResumePreview 
                resume={resume} 
                template={template} 
                onUpdate={setResume}
                isCompact={isCompact}
              />
            </motion.div>
          )}

          {activeSubTab === 'analyze' && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResumeAnalyzer resume={resume} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
