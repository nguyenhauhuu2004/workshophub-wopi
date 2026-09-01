import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workshop from '../models/Workshop.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

function calculateEndAt(startAt, durationStr) {
  const startDate = new Date(startAt);
  let hours = 2; // default 2 hours

  if (durationStr) {
    const match = durationStr.match(/(d+(?:.d+)?)s*(giờ|hour|h)/i);
    if (match) {
      hours = parseFloat(match[1]);
    } else {
      const minMatch = durationStr.match(/(d+)s*(phút|minute|m)/i);
      if (minMatch) {
        hours = parseInt(minMatch[1], 10) / 60;
      }
    }
  }

  const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
  return endDate;
}

function calculateNextScheduleStartAt(schedules) {
  const now = Date.now();
  const upcoming = schedules
    .map((s) => new Date(s.startAt).getTime())
    .filter((time) => time >= now)
    .sort((a, b) => a - b);
  
  if (upcoming.length > 0) {
    return new Date(upcoming[0]);
  }
  return null;
}

async function getStructuredLocationFromGoong(lat, lng, addressString) {
  try {
    const GOONG_API_KEY = process.env.GOONG_REST_API_KEY;
    if (!GOONG_API_KEY) return null;

    const response = await fetch(`https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOONG_API_KEY}`);
    const data = await response.json();
    
    if (data && data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.address_components || [];
      
      let ward = '';
      let district = '';
      let city = '';
      let province = '';
      
      for (const comp of components) {
        const types = comp.types || [];
        if (types.includes('sublocality_level_1') || types.includes('ward')) ward = comp.long_name;
        if (types.includes('administrative_area_level_2') || types.includes('district')) district = comp.long_name;
        if (types.includes('administrative_area_level_1') || types.includes('province') || types.includes('city')) {
          city = comp.long_name;
          province = comp.long_name;
        }
      }
      
      return {
        formattedAddress: result.formatted_address,
        ward,
        district,
        city,
        province,
        country: 'Việt Nam'
      };
    }
  } catch (err) {
    console.error('Goong API error', err);
  }
  return null;
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
  console.log('Connected.');

  const workshops = await Workshop.find({});
  console.log(`Found ${workshops.length} workshops to migrate.`);

  let updatedCount = 0;

  for (const workshop of workshops) {
    let modified = false;

    if (workshop.schedules && workshop.schedules.length > 0) {
      workshop.schedules.forEach(schedule => {
        if (!schedule.endAt) {
          schedule.endAt = calculateEndAt(schedule.startAt, workshop.duration);
          modified = true;
        }
      });
      
      const nextStart = calculateNextScheduleStartAt(workshop.schedules);
      if (
        (!workshop.nextScheduleStartAt && nextStart) || 
        (workshop.nextScheduleStartAt && nextStart && workshop.nextScheduleStartAt.getTime() !== nextStart.getTime())
      ) {
        workshop.nextScheduleStartAt = nextStart;
        modified = true;
      }
    }

    if (workshop.location && workshop.location.coordinates && workshop.location.coordinates.coordinates) {
      const [lng, lat] = workshop.location.coordinates.coordinates;
      
      if (!workshop.location.city) {
        console.log(`Geocoding for workshop ${workshop._id}...`);
        const structured = await getStructuredLocationFromGoong(lat, lng, workshop.location.address);
        if (structured) {
          workshop.location.ward = structured.ward || '';
          workshop.location.district = structured.district || '';
          workshop.location.city = structured.city || '';
          workshop.location.province = structured.province || '';
          workshop.location.country = structured.country || 'Việt Nam';
          workshop.location.formattedAddress = structured.formattedAddress || '';
          modified = true;
        } else {
          const parts = workshop.location.address.split(',').map(s => s.trim());
          if (parts.length >= 3) {
            workshop.location.city = parts[parts.length - 1];
            workshop.location.district = parts[parts.length - 2];
            workshop.location.ward = parts[parts.length - 3];
            modified = true;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (modified) {
      await workshop.save();
      console.log(`Updated workshop ${workshop._id}: ${workshop.title}`);
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} workshops.`);
  process.exit(0);
}

run().catch(console.error);
