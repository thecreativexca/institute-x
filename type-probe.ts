// Temporary type-pattern discovery file — deleted after diagnostics.
import { Schema, model, Types } from "mongoose";

// Mongoose 9 style: plain interface (no extends Document), Types.ObjectId refs.
interface IProbe {
  course: Types.ObjectId;
  title: string;
  sortOrder: number;
}

const ProbeSchema = new Schema<IProbe>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Probe = model<IProbe>("Probe", ProbeSchema);

// Q1: string filter
export async function q1(courseId: string) {
  return Probe.find({ course: courseId }).lean();
}

// Q2: Types.ObjectId filter
export async function q2(courseId: string) {
  return Probe.find({ course: new Types.ObjectId(courseId) }).lean();
}

// Q3: lean field back into filter
export async function q3(courseId: string) {
  const found = await Probe.findOne({ title: "x" }).select("course").lean();
  if (!found) return null;
  return Probe.find({ course: found.course }).lean();
}

// Q4: create
export async function q4(courseId: string) {
  return Probe.create({ course: new Types.ObjectId(courseId), title: "t" });
}

// Q5: findOneAndUpdate style
export async function q5(id: string) {
  return Probe.findOneAndUpdate({ _id: new Types.ObjectId(id) }, { $set: { title: "y" } }, { new: true }).lean();
}

