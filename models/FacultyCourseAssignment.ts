import { Schema, type Types } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { User } from "./User";

/**
 * FacultyCourseAssignment — grants a faculty member scoped access to a single
 * course's content. Faculty permission alone is never enough: office content
 * authorization is "permission + course scope" (Phase 17).
 */
export interface IFacultyCourseAssignment {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  faculty: Types.ObjectId;
  course: Types.ObjectId;
  assignedBy?: Types.ObjectId;
}

const FacultyCourseAssignmentSchema = new Schema<IFacultyCourseAssignment>(
  {
    faculty: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: User.modelName },
  },
  { timestamps: true }
);

FacultyCourseAssignmentSchema.index({ faculty: 1, course: 1 }, { unique: true });

export const FacultyCourseAssignment = defineModel(
  "FacultyCourseAssignment",
  FacultyCourseAssignmentSchema
);