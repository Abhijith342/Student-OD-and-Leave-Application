const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function generateApplicationPDF(application, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.pipe(res);

  const primaryColor = '#0F172A';
  const secondaryColor = '#2563EB';
  const textDark = '#1E293B';

  const logoPath = path.join(__dirname, '../assets/logo.png');

  // 1. Header with Logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 35, { width: 55 });
  }

  const textLeftMargin = fs.existsSync(logoPath) ? 105 : 40;

  doc
    .fillColor(primaryColor)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Dr. N.G.P. INSTITUTE OF TECHNOLOGY', textLeftMargin, 40, { align: 'left' });

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('COIMBATORE - 641048 | AUTONOMOUS INSTITUTION', textLeftMargin, doc.y + 2, { align: 'left' });

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text(`DEPARTMENT OF ${application.student.department.name.toUpperCase()}`, textLeftMargin, doc.y + 3, { align: 'left' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748B')
    .text('OFFICIAL APPLICATION & APPROVAL CERTIFICATE', textLeftMargin, doc.y + 2, { align: 'left' })
    .moveDown(1.5);

  doc.y = 110;

  doc
    .strokeColor('#CBD5E1')
    .lineWidth(1)
    .moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .stroke()
    .moveDown(1);

  // 2. Application Meta Banner
  const isOD = application.type === 'OD';
  const bannerTitle = isOD ? 'ON-DUTY (OD) APPLICATION' : 'LEAVE APPLICATION';
  
  doc
    .rect(40, doc.y, 515, 30)
    .fill(isOD ? '#EFF6FF' : '#FEF2F2');

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(isOD ? secondaryColor : '#DC2626')
    .text(`${bannerTitle} - #${application.applicationNumber}`, 50, doc.y - 22, { width: 495, align: 'left' });

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(textDark)
    .text(`STATUS: ${application.status}`, 400, doc.y - 14, { width: 145, align: 'right' });

  doc.moveDown(2);

  // 3. Complete Student & Staff Hierarchy Info Table
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('STUDENT DATA & ASSIGNED STAFF HIERARCHY', 40)
    .moveDown(0.5);

  const startY = doc.y;
  doc.rect(40, startY, 515, 75).stroke('#E2E8F0');

  // Line 1: Student Name, Register No, Roll No
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
  doc.text('Student Name:', 50, startY + 10);
  doc.font('Helvetica').fillColor(textDark).text(application.student.name, 125, startY + 10);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Reg Number:', 240, startY + 10);
  doc.font('Helvetica').fillColor(textDark).text(application.student.registerNumber, 310, startY + 10);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Roll Number:', 415, startY + 10);
  doc.font('Helvetica').fillColor(secondaryColor).text(application.student.rollNumber || '22AD001', 480, startY + 10);

  // Line 2: Department, Year & Sec
  doc.font('Helvetica-Bold').fillColor('#475569').text('Department:', 50, startY + 30);
  doc.font('Helvetica').fillColor(textDark).text(application.student.department.name, 125, startY + 30);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Year / Sec:', 415, startY + 30);
  doc.font('Helvetica').fillColor(textDark).text(`Yr ${application.student.year} - Sec ${application.student.section}`, 480, startY + 30);

  // Line 3: Staff Hierarchy (Tutor, Advisor, HOD)
  doc.font('Helvetica-Bold').fillColor('#475569').text('Tutor:', 50, startY + 52);
  doc.font('Helvetica').fillColor(textDark).text(application.student.tutor?.name || 'N PREMKUMAR', 125, startY + 52);

  doc.font('Helvetica-Bold').fillColor('#475569').text('Class Advisor:', 240, startY + 52);
  doc.font('Helvetica').fillColor(textDark).text(application.student.classAdvisor?.name || 'N PREMKUMAR', 310, startY + 52);

  doc.font('Helvetica-Bold').fillColor('#475569').text('HOD:', 415, startY + 52);
  doc.font('Helvetica').fillColor(textDark).text(application.student.hod?.name || 'PAVITHRA', 480, startY + 52);

  doc.y = startY + 90;

  // 4. Application Details
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text(isOD ? 'OD DETAILS' : 'LEAVE DETAILS', 40)
    .moveDown(0.5);

  const detailY = doc.y;
  doc.rect(40, detailY, 515, 75).stroke('#E2E8F0');

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
  doc.text('From Date:', 50, detailY + 10);
  doc.font('Helvetica').fillColor(textDark).text(new Date(application.fromDate).toLocaleDateString(), 125, detailY + 10);

  doc.font('Helvetica-Bold').fillColor('#475569').text('To Date:', 310, detailY + 10);
  doc.font('Helvetica').fillColor(textDark).text(new Date(application.toDate).toLocaleDateString(), 380, detailY + 10);

  doc.font('Helvetica-Bold').fillColor('#475569').text(isOD ? 'Event Name:' : 'Leave Type:', 50, detailY + 30);
  doc.font('Helvetica').fillColor(textDark).text(isOD ? (application.eventName || 'N/A') : (application.leaveType || 'General'), 125, detailY + 30);

  if (isOD) {
    doc.font('Helvetica-Bold').fillColor('#475569').text('Venue:', 310, detailY + 30);
    doc.font('Helvetica').fillColor(textDark).text(application.venue || 'N/A', 380, detailY + 30);
  }

  doc.font('Helvetica-Bold').fillColor('#475569').text('Reason:', 50, detailY + 50);
  doc.font('Helvetica').fillColor(textDark).text(application.reason, 125, detailY + 50, { width: 410 });

  doc.y = detailY + 90;

  // 5. Parent Confirmation Section
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('PARENT CONFIRMATION RECORD', 40)
    .moveDown(0.5);

  const parentY = doc.y;
  doc.rect(40, parentY, 515, 35).fillAndStroke('#F8FAFC', '#E2E8F0');

  if (application.parentConfirmation) {
    const pc = application.parentConfirmation;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
    doc.text('Status:', 50, parentY + 10);
    doc.font('Helvetica-Bold').fillColor(pc.isConfirmed ? '#16A34A' : '#DC2626').text(pc.isConfirmed ? 'PARENT CONFIRMED' : 'NOT CONFIRMED', 95, parentY + 10);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Confirmed Date:', 220, parentY + 10);
    doc.font('Helvetica').fillColor(textDark).text(new Date(pc.confirmedAt).toLocaleString(), 300, parentY + 10);

    doc.font('Helvetica-Bold').fillColor('#475569').text('Advisor:', 420, parentY + 10);
    doc.font('Helvetica').fillColor(textDark).text(pc.advisor ? pc.advisor.name : 'N/A', 465, parentY + 10);
  } else {
    doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#64748B').text('Parent confirmation pending or not recorded.', 50, parentY + 10);
  }

  doc.y = parentY + 50;

  // 6. Approval Audit History Table
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('APPROVAL WORKFLOW HISTORY', 40)
    .moveDown(0.5);

  const historyY = doc.y;
  doc.rect(40, historyY, 515, 18).fill('#0F172A');
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('Role', 45, historyY + 4, { width: 100 });
  doc.text('Action', 145, historyY + 4, { width: 110 });
  doc.text('Action By', 255, historyY + 4, { width: 110 });
  doc.text('Remarks', 365, historyY + 4, { width: 100 });
  doc.text('Timestamp', 465, historyY + 4, { width: 85 });

  let currentTableRowY = historyY + 18;

  if (application.approvalHistories && application.approvalHistories.length > 0) {
    application.approvalHistories.forEach((item, index) => {
      const bg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(40, currentTableRowY, 515, 20).fillAndStroke(bg, '#E2E8F0');

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark);
      doc.text(item.role.replace('_', ' '), 45, currentTableRowY + 5, { width: 95 });
      
      const actionColor = item.action === 'APPROVED' || item.action === 'COMPLETED' ? '#16A34A' : (item.action === 'REJECTED' ? '#DC2626' : '#2563EB');
      doc.fillColor(actionColor).text(item.action, 145, currentTableRowY + 5, { width: 105 });
      
      doc.fillColor(textDark).font('Helvetica').text(item.staff ? item.staff.name : 'System', 255, currentTableRowY + 5, { width: 105 });
      doc.text(item.remarks || '-', 365, currentTableRowY + 5, { width: 95 });
      doc.text(new Date(item.timestamp).toLocaleDateString(), 465, currentTableRowY + 5, { width: 85 });

      currentTableRowY += 20;
    });
  } else {
    doc.rect(40, currentTableRowY, 515, 20).fillAndStroke('#FFFFFF', '#E2E8F0');
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748B').text('No workflow actions recorded yet.', 50, currentTableRowY + 5);
    currentTableRowY += 20;
  }

  doc.y = currentTableRowY + 25;

  // 7. Official Signatures & Institutional Seal Block
  const sigY = Math.max(doc.y, 680);
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('AUTHORIZATION SIGNATURES & STAMPS', 40, sigY)
    .moveDown(0.5);

  const sigBlockY = doc.y + 10;

  doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text('Tutor Approval', 40, sigBlockY);
  doc.font('Helvetica-Oblique').fillColor('#64748B').text('[ Electronically Verified ]', 40, sigBlockY + 25);

  doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text('Class Advisor Confirmation', 170, sigBlockY);
  doc.font('Helvetica-Oblique').fillColor('#64748B').text('[ Electronically Verified ]', 170, sigBlockY + 25);

  doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text('Head of Department (HOD)', 320, sigBlockY);
  doc.rect(320, sigBlockY + 15, 75, 25).stroke('#2563EB');
  doc.fontSize(7).font('Helvetica-Bold').fillColor(secondaryColor).text('HOD SEAL', 335, sigBlockY + 23);

  if (isOD) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text('Principal Office Seal', 450, sigBlockY);
    doc.rect(450, sigBlockY + 15, 80, 25).stroke('#16A34A');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#16A34A').text('PRINCIPAL SEAL', 458, sigBlockY + 23);
  }

  doc.end();
}

module.exports = { generateApplicationPDF };
