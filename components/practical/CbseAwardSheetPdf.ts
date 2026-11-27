import { jsPDF } from 'jspdf';
import { PracticalAssessment, School } from '../../types.ts';
import { trackEvent } from '../../services/analytics.ts';

interface ExportPdfOptions {
  school?: School | null;
  academicYear: string;
  grade: string;
  section: string;
  examType: string;
  internalExaminerName?: string;
  externalExaminerName?: string;
  centerCode?: string;
  schoolCode?: string;
}

const numberToWords = (num: number): string => {
  const words = [
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five', 'Twenty-Six', 'Twenty-Seven', 'Twenty-Eight', 'Twenty-Nine', 'Thirty'
  ];
  if (num >= 0 && num <= 30) {
    return words[num];
  }
  return num.toString();
};

export const generateCbsePracticalAwardSheetPdf = (
  assessments: PracticalAssessment[],
  options: ExportPdfOptions
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;

  // Header Title
  doc.setFillColor(13, 43, 82); // #0D2B52
  doc.rect(margin, margin, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CENTRAL BOARD OF SECONDARY EDUCATION (CBSE)', pageWidth / 2, margin + 7, { align: 'center' });
  
  doc.setFontSize(10.5);
  doc.setTextColor(212, 160, 23); // #D4A017
  doc.text('SENIOR SCHOOL CERTIFICATE PRACTICAL EXAMINATION MARKS AWARD LIST (SUBJECT CODE 048)', pageWidth / 2, margin + 13, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(230, 235, 245);
  doc.text('PHYSICAL EDUCATION PRACTICAL ASSESSMENT (MAX MARKS: 30)', pageWidth / 2, margin + 18, { align: 'center' });

  // School & Examination Metadata Details Bar
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  const metaTop = margin + 26;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, metaTop, pageWidth - margin * 2, 14, 'F');
  doc.rect(margin, metaTop, pageWidth - margin * 2, 14, 'S');

  const schoolName = options.school?.name || 'SMART PE INSTITUTION';
  const centerCode = options.centerCode || options.school?.code || 'N/A';
  const schoolCode = options.schoolCode || '048-PE';

  doc.text(`School Name: ${schoolName.toUpperCase()}`, margin + 3, metaTop + 5);
  doc.text(`Center / School Code: ${centerCode}`, margin + 140, metaTop + 5);
  doc.text(`Academic Session: ${options.academicYear}`, margin + 220, metaTop + 5);

  doc.text(`Class & Section: Grade ${options.grade} - Section ${options.section}`, margin + 3, metaTop + 10);
  doc.text(`Exam Session: ${options.examType.toUpperCase()}`, margin + 140, metaTop + 10);
  doc.text(`Subject: Physical Education (048)`, margin + 220, metaTop + 10);

  // Table Column Definitions
  // Total width: 297 - 24 = 273mm
  const colWidths = {
    sno: 12,
    rollNo: 26,
    name: 58,
    gender: 14,
    fitness: 24, // 6M
    yoga: 24,    // 7M
    game: 26,    // 7M
    record: 22,  // 5M
    viva: 22,    // 5M
    totalFig: 20,// 30M
    totalWords: 25
  };

  const tableTop = metaTop + 17;
  const rowHeight = 7.5;
  const headerHeight = 11;

  // Draw Table Headers
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, tableTop, pageWidth - margin * 2, headerHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  let curX = margin;

  const drawColHeader = (text1: string, text2: string, width: number) => {
    doc.rect(curX, tableTop, width, headerHeight, 'S');
    doc.text(text1, curX + width / 2, tableTop + 4.5, { align: 'center' });
    if (text2) {
      doc.text(text2, curX + width / 2, tableTop + 8.5, { align: 'center' });
    }
    curX += width;
  };

  drawColHeader('S.No', '', colWidths.sno);
  drawColHeader('CBSE Roll No', '', colWidths.rollNo);
  drawColHeader('Candidate Name', '', colWidths.name);
  drawColHeader('Sex', '(M/F)', colWidths.gender);
  drawColHeader('Fitness Test', '(Max 6)', colWidths.fitness);
  drawColHeader('Yogic Asana', '(Max 7)', colWidths.yoga);
  drawColHeader('Game / Sport', '(Max 7)', colWidths.game);
  drawColHeader('Record File', '(Max 5)', colWidths.record);
  drawColHeader('Viva Voce', '(Max 5)', colWidths.viva);
  drawColHeader('Total', '(Figures /30)', colWidths.totalFig);
  drawColHeader('Total', '(In Words)', colWidths.totalWords);

  // Table Body Rows
  let curY = tableTop + headerHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  // Sort assessments by roll number or name
  const sorted = [...assessments].sort((a, b) => {
    const rollA = parseInt(a.rollNumber) || 0;
    const rollB = parseInt(b.rollNumber) || 0;
    if (rollA && rollB) return rollA - rollB;
    return a.studentName.localeCompare(b.studentName);
  });

  sorted.forEach((item, index) => {
    // Check if new page needed
    if (curY + rowHeight > pageHeight - 32) {
      doc.addPage('landscape');
      curY = margin + 5;
      
      // Re-render compact sub-header
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, curY, pageWidth - margin * 2, headerHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      
      curX = margin;
      drawColHeader('S.No', '', colWidths.sno);
      drawColHeader('CBSE Roll No', '', colWidths.rollNo);
      drawColHeader('Candidate Name', '', colWidths.name);
      drawColHeader('Sex', '(M/F)', colWidths.gender);
      drawColHeader('Fitness Test', '(Max 6)', colWidths.fitness);
      drawColHeader('Yogic Asana', '(Max 7)', colWidths.yoga);
      drawColHeader('Game / Sport', '(Max 7)', colWidths.game);
      drawColHeader('Record File', '(Max 5)', colWidths.record);
      drawColHeader('Viva Voce', '(Max 5)', colWidths.viva);
      drawColHeader('Total', '(Figures /30)', colWidths.totalFig);
      drawColHeader('Total', '(In Words)', colWidths.totalWords);
      
      curY += headerHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
    }

    // Alternating zebra row backgrounds
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, pageWidth - margin * 2, rowHeight, 'F');
    }

    curX = margin;

    const drawCell = (text: string, width: number, align: 'left' | 'center' | 'right' = 'center', isBold = false) => {
      doc.rect(curX, curY, width, rowHeight, 'S');
      if (isBold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');
      
      const textX = align === 'center' ? curX + width / 2 : align === 'left' ? curX + 2.5 : curX + width - 2.5;
      doc.text(text, textX, curY + 4.8, { align });
      curX += width;
    };

    const isAbsent = item.status === 'absent';
    const totalScore = isAbsent ? 0 : (item.fitnessTestScore + item.yogicPracticesScore + item.gameProficiencyScore + item.recordFileScore + item.vivaVoceScore);
    const words = isAbsent ? 'ABSENT' : numberToWords(totalScore);

    drawCell((index + 1).toString(), colWidths.sno, 'center');
    drawCell(item.rollNumber || `PE-${index + 1}`, colWidths.rollNo, 'center', true);
    drawCell(item.studentName, colWidths.name, 'left', true);
    drawCell(item.gender === 'Female' ? 'F' : 'M', colWidths.gender, 'center');
    
    if (isAbsent) {
      drawCell('AB', colWidths.fitness, 'center');
      drawCell('AB', colWidths.yoga, 'center');
      drawCell('AB', colWidths.game, 'center');
      drawCell('AB', colWidths.record, 'center');
      drawCell('AB', colWidths.viva, 'center');
      drawCell('AB', colWidths.totalFig, 'center', true);
      drawCell('ABSENT', colWidths.totalWords, 'center', true);
    } else {
      drawCell(item.fitnessTestScore.toString(), colWidths.fitness, 'center');
      drawCell(item.yogicPracticesScore.toString(), colWidths.yoga, 'center');
      drawCell(item.gameProficiencyScore.toString(), colWidths.game, 'center');
      drawCell(item.recordFileScore.toString(), colWidths.record, 'center');
      drawCell(item.vivaVoceScore.toString(), colWidths.viva, 'center');
      drawCell(totalScore.toString(), colWidths.totalFig, 'center', true);
      drawCell(words, colWidths.totalWords, 'center', false);
    }

    curY += rowHeight;
  });

  // Summary & Signature Sign-off Block at Bottom
  const sigY = pageHeight - 22;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, sigY - 2, pageWidth - margin, sigY - 2);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  // 3 Official Signatures
  const sigBoxWidth = (pageWidth - margin * 2) / 3;

  // 1. Internal Examiner
  doc.text('Certified that practical evaluation was conducted strictly as per CBSE 048 norms.', margin + 3, sigY + 2);
  doc.text('____________________________________', margin + 15, sigY + 12);
  doc.text(`Internal Examiner Signature & Name`, margin + 15, sigY + 16);
  if (options.internalExaminerName) {
    doc.setFont('helvetica', 'normal');
    doc.text(`(${options.internalExaminerName})`, margin + 15, sigY + 19.5);
    doc.setFont('helvetica', 'bold');
  }

  // 2. External Examiner
  doc.text('____________________________________', margin + sigBoxWidth + 15, sigY + 12);
  doc.text(`External Examiner Signature & Name`, margin + sigBoxWidth + 15, sigY + 16);
  if (options.externalExaminerName) {
    doc.setFont('helvetica', 'normal');
    doc.text(`(${options.externalExaminerName})`, margin + sigBoxWidth + 15, sigY + 19.5);
    doc.setFont('helvetica', 'bold');
  }

  // 3. Principal Seal
  doc.text('____________________________________', margin + sigBoxWidth * 2 + 15, sigY + 12);
  doc.text(`Principal Signature & School Stamp`, margin + sigBoxWidth * 2 + 15, sigY + 16);

  // Save / Download PDF
  const filename = `CBSE_Practical_Marks_Award_List_Grade_${options.grade}_${options.section}_${options.academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
  trackEvent('resource_downloaded', {
    resource_name: 'CBSE 30M Practical Award Sheet',
    resource_type: 'CBSE Practical',
    format: 'pdf'
  });
};
