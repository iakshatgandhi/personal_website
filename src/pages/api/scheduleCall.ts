// src/pages/api/scheduleCall.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

// Validation schema
const ScheduleCallSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  selectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  selectedTime: z.string().regex(/^(0[9]|1[0-1]):00 AM|(0[2-4]):00 PM$/, "Invalid time format"),
  message: z.string().optional()
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const validatedData = ScheduleCallSchema.parse(req.body);
    
    // Convert time string to 24-hour format for DB
    const time24h = convertTo24Hour(validatedData.selectedTime);
    
    // Combine date and time into ISO string
    const scheduledDateTime = new Date(
      `${validatedData.selectedDate}T${time24h}`
    );

    // Check if the slot is available
    const existingBooking = await prisma.callBooking.findFirst({
      where: {
        scheduledAt: scheduledDateTime,
      },
    });

    if (existingBooking) {
      return res.status(409).json({ 
        error: 'This time slot is no longer available' 
      });
    }

    // Create booking in database
    const booking = await prisma.callBooking.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        scheduledAt: scheduledDateTime,
        message: validatedData.message || '',
        status: 'SCHEDULED'
      },
    });

    // Send confirmation emails
    await Promise.all([
      // Send to customer
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: validatedData.email,
        subject: 'Call Scheduled - Confirmation',
        html: generateCustomerEmail(booking),
      }),
      // Send to admin
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Call Booking',
        html: generateAdminEmail(booking),
      }),
    ]);

    return res.status(200).json({ 
      success: true, 
      bookingId: booking.id 
    });

  } catch (error) {
    console.error('Booking error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    return res.status(500).json({ 
      error: 'Failed to schedule call' 
    });
  }
}

// Helper function to convert 12-hour to 24-hour format
function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  
  return `${hours.padStart(2, '0')}:${minutes}`;
}

// Email template functions
function generateCustomerEmail(booking: any): string {
  return `
    <h2>Your Call Has Been Scheduled</h2>
    <p>Dear ${booking.name},</p>
    <p>Your call has been scheduled for ${booking.scheduledAt.toLocaleString()}.</p>
    <p>We'll send you a calendar invite and meeting link shortly.</p>
    <p>If you need to reschedule, please contact us as soon as possible.</p>
  `;
}

function generateAdminEmail(booking: any): string {
  return `
    <h2>New Call Booking</h2>
    <p>Name: ${booking.name}</p>
    <p>Email: ${booking.email}</p>
    <p>Date/Time: ${booking.scheduledAt.toLocaleString()}</p>
    <p>Message: ${booking.message || 'No message provided'}</p>
  `;
}
