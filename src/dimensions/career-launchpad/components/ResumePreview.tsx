import React, { useEffect, useRef } from 'react';
import { ResumeData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResumePreviewProps {
  resume: ResumeData;
  template: 'modern' | 'executive' | 'minimalist' | 'ats';
  onUpdate: (updater: (prev: ResumeData) => ResumeData) => void;
  isCompact?: boolean;
}

const Editable = ({ value, onUpdate, className, multiline = false }: { 
  value: string, 
  onUpdate: (val: string) => void, 
  className?: string,
  multiline?: boolean 
}) => {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onUpdate(e.currentTarget.innerText)}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={`hover:bg-slate-50 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-slate-200 rounded px-1 -mx-1 transition-all cursor-text ${className}`}
    >
      {value}
    </div>
  );
};

export default function ResumePreview({ resume, template, onUpdate, isCompact = false }: ResumePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // --- Automated Layout / Pagination Engine ---
  // This engine analyzes elements with the 'auto-paginate' class and injects
  // physical top margin if they cross into the bottom padding zone of an A4 page,
  // ensuring the WYSIWYG preview mirrors actual physical pages accurately.
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const paginate = () => {
      if (!previewRef.current) return;
      
      const container = previewRef.current;
      const elements = Array.from(container.querySelectorAll('.auto-paginate')) as HTMLElement[];
      
      // Clear dynamically applied top margins first to evaluate natural flow
      elements.forEach(el => el.style.marginTop = '');
      
      const A4_HEIGHT = 1123;
      const PADDING = 76; // Exact equivalent of 20mm padding
      
      for (const el of elements) {
         // Recursively calculate pure unscaled offsetTop relative to the container
         let top = 0;
         let currentEl: HTMLElement | null = el;
         while (currentEl && currentEl !== container) {
             top += currentEl.offsetTop;
             currentEl = currentEl.offsetParent as HTMLElement;
         }
         
         const height = el.offsetHeight;
         const bottom = top + height;
         
         const currentPage = Math.floor(top / A4_HEIGHT);
         const pageBoundary = (currentPage + 1) * A4_HEIGHT;
         const bottomSafeZone = pageBoundary - PADDING;
         const topSafeZone = pageBoundary + PADDING;
         
         // Trigger if element is cut by the bottom zone, OR if it inadvertently started directly inside the gap
         if ((top < bottomSafeZone && bottom > bottomSafeZone) || (top >= bottomSafeZone && top < topSafeZone)) {
             const pushAmount = topSafeZone - top;
             el.style.marginTop = `${pushAmount}px`;
         }
      }
    };

    // Give the DOM a tiny bit of time to settle first render
    timeoutId = setTimeout(paginate, 150);

    // Track text changes inside the preview so we can re-paginate while typing
    const observer = new MutationObserver(() => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(paginate, 300); // debounce typing
    });
    
    if (previewRef.current) {
        observer.observe(previewRef.current, { 
            childList: true, 
            subtree: true, 
            characterData: true 
        });
    }

    return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
    };
  }, [resume, template]);

  useEffect(() => {
    (window as any).downloadResume = async () => {
      if (!previewRef.current) return;
      
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image height in PDF mm based on the canvas aspect ratio
      const imgHeightInMm = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeightInMm;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInMm, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeightInMm; // Negative position to shift the image up
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInMm, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      const fileName = resume.personalInfo.fullName ? `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf` : 'My_Resume.pdf';
      pdf.save(fileName);
    };
  }, [resume]);

  const renderModern = () => (
    <div className={`${isCompact ? 'p-[12mm]' : 'p-[20mm]'} text-[#0f172a] font-sans transition-all duration-500`}>
      <header className={`flex gap-8 border-b-[6px] border-[#0f172a] ${isCompact ? 'pb-4 mb-6' : 'pb-8 mb-12'} auto-paginate`}>
        {resume.personalInfo.profileImage && (
          <div className={`${isCompact ? 'w-24 h-24' : 'w-32 h-32'} shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 transition-all`}>
            <img 
              src={resume.personalInfo.profileImage} 
              alt={resume.personalInfo.fullName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="flex-1">
          <h1 className={`${isCompact ? 'text-3xl' : 'text-5xl'} font-black uppercase tracking-tighter mb-4 font-display transition-all`}>
            <Editable 
              value={resume.personalInfo.fullName || 'Your Name'} 
              onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, fullName: val } }))}
            />
          </h1>
          <div className={`flex flex-wrap ${isCompact ? 'gap-4' : 'gap-8'} text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.2em]`}>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#0f172a] rounded-full" />
              <Editable 
                value={resume.personalInfo.email} 
                onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, email: val } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#0f172a] rounded-full" />
              <Editable 
                value={resume.personalInfo.phone} 
                onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: val } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-[#0f172a] rounded-full" />
              <Editable 
                value={resume.personalInfo.location} 
                onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, location: val } }))}
              />
            </div>
            {resume.personalInfo.socialLinks?.map(link => (
              <div key={link.id} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-[#0f172a] rounded-full" />
                <a 
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#0f172a] hover:underline transition-all"
                >
                  {link.label || 'Link'}
                </a>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className={`grid grid-cols-3 ${isCompact ? 'gap-8 px-4' : 'gap-16'}`}>
        <div className={`col-span-2 ${isCompact ? 'space-y-6' : 'space-y-12'}`}>
          <section className="auto-paginate break-inside-avoid">
            <div className={`flex items-center gap-4 ${isCompact ? 'mb-2' : 'mb-6'}`}>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#0f172a] whitespace-nowrap">Profile Summary</h2>
              <div className="h-[1px] w-full bg-[#f1f5f9]" />
            </div>
            <Editable 
              multiline
              value={resume.personalInfo.summary} 
              onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
              className={`${isCompact ? 'text-[11px]' : 'text-sm'} leading-relaxed text-[#334155] text-justify font-medium`}
            />
          </section>
          
          <section className="auto-paginate break-inside-avoid">
            <div className={`flex items-center gap-4 ${isCompact ? 'mb-4' : 'mb-10'}`}>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#0f172a] whitespace-nowrap">Professional Experience</h2>
              <div className="h-[1px] w-full bg-[#f1f5f9]" />
            </div>
            <div className={`${isCompact ? 'space-y-6' : 'space-y-12'}`}>
              {resume.experience.map(exp => (
                <div key={exp.id} className={`auto-paginate break-inside-avoid relative ${isCompact ? 'pl-4' : 'pl-6'} border-l-2 border-[#f1f5f9] hover:border-[#0f172a] transition-colors`}>
                  <div className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#0f172a]`} />
                  <div className="flex justify-between items-baseline mb-2">
                    <Editable 
                      value={exp.role || 'Role'} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, role: val } : e) }))}
                      className={`font-black tracking-tight text-[#0f172a] font-display ${isCompact ? 'text-lg' : 'text-xl'}`}
                    />
                    <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex gap-2">
                      <Editable 
                        value={exp.startDate} 
                        onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, startDate: val } : e) }))}
                      />
                      —
                      <Editable 
                        value={exp.current ? 'Present' : exp.endDate} 
                        onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, endDate: val, current: val.toLowerCase() === 'present' } : e) }))}
                      />
                    </span>
                  </div>
                  <div className="flex gap-2 text-[11px] font-bold text-[#64748b] mb-4 uppercase tracking-wider">
                    <Editable 
                      value={exp.company} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, company: val } : e) }))}
                    />
                    <span className="opacity-30">•</span>
                    <Editable 
                      value={exp.location} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, location: val } : e) }))}
                    />
                  </div>
                  <div 
                    className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#475569] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-p:text-current prose-li:text-current prose-strong:text-[#0f172a] prose-ul:list-disc prose-ul:pl-5 prose-p:text-justify font-medium`}
                    dangerouslySetInnerHTML={{ __html: exp.description }} 
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className={`${isCompact ? 'space-y-8' : 'space-y-16'}`}>
          <section className="auto-paginate break-inside-avoid">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-8'}`}>Expertise</h2>
            <div className={`flex flex-wrap ${isCompact ? 'gap-1' : 'gap-2'}`}>
              {resume.skills.map((skill, i) => (
                <Editable 
                  key={i}
                  value={skill} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, skills: prev.skills.map((s, idx) => idx === i ? val : s) }))}
                  className={`${isCompact ? 'px-2 py-1 text-[8px]' : 'px-3 py-2 text-[10px]'} bg-[#f8fafc] border border-[#f1f5f9] rounded font-bold uppercase tracking-wider text-[#334155] hover:bg-[#0f172a] hover:text-white transition-all shadow-sm`}
                />
              ))}
            </div>
          </section>
          <section className="auto-paginate break-inside-avoid">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-8'}`}>Selected Projects</h2>
            <div className={`${isCompact ? 'space-y-6' : 'space-y-10'}`}>
              {resume.projects?.map(project => (
                <div key={project.id} className="auto-paginate break-inside-avoid group/project">
                  <Editable 
                    value={project.name} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, name: val } : p) }))}
                    className={`${isCompact ? 'text-base' : 'text-lg'} font-black mb-1 tracking-tight text-[#0f172a] font-display`}
                  />
                  <Editable 
                    value={project.technologies.join(' • ')} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, technologies: val.split('•').map(t => t.trim()) } : p) }))}
                    className="text-[9px] font-black text-[#94a3b8] mb-2 uppercase tracking-[0.15em] block"
                  />
                  <Editable 
                    multiline
                    value={project.description} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, description: val } : p) }))}
                    className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#475569] leading-relaxed text-justify font-medium`}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="auto-paginate break-inside-avoid">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-8'}`}>Education</h2>
            <div className={`${isCompact ? 'space-y-4' : 'space-y-8'}`}>
              {resume.education.map(edu => (
                <div key={edu.id} className="auto-paginate break-inside-avoid">
                  <Editable 
                    value={edu.degree || 'Degree'} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, degree: val } : e) }))}
                    className={`font-black mb-1 text-[#0f172a] tracking-tight ${isCompact ? 'text-[11px]' : 'text-sm'}`}
                  />
                  <Editable 
                    value={edu.school || 'University'} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, school: val } : e) }))}
                    className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} text-[#64748b] font-bold uppercase tracking-wider mb-2 block`}
                  />
                  {edu.grade && (
                    <div className="inline-flex items-baseline gap-1 px-2 py-1 bg-[#f1f5f9] rounded text-[10px] font-black text-[#0f172a] uppercase tracking-tighter">
                      <span className="opacity-40">{edu.gradeType === 'percentage' ? 'Perc' : 'CGPA'}:</span>
                      <Editable 
                        value={edu.grade} 
                        onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, grade: val } : e) }))}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {resume.certifications?.length > 0 && (
            <section className="auto-paginate break-inside-avoid">
              <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-6'}`}>Certifications</h2>
              <div className={`${isCompact ? 'space-y-2' : 'space-y-4'}`}>
                {resume.certifications.map(cert => (
                  <div key={cert.id} className="auto-paginate break-inside-avoid">
                    <Editable 
                      value={cert.name} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, name: val } : c) }))}
                      className={`font-bold leading-snug text-[#334155] uppercase tracking-wide ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}
                    />
                    <Editable 
                      value={cert.issuer} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, issuer: val } : c) }))}
                      className="text-[9px] text-[#94a3b8] font-bold"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const renderExecutive = () => (
    <div className={`${isCompact ? 'p-[14mm]' : 'p-[22mm]'} text-[#1e293b] font-sans transition-all duration-500`}>
      <header className={`text-center ${isCompact ? 'mb-6' : 'mb-12'} auto-paginate break-inside-avoid`}>
        {resume.personalInfo.profileImage && (
          <div className={`${isCompact ? 'w-20 h-20' : 'w-24 h-24'} mx-auto mb-4 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm transition-all`}>
            <img 
              src={resume.personalInfo.profileImage} 
              alt={resume.personalInfo.fullName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <h1 className={`${isCompact ? 'text-3xl mb-3' : 'text-5xl mb-6'} font-medium tracking-tight font-serif text-[#0f172a] transition-all`}>
          <Editable 
            value={resume.personalInfo.fullName || 'Your Name'} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, fullName: val } }))}
          />
        </h1>
        <div className={`flex justify-center flex-wrap ${isCompact ? 'gap-4' : 'gap-8'} text-[10px] text-[#64748b] font-black uppercase tracking-[0.25em]`}>
          <Editable 
            value={resume.personalInfo.email} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, email: val } }))}
          />
          <span className="opacity-20">•</span>
          <Editable 
            value={resume.personalInfo.phone} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: val } }))}
          />
          <span className="opacity-20">•</span>
          <Editable 
            value={resume.personalInfo.location} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, location: val } }))}
          />
          {resume.personalInfo.socialLinks?.map(link => (
            <React.Fragment key={link.id}>
              <span className="opacity-20">•</span>
              <a 
                href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#0f172a] hover:underline transition-all"
              >
                {link.label || 'Link'}
              </a>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-8 h-[1px] w-24 bg-[#0f172a] mx-auto opacity-20" />
      </header>

      <div className={`${isCompact ? 'space-y-6' : 'space-y-12'}`}>
        <section className="auto-paginate break-inside-avoid">
          <h2 className={`text-[10px] font-black uppercase border-b border-[#f1f5f9] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8] flex justify-between items-center`}>
            Professional Summary
            <span className="w-1.5 h-1.5 bg-[#0f172a] rounded-full" />
          </h2>
          <Editable 
            multiline
            value={resume.personalInfo.summary} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
            className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} leading-relaxed text-[#334155] text-justify font-medium`}
          />
        </section>
 
        <section className="auto-paginate break-inside-avoid">
          <h2 className={`text-[10px] font-black uppercase border-b border-[#f1f5f9] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8] flex justify-between items-center`}>
            Experience History
            <span className="w-1.5 h-1.5 bg-[#0f172a] rounded-full" />
          </h2>
          <div className={`${isCompact ? 'space-y-6' : 'space-y-12'}`}>
            {resume.experience.map(exp => (
              <div key={exp.id} className="auto-paginate break-inside-avoid group">
                <div className="flex justify-between items-baseline mb-1">
                  <Editable 
                    value={exp.company} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, company: val } : e) }))}
                    className={`font-bold uppercase tracking-wider text-[#0f172a] ${isCompact ? 'text-[13px]' : 'text-[15px]'}`}
                  />
                  <span className="text-[10px] text-[#94a3b8] font-black flex gap-2 uppercase tracking-widest">
                    <Editable 
                      value={exp.startDate} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, startDate: val } : e) }))}
                    />
                    — 
                    <Editable 
                      value={exp.current ? 'Present' : exp.endDate} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, endDate: val, current: val.toLowerCase() === 'present' } : e) }))}
                    />
                  </span>
                </div>
                <div className={`flex justify-between items-baseline ${isCompact ? 'mb-2' : 'mb-6'}`}>
                  <Editable 
                    value={exp.role} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, role: val } : e) }))}
                    className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} italic text-[#64748b] font-serif`}
                  />
                  <Editable 
                    value={exp.location} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, location: val } : e) }))}
                    className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8]"
                  />
                </div>
                <div 
                  className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#334155] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-p:text-current prose-li:text-current prose-strong:text-[#0f172a] prose-ul:list-disc prose-ul:pl-5 prose-p:text-justify font-medium`}
                  dangerouslySetInnerHTML={{ __html: exp.description }} 
                />
              </div>
            ))}
          </div>
        </section>

        <section className="auto-paginate break-inside-avoid">
          <h2 className={`text-[10px] font-black uppercase border-b border-[#f1f5f9] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8] flex justify-between items-center`}>
            Selected Projects
            <span className="w-1.5 h-1.5 bg-[#0f172a] rounded-full" />
          </h2>
          <div className={`${isCompact ? 'space-y-6' : 'space-y-10'}`}>
            {resume.projects?.map(project => (
              <div key={project.id} className="auto-paginate break-inside-avoid">
                <div className={`flex justify-between items-baseline ${isCompact ? 'mb-1' : 'mb-3'}`}>
                  <h3 className={`font-bold uppercase tracking-wide text-[#0f172a] ${isCompact ? 'text-[12px]' : 'text-[14px]'}`}>{project.name}</h3>
                  <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.2em]">{project.technologies.join(' / ')}</p>
                </div>
                <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#475569] leading-relaxed text-justify font-medium`}>{project.description}</p>
              </div>
            ))}
          </div>
        </section>
 
        <section className={`grid grid-cols-2 ${isCompact ? 'gap-8' : 'gap-16'} auto-paginate break-inside-avoid`}>
          <div className="break-inside-avoid">
            <h2 className={`text-[10px] font-black uppercase border-b border-[#f1f5f9] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8]`}>Academic Background</h2>
            {(resume.education || []).map(edu => (
              <div key={edu.id} className={`${isCompact ? 'mb-6' : 'mb-10'} auto-paginate break-inside-avoid`}>
                <Editable 
                  value={edu.school} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, school: val } : e) }))}
                  className={`font-bold uppercase mb-1 text-[#0f172a] ${isCompact ? 'text-[11px]' : 'text-[13px]'}`}
                />
                <div className="flex gap-2 text-[12px] text-[#64748b] italic font-serif">
                  <Editable 
                    value={edu.degree} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, degree: val } : e) }))}
                  />
                  <Editable 
                    value={edu.field} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, field: val } : e) }))}
                  />
                </div>
                {edu.grade && (
                  <div className="text-[10px] font-black text-[#94a3b8] mt-3 uppercase tracking-tighter flex gap-2">
                    <span className="opacity-50">{edu.gradeType === 'percentage' ? 'Perc' : 'CGPA'}:</span>
                    <Editable 
                      value={edu.grade} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, grade: val } : e) }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="break-inside-avoid">
            <h2 className="text-[10px] font-black uppercase border-b border-[#f1f5f9] pb-3 mb-8 tracking-[0.4em] text-[#94a3b8]">Core Competency</h2>
            <div className="flex flex-wrap gap-2 mb-12">
              {resume.skills.map((skill, i) => (
                <span key={i} className="text-[10px] font-black uppercase tracking-widest text-[#334155] border-r border-[#f1f5f9] pr-3 last:border-0 leading-loose">
                  {skill}
                </span>
              ))}
            </div>
            
            {(resume.certifications || []).length > 0 && (
              <div className="break-inside-avoid mt-8">
                <h2 className="text-[10px] font-black uppercase border-b border-[#f1f5f9] pb-3 mb-8 tracking-[0.4em] text-[#94a3b8]">Board Certifications</h2>
                {(resume.certifications || []).map(cert => (
                  <div key={cert.id} className="mb-6 auto-paginate break-inside-avoid">
                    <Editable 
                      value={cert.name} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, name: val } : c) }))}
                      className="font-bold text-[11px] uppercase mb-1 text-[#334155]"
                    />
                    <Editable 
                      value={cert.issuer} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, issuer: val } : c) }))}
                      className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider italic font-serif"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const renderMinimalist = () => (
    <div className={`${isCompact ? 'p-[12mm]' : 'p-[20mm]'} text-[#0f172a] font-sans transition-all duration-500`}>
      <div className={`flex justify-between items-start ${isCompact ? 'mb-10' : 'mb-20'} auto-paginate break-inside-avoid`}>
        <div className="flex gap-8 items-start">
          {resume.personalInfo.profileImage && (
            <div className={`${isCompact ? 'w-20 h-20' : 'w-24 h-24'} shrink-0 overflow-hidden grayscale contrast-125 transition-all`}>
              <img 
                src={resume.personalInfo.profileImage} 
                alt={resume.personalInfo.fullName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div>
            <h1 className={`${isCompact ? 'text-4xl' : 'text-6xl'} font-black tracking-tight mb-4 font-display transition-all`}>
              <Editable 
                value={resume.personalInfo.fullName || 'Your Name'} 
                onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, fullName: val } }))}
              />
            </h1>
            <Editable 
              value={(resume.experience || [])[0]?.role || 'Professional'} 
              onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map((e, idx) => idx === 0 ? { ...e, role: val } : e) }))}
              className={`${isCompact ? 'text-sm' : 'text-lg'} text-[#94a3b8] font-black tracking-[0.3em] uppercase transition-all`}
            />
          </div>
        </div>
        <div className="text-right text-[10px] text-[#475569] space-y-3 uppercase tracking-[0.3em] font-black">
          <Editable 
            value={resume.personalInfo.email} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, email: val } }))}
          />
          <Editable 
            value={resume.personalInfo.phone} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: val } }))}
          />
          <Editable 
            value={resume.personalInfo.location} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, location: val } }))}
          />
          {resume.personalInfo.socialLinks?.map(link => (
            <a 
              key={link.id}
              href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-black hover:underline transition-all block"
            >
              {link.label || 'Link'}
            </a>
          ))}
        </div>
      </div>

      <div className={`${isCompact ? 'space-y-8' : 'space-y-16'}`}>
        <section className={`grid grid-cols-4 ${isCompact ? 'gap-8' : 'gap-16'} auto-paginate break-inside-avoid border-t border-[#f1f5f9] ${isCompact ? 'pt-6' : 'pt-12'}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8]">Overview</h2>
          <div className="col-span-3">
            <Editable 
              multiline
              value={resume.personalInfo.summary} 
              onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
              className={`${isCompact ? 'text-[11px]' : 'text-sm'} leading-relaxed text-[#334155] text-justify font-medium`}
            />
          </div>
        </section>
 
        <section className={`grid grid-cols-4 ${isCompact ? 'gap-8' : 'gap-16'} auto-paginate break-inside-avoid border-t border-[#f1f5f9] ${isCompact ? 'pt-6' : 'pt-12'}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8]">Background</h2>
          <div className={`col-span-3 ${isCompact ? 'space-y-8' : 'space-y-16'}`}>
            {resume.experience.map(exp => (
              <div key={exp.id} className="auto-paginate break-inside-avoid group">
                <div className={`flex justify-between items-baseline ${isCompact ? 'mb-2' : 'mb-4'}`}>
                  <Editable 
                    value={exp.role} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, role: val } : e) }))}
                    className={`font-black tracking-tight font-display text-[#0f172a] ${isCompact ? 'text-lg' : 'text-xl'}`}
                  />
                  <span className="text-[10px] text-[#94a3b8] font-black tracking-[0.2em] flex gap-2 uppercase">
                    <Editable 
                      value={exp.startDate} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, startDate: val } : e) }))}
                    />
                    — 
                    <Editable 
                      value={exp.current ? 'Present' : exp.endDate} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, endDate: val, current: val.toLowerCase() === 'present' } : e) }))}
                    />
                  </span>
                </div>
                <Editable 
                  value={exp.company} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, experience: prev.experience.map(e => e.id === exp.id ? { ...e, company: val } : e) }))}
                  className={`${isCompact ? 'text-[10px] mb-4' : 'text-[11px] mb-8'} text-[#64748b] font-black tracking-[0.2em] uppercase`}
                />
                <div 
                  className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#475569] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-p:text-current prose-li:text-current prose-strong:text-[#0f172a] prose-ul:list-disc prose-ul:pl-5 prose-p:text-justify font-medium`}
                  dangerouslySetInnerHTML={{ __html: exp.description }} 
                />
              </div>
            ))}
          </div>
        </section>

        {resume.projects?.length > 0 && (
          <section className="grid grid-cols-4 gap-16 auto-paginate break-inside-avoid border-t border-[#f1f5f9] pt-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8]">Portfolio</h2>
            <div className="col-span-3 space-y-12">
              {resume.projects.map(proj => (
                <div key={proj.id} className="auto-paginate break-inside-avoid">
                  <Editable 
                    value={proj.name} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === proj.id ? { ...p, name: val } : p) }))}
                    className="font-black text-lg tracking-tight mb-2 text-[#0f172a] font-display"
                  />
                  <Editable 
                    value={proj.technologies.join(' • ')} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === proj.id ? { ...p, technologies: val.split('•').map(t => t.trim()) } : p) }))}
                    className="text-[9px] text-[#94a3b8] mb-6 font-black tracking-widest uppercase block"
                  />
                  <Editable 
                    multiline
                    value={proj.description} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === proj.id ? { ...p, description: val } : p) }))}
                    className="text-xs text-[#475569] leading-relaxed text-justify font-medium"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-4 gap-16 auto-paginate break-inside-avoid border-t border-[#f1f5f9] pt-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8]">Skills</h2>
          <div className="col-span-3 grid grid-cols-2 gap-x-12 gap-y-6">
            {resume.skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-3 group/skill auto-paginate break-inside-avoid">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f1f5f9] group-hover/skill:bg-[#0f172a] transition-colors" />
                <Editable 
                  value={skill} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, skills: prev.skills.map((s, idx) => idx === i ? val : s) }))}
                  className="text-[11px] text-[#334155] font-bold tracking-widest uppercase"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-4 gap-16 auto-paginate break-inside-avoid border-t border-[#f1f5f9] pt-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8]">Academic</h2>
          <div className="col-span-3 space-y-10">
            {resume.education.map(edu => (
              <div key={edu.id} className="auto-paginate break-inside-avoid">
                <div className="flex justify-between items-baseline mb-3">
                  <Editable 
                    value={edu.degree} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, degree: val } : e) }))}
                    className="font-black text-lg tracking-tight text-[#0f172a] font-display"
                  />
                  <span className="text-[10px] text-[#94a3b8] font-black tracking-[0.2em] flex gap-2 uppercase">
                    <Editable 
                      value={edu.startDate} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, startDate: val } : e) }))}
                    />
                    — 
                    <Editable 
                      value={edu.endDate} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, endDate: val } : e) }))}
                    />
                  </span>
                </div>
                <Editable 
                  value={edu.school} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, school: val } : e) }))}
                  className="text-[11px] text-[#64748b] font-black tracking-widest uppercase mb-4 block"
                />
                {edu.grade && (
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#f8fafc] border border-[#f1f5f9] rounded text-[9px] text-[#475569] font-black uppercase tracking-tight">
                    <span className="opacity-40">{edu.gradeType === 'percentage' ? 'Perc' : 'CGPA'}:</span>
                    <Editable 
                      value={edu.grade} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, education: prev.education.map(e => e.id === edu.id ? { ...e, grade: val } : e) }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {(resume.certifications || []).length > 0 && (
          <section className="grid grid-cols-4 gap-16 auto-paginate break-inside-avoid border-t border-[#f1f5f9] pt-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8]">Distinctions</h2>
            <div className="col-span-3 space-y-6">
              {resume.certifications.map(cert => (
                <div key={cert.id} className="flex justify-between items-baseline group/cert auto-paginate break-inside-avoid">
                  <Editable 
                    value={cert.name} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, name: val } : c) }))}
                    className="text-xs font-black tracking-tight text-[#0f172a] font-display uppercase"
                  />
                  <Editable 
                    value={cert.issuer} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, certifications: prev.certifications.map(c => c.id === cert.id ? { ...c, issuer: val } : c) }))}
                    className="text-[9px] text-[#94a3b8] font-black tracking-[0.2em] uppercase"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {(resume.coursework || []).length > 0 && (
          <section className="grid grid-cols-4 gap-16 auto-paginate break-inside-avoid border-t border-[#f1f5f9] pt-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8]">Inquiry</h2>
            <div className="col-span-3 flex flex-wrap gap-x-12 gap-y-3">
              {resume.coursework.map((course, i) => (
                <Editable 
                  key={i}
                  value={course} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, coursework: prev.coursework.map((c, idx) => idx === i ? val : c) }))}
                  className="text-[10px] text-[#64748b] font-bold tracking-widest uppercase"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  const renderATS = () => (
    <div className={`p-[20mm] text-[#000000] font-sans leading-normal transition-all duration-500`}>
      <header className="mb-6 text-center border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold mb-2 uppercase tracking-tight">
          <Editable 
            value={resume.personalInfo.fullName || 'Your Name'} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, fullName: val } }))}
          />
        </h1>
        <div className="flex justify-center flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
          <Editable 
            value={resume.personalInfo.email} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, email: val } }))}
          />
          <span>•</span>
          <Editable 
            value={resume.personalInfo.phone} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: val } }))}
          />
          <span>•</span>
          <Editable 
            value={resume.personalInfo.location} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, location: val } }))}
          />
          {resume.personalInfo.socialLinks?.map(link => (
            <React.Fragment key={link.id}>
              <span>•</span>
              <a 
                href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline transition-all"
              >
                {link.label || 'Link'}
              </a>
            </React.Fragment>
          ))}
        </div>
      </header>

      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1 tracking-widest text-left">Professional Summary</h2>
        <Editable 
          multiline
          value={resume.personalInfo.summary} 
          onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
          className="text-[11px] leading-relaxed text-justify"
        />
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1 tracking-widest text-left">Experience</h2>
        <div className="space-y-6">
          {resume.experience.map(exp => (
            <div key={exp.id} className="auto-paginate break-inside-avoid">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-xs uppercase tracking-tight">{exp.company}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[11px] font-bold italic">{exp.role}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{exp.location}</span>
              </div>
              <div 
                className="text-[11px] leading-relaxed prose prose-slate max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-ul:list-disc prose-ul:pl-4 text-justify"
                dangerouslySetInnerHTML={{ __html: exp.description }} 
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1 tracking-widest text-left">Education</h2>
        <div className="space-y-4">
          {resume.education.map(edu => (
            <div key={edu.id} className="auto-paginate break-inside-avoid">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-xs uppercase tracking-tight">{edu.school}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">{edu.startDate} – {edu.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] italic">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span>
                {edu.grade && (
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {edu.gradeType === 'percentage' ? 'Perc' : 'CGPA'}: {edu.grade}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1 tracking-widest text-left">Projects</h2>
          <div className="space-y-4">
            {resume.projects.map(project => (
              <div key={project.id} className="auto-paginate break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-xs uppercase tracking-tight">{project.name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest">{project.technologies.join(' | ')}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-justify">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1 tracking-widest text-left">Skills & Certifications</h2>
        <div className="text-[11px] leading-relaxed space-y-2">
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] mr-2">Core Skills:</span>
            {resume.skills.join(', ')}
          </div>
          {resume.certifications && resume.certifications.length > 0 && (
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] mr-2">Certifications:</span>
              {resume.certifications.map(c => c.name).join(', ')}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div className="relative group/preview">
      {/* Page Indicators */}
      <div className="absolute -left-24 top-0 h-full w-20 flex flex-col pointer-events-none">
        {[1, 2, 3, 4].map(page => (
          <div key={page} className="h-[1123px] flex flex-col items-end justify-start pr-4 pt-12">
            <span className="text-[10px] font-black text-zinc-700/50 uppercase tracking-[0.2em] [writing-mode:vertical-lr]">Page {page}</span>
            <div className="w-[1px] h-full bg-zinc-200 mt-4 mx-auto" />
          </div>
        ))}
      </div>

      <div 
        ref={previewRef} 
        className="w-[794px] min-h-[1123px] mx-auto bg-white shadow-2xl origin-top relative overflow-hidden"
      >
        {/* Transparent Page Guides (Word-style simulation) */}
        {[1123, 2246, 3369].map((top, i) => (
          <div 
            key={i}
            data-html2canvas-ignore="true"
            style={{ top: `${top}px` }}
            className="absolute left-0 w-full z-[60] flex flex-col pointer-events-none"
          >
            {/* Visual indicator of the page boundary */}
            <div className="h-[1px] w-full bg-zinc-200 relative">
              <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#f1f5f9] px-2 py-0.5 rounded-full border border-zinc-200 text-[8px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                Page {i + 2} Start / Page {i + 1} End
              </div>
            </div>
          </div>
        ))}

        {template === 'modern' && renderModern()}
        {template === 'executive' && renderExecutive()}
        {template === 'minimalist' && renderMinimalist()}
        {template === 'ats' && renderATS()}
      </div>
      
      {/* Help tooltip */}
      <div className="mt-6 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest opacity-0 group-hover/preview:opacity-100 transition-all">
        Pro Tip: You can edit text directly in the preview above.
      </div>
    </div>
  );
}
