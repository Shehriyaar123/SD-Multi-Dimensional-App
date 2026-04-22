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
      
      // 1. DYNAMIC ANALYSIS: Skip the guide overlays and measure the ACTUAL template padding
      const templateEl = Array.from(container.children).find(child => !child.hasAttribute('data-html2canvas-ignore')) as HTMLElement;
      if (!templateEl) return;

      const computedStyle = window.getComputedStyle(templateEl);
      const measuredPadding = parseFloat(computedStyle.paddingTop) || 105;
      
      // 2. SYMMETRY: Set the footer boundary to match the header exactly
      const PAGE_MARGIN = measuredPadding;
      const A4_HEIGHT = 1123;
      const JUMP_THRESHOLD = 90; // High sensitivity for a "proper" feel
      
      // 3. INNER SPLITTING: Allow rich text boundaries to split intelligently
      const proseElements = container.querySelectorAll('.legacy-prose');
      proseElements.forEach(prose => {
        Array.from(prose.children).forEach((child: Element) => {
          if (child.tagName === 'UL' || child.tagName === 'OL') {
             Array.from(child.children).forEach((li: Element) => {
                li.classList.add('auto-paginate', 'break-inside-avoid');
             });
          } else {
             if (child.tagName !== 'BR') {
               child.classList.add('auto-paginate', 'break-inside-avoid');
             }
          }
        });
      });
      
      const elements = Array.from(container.querySelectorAll('.auto-paginate')).filter(el => {
        let p = el.parentElement;
        while (p && p !== container) {
          if (p.classList.contains('auto-paginate')) return false;
          p = p.parentElement;
        }
        return true;
      }) as HTMLElement[];
      
      elements.forEach(el => el.style.marginTop = '');
      
      // Pass 1: Handle Jumps and Footer Symmetry
      for (let i = 0; i < elements.length; i++) {
         const el = elements[i];
         
         let top = 0;
         let currentEl: HTMLElement | null = el;
         while (currentEl && currentEl !== container) {
             top += currentEl.offsetTop;
             currentEl = (currentEl.offsetParent as HTMLElement);
         }
         
         const height = el.offsetHeight;
         const bottom = top + height;
         
         const currentPage = Math.floor(top / A4_HEIGHT);
         const pageBoundary = (currentPage + 1) * A4_HEIGHT;
         
         // Logic: Ensure bottom margin equals analyzed header padding
         const footerStart = pageBoundary - PAGE_MARGIN;
         const nextPageHeaderEnd = pageBoundary + PAGE_MARGIN;
         
         const crossesFooter = top < footerStart && bottom > footerStart;
         const startsInGap = top >= footerStart && top < nextPageHeaderEnd;
         const startsTooLow = top < pageBoundary && top > (footerStart - JUMP_THRESHOLD);

         if (crossesFooter || startsInGap || startsTooLow) {
            const shouldAvoidBreak = el.classList.contains('break-inside-avoid') || 
                                   el.tagName.startsWith('H') || 
                                   el.classList.contains('section-header') ||
                                   el.classList.contains('bond-header');

            if (shouldAvoidBreak) {
                // FORCE JUMP: Pushes content to the next page header line exactly
                const pushAmount = nextPageHeaderEnd - top;
                // Treat chunks intelligently; if it's smaller than a full page, push it.
                if (pushAmount < A4_HEIGHT * 0.8) {
                    el.style.marginTop = `${pushAmount}px`;
                }
            }
         }
      }

      // Pass 2: Header/Content Bonding
      for (let i = 0; i < elements.length - 1; i++) {
        const el = elements[i];
        const nextEl = elements[i+1];
        
        const isHeader = el.tagName.startsWith('H') || el.classList.contains('section-header') || el.classList.contains('bond-header');
        if (!isHeader) continue;

        let top = 0; let curr: HTMLElement | null = el;
        while (curr && curr !== container) { top += curr.offsetTop; curr = (curr.offsetParent as HTMLElement); }
        
        let nextTop = 0; let nextCurr: HTMLElement | null = nextEl;
        while (nextCurr && nextCurr !== container) { nextTop += nextCurr.offsetTop; nextCurr = (nextCurr.offsetParent as HTMLElement); }

        const pageEl = Math.floor(top / A4_HEIGHT);
        const pageNext = Math.floor(nextTop / A4_HEIGHT);

        if (pageNext > pageEl) {
           const pageBoundary = (pageEl + 1) * A4_HEIGHT;
           const headerEnd = pageBoundary + PAGE_MARGIN;
           el.style.marginTop = `${headerEnd - top}px`;
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
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Identify the preview container in the clone and force white background context
          const clonedPreview = clonedDoc.querySelector('[data-resume-preview]') as HTMLElement;
          if (clonedPreview) {
            clonedPreview.style.backgroundColor = '#ffffff';
            clonedPreview.style.color = '#0f172a';
          }

          // Disable modern filters and transitions that crash or break legacy parsers
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { 
              transition: none !important; 
              animation: none !important; 
              backdrop-filter: none !important;
              -webkit-font-smoothing: antialiased !important;
            }
            /* Force variables to legacy format in the clone to bypass oklch defaults */
            :root {
              --tw-ring-color: rgba(59, 130, 246, 0.5) !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
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
      
      // Pass 3: Manually map links from DOM to PDF coordinate space
      const links = element.querySelectorAll('a');
      const containerRect = element.getBoundingClientRect();
      const scale = pdfWidth / containerRect.width;

      links.forEach(link => {
        const rect = link.getBoundingClientRect();
        let url = link.getAttribute('href');
        if (!url) return;
        
        // Ensure valid absolute URL
        if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
            url = `https://${url}`;
        }

        // Position in mm relative to the whole block
        const x = (rect.left - containerRect.left) * scale;
        const y = (rect.top - containerRect.top) * scale;
        const w = rect.width * scale;
        const h = rect.height * scale;

        // Determine which page the link belongs to
        const pageIndex = Math.floor(y / pdfHeight);
        const yOnPage = y % pdfHeight;
        
        const totalPages = (pdf as any).internal.getNumberOfPages();
        if (pageIndex + 1 <= totalPages) {
          pdf.setPage(pageIndex + 1);
          pdf.link(x, yOnPage, w, h, { url });
        }
      });

      pdf.save(fileName);
    };
  }, [resume]);

  const renderModern = () => (
    <div className={`p-[28mm] text-[#0f172a] font-sans transition-all duration-500`}>
      <header className={`flex gap-8 border-b-[6px] border-[#0f172a] ${isCompact ? 'pb-4 mb-10' : 'pb-8 mb-12'} auto-paginate`}>
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
          <div className="space-y-2">
            <div className={`flex flex-wrap ${isCompact ? 'gap-4' : 'gap-8'} text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.2em]`}>
              <div className="flex items-center gap-2">
                <Editable 
                  value={resume.personalInfo.email} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, email: val } }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Editable 
                  value={resume.personalInfo.phone} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: val } }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Editable 
                  value={resume.personalInfo.location} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, location: val } }))}
                />
              </div>
            </div>
            {resume.personalInfo.socialLinks && resume.personalInfo.socialLinks.length > 0 && (
              <div className={`flex flex-wrap ${isCompact ? 'gap-4' : 'gap-8'} text-[10px] font-extrabold text-[#64748b] uppercase tracking-[0.2em]`}>
                {resume.personalInfo.socialLinks.map(link => (
                  <div key={link.id} className="flex items-center gap-2">
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
            )}
          </div>
        </div>
      </header>

      <div className={`grid grid-cols-3 ${isCompact ? 'gap-8 px-4' : 'gap-16'}`}>
        <div className={`col-span-2 ${isCompact ? 'space-y-6' : 'space-y-12'}`}>
          <section className="">
            <div className={`flex items-center gap-4 ${isCompact ? 'mb-2' : 'mb-6'} auto-paginate section-header`}>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#0f172a] whitespace-nowrap">Profile Summary</h2>
              <div className="h-[1px] w-full bg-[#f1f5f9]" />
            </div>
            <div className="auto-paginate">
              <Editable 
                multiline
                value={resume.personalInfo.summary} 
                onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
                className={`${isCompact ? 'text-[11px]' : 'text-sm'} leading-relaxed text-[#334155] text-justify font-medium`}
              />
            </div>
          </section>
          
          <section className="">
            <div className={`flex items-center gap-4 ${isCompact ? 'mb-4' : 'mb-10'} auto-paginate section-header`}>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#0f172a] whitespace-nowrap">Professional Experience</h2>
              <div className="h-[1px] w-full bg-[#f1f5f9]" />
            </div>
            <div className={`${isCompact ? 'space-y-6' : 'space-y-12'}`}>
              {resume.experience.map(exp => (
                <div key={exp.id} className={`relative ${isCompact ? 'pl-4' : 'pl-6'} border-l-2 border-[#f1f5f9] hover:border-[#0f172a] transition-colors mb-4`}>
                  <div className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#0f172a]`} />
                  <div className="auto-paginate break-inside-avoid bond-header">
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
                  </div>
                  <div 
                    className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#475569] leading-relaxed legacy-prose max-w-none text-justify font-medium`}
                    dangerouslySetInnerHTML={{ __html: exp.description }} 
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className={`${isCompact ? 'space-y-8' : 'space-y-16'}`}>
          <section className="">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-8'} auto-paginate`}>Expertise</h2>
            <div className={`flex flex-wrap ${isCompact ? 'gap-1' : 'gap-1.5'} auto-paginate`}>
              {resume.skills.map((skill, i) => (
                <Editable 
                  key={i}
                  value={skill} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, skills: prev.skills.map((s, idx) => idx === i ? val : s) }))}
                  className={`${isCompact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[9px]'} bg-[#f8fafc] border border-[#f1f5f9] rounded font-bold uppercase tracking-wider text-[#334155] hover:bg-[#0f172a] hover:text-white transition-all`}
                />
              ))}
            </div>
          </section>
          <section className="">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-8'} auto-paginate section-header`}>Selected Projects</h2>
            <div className={`${isCompact ? 'space-y-6' : 'space-y-10'}`}>
              {resume.projects?.map(project => (
                <div key={project.id} className="group/project mb-4">
                  <div className="auto-paginate break-inside-avoid bond-header">
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
                  </div>
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

          <section className="">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-8'} auto-paginate section-header`}>Education</h2>
            <div className={`${isCompact ? 'space-y-4' : 'space-y-8'}`}>
              {resume.education.map(edu => (
                <div key={edu.id} className="auto-paginate">
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
            <section className="">
              <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'mb-4' : 'mb-6'} auto-paginate section-header`}>Certifications</h2>
              <div className={`${isCompact ? 'space-y-2' : 'space-y-4'}`}>
                {resume.certifications.map(cert => (
                  <div key={cert.id} className="auto-paginate">
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
    <div className={`p-[28mm] text-[#1e293b] font-sans transition-all duration-500`}>
      <header className={`text-center ${isCompact ? 'mb-8' : 'mb-12'} auto-paginate break-inside-avoid`}>
        {resume.personalInfo.profileImage && (
          <div className={`${isCompact ? 'w-20 h-20' : 'w-24 h-24'} mx-auto mb-4 rounded-full overflow-hidden border-2 border-slate-200 transition-all`}>
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
        <div className="space-y-2">
          <div className={`flex justify-center flex-wrap ${isCompact ? 'gap-4' : 'gap-8'} text-[10px] text-[#64748b] font-black uppercase tracking-[0.25em]`}>
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
          </div>
          {resume.personalInfo.socialLinks && resume.personalInfo.socialLinks.length > 0 && (
            <div className={`flex justify-center flex-wrap ${isCompact ? 'gap-4' : 'gap-8'} text-[10px] text-[#64748b] font-black uppercase tracking-[0.25em]`}>
              {resume.personalInfo.socialLinks.map(link => (
                <a 
                  key={link.id}
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#0f172a] hover:underline transition-all"
                >
                  {link.label || 'Link'}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mt-8 h-[1px] w-24 bg-[#0f172a] mx-auto opacity-20" />
      </header>

      <div className={`${isCompact ? 'space-y-6' : 'space-y-12'}`}>
        <section className="">
          <h2 className={`text-[10px] font-black uppercase border-b border-[#f1f5f9] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8] flex justify-between items-center auto-paginate`}>
            Professional Summary
            <span className="w-1.5 h-1.5 bg-[#0f172a] rounded-full" />
          </h2>
          <div className="auto-paginate">
            <Editable 
              multiline
              value={resume.personalInfo.summary} 
              onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
              className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} leading-relaxed text-[#334155] text-justify font-medium`}
            />
          </div>
        </section>
 
          <section className="">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-[#64748b] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8] flex justify-between items-center auto-paginate section-header`}>
              Experience History
              <span className="w-1.5 h-1.5 bg-[#0f172a] rounded-full" />
            </h2>
            <div className={`${isCompact ? 'space-y-6' : 'space-y-12'}`}>
              {resume.experience.map(exp => (
                <div key={exp.id} className="group mb-4">
                  <div className="auto-paginate break-inside-avoid bond-header">
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
                  </div>
                  <div 
                    className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#334155] leading-relaxed legacy-prose max-w-none text-justify font-medium`}
                    dangerouslySetInnerHTML={{ __html: exp.description }} 
                  />
                </div>
              ))}
          </div>
        </section>

          <section className="">
            <h2 className={`text-[10px] font-black uppercase border-b border-[#f1f5f9] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8] flex justify-between items-center auto-paginate section-header`}>
              Selected Projects
              <span className="w-1.5 h-1.5 bg-[#0f172a] rounded-full" />
            </h2>
            <div className={`${isCompact ? 'space-y-6' : 'space-y-10'}`}>
              {resume.projects?.map(project => (
                <div key={project.id} className="group mb-4">
                  <div className="auto-paginate break-inside-avoid bond-header">
                    <div className={`flex justify-between items-baseline ${isCompact ? 'mb-1' : 'mb-3'}`}>
                      <h3 className={`font-bold uppercase tracking-wide text-[#0f172a] ${isCompact ? 'text-[12px]' : 'text-[14px]'}`}>{project.name}</h3>
                      <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.2em]">{project.technologies.join(' / ')}</p>
                    </div>
                  </div>
                <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#475569] leading-relaxed text-justify font-medium`}>{project.description}</p>
              </div>
            ))}
          </div>
        </section>
 
        <section className={`grid grid-cols-2 ${isCompact ? 'gap-8' : 'gap-16'}`}>
          <div className="">
            <h2 className={`text-[10px] font-black uppercase border-b border-[#f1f5f9] ${isCompact ? 'pb-2 mb-4' : 'pb-3 mb-8'} tracking-[0.4em] text-[#94a3b8] auto-paginate`}>Academic Background</h2>
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
    <div className={`p-[28mm] text-[#0f172a] font-sans transition-all duration-500`}>
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
        <section className={`grid grid-cols-4 ${isCompact ? 'gap-8' : 'gap-16'} border-t border-[#f1f5f9] ${isCompact ? 'pt-6' : 'pt-12'}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8] auto-paginate section-header">Overview</h2>
          <div className="col-span-3 auto-paginate">
            <Editable 
              multiline
              value={resume.personalInfo.summary} 
              onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
              className={`${isCompact ? 'text-[11px]' : 'text-sm'} leading-relaxed text-[#334155] text-justify font-medium`}
            />
          </div>
        </section>
 
        <section className={`grid grid-cols-4 ${isCompact ? 'gap-8' : 'gap-16'} border-t border-[#f1f5f9] ${isCompact ? 'pt-6' : 'pt-12'}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8] auto-paginate section-header">Background</h2>
          <div className={`col-span-3 ${isCompact ? 'space-y-8' : 'space-y-16'}`}>
            {resume.experience.map(exp => (
              <div key={exp.id} className="group mb-4">
                <div className="auto-paginate break-inside-avoid bond-header">
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
                </div>
                <div 
                  className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#475569] leading-relaxed legacy-prose max-w-none text-justify font-medium`}
                  dangerouslySetInnerHTML={{ __html: exp.description }} 
                />
              </div>
            ))}
          </div>
        </section>

        {resume.projects?.length > 0 && (
          <section className="grid grid-cols-4 gap-16 border-t border-[#f1f5f9] pt-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8] auto-paginate section-header">Portfolio</h2>
            <div className={`col-span-3 ${isCompact ? 'space-y-8' : 'space-y-12'}`}>
              {resume.projects.map(proj => (
                <div key={proj.id} className="auto-paginate">
                  <div className="break-inside-avoid">
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
                  </div>
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

        <section className={`grid grid-cols-4 ${isCompact ? 'gap-6' : 'gap-12'} border-t border-[#f1f5f9] ${isCompact ? 'pt-4' : 'pt-8'}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8] auto-paginate">Skills</h2>
          <div className="col-span-3 grid grid-cols-3 gap-x-6 gap-y-2">
            {resume.skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-2 group/skill auto-paginate break-inside-avoid">
                <div className="w-1 h-1 rounded-full bg-[#f1f5f9] group-hover/skill:bg-[#0f172a] transition-colors" />
                <Editable 
                  value={skill} 
                  onUpdate={(val) => onUpdate(prev => ({ ...prev, skills: prev.skills.map((s, idx) => idx === i ? val : s) }))}
                  className="text-[10px] text-[#334155] font-bold tracking-widest uppercase truncate"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-4 gap-16 border-t border-[#f1f5f9] pt-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8] auto-paginate section-header">Academic</h2>
          <div className="col-span-3 space-y-10">
            {resume.education.map(edu => (
              <div key={edu.id} className="auto-paginate">
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
          <section className="grid grid-cols-4 gap-16 border-t border-[#f1f5f9] pt-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8] auto-paginate">Distinctions</h2>
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
          <section className="grid grid-cols-4 gap-16 border-t border-[#f1f5f9] pt-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#94a3b8] auto-paginate section-header">Inquiry</h2>
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
      <header className="mb-4 text-center border-b-2 border-black pb-2">
        <h1 className="text-2xl font-bold mb-1 uppercase tracking-tight">
          <Editable 
            value={resume.personalInfo.fullName || 'Your Name'} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, fullName: val } }))}
          />
        </h1>
        <div className="space-y-1">
          <div className="flex justify-center flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
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
          </div>
          {resume.personalInfo.socialLinks && resume.personalInfo.socialLinks.length > 0 && (
            <div className="flex justify-center flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
              {resume.personalInfo.socialLinks.map(link => (
                <a 
                  key={link.id}
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline transition-all"
                >
                  {link.label || 'Link'}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="mb-4">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1 tracking-widest text-left auto-paginate section-header">Professional Summary</h2>
        <div className="auto-paginate break-inside-avoid">
          <Editable 
            multiline
            value={resume.personalInfo.summary} 
            onUpdate={(val) => onUpdate(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: val } }))}
            className="text-[12px] leading-relaxed text-justify hyphens-auto break-words"
          />
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1 tracking-widest text-left auto-paginate section-header">Experience</h2>
        <div className="space-y-4">
          {resume.experience.map(exp => (
            <div key={exp.id} className="mb-3">
              <div className="auto-paginate break-inside-avoid bond-header mb-1">
                <div className="flex justify-between items-baseline mb-1 gap-x-4">
                  <div className="font-bold text-xs uppercase tracking-tight">{exp.company}</div>
                  <div className="text-[11px] uppercase font-bold tracking-widest">{exp.startDate} {exp.current ? 'Present' : exp.endDate}</div>
                </div>
                <div className="flex justify-between items-baseline gap-x-4">
                  <div className="text-[12px] font-bold italic">{exp.role}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider">{exp.location}</div>
                </div>
              </div>
              <div 
                className="text-[12px] leading-relaxed legacy-prose max-w-none text-justify hyphens-auto break-words"
                dangerouslySetInnerHTML={{ __html: exp.description }} 
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1 tracking-widest text-left auto-paginate section-header">Education</h2>
        <div className="space-y-3">
          {resume.education.map(edu => (
            <div key={edu.id} className="auto-paginate break-inside-avoid">
              <div className="flex justify-between items-baseline mb-1 gap-x-4">
                <div className="font-bold text-xs uppercase tracking-tight">{edu.school}</div>
                <div className="text-[11px] uppercase font-bold tracking-widest">{edu.startDate} {edu.endDate}</div>
              </div>
              <div className="flex justify-between items-baseline gap-x-4">
                <div className="text-[12px] italic">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</div>
                {edu.grade && (
                  <div className="text-[11px] font-bold uppercase tracking-tighter">
                    {edu.gradeType === 'percentage' ? 'Perc' : 'CGPA'}: {edu.grade}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1 tracking-widest text-left auto-paginate section-header">Projects</h2>
          <div className="space-y-3">
            {resume.projects.map(project => (
              <div key={project.id} className="mb-3">
                <div className="auto-paginate break-inside-avoid bond-header">
                  <Editable 
                    value={project.name} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, name: val } : p) }))}
                    className="font-bold text-xs uppercase tracking-tight mb-1"
                  />
                  <div className="text-[11px] font-bold uppercase tracking-tight text-black leading-normal block text-justify hyphens-auto break-words">
                    <span className="font-bold">Tech Stack: </span>
                    <Editable 
                      value={project.technologies.join(', ')} 
                      onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, technologies: val.split(',').map(t => t.trim()).filter(Boolean) } : p) }))}
                      className="italic inline"
                    />
                  </div>
                </div>
                <div className="auto-paginate break-inside-avoid mt-1">
                  <Editable 
                    multiline
                    value={project.description} 
                    onUpdate={(val) => onUpdate(prev => ({ ...prev, projects: (prev.projects || []).map(p => p.id === project.id ? { ...p, description: val } : p) }))}
                    className="text-[12px] leading-relaxed text-justify hyphens-auto break-words"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-4">
        <h2 className="text-sm font-bold uppercase border-b border-black mb-2 pb-1 tracking-widest text-left auto-paginate section-header">Skills</h2>
        <div className="text-[11px] leading-relaxed auto-paginate break-inside-avoid px-1 text-justify hyphens-auto break-words">
          <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
            {resume.skills.map((skill, i) => (
              <span key={i} className="whitespace-nowrap">
                {skill}{i < resume.skills.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        </div>
      </section>

      {resume.certifications && resume.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1 tracking-widest text-left auto-paginate section-header">Certifications</h2>
          <div className="text-[12px] leading-relaxed auto-paginate break-inside-avoid px-2">
            <ul className="safe-list">
              {resume.certifications.map((c, i) => (
                <li key={i}>{c.name} {c.issuer ? `— ${c.issuer}` : ''}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="relative group/preview">
      {/* Page Indicators */}
      <div className="absolute -left-24 top-0 h-full w-20 flex flex-col pointer-events-none">
        {[1, 2, 3, 4].map(page => (
          <div key={page} className="h-[1123px] flex flex-col items-end justify-start pr-4 pt-12">
            <span 
              style={{ color: 'rgba(63, 63, 70, 0.5)' }}
              className="text-[10px] font-black uppercase tracking-[0.2em] [writing-mode:vertical-lr]"
            >
              Page {page}
            </span>
            <div className="w-[1px] h-full bg-zinc-200 mt-4 mx-auto" />
          </div>
        ))}
      </div>

      <div 
        ref={previewRef} 
        data-resume-preview
        className="w-[794px] min-h-[1123px] mx-auto bg-white border border-slate-200 origin-top relative overflow-hidden"
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
