import { Router, type IRouter } from "express";
import { Assessment, AssessmentResult, User, Certification } from "@workspace/db";
import { getUserIdFromToken } from "./auth";

const router: IRouter = Router();

// GET /assessments
router.get("/assessments", async (req, res): Promise<void> => {
  const { category } = req.query as Record<string, string>;

  let assessments;
  if (category) {
    assessments = await Assessment.find({ category });
  } else {
    assessments = await Assessment.find();
  }

  // Strip correct answers from questions
  res.json(assessments.map(a => {
    const obj = a.toObject();
    return {
      ...obj,
      id: obj._id.toString(),
      questionCount: Array.isArray(obj.questions) ? obj.questions.length : 0,
      questions: undefined,
    };
  }));
});

// POST /assessments
router.post("/assessments", async (req, res): Promise<void> => {
  const { title, category, type, difficulty, duration, questions } = req.body;
  if (!title || !category || !type || !difficulty || !duration || !questions) {
    res.status(400).json({ error: "All fields required" });
    return;
  }

  const assessment = await Assessment.create({
    title, category, type, difficulty, duration, questions,
  });

  const obj = assessment.toObject();
  res.status(201).json({ ...obj, id: obj._id.toString(), questionCount: questions.length });
});

// GET /assessments/:id
router.get("/assessments/:id", async (req, res): Promise<void> => {
  const id = req.params.id;
  const assessment = await Assessment.findById(id);
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  const obj = assessment.toObject();
  const questions = (obj.questions as Array<Record<string, any>>).map(q => ({
    id: q.id,
    text: q.text,
    options: q.options,
    type: q.type,
    // do not expose correctAnswer
  }));

  res.json({ ...obj, id: obj._id.toString(), questions });
});

// POST /assessments/:id/submit
router.post("/assessments/:id/submit", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = req.params.id;
  const assessment = await Assessment.findById(id);
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  const { answers, flagged } = req.body;
  const obj = assessment.toObject();
  const questions = obj.questions as Array<Record<string, any>>;

  // Score calculation
  let correct = 0;
  for (const answer of (answers ?? [])) {
    const question = questions.find(q => q.id === answer.questionId);
    if (question && question.correctAnswer === answer.answer) {
      correct++;
    }
  }

  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= 60;

  const result = await AssessmentResult.create({
    assessmentId: id,
    userId,
    score,
    passed,
    flagged: !!flagged,
    certificate: (passed && !flagged) ? `CERT-${userId}-${id}-${Date.now()}` : null,
  });

  // Award XP and Generate Certificate in Profile
  if (passed && !flagged) {
    await User.findByIdAndUpdate(userId, { $inc: { xp: 50 } });

    // Generate certification in user profile
    await Certification.create({
      userId,
      name: `${obj.title} Professional Certification`,
      organization: "SkillSync.ai",
      issueDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      credentialId: result.certificate,
      credentialUrl: `/api/assessments/certificate/${result._id}`,
    });
  } else if (passed && flagged) {
    // Still award some XP for completion but less, or just record it
    await User.findByIdAndUpdate(userId, { $inc: { xp: 10 } });
  }

  const resultObj = result.toObject();
  res.json({ ...resultObj, id: resultObj._id.toString(), assessment: obj });
});

// GET /assessment-results
router.get("/assessment-results", async (req, res): Promise<void> => {
  const userId = getUserIdFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const results = await AssessmentResult.find({ userId }).populate("assessmentId");
  res.json(results.map(r => {
    const obj = r.toObject();
    return { ...obj, id: obj._id.toString() };
  }));
});

// GET /assessments/certificate/:id
router.get("/certificate/:id", async (req, res): Promise<void> => {
  const resultId = req.params.id;
  const result = await AssessmentResult.findById(resultId).populate("assessmentId").populate("userId");
  
  if (!result || !result.passed) {
    res.status(404).send("Certificate not found");
    return;
  }

  const assessment = (result.assessmentId as any);
  const user = (result.userId as any);
  const date = result.completedAt.toLocaleDateString("en-US", { 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Certificate of Completion - ${user.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
        .certificate { width: 800px; height: 600px; background: white; border: 20px solid #3b82f6; padding: 60px; box-sizing: border-box; position: relative; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .logo { font-weight: 900; font-size: 24px; color: #000; letter-spacing: -1px; margin-bottom: 40px; }
        .logo span { color: #3b82f6; }
        .title { font-size: 14px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 20px; }
        .header { font-size: 48px; font-weight: 900; color: #000; margin-bottom: 10px; letter-spacing: -2px; }
        .subtitle { font-size: 18px; color: #666; margin-bottom: 40px; }
        .user-name { font-size: 36px; font-weight: 700; color: #000; margin-bottom: 10px; border-bottom: 2px solid #eee; display: inline-block; padding: 0 40px 10px; }
        .description { font-size: 16px; color: #444; line-height: 1.6; max-width: 500px; margin: 0 auto 40px; }
        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; }
        .signature { text-align: left; }
        .signature-line { width: 200px; height: 1px; background: #000; margin-bottom: 10px; }
        .signature-name { font-size: 14px; font-weight: 700; color: #000; }
        .date { text-align: right; }
        .date-label { font-size: 12px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .date-value { font-size: 16px; font-weight: 700; color: #000; }
        .id { position: absolute; bottom: 20px; left: 0; right: 0; font-size: 10px; color: #ccc; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="logo">SkillSync<span>.ai</span></div>
        <div class="title">Certificate of Completion</div>
        <div class="header">Professional Proficiency</div>
        <div class="subtitle">This is to certify that</div>
        <div class="user-name">${user.name}</div>
        <div class="description">
          has successfully completed the <strong>${assessment.title}</strong> assessment with a score of <strong>${result.score}%</strong>, demonstrating exceptional expertise in the subject matter.
        </div>
        <div class="footer">
          <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-name">Certification Board</div>
            <div style="font-size: 10px; color: #999;">SkillSync.ai Enterprise</div>
          </div>
          <div class="date">
            <div class="date-label">Issued on</div>
            <div class="date-value">${date}</div>
          </div>
        </div>
        <div class="id">Credential ID: ${result.certificate}</div>
      </div>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

export default router;
