// ============================================
// FILE: lib/db/hospital-schema.js
// HEALWAY HOSPITAL MANAGEMENT SYSTEM SCHEMA
// Updated with enhanced relationships and data integrity
// ============================================

import {
  mysqlTable,
  bigint,
  varchar,
  boolean,
  timestamp,
  text,
  mysqlEnum,
  int,
  decimal,
  date,
  time,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ============================================
// 1. Super Admins
// ============================================
export const superAdmins = mysqlTable("super_admins", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  passwordChangedAt: timestamp("password_changed_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  emailIdx: index("idx_super_admin_email").on(table.email),
}));

// ============================================
// 2. Hospitals
// ============================================
export const hospitals = mysqlTable("hospitals", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  address: text("address").notNull(),
  district: varchar("district", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("India"),
  pincode: varchar("pincode", { length: 10 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 15 }),
  createdBySuperAdminId: bigint("created_by_super_admin_id", { mode: "number", unsigned: true }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  superAdminIdx: index("idx_hospital_super_admin").on(table.createdBySuperAdminId),
  nameIdx: index("idx_hospital_name").on(table.name),
}));

// ============================================
// 3. Hospital Admins
// ============================================
export const hospitalAdmins = mysqlTable("hospital_admins", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobileNumber: varchar("mobile_number", { length: 15 }),
  password: varchar("password", { length: 255 }).notNull(),
  passwordChangedAt: timestamp("password_changed_at"),
  role: mysqlEnum("role", ["admin", "sub_admin"]).default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  hospitalIdx: index("idx_admin_hospital").on(table.hospitalId),
  emailIdx: uniqueIndex("idx_admin_email").on(table.email),
}));

// ============================================
// 4. Hospital Wings
// ============================================
export const hospitalWings = mysqlTable("hospital_wings", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  wingName: varchar("wing_name", { length: 255 }).notNull(),
  wingCode: varchar("wing_code", { length: 50 }),
  floorNumber: int("floor_number"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  hospitalIdx: index("idx_wing_hospital").on(table.hospitalId),
  wingNameIdx: index("idx_wing_name").on(table.wingName),
}));

// ============================================
// 5. Rooms
// ============================================
export const rooms = mysqlTable("rooms", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  wingId: bigint("wing_id", { mode: "number", unsigned: true }).notNull(),
  roomNumber: varchar("room_number", { length: 50 }).notNull(),
  roomNumberInt: int("room_number_int"), // For numeric sorting and range queries
  roomType: mysqlEnum("room_type", ["general", "private", "icu", "emergency"]).default("general"),
  capacity: int("capacity").default(1),
  status: mysqlEnum("status", ["available", "occupied", "maintenance", "reserved"]).default("available"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  wingIdx: index("idx_room_wing").on(table.wingId),
  roomNumberIdx: index("idx_room_number").on(table.roomNumber),
  statusIdx: index("idx_room_status").on(table.status),
  roomNumberIntIdx: index("idx_room_number_int").on(table.roomNumberInt),
}));

// ============================================
// 6. Nursing Sections
// ============================================
export const nursingSections = mysqlTable("nursing_sections", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  wingId: bigint("wing_id", { mode: "number", unsigned: true }),
  sectionName: varchar("section_name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  hospitalIdx: index("idx_section_hospital").on(table.hospitalId),
  wingIdx: index("idx_section_wing").on(table.wingId),
}));

// ============================================
// 7. Nursing Section Rooms (Junction Table)
// ============================================
export const nursingSectionRooms = mysqlTable("nursing_section_rooms", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  sectionId: bigint("section_id", { mode: "number", unsigned: true }).notNull(),
  roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => ({
  sectionIdx: index("idx_section_room_section").on(table.sectionId),
  roomIdx: index("idx_section_room_room").on(table.roomId),
  uniqueAssignment: uniqueIndex("idx_unique_section_room").on(table.sectionId, table.roomId),
}));

// ============================================
// 8. Nurses
// ============================================
export const nurses = mysqlTable("nurses", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  sectionId: bigint("section_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  mobileNumber: varchar("mobile_number", { length: 15 }),
  password: varchar("password", { length: 255 }).notNull(),
  passwordChangedAt: timestamp("password_changed_at"),
  shiftTiming: varchar("shift_timing", { length: 100 }),
  employeeId: varchar("employee_id", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  hospitalIdx: index("idx_nurse_hospital").on(table.hospitalId),
  sectionIdx: index("idx_nurse_section").on(table.sectionId),
  emailIdx: uniqueIndex("idx_nurse_email").on(table.email),
}));

// ============================================
// 9. Securities
// ============================================
export const securities = mysqlTable("securities", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
  username: varchar("username", { length: 100 }).unique(),
  password: varchar("password", { length: 255 }).notNull(),
  passwordChangedAt: timestamp("password_changed_at"),
  assignedWingId: bigint("assigned_wing_id", { mode: "number", unsigned: true }),
  shiftTiming: varchar("shift_timing", { length: 100 }),
  employeeId: varchar("employee_id", { length: 50 }),
  photoUrl: varchar("photo_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  hospitalIdx: index("idx_security_hospital").on(table.hospitalId),
  wingIdx: index("idx_security_wing").on(table.assignedWingId),
  usernameIdx: uniqueIndex("idx_security_username").on(table.username),
}));

// ============================================
// 10. Users (Patients / Bystanders)
// ============================================
export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
  email: varchar("email", { length: 255 }),
  role: mysqlEnum("role", ["patient", "bystander"]).default("patient"),
  otpLoginEnabled: boolean("otp_login_enabled").default(true),
  createdByAdminId: bigint("created_by_admin_id", { mode: "number", unsigned: true }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  hospitalIdx: index("idx_user_hospital").on(table.hospitalId),
  mobileIdx: index("idx_user_mobile").on(table.mobileNumber),
  adminIdx: index("idx_user_admin").on(table.createdByAdminId),
}));

// ============================================
// 11. OTP Verifications
// ============================================
export const otpVerifications = mysqlTable("otp_verifications", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attemptCount: int("attempt_count").default(0),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  mobileIdx: index("idx_otp_mobile").on(table.mobileNumber),
  expiresIdx: index("idx_otp_expires").on(table.expiresAt),
}));

// ============================================
// 12. Patient Sessions (Active Admissions)
// ============================================
export const patientSessions = mysqlTable("patient_sessions", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  wingId: bigint("wing_id", { mode: "number", unsigned: true }).notNull(),
  roomId: bigint("room_id", { mode: "number", unsigned: true }).notNull(),
  admittedByAdminId: bigint("admitted_by_admin_id", { mode: "number", unsigned: true }).notNull(),
  dischargedByAdminId: bigint("discharged_by_admin_id", { mode: "number", unsigned: true }),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  admissionType: mysqlEnum("admission_type", ["emergency", "planned", "transfer"]).default("planned"),
  status: mysqlEnum("status", ["active", "discharged", "transferred"]).default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  userIdx: index("idx_session_user").on(table.userId),
  hospitalIdx: index("idx_session_hospital").on(table.hospitalId),
  roomIdx: index("idx_session_room").on(table.roomId),
  statusIdx: index("idx_session_status").on(table.status),
  dateIdx: index("idx_session_dates").on(table.startDate, table.endDate),
}));

// ============================================
// 13. Nurse Patient Assignments
// ============================================
export const nursePatientAssignments = mysqlTable("nurse_patient_assignments", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  nurseId: bigint("nurse_id", { mode: "number", unsigned: true }).notNull(),
  sessionId: bigint("session_id", { mode: "number", unsigned: true }).notNull(),
  assignedByAdminId: bigint("assigned_by_admin_id", { mode: "number", unsigned: true }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  unassignedAt: timestamp("unassigned_at"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  nurseIdx: index("idx_assignment_nurse").on(table.nurseId),
  sessionIdx: index("idx_assignment_session").on(table.sessionId),
  activeIdx: index("idx_assignment_active").on(table.isActive),
}));

// ============================================
// 14. Hospital & Wing Visiting Hours
// ============================================
export const visitingHours = mysqlTable("visiting_hours", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  wingId: bigint("wing_id", { mode: "number", unsigned: true }), // NULL = hospital-wide
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  dayOfWeek: mysqlEnum("day_of_week", [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]), // NULL = applies to all days
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  hospitalIdx: index("idx_visiting_hospital").on(table.hospitalId),
  wingIdx: index("idx_visiting_wing").on(table.wingId),
}));

// ============================================
// 15. Guests
// ============================================
export const guests = mysqlTable("guests", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  createdByUserId: bigint("created_by_user_id", { mode: "number", unsigned: true }).notNull(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  sessionId: bigint("session_id", { mode: "number", unsigned: true }).notNull(),
  guestName: varchar("guest_name", { length: 255 }).notNull(),
  guestPhone: varchar("guest_phone", { length: 15 }),
  guestIdProof: varchar("guest_id_proof", { length: 100 }),
  relationshipToPatient: varchar("relationship_to_patient", { length: 100 }),
  guestType: mysqlEnum("guest_type", ["frequent", "one_time"]).default("one_time"),
  
  // Time validity
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  
  // QR Code details
  qrCode: varchar("qr_code", { length: 500 }).unique().notNull(),
  qrEncryptedData: text("qr_encrypted_data"),
  qrExpiresAt: timestamp("qr_expires_at"),
  qrScanLimit: int("qr_scan_limit"), // NULL = unlimited
  qrScansUsed: int("qr_scans_used").default(0),
  
  purpose: text("purpose"),
  status: mysqlEnum("status", ["pending", "approved", "denied", "expired", "revoked"]).default("pending"),
  approvedByAdminId: bigint("approved_by_admin_id", { mode: "number", unsigned: true }),
  approvedAt: timestamp("approved_at"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  userIdx: index("idx_guest_user").on(table.createdByUserId),
  sessionIdx: index("idx_guest_session").on(table.sessionId),
  qrIdx: uniqueIndex("idx_guest_qr").on(table.qrCode),
  statusIdx: index("idx_guest_status").on(table.status),
  validityIdx: index("idx_guest_validity").on(table.validFrom, table.validUntil),
}));

// ============================================
// 16. Guest Logs
// ============================================
export const guestLogs = mysqlTable("guest_logs", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  guestId: bigint("guest_id", { mode: "number", unsigned: true }).notNull(),
  sessionId: bigint("session_id", { mode: "number", unsigned: true }).notNull(),
  securityId: bigint("security_id", { mode: "number", unsigned: true }),
  nurseId: bigint("nurse_id", { mode: "number", unsigned: true }),
  entryTime: timestamp("entry_time").defaultNow(),
  exitTime: timestamp("exit_time"),
  currentlyInside: boolean("currently_inside").default(true),
  accessGranted: boolean("access_granted").default(false),
  accessDeniedReason: varchar("access_denied_reason", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  guestIdx: index("idx_log_guest").on(table.guestId),
  sessionIdx: index("idx_log_session").on(table.sessionId),
  securityIdx: index("idx_log_security").on(table.securityId),
  entryTimeIdx: index("idx_log_entry_time").on(table.entryTime),
  currentlyInsideIdx: index("idx_log_currently_inside").on(table.currentlyInside),
}));

// ============================================
// 17. QR Scans
// ============================================
export const qrScans = mysqlTable("qr_scans", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  guestId: bigint("guest_id", { mode: "number", unsigned: true }).notNull(),
  securityId: bigint("security_id", { mode: "number", unsigned: true }).notNull(),
  hospitalId: bigint("hospital_id", { mode: "number", unsigned: true }).notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
  accessGranted: boolean("access_granted").default(false),
  accessReason: varchar("access_reason", { length: 255 }),
  denialReason: varchar("denial_reason", { length: 255 }),
  deviceInfo: varchar("device_info", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  guestIdx: index("idx_scan_guest").on(table.guestId),
  securityIdx: index("idx_scan_security").on(table.securityId),
  hospitalIdx: index("idx_scan_hospital").on(table.hospitalId),
  scannedAtIdx: index("idx_scan_time").on(table.scannedAt),
}));

// ============================================
// 18. Notifications
// ============================================
export const notifications = mysqlTable("notifications", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  nurseId: bigint("nurse_id", { mode: "number", unsigned: true }),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }),
  type: mysqlEnum("type", ["guest_arrival", "guest_waiting", "guest_approved", "guest_denied", "session_update", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedGuestId: bigint("related_guest_id", { mode: "number", unsigned: true }),
  relatedSessionId: bigint("related_session_id", { mode: "number", unsigned: true }),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_notif_user").on(table.userId),
  nurseIdx: index("idx_notif_nurse").on(table.nurseId),
  adminIdx: index("idx_notif_admin").on(table.adminId),
  typeIdx: index("idx_notif_type").on(table.type),
  isReadIdx: index("idx_notif_read").on(table.isRead),
  createdAtIdx: index("idx_notif_created").on(table.createdAt),
}));

// ============================================
// 19. Audit Logs
// ============================================
export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: bigint("record_id", { mode: "number", unsigned: true }).notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "login", "logout"]).notNull(),
  performedBy: varchar("performed_by", { length: 100 }), // Format: "admin:123" or "nurse:456"
  performedByType: mysqlEnum("performed_by_type", ["super_admin", "admin", "nurse", "security", "user", "system"]),
  oldValues: text("old_values"), // JSON
  newValues: text("new_values"), // JSON
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tableIdx: index("idx_audit_table").on(table.tableName),
  recordIdx: index("idx_audit_record").on(table.recordId),
  actionIdx: index("idx_audit_action").on(table.action),
  performedByIdx: index("idx_audit_performed_by").on(table.performedBy),
  createdAtIdx: index("idx_audit_created").on(table.createdAt),
}));

export const deviceTokens = mysqlTable("device_tokens", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),

  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  deviceToken: text("device_token").notNull(),

  platform: varchar("platform", { length: 20 }), // "android" | "ios" | "web"

  deviceModel: varchar("device_model", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .onUpdateNow(),
}, (table) => ({
  userIdx: index("idx_device_user").on(table.userId),
  tokenIdx: index("idx_device_token").on(table.deviceToken),
}));