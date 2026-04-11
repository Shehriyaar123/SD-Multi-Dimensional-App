import React, { useEffect, useRef } from 'react';
import { ResumeData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResumePreviewProps {
  resume: ResumeData;
  template: 'modern' | 'executive' | 'minimalist';
}

export default function ResumePreview({ resume, template }: ResumePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as any).downloadResume = async () => {
      if (!previewRef.current) return;
      
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const fileName = resume.personalInfo.fullName ? `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf` : 'My_Resume.pdf';
      pdf.save(fileName);
    };
  }, [resume]);

  const renderModern = () => (
    <div className="p-12 text-[#18181b]">
      <header className="border-b-4 border-[#f97316] pb-6 mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{resume.personalInfo.fullName || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-4 text-xs font-bold text-[#71717a]">
          <span>{resume.personalInfo.email}</span>
          <span>{resume.personalInfo.phone}</span>
          <span>{resume.personalInfo.location}</span>
          {resume.personalInfo.linkedin && <span>LinkedIn: {resume.personalInfo.linkedin}</span>}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#f97316] mb-4">Summary</h2>
            <p className="text-sm leading-relaxed text-[#3f3f46]">{resume.personalInfo.summary}</p>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#f97316] mb-4">Experience</h2>
            <div className="space-y-6">
              {resume.experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-base">{exp.role || 'Role'}</h3>
                    <span className="text-[10px] font-bold text-[#a1a1aa]">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <p className="text-xs font-bold text-[#71717a] mb-2">{exp.company} • {exp.location}</p>
                  <div 
                    className="text-xs text-[#52525b] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-p:text-current prose-li:text-current prose-strong:text-current prose-ul:list-disc prose-ul:pl-4"
                    dangerouslySetInnerHTML={{ __html: exp.description }} 
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#f97316] mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, i) => (
                <span key={i} className="px-2 py-1 bg-[#f4f4f5] rounded text-[10px] font-bold">{skill}</span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#f97316] mb-4">Education</h2>
            <div className="space-y-4">
              {resume.education.map(edu => (
                <div key={edu.id}>
                  <h3 className="font-bold text-xs">{edu.degree}</h3>
                  <p className="text-[10px] text-[#71717a]">{edu.school}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderExecutive = () => (
    <div className="p-16 text-[#18181b] font-serif">
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">{resume.personalInfo.fullName || 'Your Name'}</h1>
        <div className="flex justify-center gap-4 text-xs text-[#52525b] italic">
          <span>{resume.personalInfo.email}</span>
          <span>{resume.personalInfo.phone}</span>
          <span>{resume.personalInfo.location}</span>
        </div>
      </header>

      <div className="space-y-10">
        <section>
          <h2 className="text-xs font-bold uppercase border-b border-[#d4d4d8] pb-1 mb-4">Professional Profile</h2>
          <p className="text-sm leading-relaxed text-[#3f3f46]">{resume.personalInfo.summary}</p>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase border-b border-[#d4d4d8] pb-1 mb-4">Professional Experience</h2>
          <div className="space-y-8">
            {resume.experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-sm">{exp.company}</h3>
                  <span className="text-[10px] text-[#71717a]">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <p className="text-xs italic text-[#52525b] mb-3">{exp.role}</p>
                <div 
                  className="text-xs text-[#3f3f46] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-p:text-current prose-li:text-current prose-strong:text-current prose-ul:list-disc prose-ul:pl-4"
                  dangerouslySetInnerHTML={{ __html: exp.description }} 
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-12">
          <div>
            <h2 className="text-xs font-bold uppercase border-b border-[#d4d4d8] pb-1 mb-4">Education</h2>
            {resume.education.map(edu => (
              <div key={edu.id} className="mb-4">
                <h3 className="font-bold text-xs">{edu.school}</h3>
                <p className="text-[10px] text-[#52525b]">{edu.degree} in {edu.field}</p>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase border-b border-[#d4d4d8] pb-1 mb-4">Expertise</h2>
            <p className="text-xs text-[#3f3f46] leading-loose">{resume.skills.join(' • ')}</p>
          </div>
        </section>
      </div>
    </div>
  );

  const renderMinimalist = () => (
    <div className="p-12 text-[#27272a] font-sans">
      <div className="flex justify-between items-start mb-16">
        <div>
          <h1 className="text-5xl font-light tracking-tight mb-2">{resume.personalInfo.fullName || 'Your Name'}</h1>
          <p className="text-sm text-[#a1a1aa] font-medium">{resume.experience[0]?.role || 'Professional'}</p>
        </div>
        <div className="text-right text-[10px] text-[#a1a1aa] space-y-1">
          <p>{resume.personalInfo.email}</p>
          <p>{resume.personalInfo.phone}</p>
          <p>{resume.personalInfo.location}</p>
        </div>
      </div>

      <div className="space-y-12">
        <section className="grid grid-cols-4 gap-8">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#d4d4d8]">About</h2>
          <div className="col-span-3">
            <p className="text-sm leading-relaxed text-[#52525b]">{resume.personalInfo.summary}</p>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-8">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#d4d4d8]">Experience</h2>
          <div className="col-span-3 space-y-8">
            {resume.experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-bold text-sm">{exp.role}</h3>
                  <span className="text-[10px] text-[#d4d4d8]">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <p className="text-xs text-[#a1a1aa] mb-4">{exp.company}</p>
                <div 
                  className="text-xs text-[#71717a] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-p:text-current prose-li:text-current prose-strong:text-current prose-ul:list-disc prose-ul:pl-4"
                  dangerouslySetInnerHTML={{ __html: exp.description }} 
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-4 gap-8">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#d4d4d8]">Skills</h2>
          <div className="col-span-3 flex flex-wrap gap-x-6 gap-y-2">
            {resume.skills.map((skill, i) => (
              <span key={i} className="text-xs text-[#52525b]">{skill}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div ref={previewRef} className="w-[794px] min-h-[1123px] mx-auto bg-white shadow-2xl origin-top">
      {template === 'modern' && renderModern()}
      {template === 'executive' && renderExecutive()}
      {template === 'minimalist' && renderMinimalist()}
    </div>
  );
}
