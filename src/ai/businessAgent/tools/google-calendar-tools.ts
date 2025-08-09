
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';
import { getGoogleAuthClientForUser } from '@/lib/gcal-actions';

// This tool's function now directly receives the owner's UID.
export const getAvailableSlots = ai.defineTool(
    {
        name: 'getAvailableSlots',
        description: 'Verifica los huecos disponibles en el calendario de un negocio para una fecha específica.',
        inputSchema: z.object({
            date: z.string().describe('La fecha para la cual verificar la disponibilidad, en formato YYYY-MM-DD.'),
        }),
        outputSchema: z.object({
            availableSlots: z.array(z.string()).describe('Una lista de horarios de inicio disponibles, en formato HH:mm.'),
        }),
    },
    // The UID is now passed as a context parameter from the flow's execution.
    async ({ date }, { uid }) => {
        if (!uid) {
            throw new Error("UID del propietario no fue proporcionado a la herramienta getAvailableSlots.");
        }
        try {
            const auth = await getGoogleAuthClientForUser(uid);
            const calendar = google.calendar({ version: 'v3', auth });

            const startOfDay = new Date(`${date}T00:00:00Z`);
            const endOfDay = new Date(`${date}T23:59:59Z`);

            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: startOfDay.toISOString(),
                    timeMax: endOfDay.toISOString(),
                    items: [{ id: 'primary' }],
                },
            });

            const busySlots = response.data.calendars?.primary.busy || [];
            const workHours = { start: 9, end: 17 }; // Asumir horario de 9 a 5 por ahora
            const availableSlots: string[] = [];

            for (let hour = workHours.start; hour < workHours.end; hour++) {
                const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
                let isBusy = false;
                for (const busy of busySlots) {
                    const busyStart = new Date(busy.start!);
                    const busyEnd = new Date(busy.end!);
                    if (slotStart >= busyStart && slotStart < busyEnd) {
                        isBusy = true;
                        break;
                    }
                }
                if (!isBusy) {
                    availableSlots.push(`${String(hour).padStart(2, '0')}:00`);
                }
            }

            return { availableSlots };
        } catch (error) {
            console.error('Error en getAvailableSlots:', error);
            return { availableSlots: [] };
        }
    }
);


export const createAppointment = ai.defineTool(
    {
        name: 'createAppointment',
        description: 'Crea una nueva cita en el calendario del negocio.',
        inputSchema: z.object({
            dateTime: z.string().describe('La fecha y hora de inicio de la cita en formato ISO (ej. 2024-08-15T14:00:00).'),
            summary: z.string().describe('Un resumen o título para la cita (ej. "Cita con Juan Pérez").'),
            durationMinutes: z.number().default(60).describe('La duración de la cita en minutos.'),
        }),
        outputSchema: z.object({
            success: z.boolean().describe('Indica si la cita fue creada exitosamente.'),
            appointmentId: z.string().optional().describe('El ID del evento creado en Google Calendar.'),
        }),
    },
    async ({ dateTime, summary, durationMinutes }, { uid }) => {
         if (!uid) {
            throw new Error("UID del propietario no fue proporcionado a la herramienta createAppointment.");
        }
        try {
            const auth = await getGoogleAuthClientForUser(uid);
            const calendar = google.calendar({ version: 'v3', auth });
            
            const startDate = new Date(dateTime);
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

            const event = {
                summary: summary,
                start: { dateTime: startDate.toISOString(), timeZone: 'Europe/Madrid' },
                end: { dateTime: endDate.toISOString(), timeZone: 'Europe/Madrid' },
            };

            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });

            return { success: true, appointmentId: response.data.id || undefined };
        } catch (error) {
            console.error('Error en createAppointment:', error);
            return { success: false };
        }
    }
);
