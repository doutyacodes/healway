// ============================================
// FILE: lib/db/hospital-relations.js
// HEALWAY HOSPITAL MANAGEMENT SYSTEM RELATIONS
// ============================================

import { relations } from "drizzle-orm";
import * as schema from "./hospital-schema";

// Super Admin Relations
export const superAdminsRelations = relations(schema.superAdmins, ({ many }) => ({
  hospitals: many(schema.hospitals),
}));

// Hospital Relations
export const hospitalsRelations = relations(schema.hospitals, ({ one, many }) => ({
  createdBy: one(schema.superAdmins, {
    fields: [schema.hospitals.createdBySuperAdminId],
    references: [schema.superAdmins.id],
  }),
  admins: many(schema.hospitalAdmins),
  wings: many(schema.hospitalWings),
  users: many(schema.users),
  nursingSections: many(schema.nursingSections),
  nurses: many(schema.nurses),
  securities: many(schema.securities),
  visitingHours: many(schema.visitingHours),
  guests: many(schema.guests),
  patientSessions: many(schema.patientSessions),
}));

// Hospital Admin Relations
export const hospitalAdminsRelations = relations(schema.hospitalAdmins, ({ one, many }) => ({
  hospital: one(schema.hospitals, {
    fields: [schema.hospitalAdmins.hospitalId],
    references: [schema.hospitals.id],
  }),
  createdUsers: many(schema.users),
  admittedSessions: many(schema.patientSessions, { relationName: "admittedBy" }),
  dischargedSessions: many(schema.patientSessions, { relationName: "dischargedBy" }),
  approvedGuests: many(schema.guests),
}));

// Wing Relations
export const hospitalWingsRelations = relations(schema.hospitalWings, ({ one, many }) => ({
  hospital: one(schema.hospitals, {
    fields: [schema.hospitalWings.hospitalId],
    references: [schema.hospitals.id],
  }),
  rooms: many(schema.rooms),
  nursingSections: many(schema.nursingSections),
  securities: many(schema.securities),
  visitingHours: many(schema.visitingHours),
  patientSessions: many(schema.patientSessions),
}));

// Room Relations
export const roomsRelations = relations(schema.rooms, ({ one, many }) => ({
  wing: one(schema.hospitalWings, {
    fields: [schema.rooms.wingId],
    references: [schema.hospitalWings.id],
  }),
  patientSessions: many(schema.patientSessions),
  nursingSectionRooms: many(schema.nursingSectionRooms),
}));

// Nursing Section Relations
export const nursingSectionsRelations = relations(schema.nursingSections, ({ one, many }) => ({
  hospital: one(schema.hospitals, {
    fields: [schema.nursingSections.hospitalId],
    references: [schema.hospitals.id],
  }),
  wing: one(schema.hospitalWings, {
    fields: [schema.nursingSections.wingId],
    references: [schema.hospitalWings.id],
  }),
  nurses: many(schema.nurses),
  nursingSectionRooms: many(schema.nursingSectionRooms),
}));

// Nursing Section Rooms Relations
export const nursingSectionRoomsRelations = relations(schema.nursingSectionRooms, ({ one }) => ({
  section: one(schema.nursingSections, {
    fields: [schema.nursingSectionRooms.sectionId],
    references: [schema.nursingSections.id],
  }),
  room: one(schema.rooms, {
    fields: [schema.nursingSectionRooms.roomId],
    references: [schema.rooms.id],
  }),
}));

// Nurse Relations
export const nursesRelations = relations(schema.nurses, ({ one, many }) => ({
  hospital: one(schema.hospitals, {
    fields: [schema.nurses.hospitalId],
    references: [schema.hospitals.id],
  }),
  section: one(schema.nursingSections, {
    fields: [schema.nurses.sectionId],
    references: [schema.nursingSections.id],
  }),
  patientAssignments: many(schema.nursePatientAssignments),
  guestLogs: many(schema.guestLogs),
  notifications: many(schema.notifications),
}));

// Security Relations
export const securitiesRelations = relations(schema.securities, ({ one, many }) => ({
  hospital: one(schema.hospitals, {
    fields: [schema.securities.hospitalId],
    references: [schema.hospitals.id],
  }),
  assignedWing: one(schema.hospitalWings, {
    fields: [schema.securities.assignedWingId],
    references: [schema.hospitalWings.id],
  }),
  guestLogs: many(schema.guestLogs),
  qrScans: many(schema.qrScans),
}));

// User Relations
export const usersRelations = relations(schema.users, ({ one, many }) => ({
  hospital: one(schema.hospitals, {
    fields: [schema.users.hospitalId],
    references: [schema.hospitals.id],
  }),
  createdBy: one(schema.hospitalAdmins, {
    fields: [schema.users.createdByAdminId],
    references: [schema.hospitalAdmins.id],
  }),
  patientSessions: many(schema.patientSessions),
  createdGuests: many(schema.guests),
  notifications: many(schema.notifications),
}));

// Patient Session Relations
export const patientSessionsRelations = relations(schema.patientSessions, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.patientSessions.userId],
    references: [schema.users.id],
  }),
  hospital: one(schema.hospitals, {
    fields: [schema.patientSessions.hospitalId],
    references: [schema.hospitals.id],
  }),
  wing: one(schema.hospitalWings, {
    fields: [schema.patientSessions.wingId],
    references: [schema.hospitalWings.id],
  }),
  room: one(schema.rooms, {
    fields: [schema.patientSessions.roomId],
    references: [schema.rooms.id],
  }),
  admittedBy: one(schema.hospitalAdmins, {
    fields: [schema.patientSessions.admittedByAdminId],
    references: [schema.hospitalAdmins.id],
    relationName: "admittedBy",
  }),
  dischargedBy: one(schema.hospitalAdmins, {
    fields: [schema.patientSessions.dischargedByAdminId],
    references: [schema.hospitalAdmins.id],
    relationName: "dischargedBy",
  }),
  nurseAssignments: many(schema.nursePatientAssignments),
  guests: many(schema.guests),
  guestLogs: many(schema.guestLogs),
}));

// Nurse Patient Assignment Relations
export const nursePatientAssignmentsRelations = relations(schema.nursePatientAssignments, ({ one }) => ({
  nurse: one(schema.nurses, {
    fields: [schema.nursePatientAssignments.nurseId],
    references: [schema.nurses.id],
  }),
  session: one(schema.patientSessions, {
    fields: [schema.nursePatientAssignments.sessionId],
    references: [schema.patientSessions.id],
  }),
  assignedBy: one(schema.hospitalAdmins, {
    fields: [schema.nursePatientAssignments.assignedByAdminId],
    references: [schema.hospitalAdmins.id],
  }),
}));

// Visiting Hours Relations
export const visitingHoursRelations = relations(schema.visitingHours, ({ one }) => ({
  hospital: one(schema.hospitals, {
    fields: [schema.visitingHours.hospitalId],
    references: [schema.hospitals.id],
  }),
  wing: one(schema.hospitalWings, {
    fields: [schema.visitingHours.wingId],
    references: [schema.hospitalWings.id],
  }),
}));

// Guest Relations
export const guestsRelations = relations(schema.guests, ({ one, many }) => ({
  createdBy: one(schema.users, {
    fields: [schema.guests.createdByUserId],
    references: [schema.users.id],
  }),
  hospital: one(schema.hospitals, {
    fields: [schema.guests.hospitalId],
    references: [schema.hospitals.id],
  }),
  session: one(schema.patientSessions, {
    fields: [schema.guests.sessionId],
    references: [schema.patientSessions.id],
  }),
  approvedBy: one(schema.hospitalAdmins, {
    fields: [schema.guests.approvedByAdminId],
    references: [schema.hospitalAdmins.id],
  }),
  guestLogs: many(schema.guestLogs),
  qrScans: many(schema.qrScans),
}));

// Guest Log Relations
export const guestLogsRelations = relations(schema.guestLogs, ({ one }) => ({
  guest: one(schema.guests, {
    fields: [schema.guestLogs.guestId],
    references: [schema.guests.id],
  }),
  session: one(schema.patientSessions, {
    fields: [schema.guestLogs.sessionId],
    references: [schema.patientSessions.id],
  }),
  security: one(schema.securities, {
    fields: [schema.guestLogs.securityId],
    references: [schema.securities.id],
  }),
  nurse: one(schema.nurses, {
    fields: [schema.guestLogs.nurseId],
    references: [schema.nurses.id],
  }),
}));

// QR Scan Relations
export const qrScansRelations = relations(schema.qrScans, ({ one }) => ({
  guest: one(schema.guests, {
    fields: [schema.qrScans.guestId],
    references: [schema.guests.id],
  }),
  security: one(schema.securities, {
    fields: [schema.qrScans.securityId],
    references: [schema.securities.id],
  }),
  hospital: one(schema.hospitals, {
    fields: [schema.qrScans.hospitalId],
    references: [schema.hospitals.id],
  }),
}));

// Notification Relations
export const notificationsRelations = relations(schema.notifications, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.notifications.userId],
    references: [schema.users.id],
  }),
  nurse: one(schema.nurses, {
    fields: [schema.notifications.nurseId],
    references: [schema.nurses.id],
  }),
  admin: one(schema.hospitalAdmins, {
    fields: [schema.notifications.adminId],
    references: [schema.hospitalAdmins.id],
  }),
  relatedGuest: one(schema.guests, {
    fields: [schema.notifications.relatedGuestId],
    references: [schema.guests.id],
  }),
  relatedSession: one(schema.patientSessions, {
    fields: [schema.notifications.relatedSessionId],
    references: [schema.patientSessions.id],
  }),
}));