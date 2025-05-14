import { VercelRequest, VercelResponse } from '@vercel/node';
import { findNearestDonors } from '../utils/knn.js';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MatchDonorsRequest, MatchDonorsResponse, Donor } from '../utils/types.js';

// Initialize Firebase Admin once
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!))
  });
}

const db = getFirestore();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { centerLocation, bloodType, radius = 50, limit = 10 }: MatchDonorsRequest = req.body;

    // Validate input
    if (!centerLocation?.latitude || !centerLocation?.longitude || !bloodType) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Need centerLocation (latitude, longitude) and bloodType.' 
      });
    }

    // Get donors from Firestore
    const donorsSnapshot = await db.collection('donors')
      .where('isAvailable', '==', true)
      .get();

    const donors = donorsSnapshot.docs.map(doc => ({
      id: doc.id,
      location: doc.data().location,
      bloodType: doc.data().bloodType,
      lastDonation: doc.data().lastDonation,
      name: doc.data().name,
      phoneNumber: doc.data().phoneNumber,
      isAvailable: doc.data().isAvailable ?? true
    })) as Donor[];

    // Find nearest matching donors
    const matchedDonors = findNearestDonors(
      centerLocation,
      donors,
      bloodType,
      radius,
      limit
    );

    const response: MatchDonorsResponse = {
      donors: matchedDonors,
      total: matchedDonors.length
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
