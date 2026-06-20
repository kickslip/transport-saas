'use server'

import { prisma } from './db'

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTER'
  | 'USER_DEACTIVATED'
  | 'USER_ACTIVATED'
  | 'BOOKING_CREATED'
  | 'BOOKING_CANCELLED'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'REVIEW_SUBMITTED'
  | 'TENANT_CREATED'
  | 'TENANT_SUSPENDED'
  | 'TENANT_UPDATED'
  | 'DATA_EXPORT'
  | 'DATA_DELETION_REQUEST'

export async function auditLog(opts: {
  action: AuditAction
  userId?: string
  tenantId?: string
  entityId?: string
  entityType?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        userId: opts.userId,
        tenantId: opts.tenantId,
        entityId: opts.entityId,
        entityType: opts.entityType,
        oldValues: opts.oldValues ? JSON.stringify(opts.oldValues) : undefined,
        newValues: opts.newValues ? JSON.stringify(opts.newValues) : undefined,
        ipAddress: opts.ipAddress,
      },
    })
  } catch (e) {
    console.error('[AuditLog] Failed to write audit log:', e)
  }
}
