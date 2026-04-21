import { NextResponse } from 'next/server';
import { createClient } from '@/actions/clients';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Convertir JSON a FormData si viene como JSON
    const body = await request.json().catch(() => null);
    if (body) {
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }
    
    const result = await createClient(formData);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error en endpoint /api/clients/create:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}