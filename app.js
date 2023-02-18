const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require ('cors');
const path = require ('path');
const multer = require ('multer');
var textract = require('textract')

const axios = require('axios')
require('dotenv').config();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded ({extended: true}));
app.use(cors ());

  
const PROMPT="You are a professional resume analyzer. \nYou tell people what they are doing well with on their resume and the areas that they really need to improve on. \nYou use a friendly voice and keep things professional. \nAnalyze the Input below and tell the user what they did well with the resume and what should do to improve the document \nExample analysis and format: \nGood job on writing this resume! \nThings you did very well: \n- You listed all of your relevant credentials \n- You included the key sections for education, skills, experience, and qualifications \n- You included the metrics to help show the impacts you made in your roles \n- You used a profeesional and concise tone \nThings that can be improved on. \n- Break up long paragraphs into shorter concise sentencs. \n- Incorporate active voice using action words \n- Use bullet points to highlight your accomplishments \n- Focus on only the most relevant skills and experiences to the job you are applying for. \nInput: <Resume>"

// storage engine for multer
const storageEngine = multer.diskStorage ({
    destination: './public/uploads/',
    filename: function (req, file, callback) {
        callback (
        null,
        file.fieldname + '-' + Date.now () + path.extname (file.originalname)
        );
    },
});  

const fileFilter = (req, file, callback) => {
    let pattern = /pdf|docx|doc/; // reqex

    if (pattern.test (path.extname (file.originalname))) {
      callback (null, true);
    } else {
      callback ('Error: not a valid file');
    }
  };

// initialize multer
const upload = multer ({
    storage: storageEngine,
    fileFilter: fileFilter,
  });  

app.get('/test', (req, res, next) => {
    console.log("test");
})
  
// routing
app.post ('/upload', upload.single ('uploadedFile'), (req, res) => {
    let uploadedFileName = req.file.filename;
    textract.fromFileWithPath('./public/uploads/'+uploadedFileName, async function(error, text){
        if(error) {
            res.json({
                status: false,
                msg: "request was failed"
            })
        } else {
            const resume = PROMPT;
            let question = resume.replace("<Resume>", text);
        
            let result = await axios.post('https://api.openai.com/v1/completions', {
                "model": "text-davinci-003",
                "prompt": `${question}`,
                "temperature": 0.76,
                "max_tokens": 506,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_KEY}`
                }
            });

            if(result.status === 200) {
                res.json({
                    status: true,
                    msg: result.data
                })
            } else {
                res.json({
                    status: false,
                    msg: "Request was failed"
                })
            }
        }
    })
});
  

app.post('/openai', async (req, res, next) => {
    
})

const server = app.listen(5000, function () {
    let host = server.address().address
    let port = server.address().port

    console.log("Server starting on port 5000");
})
