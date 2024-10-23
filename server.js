const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');


const app = express();

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/view-metadata', upload.single('pdf'), async (req, res) => {
  try {
    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);

    const metadata = {
      title: data.info.Title || 'Untitled',
      author: data.info.Author || 'Unknown',
      subject: data.info.Subject || 'No Subject',
      keywords: data.info.Keywords || 'No Keywords',
      producer: data.info.Producer || "No Producer",
      application: data.info.Creator || "Unknown Application",
    };

    res.json(metadata);
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal membaca metadata PDF.');
  }
});


app.post('/edit-metadata', upload.single('pdf'), async (req, res) => {
  try {
    const { title, author, subject, keywords, application, producer } = req.body;

   
    const existingPdfBytes = req.file.buffer;


    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    console.log(pdfDoc);

 
    pdfDoc.setTitle(title || 'Untitled');
    pdfDoc.setAuthor(author || 'Unknown');
    pdfDoc.setSubject(subject || '');
    pdfDoc.setKeywords(keywords ? keywords.split(',,,').map(k => k.trim()) : []);



    if (application) {
      pdfDoc.setCreator(application);
    }


    if (producer) {
      pdfDoc.setProducer(producer);
    }

  

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(UPLOAD_DIR, `edited_${req.file.originalname}`);


    fs.writeFileSync(outputPath, pdfBytes);

  
    // res.download(outputPath, `${title}` + ".pdf", (err) => {
      res.download(outputPath, `${req.file.originalname}`, (err) => {
      if (err) throw err;


      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat mengedit metadata.');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  
  console.log(`http://localhost:${PORT}`);
});
