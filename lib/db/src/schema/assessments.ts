import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, required: true },
  difficulty: { type: String, required: true, default: "medium" },
  duration: { type: Number, required: true, default: 30 },
  questions: { type: [mongoose.Schema.Types.Mixed], required: true, default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });

const assessmentResultSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number, required: true, default: 0 },
  passed: { type: Boolean, required: true, default: false },
  flagged: { type: Boolean, default: false },
  certificate: { type: String },
}, { timestamps: { createdAt: "completedAt", updatedAt: false } });

export const Assessment = mongoose.model("Assessment", assessmentSchema);
export const AssessmentResult = mongoose.model("AssessmentResult", assessmentResultSchema);

export const assessmentsTable = Assessment;
export const assessmentResultsTable = AssessmentResult;
