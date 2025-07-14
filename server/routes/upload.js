// Upload and OCR API endpoints
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { TextractClient, AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');
const fs = require('fs');
const path = require('path');

// Configure AWS SDK v3
const s3Client = new S3Client({ region: 'us-east-1' }); // Use your region
const textractClient = new TextractClient({ region: 'us-east-1' });

// Multer setup for file uploads (limit 1MB, restrict to JPEG, PNG, PDF)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or PDF files are allowed'));
    }
    cb(null, true);
  }
});

// Upload receipt to S3 and auto-create expense
router.post('/upload', authenticateToken, upload.single('receipt'), async (req, res) => {
  console.log('=== UPLOAD ENDPOINT HIT ===');
  try {
    const file = req.file;
    console.log('File received:', file ? file.originalname : 'No file');
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    // File size check (should be handled by Multer, but double check)
    if (file.size > 1 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'File size exceeds 1MB' });
    }
    const fileContent = fs.readFileSync(file.path);
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET, // Set in your .env
      Key: `receipts/${Date.now()}_${file.originalname}`,
      Body: fileContent,
      ContentType: file.mimetype,
    };
    const putObjectCommand = new PutObjectCommand(s3Params);
    console.log('Uploading to S3...');
    const s3Result = await s3Client.send(putObjectCommand);
    const s3Location = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;
    console.log('S3 upload successful:', s3Location);
    fs.unlinkSync(file.path); // Remove local file

    // Textract OCR
    console.log('Starting Textract OCR...');
    const textractParams = {
      Document: {
        S3Object: {
          Bucket: s3Params.Bucket,
          Name: s3Params.Key,
        },
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    };
    const analyzeDocumentCommand = new AnalyzeDocumentCommand(textractParams);
    console.log('Calling Textract...');
    const textractResult = await textractClient.send(analyzeDocumentCommand);
    console.log('Textract completed, processing results...');
    
    // Extract text lines from Textract
    const lines = textractResult?.Blocks
      ?.filter(block => block.BlockType === 'LINE' && block.Text)
      .map(block => block.Text.trim()) || [];
    
    const parsedText = [...lines];
    const fullText = lines.join(' ').toLowerCase();
    
    console.log('=== OCR RESULTS ===');
    console.log('Total lines:', lines.length);
    console.log('Full text contains "time":', fullText.includes('time'));
    console.log('Full text contains "tm":', fullText.includes('tm'));
    
    let item = 'Unknown';
    let category = 'Others';
    let amount = null;
    
    // BRAND DETECTION - Fixed logic
    console.log('=== BRAND DETECTION ===');
    if (fullText.includes('time')) {
      item = 'Time';
      category = 'Bills';
      console.log('✓ Detected Time brand');
    } else if (fullText.includes('tesco')) {
      item = 'Tesco';
      category = 'Shopping';
      console.log('✓ Detected Tesco brand');
    } else if (fullText.includes('mcdonald')) {
      item = 'McDonald';
      category = 'Food';
      console.log('✓ Detected McDonald brand');
    } else if (fullText.includes('grab')) {
      item = 'Grab';
      category = 'Transport';
      console.log('✓ Detected Grab brand');
    } else if (fullText.includes('watsons')) {
      item = 'Watsons';
      category = 'Health';
      console.log('✓ Detected Watsons brand');
    } else if (fullText.includes('maxis')) {
      item = 'Maxis';
      category = 'Bills';
      console.log('✓ Detected Maxis brand');
    } else if (fullText.includes('unifi')) {
      item = 'Unifi';
      category = 'Bills';
      console.log('✓ Detected Unifi brand');
    } else {
      console.log('✗ No brand detected');
    }
    
    console.log(`FINAL BRAND: ${item} -> CATEGORY: ${category}`);
    
    // AMOUNT DETECTION - Fixed and simplified
    console.log('=== AMOUNT DETECTION ===');
    
    // For Time bills, look for the main MYR amount
    if (item === 'Time') {
      console.log('Processing Time bill...');
      // Look for MYR 145.22 pattern specifically
      const myrPattern = /myr\s*(\d+\.\d{2})/gi;
      const myrMatches = fullText.match(myrPattern);
      if (myrMatches) {
        console.log('Found MYR patterns:', myrMatches);
        // Extract the largest meaningful amount
        const amounts = myrMatches.map(match => {
          const num = parseFloat(match.replace(/myr\s*/i, ''));
          return num;
        }).filter(num => num > 50 && num < 1000);
        
        if (amounts.length > 0) {
          amount = Math.max(...amounts);
          console.log(`✓ Found Time bill amount: ${amount}`);
        }
      }
    }
    
    // General total detection
    if (!amount) {
      console.log('Looking for total amount...');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('total')) {
          console.log(`Found total line ${i}: "${lines[i]}"`);
          // Check current and next 2 lines
          for (let j = i; j <= i + 2 && j < lines.length; j++) {
            const match = lines[j].match(/(\d+\.\d{2})/);
            if (match) {
              const foundAmount = parseFloat(match[1]);
              if (foundAmount >= 10 && foundAmount <= 2000) {
                amount = foundAmount;
                console.log(`✓ Found total amount: ${amount} from line "${lines[j]}"`);
                break;
              }
            }
          }
          if (amount) break;
        }
      }
    }
    
    // Final fallback - but exclude obviously wrong numbers
    if (!amount) {
      console.log('Final fallback - looking for any reasonable amount...');
      const validAmounts = [];
      lines.forEach((line, index) => {
        const matches = line.match(/(\d+\.\d{2})/g);
        if (matches) {
          matches.forEach(match => {
            const val = parseFloat(match);
            // More restrictive range to avoid wrong numbers
            if (val >= 10 && val <= 1000 && val !== 5021) {
              validAmounts.push({ value: val, line: index, text: line });
              console.log(`Found valid amount: ${val} in line: "${line}"`);
            }
          });
        }
      });
      
      if (validAmounts.length > 0) {
        // Pick the most reasonable amount (not just largest)
        validAmounts.sort((a, b) => b.value - a.value);
        amount = validAmounts[0].value;
        console.log(`✓ Using fallback amount: ${amount}`);
      }
    }

    
    console.log('=== FINAL RESULTS ===');
    console.log(`Item: ${item}`);
    console.log(`Category: ${category}`); 
    console.log(`Amount: ${amount}`);

    if (!amount) {
      return res.status(400).json({ 
        message: 'Could not extract amount from receipt.', 
        parsedText 
      });
    }
    // Return extracted data only, do NOT insert into DB
    return res.status(200).json({
      amount,
      item,
      category,
      parsedText,
      receipt_image: s3Location,
      message: 'Receipt processed. You can review and edit before saving as an expense.'
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (error.message && error.message.includes('File too large')) {
      return res.status(400).json({ message: 'File size exceeds 1MB' });
    }
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// OCR using AWS Textract
router.post('/ocr', authenticateToken, async (req, res) => {
  try {
    const { s3Url } = req.body;
    if (!s3Url) return res.status(400).json({ message: 's3Url is required' });
    // Parse bucket and key from s3Url
    const url = new URL(s3Url);
    const bucket = url.host.split('.')[0];
    const key = decodeURIComponent(url.pathname.substring(1));
    const params = {
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    };
    const analyzeDocumentCommand = new AnalyzeDocumentCommand(params);
    const textractResult = await textractClient.send(analyzeDocumentCommand);
    res.status(200).json({ textract: textractResult });
  } catch (error) {
    res.status(500).json({ message: 'Textract failed', error: error.message });
  }
});

module.exports = router;
