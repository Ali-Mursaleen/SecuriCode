require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Use environment variables for API tokens
const DEEPSEEK_API_TOKEN = process.env.DEEPSEEK_API_TOKEN;
const SEMGREP_API_TOKEN = process.env.SEMGREP_API_TOKEN;

app.post('/api/improve-code', async (req, res) => {
  const { code } = req.body;
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_TOKEN}`
      },
      body: JSON.stringify({
        model: "deepseek-coder",
        messages: [
          {
            role: "system",
            content: "You are a security-focused coding assistant. Improve the given JavaScript code security without changing its functionality. Return only the code without explanations."
          },
          {
            role: "user",
            content: `Improve the security of this JavaScript code: ${code}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from DeepSeek API');
    }
    
    const improvedCode = data.choices[0].message.content;
    
    res.json({ improvedCode });
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-security', async (req, res) => {
  const { originalCode, improvedCode } = req.body;
  
  try {
    // For Semgrep, you would typically use their CLI or cloud API
    // This is a simplified simulation of what the response might look like
    
    // Simulate analysis based on code content
    const issues = {
      original: 0,
      improved: 0,
      vulnerabilities: []
    };
    
    // Check for SQL injection patterns
    if (originalCode.includes("'+") && originalCode.includes("SELECT")) {
      issues.original++;
      issues.vulnerabilities.push({
        type: "SQL Injection",
        severity: "High",
        description: "Original code concatenates user input directly into SQL query",
        fixed: improvedCode.includes("?")
      });
    }
    
    // Check for XSS patterns
    if (originalCode.includes("innerHTML")) {
      issues.original++;
      issues.vulnerabilities.push({
        type: "Cross-Site Scripting (XSS)",
        severity: "Medium",
        description: "Original code uses innerHTML with user input",
        fixed: improvedCode.includes("textContent") || improvedCode.includes("DOMPurify")
      });
    }
    
    // Check for eval usage
    if (originalCode.includes("eval(")) {
      issues.original++;
      issues.vulnerabilities.push({
        type: "Code Injection",
        severity: "Critical",
        description: "Original code uses eval() which can execute arbitrary code",
        fixed: !improvedCode.includes("eval(")
      });
    }
    
    // Count issues in improved code
    if (improvedCode.includes("'+") && improvedCode.includes("SELECT")) issues.improved++;
    if (improvedCode.includes("innerHTML")) issues.improved++;
    if (improvedCode.includes("eval(")) issues.improved++;
    
    res.json(issues);
  } catch (error) {
    console.error('Error in security analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`SecuriCode backend running on port ${port}`);
});