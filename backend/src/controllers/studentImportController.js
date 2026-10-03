const fs = require('fs');
const path = require('path');
const studentImportService = require('../services/studentImportService');
const AppError = require('../utils/appError');

async function importPreview(req, res, next) {
  try {
    let jsonRows;
    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      jsonRows = studentImportService.parseExcelBuffer(buffer);
      // Clean up temp file
      fs.unlinkSync(req.file.path);
    } else {
      // Or fallback to backend dataset if file is omitted
      const datasetPath = path.resolve(__dirname, '../assets/initial_students.xlsx');
      if (fs.existsSync(datasetPath)) {
        const buffer = fs.readFileSync(datasetPath);
        jsonRows = studentImportService.parseExcelBuffer(buffer);
      } else {
        return next(new AppError('Please upload an Excel (.xlsx) file.', 400));
      }
    }

    const preview = await studentImportService.validateStudentImportData(jsonRows);

    res.status(200).json({
      status: 'success',
      data: preview
    });
  } catch (error) {
    next(error);
  }
}

async function importConfirm(req, res, next) {
  try {
    const { validRows } = req.body;
    if (!validRows || validRows.length === 0) {
      return next(new AppError('No valid student records provided for confirmation.', 400));
    }

    const result = await studentImportService.executeStudentImport(validRows);

    res.status(201).json({
      status: 'success',
      message: `Successfully imported ${result.importedCount} student records into database.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function downloadTemplate(req, res, next) {
  try {
    const templatePath = path.resolve(__dirname, '../../frontend/public/Student_Import_Template.xlsx');
    if (!fs.existsSync(templatePath)) {
      return next(new AppError('Template file not found on server.', 404));
    }
    res.download(templatePath, 'Student_Import_Template.xlsx');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  importPreview,
  importConfirm,
  downloadTemplate
};
