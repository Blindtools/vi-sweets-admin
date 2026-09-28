import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function adminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is not configured');
  const serviceAccount = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
  });
}

export async function requireAdmin(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('Missing Firebase ID token');
  const token = authorization.slice('Bearer '.length);
  const app = adminApp();
  const decoded = await getAuth(app).verifyIdToken(token);
  const role = await getFirestore(app).collection('admin_roles').doc(decoded.uid).get();
  const data = role.data() ?? {};
  if (!role.exists || (data.admin !== true && data.developer !== true && data.is_admin !== true)) {
    throw new Error('Admin role required');
  }
  return { app, uid: decoded.uid, email: decoded.email ?? null };
}
