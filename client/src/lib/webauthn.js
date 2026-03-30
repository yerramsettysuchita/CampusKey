import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { api } from './api';

/**
 * Full passkey enrollment flow:
 * 1. GET options from backend
 * 2. Prompt browser / cross-device QR
 * 3. POST credential back to backend
 */
export async function enrollPasskey(enrollData) {
  const options    = await api.registerStart(enrollData);
  const credential = await startRegistration({ optionsJSON: options });
  const result     = await api.registerFinish(enrollData.email, credential, enrollData.sessionId);
  return result;
}

/**
 * Full passkey login flow:
 * 1. GET challenge from backend
 * 2. Prompt browser / cross-device QR
 * 3. POST assertion back to backend
 */
export async function loginWithPasskey(email) {
  const options    = await api.loginStart(email);
  const credential = await startAuthentication({ optionsJSON: options });
  const result     = await api.loginFinish(email, credential);
  return result;
}
