import admin from 'firebase-admin'

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!raw) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no está configurado')
}

const serviceAccount = JSON.parse(raw)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export const auth = admin.auth()
export const db = admin.firestore()
export const FieldValue = admin.firestore.FieldValue
export default admin
