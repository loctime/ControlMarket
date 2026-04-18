import admin from 'firebase-admin'

function initAdmin() {
  if (admin.apps.length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON no está configurado en Vercel. Agregalo en Project Settings → Environment Variables y redeployá.'
    )
  }
  let serviceAccount
  try {
    serviceAccount = JSON.parse(raw)
  } catch (err) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON no es JSON válido: ${err.message}`)
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export function getAuth() {
  initAdmin()
  return admin.auth()
}

export function getDb() {
  initAdmin()
  return admin.firestore()
}

export const FieldValue = admin.firestore.FieldValue
export default admin
