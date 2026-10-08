package com.transmoney.backend.exception;

/**
 * Exception thrown when simulating a coordinator crash immediately after
 * the 2PC PREPARED phase is committed to disk.
 * Configured with noRollbackFor so the PREPARED transaction log persists in DB,
 * allowing the Recovery Coordinator to detect and reconcile it.
 */
public class CoordinatorCrashException extends TransactionException {
    public CoordinatorCrashException(String message) {
        super(message);
    }
}
