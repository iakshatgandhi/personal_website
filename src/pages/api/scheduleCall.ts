// src/pages/api/scheduleCall.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { PrismaClient } from "@prisma/client";
import rateLimit from 'express-rate-limit';

// Initialize Prisma client as singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Enhanced validation schema
const ScheduleCallSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(255),
  selectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  selectedTime: z.string().regex(/^(0[9]|1[0-1]):00 AM|(0[2-4]):00 PM$/, "Invalid time format"),
  message: z.string().max(1000, "Message is too long").optional(),
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

// Email configuration with retry logic
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await new Promise((resolve) => limiter(req, res, resolve));

  try {
    const validatedData = ScheduleCallSchema.parse(req.body);
    
    // Validate date is not in the past
    const currentDate = new Date();
    const selectedDateTime = new Date(
      `${validatedData.selectedDate}T${convertTo24Hour(validatedData.selectedTime)}`
    );
    
    if (selectedDateTime < currentDate) {
      return res.status(400).json({ error: 'Cannot schedule calls in the past' });
    }

    // Check if within business hours (9 AM - 4 PM)
    const hour = selectedDateTime.getHours();
    if (hour < 9 || hour > 16) {
      return res.status(400).json({ error: 'Selected time must be within business hours' });
    }

    // Transaction to ensure data consistency
    const booking = await prisma.$transaction(async (tx) => {
      // Check for existing booking
      const existingBooking = await tx.callBooking.findFirst({
        where: {
          scheduledAt: selectedDateTime,
          status: 'SCHEDULED',
        },
      });

      if (existingBooking) {
        throw new Error('Time slot already booked');
      }

      return tx.callBooking.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          scheduledAt: selectedDateTime,
          message: validatedData.message || '',
          status: 'SCHEDULED'
        },
      });
    });

    // Send emails with retry logic
    const transporter = createTransporter();
    const maxRetries = 3;
    
    const sendEmailWithRetry = async (mailOptions: any, retryCount = 0) => {
      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return sendEmailWithRetry(mailOptions, retryCount + 1);
        }
        throw error;
      }
    };

    await Promise.all([
      sendEmailWithRetry({
        from: process.env.EMAIL_FROM,
        to: validatedData.email,
        subject: 'Call Scheduled - Confirmation',
        html: generateCustomerEmail(booking),
      }),
      sendEmailWithRetry({
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
    if (error.message === 'Time slot already booked') {
      return res.status(409).json({ error: 'This time slot is no longer available' });
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
